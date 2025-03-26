import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

const WEBSOCKET_URL = import.meta.env.VITE_WS_URL || "ws://localhost:5000";

interface WebSocketContextType {
  ws: WebSocket | null;
  joinRoom: (roomId: string, roomType: string, data: unknown) => void;
  leaveRoom: (roomId: string, roomType: string) => void;
  updateRoom: (
    roomId: string,
    updateType: "UPDATE_ROOM",
    updates: {
      updateType: "TASK_UPDATE" | "SHARE_TASK" | "UNSHARE_TASK";
      updates: any;
      roomId: string;
    }
  ) => void;
  sendMessage: (type: string, payload: any) => void;
  // isConnected: boolean;
  // error: string | null;
  // connect: () => void;
  // disconnect: () => void;
}

const webSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    try {
      const socket = new WebSocket(WEBSOCKET_URL);
      setWs(socket);
    } catch (error: unknown) {
      console.error("Connection to real time communication failed");
    }
  }, []);

  useEffect(() => {
    if (!ws) return;
    ws.onopen = () => {
      console.log("Established real time communication");
    };
    ws.onclose = () => {
      console.log("Unestablished real time communication");
    };
    ws.onerror = () => {
      console.error("Something went wrong in real time communication");
    };

    // Add a message handler for debugging
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received in context:", data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
  }, [ws]);

  const sendMessage = useCallback(
    (type: string, payload: any) => {
      if (ws?.readyState === WebSocket.OPEN) {
        console.log("Sending WebSocket message:", { type, payload });
        ws.send(JSON.stringify({ type, payload }));
      } else {
        console.error("WebSocket is not connected");
      }
    },
    [ws]
  );

  const joinRoom = useCallback(
    (roomId: string, roomType: string, data: unknown) => {
      if (!roomId.trim()) return;
      const info = JSON.stringify({
        type: "JOIN_ROOM",
        payload: {
          roomType,
          roomId,
          data,
        },
      });
      ws?.send(info);
    },
    [ws]
  );

  const leaveRoom = useCallback(
    (roomId: string, roomType: string) => {
      if (!roomId.trim()) return;
      const info = JSON.stringify({
        type: "LEAVE_ROOM",
        payload: {
          roomType,
          roomId,
        },
      });
      ws?.send(info);
    },
    [ws]
  );

  const updateRoom = useCallback(
    (
      roomId: string,
      updateType: "UPDATE_ROOM",
      updates: {
        updateType: "TASK_UPDATE" | "SHARE_TASK" | "UNSHARE_TASK";
        updates: any;
        roomId: string;
      }
    ) => {
      if (!roomId.trim()) return;
      const info = JSON.stringify({
        type: updateType,
        payload: updates,
      });
      ws?.send(info);
    },
    [ws]
  );

  return (
    <webSocketContext.Provider
      value={{ ws, joinRoom, leaveRoom, updateRoom, sendMessage }}
    >
      {children}
    </webSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(webSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};

export default webSocketContext;
