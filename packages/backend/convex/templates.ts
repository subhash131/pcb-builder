import { mutation, query } from "./_generated/server";

export const getTemplates = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("templates")
      .withIndex("by_isOSS", (q) => q.eq("isOSS", undefined))
      .collect();
  },
});

export const getOssTemplates = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("templates")
      .withIndex("by_isOSS", (q) => q.eq("isOSS", true))
      .collect();
  },
});

export const seedTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("templates")
      .withIndex("by_isOSS", (q) => q.eq("isOSS", undefined))
      .collect();
    
    if (existing.length === 0) {

    const templates = [
      {
        name: "Standard AI Agent",
        slug: "standard-ai-agent",
        description: "A solid foundation for any AI agent workflow. Includes basic memory and task management.",
        price: 4900,
        creemProductId: "prod_standard",
        features: ["Core Memory", "Task Execution", "Email Integration"],
        isFeatured: true,
        previewVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&mute=0",
        livePreviewUrl: "https://demo.standard-agent.example.com",
        screenshots: [
           "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
           "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
           "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800"
        ],
        setupDocUrl: "https://docs.standard-agent.example.com/setup",
        createdAt: Date.now(),
      },
      {
        name: "Professional AI Agent",
        slug: "professional-ai-agent",
        description: "Advanced capabilities for teams. Multi-agent coordination and complex tool use.",
        price: 9900,
        creemProductId: "prod_pro",
        features: ["Multi-agent support", "Custom Tools", "Analytics Dashboard"],
        isFeatured: true,
        previewVideoUrl: "https://www.youtube.com/embed/jNQXAC9IVRw?autoplay=0&mute=0",
        livePreviewUrl: "https://demo.pro-agent.example.com",
        screenshots: [
           "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&q=80&w=800",
           "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
           "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800"
        ],
        setupDocUrl: "https://docs.pro-agent.example.com/setup",
        createdAt: Date.now(),
      },
      {
        name: "Enterprise AI Agent",
        slug: "enterprise-ai-agent",
        description: "The ultimate power for large scale operations. Unlimited agents and high-throughput processing.",
        price: 19900,
        creemProductId: "prod_enterprise",
        features: ["Priority Support", "Custom Model Training", "SSO & Security"],
        isFeatured: false,
        previewVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&mute=0",
        livePreviewUrl: "https://demo.enterprise-agent.example.com",
        screenshots: [
           "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
           "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&q=80&w=800",
           "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800"
        ],
        setupDocUrl: "https://docs.enterprise-agent.example.com/setup",
        createdAt: Date.now(),
      }
    ];

      for (const template of templates) {
        await ctx.db.insert("templates", template);
      }
    }

    const existingOss = await ctx.db.query("templates")
      .withIndex("by_isOSS", (q) => q.eq("isOSS", true))
      .collect();

    if (existingOss.length === 0) {
      const ossTemplates = [
        {
          name: "Next.js Boilerplate",
          slug: "nextjs-boilerplate",
          description: "A clean Next.js boilerplate with Tailwind CSS and Framer Motion.",
          price: 0,
          creemProductId: "oss_nextjs",
          features: ["Next.js App Router", "Tailwind CSS", "Framer Motion"],
          githubUrl: "https://github.com/example/nextjs-boilerplate",
          tags: ["Next.js", "Tailwind", "React"],
          isOSS: true,
          createdAt: Date.now(),
        },
        {
          name: "Vite React Starter",
          slug: "vite-react-starter",
          description: "Fast Vite starter template with React, TypeScript, and ESLint.",
          price: 0,
          creemProductId: "oss_vite",
          features: ["Vite", "React", "TypeScript", "ESLint"],
          githubUrl: "https://github.com/example/vite-react-starter",
          tags: ["Vite", "React", "TypeScript"],
          isOSS: true,
          createdAt: Date.now(),
        }
      ];
      for (const oss of ossTemplates) {
        await ctx.db.insert("templates", oss);
      }
    }

    return "Seeded templates successfully";
  },
});
