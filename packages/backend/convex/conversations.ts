import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server.js";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel.js";

export const create = mutation({
  args: { 
    schematicId: v.id("schematics"),
    name: v.optional(v.string()) 
  },
  handler: async (ctx: MutationCtx, args: { schematicId: Id<"schematics">; name?: string }) => {
    return await ctx.db.insert("conversations", {
      schematicId: args.schematicId,
      name: args.name,
      updatedAt: Date.now(),
    });
  },
});

export const listBySchematic = query({
  args: { schematicId: v.id("schematics") },
  handler: async (ctx: QueryCtx, args: { schematicId: Id<"schematics"> }) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_schematicId", (q: any) => q.eq("schematicId", args.schematicId))
      .order("desc")
      .collect();
  },
});

export const remove = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx: MutationCtx, args: { id: Id<"conversations"> }) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) return;
    
    // Delete all messages in the conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q: any) => q.eq("conversationId", args.id))
      .collect();
      
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
    
    // Delete the conversation
    await ctx.db.delete(args.id);
  },
});

export const getById = query({
  args: { id: v.id("conversations") },
  handler: async (ctx: QueryCtx, args: { id: Id<"conversations"> }) => {
    return await ctx.db.get(args.id);
  },
});
