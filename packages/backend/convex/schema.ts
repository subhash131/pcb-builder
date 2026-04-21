import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  schematics: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    lastUpdated: v.number(),
    sheetWidth: v.optional(v.number()),
    sheetHeight: v.optional(v.number()),
    sheetPreset: v.optional(v.string()),
    cameraX: v.optional(v.number()),
    cameraY: v.optional(v.number()),
    cameraZoom: v.optional(v.number()),
  }),

  shapes: defineTable({
    schematicId: v.id("schematics"),
    tldrawId: v.string(), // e.g. "shape:some-id"
    type: v.string(),
    x: v.number(),
    y: v.number(),
    rotation: v.number(),
    index: v.string(),
    parentId: v.string(),
    isLocked: v.boolean(),
    opacity: v.number(),
    props: v.any(),
    meta: v.any(),
  })
  .index("by_schematicId", ["schematicId"])
  .index("by_tldrawId_schematicId", ["tldrawId", "schematicId"]),

  bindings: defineTable({
    schematicId: v.id("schematics"),
    tldrawId: v.string(), // e.g. "binding:some-id"
    type: v.string(),
    fromId: v.string(),
    toId: v.string(),
    props: v.any(),
    meta: v.any(),
  })
  .index("by_schematicId", ["schematicId"])
  .index("by_tldrawId_schematicId", ["tldrawId", "schematicId"]),

  conversations: defineTable({
    schematicId: v.id("schematics"),
    name: v.optional(v.string()), // Optionally name the chat thread
    updatedAt: v.number(),
  }).index("by_schematicId", ["schematicId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("ai"), v.literal("system"), v.literal("tool")),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_conversationId", ["conversationId"]),

  pcb_boards: defineTable({
    schematicId: v.id("schematics"),
    boardWidth: v.number(),           // mm
    boardHeight: v.number(),
    layers: v.number(),               // 2, 4, 6...
    gridConfig: v.object({
      unit: v.string(),
      size: v.number(),
    }),
    boardPreset: v.optional(v.string()),
    cameraX: v.optional(v.number()),
    cameraY: v.optional(v.number()),
    cameraZoom: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_schematicId", ["schematicId"]),

  pcb_footprints: defineTable({
    boardId: v.id("pcb_boards"),
    componentRef: v.string(),         // "R1" — foreign key to schematic component
    footprintId: v.string(),          // "R_0805"
    x: v.number(),                    // mm from board origin
    y: v.number(),
    rotation: v.number(),             // degrees
    layer: v.string(),                // "F.Cu" | "B.Cu"
    isLocked: v.boolean(),
  }).index("by_board", ["boardId"])
    .index("by_ref", ["boardId", "componentRef"]),
});

