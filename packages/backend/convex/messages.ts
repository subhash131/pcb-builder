import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Fetch messages for a given conversation.
 */
export const list = query({
  args: { 
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const q = ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .order("desc"); // Get most recent first
      
    const messages = args.limit ? await q.take(args.limit) : await q.collect();
    // Return them in chronological order
    return messages.reverse();
  },
});

/**
 * Insert a single message.
 */
export const insert = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("ai"), v.literal("system"), v.literal("tool")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Update the conversation's updatedAt timestamp
    await ctx.db.patch(args.conversationId, { updatedAt: Date.now() });

    return await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      createdAt: Date.now(),
    });
  },
});

/**
 * Insert multiple messages at once (useful for saving agent executions).
 */
export const insertMany = mutation({
  args: {
    conversationId: v.id("conversations"),
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("ai"), v.literal("system"), v.literal("tool")),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Update the conversation's updatedAt timestamp
    await ctx.db.patch(args.conversationId, { updatedAt: Date.now() });

    const now = Date.now();
    for (const msg of args.messages) {
      await ctx.db.insert("messages", {
        conversationId: args.conversationId,
        role: msg.role,
        content: msg.content,
        createdAt: now,
      });
    }
  },
});
