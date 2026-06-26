import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Trash2, Check, BellOff, ShoppingBag, X } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  target: string;
  userId?: string;
  adminId?: string;
  orderId?: string;
  productId?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
}

function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function NotificationMenu({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
}: NotificationMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // Only close if we did not click the bell button itself
        const target = event.target as HTMLElement;
        if (!target.closest('[aria-label="Notifications"]')) {
          onClose();
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSuperAdmin = location.pathname.startsWith('/superadmin');
  const ordersPath = isSuperAdmin ? '/superadmin/orders' : '/admin/orders';
  const productsPath = isSuperAdmin ? '/superadmin/products' : '/admin/products';

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const unreadCount = unreadNotifications.length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    onClose();
    if (notification.orderId) {
      navigate(`${ordersPath}?orderId=${notification.orderId}`);
    } else if (notification.productId) {
      navigate(`${productsPath}?productId=${notification.productId}`);
    } else {
      navigate(ordersPath);
    }
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
        <div>
          <h3 className="text-sm font-bold text-foreground">Notifications</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {unreadCount > 0 ? `You have ${unreadCount} unread message(s)` : 'No new messages'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-[11px] font-semibold text-primary hover:opacity-80 transition duration-150 cursor-pointer flex items-center gap-1"
              title="Mark all as read"
            >
              <Check className="h-3 w-3" />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-full text-muted-foreground hover:bg-muted transition duration-150 cursor-pointer"
            aria-label="Close notifications menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[360px] overflow-y-auto divide-y divide-border/60">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <BellOff className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs font-semibold text-foreground">All caught up!</p>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px]">
              You don't have any notifications at the moment.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`group flex items-start gap-3 p-4 hover:bg-muted/40 transition duration-150 cursor-pointer relative border-l-4 ${
                notification.isRead ? 'border-l-transparent' : 'border-l-primary bg-primary/5'
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              {/* Notification Icon */}
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                notification.isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
              }`}>
                <ShoppingBag className="h-4 w-4" />
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center justify-between">
                  <p className={`text-xs truncate ${notification.isRead ? 'font-medium text-muted-foreground' : 'font-bold text-foreground'}`}>
                    {notification.title}
                  </p>
                  <span className="text-[10px] text-muted-foreground select-none">
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                </div>
                <p className={`text-[11px] mt-1 break-words line-clamp-2 leading-relaxed ${
                  notification.isRead ? 'text-muted-foreground/80' : 'text-foreground/90 font-medium'
                }`}>
                  {notification.message}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notification.id);
                  }}
                  className="p-1 rounded bg-card border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition duration-150 cursor-pointer shadow-sm"
                  title="Delete notification"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
