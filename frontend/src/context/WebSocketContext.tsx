import { createContext, useContext, useEffect, useState } from "react";

const WEBSOCKET_URL = "ws://localhost:5001";

// TODO: CONNECT TO WEBSOCKET SERVER

interface WebSocketContextType {
  ws: WebSocket | null;
  joinRoom: (roomId: string, data: unknown) => void;
  leaveRoom: (roomId: string) => void;
  updateRoom: (
    roomId: string,
    updateType: "TASK_UPDATE",
    updates: unknown
  ) => void;
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
  }, [ws]);

  const joinRoom = (roomId: string, data: unknown) => {
    if (!roomId.trim()) return;
    const info = JSON.stringify({
      type: "JOIN_ROOM",
      payload: {
        roomId,
        data,
      },
    });
    ws?.send(info);
  };

  const leaveRoom = (roomId: string) => {
    if (!roomId.trim()) return;
    const info = JSON.stringify({
      type: "LEAVE_ROOM",
      payload: {
        roomId,
      },
    });
    ws?.send(info);
  };

  const updateRoom = (
    roomId: string,
    updateType: "TASK_UPDATE",
    updates: unknown
  ) => {
    if (!roomId.trim()) return;
    const info = JSON.stringify({
      type: "UPDATE_ROOM",
      payload: {
        updateType,
        updates,
      },
    });
    ws?.send(info);
  };

  return (
    <webSocketContext.Provider value={{ ws, joinRoom, leaveRoom, updateRoom }}>
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
