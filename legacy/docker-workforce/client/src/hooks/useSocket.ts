import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;

    const socket = io(process.env.REACT_APP_WS_URL || "http://localhost:3000", {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("[Socket.io] Connected");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("[Socket.io] Disconnected");
      setIsConnected(false);
    });

    socket.on("task_complete", (data) => {
      setNotifications((prev) => [...prev, data]);
      console.log("[Task Complete]", data);
    });

    socket.on("task_failed", (data) => {
      setNotifications((prev) => [...prev, { ...data, type: "error" }]);
      console.log("[Task Failed]", data);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const emit = (event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    notifications,
    emit,
  };
}
