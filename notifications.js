// notifications.js - Handles user notifications
let currentUser = null;
let notifications = [];

// Initialize notifications when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    setupNotificationEventListeners();
    loadNotifications();
});

// Check if user is logged in
function checkLoginStatus() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentUser = JSON.parse(userData);
    }
}

// Load notifications from localStorage
function loadNotifications() {
    if (!currentUser) return;
    
    // Get user-specific notifications
    const userNotificationsData = localStorage.getItem(`notifications_${currentUser.id}`);
    if (userNotificationsData) {
        const userNotifications = JSON.parse(userNotificationsData);
        notifications = [...userNotifications];
    }
    
    // Get global notifications
    const globalNotificationsData = localStorage.getItem('global_notifications');
    if (globalNotificationsData) {
        const globalNotifications = JSON.parse(globalNotificationsData);
        
        // Add global notifications that aren't already in the user's notifications
        globalNotifications.forEach(notification => {
            if (!notifications.some(n => n.id === notification.id)) {
                notifications.push({
                    ...notification,
                    userId: currentUser.id
                });
            }
        });
    }
    
    // Sort notifications by timestamp (newest first)
    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Update notification badge
    updateNotificationBadge();
    
    // Render notifications
    renderNotifications();
}

// Update notification badge
function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Update dashboard notification badge
    const dashboardBadge = document.getElementById('notification-badge');
    if (dashboardBadge) {
        dashboardBadge.textContent = unreadCount;
        dashboardBadge.style.display = unreadCount > 0 ? 'block' : 'none';
    }
    
    // Update sidebar notification badge
    const sidebarBadge = document.getElementById('sidebar-notification-badge');
    if (sidebarBadge) {
        sidebarBadge.textContent = unreadCount;
        sidebarBadge.style.display = unreadCount > 0 ? 'block' : 'none';
    }
}

// Render notifications
function renderNotifications() {
    const notificationsContainer = document.getElementById('notifications');
    if (!notificationsContainer) return;
    
    notificationsContainer.innerHTML = '';
    
    if (notifications.length === 0) {
        notificationsContainer.innerHTML = '<p class="no-notifications">No notifications yet</p>';
        return;
    }
    
    notifications.forEach(notification => {
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
        notificationElement.setAttribute('data-notification-id', notification.id);
        
        let icon = '';
        switch (notification.type) {
            case 'new_post':
                icon = 'fa-file-alt';
                break;
            case 'new_music':
                icon = 'fa-music';
                break;
            case 'like':
                icon = 'fa-heart';
                break;
            case 'comment':
                icon = 'fa-comment';
                break;
            case 'follow':
                icon = 'fa-user-plus';
                break;
            case 'friend_request':
                icon = 'fa-user-friends';
                break;
            case 'friend_accepted':
                icon = 'fa-handshake';
                break;
            default:
                icon = 'fa-bell';
        }
        
        notificationElement.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${getTimeAgo(notification.timestamp)}</div>
            </div>
            <div class="notification-actions">
                <button class="mark-read-btn" data-notification-id="${notification.id}">
                    ${notification.read ? 'Mark Unread' : 'Mark Read'}
                </button>
            </div>
        `;
        
        notificationsContainer.appendChild(notificationElement);
    });
}

// Mark notification as read
function markNotificationAsRead(notificationId) {
    const notificationIndex = notifications.findIndex(n => n.id === parseInt(notificationId));
    if (notificationIndex === -1) return;
    
    notifications[notificationIndex].read = true;
    
    // Save to localStorage
    saveNotifications();
    
    // Update UI
    const notificationElement = document.querySelector(`.notification-item[data-notification-id="${notificationId}"]`);
    if (notificationElement) {
        notificationElement.classList.remove('unread');
        notificationElement.classList.add('read');
        
        const markReadBtn = notificationElement.querySelector('.mark-read-btn');
        if (markReadBtn) {
            markReadBtn.textContent = 'Mark Unread';
        }
    }
    
    // Update notification badge
    updateNotificationBadge();
}

// Mark notification as unread
function markNotificationAsUnread(notificationId) {
    const notificationIndex = notifications.findIndex(n => n.id === parseInt(notificationId));
    if (notificationIndex === -1) return;
    
    notifications[notificationIndex].read = false;
    
    // Save to localStorage
    saveNotifications();
    
    // Update UI
    const notificationElement = document.querySelector(`.notification-item[data-notification-id="${notificationId}"]`);
    if (notificationElement) {
        notificationElement.classList.remove('read');
        notificationElement.classList.add('unread');
        
        const markReadBtn = notificationElement.querySelector('.mark-read-btn');
        if (markReadBtn) {
            markReadBtn.textContent = 'Mark Read';
        }
    }
    
    // Update notification badge
    updateNotificationBadge();
}

// Mark all notifications as read
function markAllNotificationsAsRead() {
    notifications.forEach(notification => {
        notification.read = true;
    });
    
    // Save to localStorage
    saveNotifications();
    
    // Update UI
    const notificationElements = document.querySelectorAll('.notification-item');
    notificationElements.forEach(element => {
        element.classList.remove('unread');
        element.classList.add('read');
        
        const markReadBtn = element.querySelector('.mark-read-btn');
        if (markReadBtn) {
            markReadBtn.textContent = 'Mark Unread';
        }
    });
    
    // Update notification badge
    updateNotificationBadge();
}

// Save notifications to localStorage
function saveNotifications() {
    if (!currentUser) return;
    
    localStorage.setItem(`notifications_${currentUser.id}`, JSON.stringify(notifications));
}

// Create a new notification
function createNotification(type, message, contentId = null) {
    if (!currentUser) return;
    
    const notification = {
        id: Date.now(),
        userId: currentUser.id,
        type: type,
        message: message,
        contentId: contentId,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    // Add to notifications array
    notifications.unshift(notification);
    
    // Save to localStorage
    saveNotifications();
    
    // Update notification badge
    updateNotificationBadge();
    
    // Render notifications if container exists
    const notificationsContainer = document.getElementById('notifications');
    if (notificationsContainer) {
        renderNotifications();
    }
    
    return notification;
}

// Setup notification event listeners
function setupNotificationEventListeners() {
    // Mark notification as read/unread
    document.addEventListener('click', function(e) {
        if (e.target.matches('.mark-read-btn')) {
            const notificationId = e.target.getAttribute('data-notification-id');
            const notification = notifications.find(n => n.id === parseInt(notificationId));
            
            if (notification) {
                if (notification.read) {
                    markNotificationAsUnread(notificationId);
                } else {
                    markNotificationAsRead(notificationId);
                }
            }
        }
        // Mark all as read button
        else if (e.target.matches('#mark-all-read-btn')) {
            markAllNotificationsAsRead();
        }
    });
    
    // Notification item click to view content
    document.addEventListener('click', function(e) {
        if (e.target.matches('.notification-item') || e.target.closest('.notification-item')) {
            const notificationElement = e.target.matches('.notification-item') ? e.target : e.target.closest('.notification-item');
            const notificationId = notificationElement.getAttribute('data-notification-id');
            const notification = notifications.find(n => n.id === parseInt(notificationId));
            
            if (notification && !notification.read) {
                markNotificationAsRead(notificationId);
            }
            
            // Handle notification click based on type
            if (notification && notification.contentId) {
                switch (notification.type) {
                    case 'new_post':
                        // View post
                        viewPost(notification.contentId);
                        break;
                    case 'new_music':
                        // View music
                        viewMusic(notification.contentId);
                        break;
                    case 'like':
                    case 'comment':
                        // View comment
                        viewComment(notification.contentId);
                        break;
                    case 'follow':
                    case 'friend_request':
                    case 'friend_accepted':
                        // View profile
                        viewProfile(notification.contentId);
                        break;
                }
            }
        }
    });
}

// View post
function viewPost(postId) {
    // Implementation would depend on your app structure
    console.log('Viewing post:', postId);
}

// View music
function viewMusic(musicId) {
    // Implementation would depend on your app structure
    console.log('Viewing music:', musicId);
}

// View comment
function viewComment(commentId) {
    // Implementation would depend on your app structure
    console.log('Viewing comment:', commentId);
}

// View profile
function viewProfile(userId) {
    // Implementation would depend on your app structure
    console.log('Viewing profile:', userId);
}

// Helper function for time ago
function getTimeAgo(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days < 1) {
        if (hours < 1) {
            if (minutes < 1) {
                return 'just now';
            }
            return `${minutes}m ago`;
        }
        return `${hours}h ago`;
    } else if (days < 7) {
        return `${days}d ago`;
    }

    return date.toLocaleDateString();
}
