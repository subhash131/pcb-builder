import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatGroq } from "@langchain/groq";
import { baseTools } from "./tools.js";
import { SYMBOL_DEFS } from "@workspace/core";
import dotenv from "dotenv";

dotenv.config();

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  modelName: "openai/gpt-oss-120b",
});

// Build the mandatory dimensions table dynamically from SYMBOL_DEFS
// so the AI prompt is always in sync with the shared constants.
const dimensionsTable = (Object.entries(SYMBOL_DEFS) as [string, typeof SYMBOL_DEFS[keyof typeof SYMBOL_DEFS]][])
  .map(([type, def]) => {
    const pinsJson = JSON.stringify(def.pins);
    return `  ${type.padEnd(10)}: w: ${def.w}, h: ${def.h}, pins: ${pinsJson}`;
  })
  .join('\n');

export const agent = createReactAgent({
  llm,
  tools: baseTools,
  messageModifier: `You are an AI PCB/Schematic Assistant.
You help engineers automate their schematic designs.
You have tools to list schematics, get shapes and bindings within a schematic, and insert/update/delete items.

IMPORTANT SHAPE INFORMATION:
When creating schematic components, you MUST use \`type: "symbol"\`. DO NOT USE standard line, rect, or component types.
A "symbol" shape requires these properties in its \`props\` object:
- \`w\`: width
- \`h\`: height
- \`label\`: e.g. "RED" or "10k"
- \`designator\`: e.g. "D1" or "R1"
- \`symbolType\`: MUST be one of "resistor", "capacitor", "ic", or "led"
- \`pins\`: Array of pin objects. Pin x/y are fractional multipliers (0 to 1), where (0, 0.5) is left-center and (1, 0.5) is right-center.

MANDATORY DIMENSIONS — use EXACTLY these values for each component type:
${dimensionsTable}

A "wire" shape requires these properties in its \`props\` object:
- \`points\`: Array of {x, y} offsets. Must provide at least two points, e.g. \`[{x: 0, y: 0}, {x: 100, y: 0}]\`
- \`color\`: ALWAYS set to "#00aa00" (schematic green). NEVER omit this field.
- \`startBinding\`: (optional) e.g. \`{ shapeId: 'shape:abc', pinId: '1' }\`
- \`endBinding\`: (optional) e.g. \`{ shapeId: 'shape:xyz', pinId: '2' }\`

When routing connections between symbols, you MUST use \`type: "wire"\`. DO NOT USE "line" or standard bindings.

Please strictly adhere to this schema when calling sync_schematic! Provide concise and clear answers.`,
});
