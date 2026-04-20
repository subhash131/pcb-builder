import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const handleCheckoutCompleted = mutation({
  args: { 
    data: v.any(), 
    secret: v.string() 
  },
  handler: async (ctx, { data, secret }) => {
    // Basic verification of secret could be added here if needed, 
    // although http.ts usually handles it.

    const customerEmail = data.customer?.email;
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", customerEmail))
      .first();

    if (!user) {
      console.error(`User not found for checkout: ${customerEmail}`);
      return { success: false, error: "User not found" };
    }

    // Update customer ID if not set in user_metadata
    let userMetadata = await ctx.db
      .query("user_metadata")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    if (!userMetadata) {
      await ctx.db.insert("user_metadata", {
        userId: user._id,
        creemCustomerId: data.customer?.id,
      });
    } else if (!userMetadata.creemCustomerId && data.customer?.id) {
      await ctx.db.patch(userMetadata._id, { 
        creemCustomerId: data.customer.id
      });
    }

    // Handle the purchase (Template or Product)
    const productId = data.product?.id || data.productId;
    
    if (productId) {
      // Find the template in our database that matches this Creem Product ID
      const template = await ctx.db
        .query("templates")
        .filter((q) => q.eq(q.field("creemProductId"), productId))
        .first();

      if (template) {
        // Record the purchase
        await ctx.db.insert("purchases", {
          userId: user._id,
          templateId: template._id,
          purchaseDate: Date.now(),
          creemCheckoutId: data.id,
          amount: data.total || 0,
        });
        console.log(`Recorded purchase for user ${user._id} of template ${template._id}`);
      } else {
        console.warn(`Purchased product ${productId} not found in templates table`);
      }
    }

    return { success: true };
  },
});
