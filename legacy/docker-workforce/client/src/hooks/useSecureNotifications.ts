import { useEffect, useRef, useState, useCallback } from "react";

interface NotificationPayload {
  type: "task_complete" | "compliance_violation" | "schedule_published" | "payroll_ready";
  taskId: string;
  taskName: string;
  status: "success" | "warning" | "error";
}

export function useSecureNotifications(token: string | null) {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" ? Notification.permission : "denied"
  );
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/sounds/notification.mp3");
      audioRef.current.volume = 0.5;
    }
  }, []);

  const connect = useCallback(() => {
    if (!token || permission !== "granted") return;

    const wsUrl = `${process.env.REACT_APP_WS_URL}/ws/notifications?token=${token}`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    wsRef.current.onmessage = (event) => {
      const data: NotificationPayload = JSON.parse(event.data);
      if (data.type === "task_complete") {
        triggerNotification(data);
      }
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttemptsRef.current++;
        connect();
      }, delay);
    };

    wsRef.current.onerror = () => {
      wsRef.current?.close();
    };
  }, [token, permission]);

  const triggerNotification = (data: NotificationPayload) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    if (Notification.permission === "granted") {
      new Notification("✅ Tarea Completada - AION", {
        body: `${data.taskName} finalizado.`,
        icon: "/favicon.ico",
        tag: data.taskId,
      });
    }
  };

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") connect();
  };

  const revokePermission = () => {
    if (wsRef.current) wsRef.current.close();
    setPermission("denied");
  };

  useEffect(() => {
    if (permission === "granted") connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect, permission]);

  return { permission, requestPermission, revokePermission, isConnected };
}
