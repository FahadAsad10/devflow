import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type ApiNotification } from "../lib/api";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("devflow-theme") === "dark");
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("devflow-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    api.notifications().then((response) => setNotifications(response.notifications)).catch(() => undefined);
  }, [user?.id]);

  async function signOut() {
    await logout();
    navigate("/login", { replace: true });
  }

  async function markRead(notification: ApiNotification) {
    if (!notification.read) {
      await api.markNotificationRead(notification.id).catch(() => undefined);
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item));
    }
    if (notification.project) navigate(`/projects/${notification.project.id}`);
    setNotificationOpen(false);
  }

  async function markAllRead() {
    await api.markAllNotificationsRead().catch(() => undefined);
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }

  const initial = user?.name?.charAt(0).toUpperCase() ?? "U";
  const unread = notifications.filter((notification) => !notification.read).length;

  return (
    <header className="topbar">
      <button className="topbar-logo logo-button" type="button" onClick={() => navigate("/dashboard")} aria-label="Go to dashboard">DevFlow</button>

      <div className="topbar-user">
        <button className="theme-toggle" type="button" onClick={() => setDark((value) => !value)} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Light mode" : "Dark mode"}>
          {dark ? "☀" : "☾"}
        </button>

        <div className="notification-wrap">
          <button className="notification-button" type="button" onClick={() => setNotificationOpen((value) => !value)} aria-label={`${unread} unread notifications`} aria-expanded={notificationOpen}>
            🔔{unread > 0 && <span className="notification-count">{unread > 9 ? "9+" : unread}</span>}
          </button>
          {notificationOpen && (
            <div className="notification-menu">
              <div className="notification-menu-header">
                <strong>Notifications</strong>
                {unread > 0 && <button type="button" onClick={() => void markAllRead()}>Mark all read</button>}
              </div>
              {notifications.length === 0 ? <p className="notification-empty">You're all caught up.</p> : notifications.slice(0, 8).map((notification) => (
                <button className={`notification-item ${notification.read ? "" : "unread"}`} key={notification.id} type="button" onClick={() => void markRead(notification)}>
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                  <time dateTime={notification.createdAt}>{new Date(notification.createdAt).toLocaleString()}</time>
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="user-avatar" aria-hidden="true">{initial}</span>
        <span className="topbar-name">{user?.name ?? "User"}</span>
        <button className="button-secondary nav-logout" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>Account</button>
        {open && (
          <div className="account-menu">
            <span>{user?.email}</span>
            <button className="button-secondary" type="button" onClick={signOut}>Sign out</button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
