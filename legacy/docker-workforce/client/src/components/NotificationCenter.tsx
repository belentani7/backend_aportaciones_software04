import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/_core/hooks/useAuth";
import { Bell, CheckCircle, AlertCircle, X } from "lucide-react";

interface Notification {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message: string;
  timestamp: Date;
}

export function NotificationCenter() {
  const { user } = useAuth();
  const { isConnected, notifications: socketNotifications } = useSocket(user?.id ? `token-${user.id}` : null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (socketNotifications.length > 0) {
      const lastNotif = socketNotifications[socketNotifications.length - 1];
      const newNotif: Notification = {
        id: `${Date.now()}`,
        type: lastNotif.status === "success" ? "success" : "error",
        title: lastNotif.task_name || "Tarea completada",
        message: lastNotif.data?.message || JSON.stringify(lastNotif.data),
        timestamp: new Date(),
      };

      setNotifications((prev) => [newNotif, ...prev.slice(0, 4)]);
      setUnreadCount((prev) => prev + 1);

      playNotificationSound();
    }
  }, [socketNotifications]);

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 space-y-2 max-w-sm z-50">
      {/* Connection Status */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
        <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
        {isConnected ? "Conectado" : "Desconectado"}
      </div>

      {/* Notifications */}
      {notifications.map((notif) => (
        <div key={notif.id} className={`flex items-start gap-3 p-4 rounded-lg shadow-lg text-sm ${notif.type === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          {notif.type === "success" ? <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />}

          <div className="flex-1">
            <p className={`font-semibold ${notif.type === "success" ? "text-green-900" : "text-red-900"}`}>{notif.title}</p>
            <p className={`text-xs mt-1 ${notif.type === "success" ? "text-green-700" : "text-red-700"}`}>{notif.message}</p>
          </div>

          <button onClick={() => removeNotification(notif.id)} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      {/* Notification Bell Icon */}
      {unreadCount > 0 && (
        <div className="absolute top-0 right-0 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
          {unreadCount}
        </div>
      )}
    </div>
  );
}
