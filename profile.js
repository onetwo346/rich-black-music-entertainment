// profile.js - Handles user profiles and friend functionality
let currentUser = null;
let userProfiles = {};
let friendRequests = [];
let notifications = [];

// Initialize profile functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    setupProfileEventListeners();
    loadUserProfiles();
});

// Check if user is logged in
function checkLoginStatus() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentUser = JSON.parse(userData);
    }
}

// Load user profiles from localStorage
function loadUserProfiles() {
    const profilesData = localStorage.getItem('user_profiles');
    if (profilesData) {
        userProfiles = JSON.parse(profilesData);
    }
    
    // Load friend requests
    const requestsData = localStorage.getItem('friend_requests');
    if (requestsData) {
        friendRequests = JSON.parse(requestsData);
    }
    
    // Load notifications
    const notificationsData = localStorage.getItem('user_notifications');
    if (notificationsData) {
        notifications = JSON.parse(notificationsData);
    } else {
        // Check for global notifications
        const globalNotifications = localStorage.getItem('global_notifications');
        if (globalNotifications) {
            notifications = JSON.parse(globalNotifications);
            localStorage.setItem('user_notifications', JSON.stringify(notifications));
        }
    }
    
    updateNotificationCount();
}

// Get user profile
function getUserProfile(userId) {
    // If profile exists in cache, return it
    if (userProfiles[userId]) {
        return userProfiles[userId];
    }
    
    // Otherwise, create a basic profile from users data
    const usersData = localStorage.getItem('users');
    if (usersData) {
        const users = JSON.parse(usersData);
        const user = users.find(u => u.id === userId);
        
        if (user) {
            const profile = {
                id: user.id,
                username: user.username,
                avatar: user.avatar || getRandomAvatar(user.username),
                bio: user.bio || 'No bio yet',
                followers: [],
                following: [],
                posts: [],
                joinDate: user.joinDate || new Date().toISOString()
            };
            
            // Cache the profile
            userProfiles[userId] = profile;
            localStorage.setItem('user_profiles', JSON.stringify(userProfiles));
            
            return profile;
        }
    }
    
    return null;
}

// View user profile
function viewUserProfile(userId) {
    if (!userId) return;
    
    const profile = getUserProfile(userId);
    if (!profile) return;
    
    // Show profile modal
    const profileModal = document.getElementById('profile-modal');
    if (!profileModal) return;
    
    profileModal.innerHTML = `
        <div class="modal-content profile-modal-content">
            <span class="close">&times;</span>
            <div class="profile-header">
                <img src="${profile.avatar}" alt="${profile.username}" class="profile-avatar">
                <div class="profile-info">
                    <h2>${profile.username}</h2>
                    <p class="profile-bio">${profile.bio}</p>
                    <div class="profile-stats">
                        <div class="stat">
                            <span class="stat-count">${profile.posts.length}</span>
                            <span class="stat-label">Posts</span>
                        </div>
                        <div class="stat">
                            <span class="stat-count">${profile.followers.length}</span>
                            <span class="stat-label">Followers</span>
                        </div>
                        <div class="stat">
                            <span class="stat-count">${profile.following.length}</span>
                            <span class="stat-label">Following</span>
                        </div>
                    </div>
                    ${currentUser && currentUser.id !== userId ? `
                        <div class="profile-actions">
                            ${isFollowing(userId) ? 
                                `<button class="unfollow-btn" data-user-id="${userId}">Unfollow</button>` : 
                                `<button class="follow-btn" data-user-id="${userId}">Follow</button>`
                            }
                            ${hasFriendRequest(userId) ? 
                                `<button class="accept-request-btn" data-user-id="${userId}">Accept Request</button>` : 
                                isFriend(userId) ? 
                                    `<button class="unfriend-btn" data-user-id="${userId}">Unfriend</button>` : 
                                    hasSentFriendRequest(userId) ? 
                                        `<button class="cancel-request-btn" data-user-id="${userId}">Cancel Request</button>` : 
                                        `<button class="add-friend-btn" data-user-id="${userId}">Add Friend</button>`
                            }
                            <button class="message-btn" data-user-id="${userId}">Message</button>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="profile-content">
                <h3>Posts</h3>
                <div class="profile-posts" id="profile-posts-${userId}">
                    <!-- Posts will be loaded here -->
                </div>
            </div>
        </div>
    `;
    
    profileModal.style.display = 'block';
    
    // Load user posts
    loadUserPosts(userId);
    
    // Setup close button
    const closeBtn = profileModal.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            profileModal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === profileModal) {
            profileModal.style.display = 'none';
        }
    });
}

// Load user posts
function loadUserPosts(userId) {
    const postsContainer = document.getElementById(`profile-posts-${userId}`);
    if (!postsContainer) return;
    
    // Get all posts
    let allPosts = [];
    
    // Get admin posts
    const adminPostsData = localStorage.getItem('all_posts');
    if (adminPostsData) {
        const adminPosts = JSON.parse(adminPostsData);
        allPosts = [...adminPosts];
    }
    
    // Get user posts
    const userPostsData = localStorage.getItem('user_posts');
    if (userPostsData) {
        const userPosts = JSON.parse(userPostsData);
        // Add user posts that aren't already in allPosts
        userPosts.forEach(post => {
            if (!allPosts.some(p => p.id === post.id)) {
                allPosts.push(post);
            }
        });
    }
    
    // Filter posts by user ID
    const userPosts = allPosts.filter(post => post.userId === userId);
    
    if (userPosts.length === 0) {
        postsContainer.innerHTML = '<p class="no-posts">No posts yet</p>';
        return;
    }
    
    postsContainer.innerHTML = '';
    
    // Sort posts by timestamp (newest first)
    userPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Render posts
    userPosts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'profile-post';
        
        let mediaContent = '';
        if (post.type === 'photo' && post.mediaUrl) {
            mediaContent = `<img src="${post.mediaUrl}" alt="Post image" class="post-image">`;
        } else if (post.type === 'music' && post.mediaUrl) {
            mediaContent = `
                <audio controls class="post-audio">
                    <source src="${post.mediaUrl}" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
            `;
        }
        
        postElement.innerHTML = `
            <div class="post-header">
                <div class="post-info">
                    <div class="post-time">${getTimeAgo(post.timestamp)}</div>
                </div>
            </div>
            <div class="post-content">${post.content}</div>
            ${mediaContent}
            <div class="post-stats">
                <span>${post.likes.length} likes</span>
                <span>${post.comments ? post.comments.length : 0} comments</span>
            </div>
        `;
        
        postsContainer.appendChild(postElement);
    });
}

// Check if current user is following a user
function isFollowing(userId) {
    if (!currentUser) return false;
    
    const profile = getUserProfile(currentUser.id);
    return profile && profile.following.includes(userId);
}

// Check if user has sent a friend request to current user
function hasFriendRequest(userId) {
    if (!currentUser) return false;
    
    return friendRequests.some(req => 
        req.from === userId && 
        req.to === currentUser.id && 
        req.status === 'pending'
    );
}

// Check if current user has sent a friend request to user
function hasSentFriendRequest(userId) {
    if (!currentUser) return false;
    
    return friendRequests.some(req => 
        req.from === currentUser.id && 
        req.to === userId && 
        req.status === 'pending'
    );
}

// Check if user is a friend of current user
function isFriend(userId) {
    if (!currentUser) return false;
    
    return friendRequests.some(req => 
        ((req.from === userId && req.to === currentUser.id) || 
         (req.from === currentUser.id && req.to === userId)) && 
        req.status === 'accepted'
    );
}

// Follow a user
function followUser(userId) {
    if (!currentUser || currentUser.id === userId) return;
    
    // Get current user profile
    const userProfile = getUserProfile(currentUser.id);
    if (!userProfile) return;
    
    // Get target user profile
    const targetProfile = getUserProfile(userId);
    if (!targetProfile) return;
    
    // Add target user to following list if not already following
    if (!userProfile.following.includes(userId)) {
        userProfile.following.push(userId);
    }
    
    // Add current user to target user's followers list
    if (!targetProfile.followers.includes(currentUser.id)) {
        targetProfile.followers.push(currentUser.id);
    }
    
    // Update profiles
    userProfiles[currentUser.id] = userProfile;
    userProfiles[userId] = targetProfile;
    
    // Save to localStorage
    localStorage.setItem('user_profiles', JSON.stringify(userProfiles));
    
    // Create notification for target user
    createNotification(userId, 'follow', `${currentUser.username} started following you`);
    
    // Update UI
    const followBtn = document.querySelector(`.follow-btn[data-user-id="${userId}"]`);
    if (followBtn) {
        followBtn.outerHTML = `<button class="unfollow-btn" data-user-id="${userId}">Unfollow</button>`;
    }
}

// Unfollow a user
function unfollowUser(userId) {
    if (!currentUser || currentUser.id === userId) return;
    
    // Get current user profile
    const userProfile = getUserProfile(currentUser.id);
    if (!userProfile) return;
    
    // Get target user profile
    const targetProfile = getUserProfile(userId);
    if (!targetProfile) return;
    
    // Remove target user from following list
    const followingIndex = userProfile.following.indexOf(userId);
    if (followingIndex !== -1) {
        userProfile.following.splice(followingIndex, 1);
    }
    
    // Remove current user from target user's followers list
    const followerIndex = targetProfile.followers.indexOf(currentUser.id);
    if (followerIndex !== -1) {
        targetProfile.followers.splice(followerIndex, 1);
    }
    
    // Update profiles
    userProfiles[currentUser.id] = userProfile;
    userProfiles[userId] = targetProfile;
    
    // Save to localStorage
    localStorage.setItem('user_profiles', JSON.stringify(userProfiles));
    
    // Update UI
    const unfollowBtn = document.querySelector(`.unfollow-btn[data-user-id="${userId}"]`);
    if (unfollowBtn) {
        unfollowBtn.outerHTML = `<button class="follow-btn" data-user-id="${userId}">Follow</button>`;
    }
}

// Send friend request
function sendFriendRequest(userId) {
    if (!currentUser || currentUser.id === userId) return;
    
    // Check if request already exists
    const existingRequest = friendRequests.find(req => 
        (req.from === currentUser.id && req.to === userId) || 
        (req.from === userId && req.to === currentUser.id)
    );
    
    if (existingRequest) return;
    
    // Create new request
    const request = {
        id: Date.now(),
        from: currentUser.id,
        to: userId,
        status: 'pending',
        timestamp: new Date().toISOString()
    };
    
    friendRequests.push(request);
    
    // Save to localStorage
    localStorage.setItem('friend_requests', JSON.stringify(friendRequests));
    
    // Create notification for target user
    createNotification(userId, 'friend_request', `${currentUser.username} sent you a friend request`);
    
    // Update UI
    const addFriendBtn = document.querySelector(`.add-friend-btn[data-user-id="${userId}"]`);
    if (addFriendBtn) {
        addFriendBtn.outerHTML = `<button class="cancel-request-btn" data-user-id="${userId}">Cancel Request</button>`;
    }
}

// Cancel friend request
function cancelFriendRequest(userId) {
    if (!currentUser) return;
    
    // Find request
    const requestIndex = friendRequests.findIndex(req => 
        req.from === currentUser.id && 
        req.to === userId && 
        req.status === 'pending'
    );
    
    if (requestIndex === -1) return;
    
    // Remove request
    friendRequests.splice(requestIndex, 1);
    
    // Save to localStorage
    localStorage.setItem('friend_requests', JSON.stringify(friendRequests));
    
    // Update UI
    const cancelBtn = document.querySelector(`.cancel-request-btn[data-user-id="${userId}"]`);
    if (cancelBtn) {
        cancelBtn.outerHTML = `<button class="add-friend-btn" data-user-id="${userId}">Add Friend</button>`;
    }
}

// Accept friend request
function acceptFriendRequest(userId) {
    if (!currentUser) return;
    
    // Find request
    const requestIndex = friendRequests.findIndex(req => 
        req.from === userId && 
        req.to === currentUser.id && 
        req.status === 'pending'
    );
    
    if (requestIndex === -1) return;
    
    // Update request status
    friendRequests[requestIndex].status = 'accepted';
    
    // Save to localStorage
    localStorage.setItem('friend_requests', JSON.stringify(friendRequests));
    
    // Create notification for sender
    createNotification(userId, 'friend_accepted', `${currentUser.username} accepted your friend request`);
    
    // Update UI
    const acceptBtn = document.querySelector(`.accept-request-btn[data-user-id="${userId}"]`);
    if (acceptBtn) {
        acceptBtn.outerHTML = `<button class="unfriend-btn" data-user-id="${userId}">Unfriend</button>`;
    }
}

// Unfriend a user
function unfriendUser(userId) {
    if (!currentUser) return;
    
    // Find request
    const requestIndex = friendRequests.findIndex(req => 
        ((req.from === userId && req.to === currentUser.id) || 
         (req.from === currentUser.id && req.to === userId)) && 
        req.status === 'accepted'
    );
    
    if (requestIndex === -1) return;
    
    // Remove request
    friendRequests.splice(requestIndex, 1);
    
    // Save to localStorage
    localStorage.setItem('friend_requests', JSON.stringify(friendRequests));
    
    // Update UI
    const unfriendBtn = document.querySelector(`.unfriend-btn[data-user-id="${userId}"]`);
    if (unfriendBtn) {
        unfriendBtn.outerHTML = `<button class="add-friend-btn" data-user-id="${userId}">Add Friend</button>`;
    }
}

// Create notification
function createNotification(userId, type, message) {
    const notification = {
        id: Date.now(),
        userId: userId,
        type: type,
        message: message,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    // Get user notifications
    let userNotifications = [];
    const notificationsData = localStorage.getItem(`notifications_${userId}`);
    if (notificationsData) {
        userNotifications = JSON.parse(notificationsData);
    }
    
    userNotifications.unshift(notification);
    
    // Save to localStorage
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(userNotifications));
}

// Update notification count
function updateNotificationCount() {
    if (!currentUser) return;
    
    // Get user notifications
    let userNotifications = [];
    const notificationsData = localStorage.getItem(`notifications_${currentUser.id}`);
    if (notificationsData) {
        userNotifications = JSON.parse(notificationsData);
    }
    
    // Count unread notifications
    const unreadCount = userNotifications.filter(n => !n.read).length;
    
    // Update UI
    const notificationBadge = document.getElementById('notification-badge');
    if (notificationBadge) {
        notificationBadge.textContent = unreadCount;
        notificationBadge.style.display = unreadCount > 0 ? 'block' : 'none';
    }
}

// Setup profile event listeners
function setupProfileEventListeners() {
    // Profile actions
    document.addEventListener('click', function(e) {
        // View profile
        if (e.target.matches('.view-profile-btn') || e.target.closest('.view-profile-btn')) {
            const userId = e.target.getAttribute('data-user-id') || e.target.closest('.view-profile-btn').getAttribute('data-user-id');
            viewUserProfile(userId);
        }
        // Follow user
        else if (e.target.matches('.follow-btn')) {
            const userId = e.target.getAttribute('data-user-id');
            followUser(userId);
        }
        // Unfollow user
        else if (e.target.matches('.unfollow-btn')) {
            const userId = e.target.getAttribute('data-user-id');
            unfollowUser(userId);
        }
        // Add friend
        else if (e.target.matches('.add-friend-btn')) {
            const userId = e.target.getAttribute('data-user-id');
            sendFriendRequest(userId);
        }
        // Cancel friend request
        else if (e.target.matches('.cancel-request-btn')) {
            const userId = e.target.getAttribute('data-user-id');
            cancelFriendRequest(userId);
        }
        // Accept friend request
        else if (e.target.matches('.accept-request-btn')) {
            const userId = e.target.getAttribute('data-user-id');
            acceptFriendRequest(userId);
        }
        // Unfriend user
        else if (e.target.matches('.unfriend-btn')) {
            const userId = e.target.getAttribute('data-user-id');
            unfriendUser(userId);
        }
    });
    
    // Comment username click to view profile
    document.addEventListener('click', function(e) {
        if (e.target.matches('.comment-username')) {
            const commentElement = e.target.closest('.comment');
            if (commentElement) {
                const userId = commentElement.getAttribute('data-user-id');
                if (userId) {
                    viewUserProfile(userId);
                }
            }
        }
    });
}

// Helper function to get random avatar
function getRandomAvatar(username) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;
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
