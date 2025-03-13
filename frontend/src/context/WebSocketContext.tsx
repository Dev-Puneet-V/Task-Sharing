import { createContext, useContext, useEffect, useState } from "react";

const WEBSOCKET_URL = "ws://localhost:5001";

// TODO: CONNECT TO WEBSOCKET SERVER

interface WebSocketContextType {
  ws: WebSocket | null;
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
    const socket = new WebSocket(WEBSOCKET_URL);
    setWs(socket);
  }, []);
  return (
    <webSocketContext.Provider value={{ws}}>
      {children}
    </webSocketContext.Provider>
  )
};

export const useWebSocket = () => {
  const context = useContext(webSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};


export default webSocketContext;