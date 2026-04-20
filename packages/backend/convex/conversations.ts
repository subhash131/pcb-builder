import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: { 
    schematicId: v.id("schematics"),
    name: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("conversations", {
      schematicId: args.schematicId,
      name: args.name,
      updatedAt: Date.now(),
    });
  },
});

export const listBySchematic = query({
  args: { schematicId: v.id("schematics") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_schematicId", (q) => q.eq("schematicId", args.schematicId))
      .order("desc")
      .collect();
  },
});

export const remove = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) return;
    
    // Delete all messages in the conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.id))
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
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
