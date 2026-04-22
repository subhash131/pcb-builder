import { ChatGroq } from "@langchain/groq";
import { baseTools, getSchematicRecordsTool } from "./tools.js";
import { SYMBOL_DEFS } from "@workspace/core";
import dotenv from "dotenv";
import { StateGraph, MessagesAnnotation, START, END, Annotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { SystemMessage, ToolMessage } from "@langchain/core/messages";

dotenv.config();

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  modelName: "openai/gpt-oss-120b",
});

// Build the mandatory dimensions table dynamically
const dimensionsTable = (Object.entries(SYMBOL_DEFS) as [string, typeof SYMBOL_DEFS[keyof typeof SYMBOL_DEFS]][])
  .map(([type, def]) => {
    const pinInfo = def.pins.map(p => `${p.number}:${p.name}`).join(', ');
    return `  ${type.padEnd(10)}: w: ${def.boundingBox.width}, h: ${def.boundingBox.height}, available pins: [${pinInfo}]`;
  })
  .join('\n');

const allowedSymbols = Object.keys(SYMBOL_DEFS).map(s => `"${s}"`).join(', ');

const systemPrompt = `You are an AI PCB/Schematic Assistant.
You help engineers automate their schematic designs.
You have tools to list schematics, get shapes and bindings within a schematic, and insert/update/delete items.

GENERAL PROTOCOL (MANDATORY):
Before making ANY modifications (adding, updating, or deleting) to an existing schematic:
1. You MUST first verify the current state of the board. (The system automatically fetches this for you at the start of each task).
2. Use the returned data to identify the exact IDs of shapes and wires you intend to modify or delete.
3. NEVER assume IDs or positions; always verify with the tool output first.

IMPORTANT SHAPE INFORMATION:
When creating schematic components, you MUST use \`type: "symbol"\`. DO NOT USE standard line, rect, or component types.
A "symbol" shape requires these properties in its \`props\` object:
- \`symbolId\`: MUST be one of ${allowedSymbols}
- \`designator\`: e.g. "D1" or "R1"
- \`value\`: e.g. "RED" or "10k"
- \`w\`: width from dimensions table
- \`h\`: height from dimensions table

DO NOT include a \`pins\` array in the \`props\` object. The system automatically populates pins based on the \`symbolId\`.

MANDATORY DIMENSIONS & PINS:
${dimensionsTable}

A "wire" shape requires these properties in its \`props\` object:
- \`points\`: Array of {x, y} offsets. Must provide at least two points, e.g. \`[{x: 0, y: 0}, {x: 100, y: 0}]\`
- \`color\`: ALWAYS set to "#00aa00" (schematic green). NEVER omit this field.
- \`startBinding\`: (optional) e.g. \`{ shapeId: 'shape:abc', pinId: '1' }\` - note: pinId must be the pin NUMBER (e.g. "1")
- \`endBinding\`: (optional) e.g. \`{ shapeId: 'shape:xyz', pinId: '2' }\` - note: pinId must be the pin NUMBER (e.g. "2")

When routing connections between symbols, you MUST use \`type: "wire"\`. DO NOT USE "line" or standard bindings.

MODIFYING EXISTING TOPOLOGY (SERIES INSERTION):
When the user asks to insert a component between two existing ones (e.g., "Add a resistor between S1 and D1"):
1. IDENTIFY: Look for a shape with \`type: "wire"\` where one binding points to the first component and the other binding points to the second component.
2. ATOMIC UPDATE: In a SINGLE call to \`sync_schematic\`:
   - \`deletions\`: [id of the identified wire]
   - \`updates\`: [The new symbol shape, and two new wire shapes connecting it to the original components]
3. DANGER: If you do not include the old wire in \`deletions\`, you will create an incorrect parallel circuit. THIS IS A CRITICAL ERROR.

REPLACING COMPONENTS:
When asked to replace one component with another (e.g., "Change R1 to a capacitor"):
1. IDENTIFY: Get the ID and coordinates (x, y) of the target component.
2. RE-BIND WIRES: Find all wires currently connected to that component.
3. ATOMIC SWAP: In a SINGLE call to \`sync_schematic\`:
   - \`deletions\`: [The ID of the old component]
   - \`updates\`: [The new component at the same position, and updated wire shapes with their bindings pointing to the new component's ID]

EXAMPLE:
User: "Replace R1 with an LED."
AI Thought: "R1 is 'shape:res123' at (100, 200). Wire 'shape:w1' is connected to it. I'll delete 'shape:res123', add the LED at (100, 200), and update 'shape:w1' to point to the LED's new ID."

Please strictly adhere to this schema when calling sync_schematic! Provide concise and clear answers.`;

// Extend the state to include schematicId using the Annotation API
const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  schematicId: Annotation<string>({
    reducer: (x: string, y: string) => y ?? x,
    default: () => "",
  }),
});

// Define the nodes
const toolNode = new ToolNode(baseTools);
const model = llm.bindTools(baseTools);

// Mandatory first step: Fetch schematic context
async function fetchContext(state: any) {
  const { schematicId } = state;
  if (!schematicId) {
    console.log("[Graph] fetch_context: No schematicId provided. Skipping.");
    return { messages: [] };
  }

  console.log(`[Graph] fetch_context: Fetching records for ${schematicId}...`);
  const result = await getSchematicRecordsTool.invoke({ schematicId });
  const data = JSON.parse(result);
  console.log(`[Graph] fetch_context: Successfully fetched ${data.shapes.length} shapes and ${data.bindings.length} bindings.`);
  
  return {
    messages: [
      new SystemMessage(`[SYSTEM CONTEXT] Current Schematic Topology (Auto-fetched):\n${result}`)
    ]
  };
}

// Logic to identify components and connections mentioned by the user
async function identifyConnections(state: any) {
  const { messages } = state;
  const contextMsg = [...messages].reverse().find(m => m.content && m.content.includes("[SYSTEM CONTEXT]"));
  const userMsg = [...messages].reverse().find(m => m._getType() === "human");

  if (!contextMsg || !userMsg) {
    console.log("[Graph] identify_connections: Context or User message missing.");
    return { messages: [] };
  }

  try {
    const topologyJson = contextMsg.content.replace("[SYSTEM CONTEXT] Current Schematic Topology (Auto-fetched):\n", "");
    const topology = JSON.parse(topologyJson);
    const allRecords = [...(topology.shapes || []), ...(topology.bindings || [])];
    const userText = (userMsg.content as string).toLowerCase();

    // Debug: Log what we have in the DB
    const shapeSummary = allRecords
      .filter(r => r.tldrawId?.startsWith("shape:"))
      .map(r => `${r.props?.designator || "NO_DES"}(${r.props?.symbolId || r.type}) [${r.tldrawId}]`)
      .join(", ");
    console.log(`[Graph] identify_connections: DB contains: ${shapeSummary}`);

    // 1. Find ANY components mentioned in the user prompt
    const identifiedComponents = allRecords.filter(r => {
      if (!r.tldrawId?.startsWith("shape:") || r.type === "wire") return false;
      const designator = (r.props?.designator || "").toLowerCase();
      const symbolId = (r.props?.symbolId || "").toLowerCase();
      const value = (r.props?.value || "").toLowerCase();
      
      return (designator && userText.includes(designator)) || 
             (symbolId && userText.includes(symbolId)) ||
             (value && userText.includes(value));
    });

    if (identifiedComponents.length === 0) {
      console.log(`[Graph] identify_connections: No matching components found for prompt: "${userText}"`);
      return { messages: [] };
    }

    const ids = identifiedComponents.map(c => c.tldrawId);
    console.log(`[Graph] identify_connections: Identified component IDs: ${ids.join(", ")}`);

    let analysisMessage = `[ANALYSIS] Identified mentioned components: ${identifiedComponents.map(c => `${c.props?.designator || c.props?.symbolId} (${c.tldrawId})`).join(", ")}.`;

    // 2. If 2+ components identified, look for connecting wires (Series Insertion case)
    if (ids.length >= 2) {
      const connectingWires = allRecords.filter((r: any) => 
        r.type === "wire" && 
        ids.includes(r.props?.startBinding?.shapeId) && 
        ids.includes(r.props?.endBinding?.shapeId)
      );

      if (connectingWires.length > 0) {
        const wireIds = connectingWires.map((w: any) => w.tldrawId);
        console.log(`[Graph] identify_connections: SUCCESS! Found connecting wires: ${wireIds.join(", ")}`);
        analysisMessage += `\nCRITICAL: Found wire(s) ${wireIds.join(", ")} connecting these components. You MUST include these in "deletions" if you are inserting a component between them.`;
      }
    }

    return {
      messages: [new SystemMessage(analysisMessage)]
    };

  } catch (err) {
    console.error("[Graph] identify_connections Error:", err);
  }

  return { messages: [] };
}

// Agent node
async function callModel(state: any) {
  console.log("[Graph] agent: LLM is thinking...");
  const { messages } = state;
  const systemMessage = new SystemMessage(systemPrompt);
  const response = await model.invoke([systemMessage, ...messages]);
  console.log(`[Graph] agent: LLM responded.`);
  return { messages: [response] };
}

// Conditional edge
function shouldContinue(state: any) {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  // @ts-ignore
  if (lastMessage.tool_calls?.length) {
    const tools = (lastMessage as any).tool_calls.map((tc: any) => tc.name).join(", ");
    console.log(`[Graph] should_continue: Routing to tools node. Calling: ${tools}`);
    return "tools";
  }
  console.log("[Graph] should_continue: Routing to END.");
  return END;
}

// Function to decide if we need context at the start
function routeStart(state: any) {
  const { schematicId } = state;
  
  if (schematicId) {
    console.log(`[Graph] route_start: schematicId found (${schematicId}). -> fetch_context`);
    return "fetch_context";
  }
  
  console.log("[Graph] route_start: No schematicId. -> agent");
  return "agent";
}

// Define the graph
const workflow = new StateGraph(AgentState)
  .addNode("fetch_context", fetchContext)
  .addNode("identify_connections", identifyConnections)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addConditionalEdges(START, routeStart)
  .addEdge("fetch_context", "identify_connections")
  .addEdge("identify_connections", "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent");

export const agent = workflow.compile();
