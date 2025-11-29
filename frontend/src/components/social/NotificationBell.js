import React, { useState, useEffect, useRef } from 'react';
import { FiBell, FiCheck } from 'react-icons/fi';
import { notificationService } from '../../services/notificationService';
import styles from './NotificationBell.module.css';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadNotifications();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(10);
      if (response.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId = null) => {
    try {
      const notificationIds = notificationId ? [notificationId] : notifications.map(n => n._id).filter(id => id);
      
      await notificationService.markAsRead(notificationIds);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification._id) 
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - (notificationId ? 1 : notifications.filter(n => !n.isRead).length)));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const formatNotificationMessage = (notification) => {
    const user = notification.fromUser?.firstName || 'Someone';
    
    switch (notification.type) {
      case 'like':
        return `${user} liked your post`;
      case 'comment':
        return `${user} commented on your post`;
      case 'follow':
        return `${user} started following you`;
      case 'mention':
        return `${user} mentioned you in a post`;
      case 'achievement':
        return `🎉 You earned a new achievement!`;
      default:
        return notification.message;
    }
  };

  const formatTimeAgo = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className={styles.notificationContainer} ref={dropdownRef}>
      <button 
        className={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        <FiBell />
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className={styles.markAllRead}
                onClick={() => handleMarkAsRead()}
              >
                <FiCheck />
                Mark all read
              </button>
            )}
          </div>

          <div className={styles.notificationsList}>
            {loading ? (
              <div className={styles.loading}>Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className={styles.empty}>No notifications yet</div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification._id}
                  className={`${styles.notificationItem} ${!notification.isRead ? styles.unread : ''}`}
                  onClick={() => handleMarkAsRead(notification._id)}
                >
                  <div className={styles.notificationAvatar}>
                    {notification.fromUser?.firstName?.charAt(0) || '👤'}
                  </div>
                  <div className={styles.notificationContent}>
                    <p className={styles.message}>
                      {formatNotificationMessage(notification)}
                    </p>
                    <span className={styles.time}>
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                  {!notification.isRead && (
                    <div className={styles.unreadDot}></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;