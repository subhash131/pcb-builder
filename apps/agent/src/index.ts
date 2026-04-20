import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { agent } from "./agent.js";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { convex } from "./tools.js";
import { api } from "@workspace/backend/_generated/api.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/chat", async (req, res) => {
  try {
    const { message, conversationId, schematicId } = req.body;

    if (!message || !conversationId || !schematicId) {
      return res.status(400).json({ error: "message, conversationId, and schematicId are required" });
    }

    // 0. Verify that the conversation belongs to the schematic
    const conversation = await convex.query(api.conversations.getById, {
      id: conversationId as any,
    });
    
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    if (conversation.schematicId !== schematicId) {
      return res.status(403).json({ error: "Forbidden: Conversation does not belong to this schematic" });
    }

    // 1. Save user's incoming message to Convex
    await convex.mutation(api.messages.insert, {
      conversationId: conversationId as any,
      role: "user",
      content: message,
    });

    // 2. Fetch recent conversation history limit to 50
    const history = await convex.query(api.messages.list, {
      conversationId: conversationId as any,
      limit: 50,
    });

    // 3. Map Convex messages to Langchain message objects
    const langchainMessages = history.map((msg: any) => {
      switch (msg.role) {
        case "user":
          return new HumanMessage(msg.content);
        case "ai":
          return new AIMessage(msg.content);
        case "system":
          return new SystemMessage(msg.content);
        // Add additional mapping if using tool types
        default:
          return new HumanMessage(msg.content);
      }
    });

    const config = { configurable: { thread_id: conversationId } };
    
    // 4. Invoke LangGraph agent with the full message history
    const result = await agent.invoke({ messages: langchainMessages }, config);

    // 5. Extract what the AI/Agent appended (we only want new AI responses, not the full history again)
    // LangGraph's result.messages has all messages, the end of the list are new ones
    // We will save the very last message assuming it's the AI's final response, 
    // or we could inspect for messages not existing in `langchainMessages`.
    // For simplicity, we assume the AI added 1 AIMessage at the end. 
    // Usually, tool executions and AI intermediate steps are there too, but we just save the final content.
    const finalMessage = result.messages[result.messages.length - 1];

    if (finalMessage) {
       await convex.mutation(api.messages.insert, {
          conversationId: conversationId as any,
          role: "ai",
          content: finalMessage.content as string,
       });
    }

    res.json(result);
  } catch (error: any) {
    console.error("Agent error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Agent Express server running on port ${port}`);
});
