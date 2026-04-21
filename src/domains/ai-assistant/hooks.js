import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "constants/queryKeys";
import { subscribeToWorkspaceEvents } from "lib/websocketClient";
import {
  getAIContext,
  sendAIMessage,
  summarizeContact,
  summarizeDeal,
  summarizeWorkspace,
} from "./service";
import { getWorkspaceMemory } from "./memory";
import { getPromptTemplateRegistry, getViewDefaultTemplate } from "./promptTemplates";

const getWorkspaceId = () => localStorage.getItem("workspace_id") || "default";

const defaultAssistantMessage = {
  id: "assistant-welcome",
  role: "assistant",
  content: "I am your CRM copilot. Ask me about deals, contacts, pipeline bottlenecks, or next actions.",
  structured: {
    answer: "I am your CRM copilot. Ask me about deals, contacts, pipeline bottlenecks, or next actions.",
    insights: [
      "Try: Summarize this deal",
      "Try: Show pipeline insights",
      "Try: Suggest next actions",
    ],
    suggestions: [],
    relatedEntities: [],
  },
  createdAt: Date.now(),
};

const pushSystemEventMessage = (eventType) => ({
  id: `event-${eventType}-${Date.now()}`,
  role: "system",
  content: `Live CRM update detected: ${eventType}`,
  createdAt: Date.now(),
});

const streamText = (text, onChunk, onDone) => {
  const fullText = String(text || "");
  let index = 0;
  const timer = setInterval(() => {
    index += 2;
    onChunk(fullText.slice(0, index));
    if (index >= fullText.length) {
      clearInterval(timer);
      onDone?.();
    }
  }, 16);

  return () => clearInterval(timer);
};

const resolveSummaryFn = (entityType) => {
  if (entityType === "deal") return summarizeDeal;
  if (entityType === "contact") return summarizeContact;
  return summarizeWorkspace;
};

export const useAIChat = ({ currentView, selectedEntityId, filters }) => {
  const workspaceId = getWorkspaceId();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState([defaultAssistantMessage]);
  const [isStreaming, setIsStreaming] = useState(false);
  const debounceRef = useRef(null);
  const streamCancelRef = useRef(null);

  const contextQuery = useQuery({
    queryKey: [QUERY_KEYS.AI_CONTEXT, workspaceId, currentView, selectedEntityId, filters || {}],
    queryFn: () => getAIContext(workspaceId, currentView, selectedEntityId),
    staleTime: 45 * 1000,
  });

  const memoryQuery = useQuery({
    queryKey: [QUERY_KEYS.AI_MEMORY, workspaceId],
    queryFn: () => getWorkspaceMemory(workspaceId),
    staleTime: 30 * 1000,
  });

  const templatesQuery = useQuery({
    queryKey: [QUERY_KEYS.AI_PROMPT_TEMPLATES],
    queryFn: async () => getPromptTemplateRegistry(),
    staleTime: Infinity,
  });

  useEffect(() => {
    const memoryConversation = memoryQuery.data?.conversation;
    if (!Array.isArray(memoryConversation) || memoryConversation.length === 0) return;

    const hydrated = memoryConversation
      .slice(-24)
      .map((item) => ({
        id: item.id || `mem-${item.role || "assistant"}-${item.createdAt || Date.now()}`,
        role: item.role || "assistant",
        content: item.content || "",
        structured: item.structured || null,
        createdAt: item.createdAt || Date.now(),
      }))
      .filter((item) => item.content);

    if (hydrated.length > 0) {
      setMessages(hydrated);
    }
  }, [memoryQuery.data?.conversation]);

  useEffect(() => {
    const events = ["deal.updated", "activity.created", "contact.updated"];

    const unsubscribers = events.map((eventType) =>
      subscribeToWorkspaceEvents(workspaceId, eventType, () => {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.AI_CONTEXT, workspaceId] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.AI_INSIGHTS, workspaceId] });
        setMessages((prev) => [...prev.slice(-24), pushSystemEventMessage(eventType)]);
      })
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [queryClient, workspaceId]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (streamCancelRef.current) {
        streamCancelRef.current();
      }
    };
  }, []);

  const chatMutation = useMutation({
    mutationFn: (payload) => sendAIMessage(payload),
    onMutate: () => {
      setIsStreaming(true);
    },
    onSuccess: (response, variables) => {
      const assistantId = `assistant-${Date.now()}`;
      const userMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: variables?.message || "",
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev.slice(-24), userMessage, {
        id: assistantId,
        role: "assistant",
        content: "",
        structured: { ...response, answer: "" },
        createdAt: Date.now(),
      }]);

      streamCancelRef.current = streamText(
        response?.answer || "",
        (chunk) => {
          setMessages((prev) =>
            prev.map((item) =>
              item.id === assistantId
                ? {
                    ...item,
                    content: chunk,
                    structured: {
                      ...(item.structured || response),
                      answer: chunk,
                    },
                  }
                : item
            )
          );
        },
        () => {
          setMessages((prev) =>
            prev.map((item) =>
              item.id === assistantId
                ? {
                    ...item,
                    content: response?.answer || "",
                    structured: response,
                  }
                : item
            )
          );
          setIsStreaming(false);
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.AI_MEMORY, workspaceId] });
        }
      );
    },
    onError: () => {
      setIsStreaming(false);
      setMessages((prev) => [
        ...prev.slice(-24),
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: "I could not process that request right now. Please try again.",
          structured: {
            answer: "I could not process that request right now. Please try again.",
            insights: [],
            suggestions: [],
            relatedEntities: [],
          },
          createdAt: Date.now(),
        },
      ]);
    },
  });

  const sendMessage = useCallback(
    (message) => {
      const trimmed = String(message || "").trim();
      if (!trimmed || chatMutation.isPending || isStreaming) return;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        chatMutation.mutate({
          message: trimmed,
          context: {
            workspaceId,
            currentView,
            selectedEntityId,
            filters,
            snapshot: contextQuery.data,
          },
        });
      }, 250);
    },
    [chatMutation, contextQuery.data, currentView, filters, isStreaming, selectedEntityId, workspaceId]
  );

  const quickActions = useMemo(() => {
    const summarizeLabel =
      currentView === "deal"
        ? "Summarize this deal"
        : currentView === "contact"
        ? "Summarize this contact"
        : "Summarize workspace";

    return [
      {
        id: "summarize",
        label: summarizeLabel,
        prompt:
          currentView === "deal"
            ? "Summarize this deal and suggest next action."
            : currentView === "contact"
            ? "Summarize this contact, explain score, and suggest next action."
            : "Summarize my workspace.",
      },
      {
        id: "pipeline",
        label: "Show pipeline insights",
        prompt: "Show pipeline bottlenecks and conversion issues.",
      },
      {
        id: "actions",
        label: "Suggest next actions",
        prompt: "Suggest next actions based on current CRM status.",
      },
    ];
  }, [currentView]);

  const activeTemplate = useMemo(() => getViewDefaultTemplate(currentView), [currentView]);

  return {
    messages,
    sendMessage,
    isLoading: chatMutation.isPending || isStreaming,
    isStreaming,
    currentContext: contextQuery.data,
    quickActions,
    memory: memoryQuery.data,
    templates: templatesQuery.data,
    activeTemplate,
  };
};

export const useAIMemory = () => {
  const workspaceId = getWorkspaceId();

  return useQuery({
    queryKey: [QUERY_KEYS.AI_MEMORY, workspaceId],
    queryFn: () => getWorkspaceMemory(workspaceId),
    staleTime: 30 * 1000,
  });
};

export const useAIPromptTemplates = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.AI_PROMPT_TEMPLATES],
    queryFn: async () => getPromptTemplateRegistry(),
    staleTime: Infinity,
  });
};

export const useAISummary = (entityType, id) => {
  const workspaceId = getWorkspaceId();
  const summaryFn = resolveSummaryFn(entityType);

  return useQuery({
    queryKey: [QUERY_KEYS.AI_SUMMARY, workspaceId, entityType, id],
    queryFn: () => summaryFn(id),
    enabled: entityType === "workspace" || !!id,
    staleTime: 60 * 1000,
  });
};

export const useAIInsights = (currentView = "workspace", selectedEntityId) => {
  const workspaceId = getWorkspaceId();

  return useQuery({
    queryKey: [QUERY_KEYS.AI_INSIGHTS, workspaceId, currentView, selectedEntityId],
    queryFn: async () => {
      if (currentView === "deal" && selectedEntityId) {
        return summarizeDeal(selectedEntityId);
      }
      if (currentView === "contact" && selectedEntityId) {
        return summarizeContact(selectedEntityId);
      }
      return summarizeWorkspace();
    },
    staleTime: 60 * 1000,
  });
};
