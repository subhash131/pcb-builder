"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { Id } from "@workspace/backend/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { MessageSquarePlus, Trash2, Maximize2, Minimize2, X, MessageCircle, Send, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@workspace/ui/components/dropdown-menu";

export function ChatPanel({ schematicId }: { schematicId: Id<"schematics"> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<Id<"conversations"> | null>(null);
  const [inputVal, setInputVal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [constrains, setConstraints] = useState({ left: -1000, right: 0, top: -1000, bottom: 0 });
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setConstraints({
        left: -window.innerWidth + 400,
        right: 0,
        top: -window.innerHeight + 640,
        bottom: 0,
      });
    }
  }, []);

  const conversations = useQuery(api.conversations.listBySchematic, { schematicId });
  const createConversation = useMutation(api.conversations.create);
  const removeConversation = useMutation(api.conversations.remove);

  const messages = useQuery(
    api.messages.list, 
    activeConversationId ? { conversationId: activeConversationId, limit: 100 } : "skip"
  );
  
  // Auto-select first conversation or null if none
  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0]?._id || null);
    }
  }, [conversations, activeConversationId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleNewChat = async () => {
    const id = await createConversation({ schematicId, name: "New Conversation" });
    setActiveConversationId(id);
  };

  const handleDeleteChat = async (id: Id<"conversations">) => {
    await removeConversation({ id });
    if (activeConversationId === id) {
      setActiveConversationId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || !activeConversationId || isSubmitting) return;

    const message = inputVal;
    setInputVal("");
    setIsSubmitting(true);

    try {
      const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:3005";
      const res = await fetch(`${agentUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          conversationId: activeConversationId,
          schematicId,
        }),
      });
      if (!res.ok) {
        console.error("Agent error:", await res.text());
      }
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-orange-600 hover:bg-orange-700 text-white z-50 transition-all hover:scale-105"
        size="icon"
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  const activeConversationName = conversations?.find(c => c._id === activeConversationId)?.name || "Chat";

  return (
    <motion.div
      drag
      dragConstraints={constrains}
      dragMomentum={false}
      dragElastic={0.1}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed z-50 shadow-2xl rounded-xl border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-hidden flex flex-col"
      style={{
        width: 380,
        height: 600,
        bottom: 24,
        right: 24,
      }}
    >
      <div className="flex items-center justify-between p-3 border-b bg-muted/50 drag-handle cursor-grab active:cursor-grabbing">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="font-semibold text-sm h-8 px-2">
              {activeConversationName}
              <span className="ml-2 text-muted-foreground text-xs font-normal">▼</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {conversations?.map((conv) => (
              <DropdownMenuItem
                key={conv._id}
                className="flex items-center justify-between"
                onSelect={() => setActiveConversationId(conv._id)}
              >
                <span className="truncate w-32">{conv.name || "Untitled"}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(conv._id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleNewChat} className="font-medium">
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              New Chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setIsOpen(false)}>
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {!activeConversationId && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-4">
            <MessageCircle className="h-10 w-10 text-muted-foreground/30" />
            <div className="space-y-1">
              <p className="text-sm font-medium">No active chat</p>
              <p className="text-xs text-muted-foreground">Select a conversation or start a new one to begin.</p>
            </div>
            <Button size="sm" onClick={handleNewChat}>Start New Chat</Button>
          </div>
        )}

        {activeConversationId && messages?.map((msg) => (
          <div
            key={msg._id}
            className={`flex flex-col max-w-[85%] ${
              msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
            }`}
          >
            <div
              className={`rounded-2xl px-4 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-slate-800 text-slate-50 dark:bg-slate-200 dark:text-slate-900"
                  : "bg-muted text-foreground"
              }`}
            >
              {msg.content}
            </div>
            <span className="text-[10px] text-muted-foreground/60 mt-1 px-1">
              {msg.role === "user" ? "You" : msg.role === "ai" ? "AI Assistant" : "System"}
            </span>
          </div>
        ))}
        {isSubmitting && (
           <div className="flex items-center mr-auto text-muted-foreground gap-2 pt-2 pb-1 text-xs">
             <Loader2 className="h-3 w-3 animate-spin"/> Thinking...
           </div>
        )}
      </div>

      <div className="p-3 border-t bg-background">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 relative">
          <Input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type your message..."
            className="pr-12 bg-muted/30 focus-visible:ring-1 border-none outline-none shadow-none"
            disabled={!activeConversationId || isSubmitting}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-1 top-1 h-7 w-7 rounded-full bg-orange-600 hover:bg-orange-700"
            disabled={!activeConversationId || !inputVal.trim() || isSubmitting}
          >
            <Send className="h-3 w-3 text-white" />
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
