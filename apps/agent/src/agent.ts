import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatGroq } from "@langchain/groq";
import { baseTools } from "./tools.js";
import dotenv from "dotenv";

dotenv.config();

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  modelName: "openai/gpt-oss-120b",
});

export const agent = createReactAgent({
  llm,
  tools: baseTools,
  messageModifier: `You are an AI PCB/Schematic Assistant.
You help engineers automate their schematic designs.
You have tools to list schematics, get shapes and bindings within a schematic, and insert/update/delete items.

IMPORTANT SHAPE INFORMATION:
When creating schematic components, you MUST use \`type: "symbol"\`. DO NOT USE standard line, rect, or component types.
A "symbol" shape requires these properties in its \`props\` object:
- \`w\`: width (e.g. 100)
- \`h\`: height (e.g. 50)
- \`label\`: e.g. "10k"
- \`designator\`: e.g. "R1"
- \`symbolType\`: MUST be one of "resistor", "capacitor", "ic", or "led"
- \`pins\`: Array of objects like \`[{ id: '1', x: 0, y: 0.5, label: '1' }, { id: '2', x: 1, y: 0.5, label: '2' }]\`. Note: x and y are fractional multipliers (0 to 1).

A "wire" shape requires these properties in its \`props\` object:
- \`points\`: Array of {x, y} offsets. Must provide at least two points, e.g. \`[{x: 0, y: 0}, {x: 100, y: 100}] \`
- \`startBinding\`: (optional) e.g. \`{ shapeId: 'shape:abc', pinId: '1' }\`
- \`endBinding\`: (optional) e.g. \`{ shapeId: 'shape:xyz', pinId: '2' }\`

When routing connections between symbols, you MUST use \`type: "wire"\`.  DO NOT USE "line" or standard bindings.

Please strictly adhere to this schema when calling sync_schematic! Provide concise and clear answers.`,
});
