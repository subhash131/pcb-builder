import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@workspace/backend/_generated/api.js";
import dotenv from "dotenv";

dotenv.config();

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL || "http://127.0.0.1:3210";
if (convexUrl === "http://127.0.0.1:3210") {
    console.warn("Warning: CONVEX_URL is not set in environment variables. Falling back to local http://127.0.0.1:3210.");
}
export const convex = new ConvexHttpClient(convexUrl);

export const listSchematicsTool = tool(
  async () => {
    try {
      const schematics = await convex.query(api.schematics.list);
      return JSON.stringify(schematics);
    } catch (e: any) {
      return `Error listing schematics: ${e.message}`;
    }
  },
  {
    name: "list_schematics",
    description: "Fetches all available schematic designs.",
    schema: z.object({}),
  }
);

export const getSchematicRecordsTool = tool(
  async ({ schematicId }: any) => {
    try {
      const records = await convex.query(api.schematics.getRecords, { schematicId: schematicId as any });
      return JSON.stringify(records);
    } catch (e: any) {
      return `Error fetching schematic records: ${e.message}`;
    }
  },
  {
    name: "get_schematic_records",
    description: "Fetches all tldraw shapes and bindings for a specific schematic ID.",
    schema: z.object({
      schematicId: z.string().describe("The Convex ID of the schematic"),
    }),
  }
);

export const syncSchematicTool = tool(
  async ({ schematicId, updates, deletions }: any) => {
    try {
      // @ts-ignore
      await convex.mutation(api.schematics.sync, {
        schematicId: schematicId as any,
        updates: updates || [],
        deletions: deletions || [],
      });
      return "Successfully synced schematic updates.";
    } catch (e: any) {
      return `Error syncing schematic: ${e.message}`;
    }
  },
  {
    name: "sync_schematic",
    description: "Inserts, updates, or deletes shapes and bindings in a schematic. 'updates' is an array of shape or binding objects (must include a 'id' starting with 'shape:' or 'binding:'). 'deletions' is an array of tldrawIds to remove.",
    schema: z.object({
      schematicId: z.string().describe("The Convex ID of the schematic to sync"),
      updates: z.array(z.any()).optional().describe("Array of tldraw shape or binding records to insert or update. Each MUST have an 'id' property. Note that 'type' and 'x'/'y' are required for new shapes."),
      deletions: z.array(z.string()).optional().describe("Array of tldraw IDs to delete (e.g., 'shape:123')."),
    }),
  }
);

export const baseTools = [listSchematicsTool, getSchematicRecordsTool, syncSchematicTool];
