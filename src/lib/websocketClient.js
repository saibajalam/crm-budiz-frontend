const listenersByWorkspace = new Map();
const socketsByWorkspace = new Map();

const getWsUrl = (workspaceId) => {
  const explicit = process.env.REACT_APP_WS_URL;
  if (explicit) {
    const separator = explicit.includes("?") ? "&" : "?";
    return `${explicit}${separator}workspace_id=${workspaceId}`;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/deals/?workspace_id=${workspaceId}`;
};

const emitEvent = (workspaceId, eventType, payload) => {
  const workspaceListeners = listenersByWorkspace.get(workspaceId);
  if (!workspaceListeners) return;

  const handlers = workspaceListeners.get(eventType);
  if (!handlers) return;

  handlers.forEach((handler) => handler(payload));
};

const ensureSocket = (workspaceId) => {
  const existing = socketsByWorkspace.get(workspaceId);
  if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
    return existing;
  }

  const socket = new WebSocket(getWsUrl(workspaceId));

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      emitEvent(workspaceId, message?.type, message?.payload || message);
    } catch (_error) {
      // Ignore malformed events to keep socket stream resilient.
    }
  };

  socket.onclose = () => {
    setTimeout(() => {
      const workspaceListeners = listenersByWorkspace.get(workspaceId);
      if (workspaceListeners && workspaceListeners.size > 0) {
        ensureSocket(workspaceId);
      }
    }, 1000);
  };

  socketsByWorkspace.set(workspaceId, socket);
  return socket;
};

export const subscribeToWorkspaceEvents = (workspaceId, eventType, handler) => {
  if (!listenersByWorkspace.has(workspaceId)) {
    listenersByWorkspace.set(workspaceId, new Map());
  }

  const workspaceListeners = listenersByWorkspace.get(workspaceId);
  if (!workspaceListeners.has(eventType)) {
    workspaceListeners.set(eventType, new Set());
  }

  workspaceListeners.get(eventType).add(handler);
  ensureSocket(workspaceId);

  return () => {
    const currentWorkspaceListeners = listenersByWorkspace.get(workspaceId);
    if (!currentWorkspaceListeners) return;

    const handlers = currentWorkspaceListeners.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        currentWorkspaceListeners.delete(eventType);
      }
    }

    if (currentWorkspaceListeners.size === 0) {
      listenersByWorkspace.delete(workspaceId);
      const socket = socketsByWorkspace.get(workspaceId);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
      socketsByWorkspace.delete(workspaceId);
    }
  };
};

export const subscribeToWorkspaceDealsEvents = (workspaceId, eventType, handler) =>
  subscribeToWorkspaceEvents(workspaceId, eventType, handler);
