import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getTemplatePurchaseStatus = query({
  args: { templateSlug: v.string() },
  handler: async (ctx, { templateSlug }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { status: "unauthenticated" };
    }

    const template = await ctx.db
      .query("templates")
      .withIndex("by_slug", (q) => q.eq("slug", templateSlug))
      .first();

    if (!template) {
      return { status: "template_not_found" };
    }

    const purchase = await ctx.db
      .query("purchases")
      .withIndex("by_user_template", (q) => q.eq("userId", userId).eq("templateId", template._id))
      .first();

    return {
      status: purchase ? "purchased" : "not_purchased",
      purchaseDate: purchase?.purchaseDate,
    };
  },
});

export const getMyPurchasedTemplates = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const purchaseRecords = await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (purchaseRecords.length === 0) return [];

    const templateIds = purchaseRecords.map((p) => p.templateId);
    const templates = await Promise.all(
      templateIds.map((id) => ctx.db.get(id))
    );

    return templates.filter((t) => t !== null);
  },
});

export const getIsSystemAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const userMetadata = await ctx.db
      .query("user_metadata")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    return userMetadata?.isSystemAdmin ?? false;
  },
});

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db.get(userId);
  },
});
