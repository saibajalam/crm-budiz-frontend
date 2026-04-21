import { useEffect, useMemo, useRef, useState } from "react";
import { FiMessageCircle, FiSend, FiX } from "react-icons/fi";
import { useLocation } from "react-router-dom";
import ContextBadge from "components/ai/ContextBadge";
import MessageBubble from "components/ai/MessageBubble";
import { useAIChat } from "domains/ai-assistant/hooks";

const getViewContext = (pathname) => {
  const path = String(pathname || "");

  if (/\/admin\/deals\/\d+/.test(path)) {
    return {
      currentView: "deal",
      selectedEntityId: path.split("/").at(-1),
    };
  }

  if (/\/admin\/contacts\/\d+/.test(path)) {
    return {
      currentView: "contact",
      selectedEntityId: path.split("/").at(-1),
    };
  }

  if (path.includes("/admin/deals-pipeline")) return { currentView: "kanban", selectedEntityId: null };
  if (path.includes("/admin/default")) return { currentView: "dashboard", selectedEntityId: null };
  if (path.includes("/admin/analytics")) return { currentView: "analytics", selectedEntityId: null };
  if (path.includes("/admin/graph")) return { currentView: "graph", selectedEntityId: null };

  return { currentView: "workspace", selectedEntityId: null };
};

export default function AssistantPanel() {
  const location = useLocation();
  const threadRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");

  const viewContext = useMemo(() => getViewContext(location.pathname), [location.pathname]);

  const { messages, sendMessage, isLoading, isStreaming, quickActions, activeTemplate, memory } = useAIChat({
    currentView: viewContext.currentView,
    selectedEntityId: viewContext.selectedEntityId,
    filters: {},
  });

  const responseStyle = memory?.preferences?.responseStyle || "concise";

  useEffect(() => {
    if (!threadRef.current) return;
    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, isStreaming]);

  const handleSend = () => {
    const value = input.trim();
    if (!value) return;
    sendMessage(value);
    setInput("");
  };

  const handleQuickAction = (prompt) => {
    sendMessage(prompt);
  };

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[70] inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-xl hover:bg-brand-600"
        >
          <FiMessageCircle className="h-4 w-4" />
          AI Copilot
        </button>
      ) : null}

      {open ? (
        <aside className="fixed right-4 top-20 z-[80] flex h-[78vh] w-[380px] flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-navy-900">
          <div className="flex items-center justify-between border-b border-gray-200 p-3 dark:border-white/10">
            <div>
              <p className="text-sm font-bold text-navy-700 dark:text-white">CRM AI Copilot</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-300">
                {activeTemplate?.title || "General CRM Assistant"} · {responseStyle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
            >
              <FiX />
            </button>
          </div>

          <div className="px-3 pt-3">
            <ContextBadge
              currentView={viewContext.currentView}
              selectedEntityId={viewContext.selectedEntityId}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto px-3 py-3">
            {quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => handleQuickAction(action.prompt)}
                className="whitespace-nowrap rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-brand-500 hover:bg-lightPrimary dark:border-white/10 dark:text-white dark:hover:bg-white/10"
              >
                {action.label}
              </button>
            ))}
          </div>

          <div ref={threadRef} className="flex-1 space-y-3 overflow-y-auto px-3 pb-2">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isTyping={
                  message.role === "assistant" &&
                  isStreaming &&
                  message.id === messages[messages.length - 1]?.id
                }
              />
            ))}
          </div>

          <div className="border-t border-gray-200 p-3 dark:border-white/10">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about deals, contacts, or pipeline..."
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-white/10 dark:bg-navy-800 dark:text-white"
              />
              <button
                type="button"
                disabled={isLoading || !input.trim()}
                onClick={handleSend}
                className="rounded-xl bg-brand-500 p-2 text-white hover:bg-brand-600 disabled:opacity-50"
              >
                <FiSend className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>
      ) : null}
    </>
  );
}
