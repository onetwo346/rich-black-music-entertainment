// admin.js - Handles the admin portal functionality
let isAdmin = false;
let allUsers = [];
let adminNotifications = [];

// Initialize admin portal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    checkAdminStatus();
});

// Make loadAdminData available globally
window.loadAdminData = loadAdminData;

// Check if user is logged in as admin
function checkAdminStatus() {
    const adminStatus = localStorage.getItem('adminLoggedIn');
    if (adminStatus === 'true') {
        isAdmin = true;
        showAdminPortal();
        loadAdminData();
    }
}



// Show admin portal
function showAdminPortal() {
    document.body.classList.add('admin-mode');
    document.getElementById('admin-portal').style.display = 'block';
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
    
    // Update admin info
    updateAdminInfo();
}

// Hide admin portal
function hideAdminPortal() {
    document.body.classList.remove('admin-mode');
    document.getElementById('admin-portal').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
}

// Update admin info
function updateAdminInfo() {
    const adminName = document.getElementById('admin-name');
    if (adminName) adminName.textContent = 'Administrator';
}

// Load admin data
function loadAdminData() {
    // Load all users
    const usersData = localStorage.getItem('users');
    if (usersData) {
        allUsers = JSON.parse(usersData);
        renderUsersList();
    }
    
    // Load all posts
    loadAllPosts();
    
    // Load admin notifications
    const notificationsData = localStorage.getItem('admin_notifications');
    if (notificationsData) {
        adminNotifications = JSON.parse(notificationsData);
        renderAdminNotifications();
    }
}

// Render users list
function renderUsersList() {
    const usersContainer = document.getElementById('users-list');
    if (!usersContainer) return;
    
    usersContainer.innerHTML = '';
    
    allUsers.forEach(user => {
        const userElement = document.createElement('div');
        userElement.className = 'user-item';
        userElement.innerHTML = `
            <img src="${user.avatar || getRandomAvatar(user.username)}" alt="${user.username}" class="user-avatar">
            <div class="user-info">
                <div class="user-name">${user.username}</div>
                <div class="user-email">${user.email || 'No email'}</div>
            </div>
            <div class="user-actions">
                <button class="view-user-btn" data-user-id="${user.id}">View</button>
                <button class="edit-user-btn" data-user-id="${user.id}">Edit</button>
                <button class="delete-user-btn" data-user-id="${user.id}">Delete</button>
            </div>
        `;
        usersContainer.appendChild(userElement);
    });
}

// Load all posts
function loadAllPosts() {
    const postsData = localStorage.getItem('all_posts');
    let allPosts = [];
    
    if (postsData) {
        allPosts = JSON.parse(postsData);
    }
    
    // Also get user posts
    const userPostsData = localStorage.getItem('user_posts');
    if (userPostsData) {
        const userPosts = JSON.parse(userPostsData);
        // Combine posts, avoiding duplicates
        userPosts.forEach(post => {
            if (!allPosts.some(p => p.id === post.id)) {
                allPosts.push(post);
            }
        });
    }
    
    renderAllPosts(allPosts);
}

// Render all posts
function renderAllPosts(posts) {
    const postsContainer = document.getElementById('all-posts');
    if (!postsContainer) return;
    
    postsContainer.innerHTML = '';
    
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post-item';
        postElement.innerHTML = `
            <div class="post-header">
                <img src="${post.avatar || getRandomAvatar(post.username)}" alt="${post.username}" class="post-avatar">
                <div class="post-info">
                    <div class="post-username">${post.username}</div>
                    <div class="post-time">${getTimeAgo(post.timestamp)}</div>
                </div>
                <div class="post-actions">
                    <button class="edit-post-btn" data-post-id="${post.id}">Edit</button>
                    <button class="delete-post-btn" data-post-id="${post.id}">Delete</button>
                </div>
            </div>
            <div class="post-content">${post.content}</div>
            ${post.mediaUrl ? `
                <div class="post-media">
                    ${post.type === 'photo' ? 
                        `<img src="${post.mediaUrl}" alt="Post image" class="post-image">` : 
                        `<audio controls src="${post.mediaUrl}" class="post-audio"></audio>`
                    }
                </div>
            ` : ''}
            <div class="post-stats">
                <span>${post.likes.length} likes</span>
                <span>${post.comments ? post.comments.length : 0} comments</span>
            </div>
        `;
        postsContainer.appendChild(postElement);
    });
}

// Create admin post
function createAdminPost() {
    const postContent = document.getElementById('admin-post-content').value;
    const postType = document.querySelector('input[name="post-type"]:checked').value;
    let mediaUrl = null;
    
    // In a real app, you would upload the file to a server
    // For this demo, we'll simulate it with a placeholder URL
    if (postType === 'photo') {
        mediaUrl = 'https://source.unsplash.com/random/800x600/?music';
    } else if (postType === 'music') {
        mediaUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    }
    
    const post = {
        id: Date.now(),
        userId: 'admin',
        username: 'Rich & Black',
        avatar: 'https://ui-avatars.com/api/?name=R+B&background=random',
        content: postContent,
        type: postType,
        mediaUrl: mediaUrl,
        timestamp: new Date().toISOString(),
        likes: [],
        comments: []
    };
    
    // Save to localStorage
    let allPosts = [];
    const postsData = localStorage.getItem('all_posts');
    if (postsData) {
        allPosts = JSON.parse(postsData);
    }
    
    allPosts.unshift(post);
    localStorage.setItem('all_posts', JSON.stringify(allPosts));
    
    // Create notification for all users
    createGlobalNotification('new_post', `Rich & Black just posted: ${postContent.substring(0, 30)}...`, post.id);
    
    // Reset form
    document.getElementById('admin-post-content').value = '';
    document.querySelector('input[name="post-type"][value="text"]').checked = true;
    
    // Refresh posts
    renderAllPosts(allPosts);
}

// Upload music
function uploadMusic() {
    const title = document.getElementById('music-title').value;
    const artist = document.getElementById('music-artist').value;
    const genre = document.getElementById('music-genre').value;
    
    // In a real app, you would upload the file to a server
    // For this demo, we'll simulate it with a placeholder URL
    const musicUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    
    const music = {
        id: Date.now(),
        title: title,
        artist: artist,
        genre: genre,
        url: musicUrl,
        coverArt: 'https://source.unsplash.com/random/300x300/?album',
        uploadedBy: 'admin',
        uploadDate: new Date().toISOString()
    };
    
    // Save to localStorage
    let allMusic = [];
    const musicData = localStorage.getItem('music_library');
    if (musicData) {
        allMusic = JSON.parse(musicData);
    }
    
    allMusic.unshift(music);
    localStorage.setItem('music_library', JSON.stringify(allMusic));
    
    // Create notification for all users
    createGlobalNotification('new_music', `New music added: ${title} by ${artist}`, music.id);
    
    // Reset form
    document.getElementById('music-title').value = '';
    document.getElementById('music-artist').value = '';
    document.getElementById('music-genre').value = '';
    
    // Refresh music library
    renderMusicLibrary();
}

// Render music library
function renderMusicLibrary() {
    const musicContainer = document.getElementById('music-library');
    if (!musicContainer) return;
    
    musicContainer.innerHTML = '';
    
    const musicData = localStorage.getItem('music_library');
    if (!musicData) return;
    
    const allMusic = JSON.parse(musicData);
    
    allMusic.forEach(music => {
        const musicElement = document.createElement('div');
        musicElement.className = 'music-item';
        musicElement.innerHTML = `
            <img src="${music.coverArt}" alt="${music.title}" class="music-cover">
            <div class="music-info">
                <div class="music-title">${music.title}</div>
                <div class="music-artist">${music.artist}</div>
                <div class="music-genre">${music.genre}</div>
            </div>
            <audio controls src="${music.url}" class="music-player"></audio>
            <div class="music-actions">
                <button class="edit-music-btn" data-music-id="${music.id}">Edit</button>
                <button class="delete-music-btn" data-music-id="${music.id}">Delete</button>
            </div>
        `;
        musicContainer.appendChild(musicElement);
    });
}

// Create global notification
function createGlobalNotification(type, message, contentId) {
    const notification = {
        id: Date.now(),
        type: type,
        message: message,
        contentId: contentId,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    // Save to localStorage for all users
    let allNotifications = [];
    const notificationsData = localStorage.getItem('global_notifications');
    if (notificationsData) {
        allNotifications = JSON.parse(notificationsData);
    }
    
    allNotifications.unshift(notification);
    localStorage.setItem('global_notifications', JSON.stringify(allNotifications));
    
    // Also save to admin notifications
    adminNotifications.unshift(notification);
    localStorage.setItem('admin_notifications', JSON.stringify(adminNotifications));
    
    // Refresh notifications
    renderAdminNotifications();
}

// Render admin notifications
function renderAdminNotifications() {
    const notificationsContainer = document.getElementById('admin-notifications');
    if (!notificationsContainer) return;
    
    notificationsContainer.innerHTML = '';
    
    adminNotifications.forEach(notification => {
        const notificationElement = document.createElement('div');
        notificationElement.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
        notificationElement.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${notification.type === 'new_post' ? 'fa-file-alt' : 
                               notification.type === 'new_music' ? 'fa-music' : 
                               notification.type === 'new_user' ? 'fa-user' : 'fa-bell'}"></i>
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

// Setup event listeners
function setupAdminEventListeners() {
    // Admin post form
    document.addEventListener('submit', function(e) {
        if (e.target.id === 'admin-post-form') {
            e.preventDefault();
            createAdminPost();
        } else if (e.target.id === 'upload-music-form') {
            e.preventDefault();
            uploadMusic();
        }
    });
    
    // Admin navigation
    document.addEventListener('click', function(e) {
        if (e.target.matches('.admin-nav-link')) {
            e.preventDefault();
            const section = e.target.getAttribute('data-section');
            showAdminSection(section);
        } else if (e.target.id === 'admin-logout' || e.target.matches('#admin-logout')) {
            e.preventDefault();
            logoutAdmin();
        } else if (e.target.matches('.delete-user-btn')) {
            const userId = e.target.getAttribute('data-user-id');
            if (confirm('Are you sure you want to delete this user?')) {
                deleteUser(userId);
            }
        } else if (e.target.matches('.delete-post-btn')) {
            const postId = e.target.getAttribute('data-post-id');
            if (confirm('Are you sure you want to delete this post?')) {
                deletePost(postId);
            }
        } else if (e.target.matches('.delete-music-btn')) {
            const musicId = e.target.getAttribute('data-music-id');
            if (confirm('Are you sure you want to delete this music?')) {
                deleteMusic(musicId);
            }
        }
    });
    
    // Explicitly connect the admin logout button
    const adminLogoutBtn = document.getElementById('admin-logout');
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logoutAdmin();
        });
    }
}

// Show admin section
function showAdminSection(section) {
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(s => s.classList.remove('active'));
    
    const navLinks = document.querySelectorAll('.admin-nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    document.getElementById(section).classList.add('active');
    document.querySelector(`.admin-nav-link[data-section="${section}"]`).classList.add('active');
}

// Logout admin
function logoutAdmin() {
    isAdmin = false;
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('rb_user_data');
    localStorage.removeItem('currentUser');
    hideAdminPortal();
    
    // Show main content
    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.style.display = 'block';
    
    // Update UI for logged out state
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (signupBtn) signupBtn.style.display = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    
    // Show notification
    if (window.showNotification) {
        window.showNotification('You have been logged out');
    } else {
        alert('You have been logged out');
    }
}

// Delete user
function deleteUser(userId) {
    const index = allUsers.findIndex(user => user.id === userId);
    if (index === -1) return;
    
    allUsers.splice(index, 1);
    localStorage.setItem('users', JSON.stringify(allUsers));
    
    renderUsersList();
}

// Delete post
function deletePost(postId) {
    // Delete from all_posts
    let allPosts = [];
    const postsData = localStorage.getItem('all_posts');
    if (postsData) {
        allPosts = JSON.parse(postsData);
        const index = allPosts.findIndex(post => post.id === parseInt(postId));
        if (index !== -1) {
            allPosts.splice(index, 1);
            localStorage.setItem('all_posts', JSON.stringify(allPosts));
        }
    }
    
    // Also check user_posts
    const userPostsData = localStorage.getItem('user_posts');
    if (userPostsData) {
        const userPosts = JSON.parse(userPostsData);
        const index = userPosts.findIndex(post => post.id === parseInt(postId));
        if (index !== -1) {
            userPosts.splice(index, 1);
            localStorage.setItem('user_posts', JSON.stringify(userPosts));
        }
    }
    
    renderAllPosts(allPosts);
}

// Delete music
function deleteMusic(musicId) {
    const musicData = localStorage.getItem('music_library');
    if (!musicData) return;
    
    const allMusic = JSON.parse(musicData);
    const index = allMusic.findIndex(music => music.id === parseInt(musicId));
    if (index === -1) return;
    
    allMusic.splice(index, 1);
    localStorage.setItem('music_library', JSON.stringify(allMusic));
    
    renderMusicLibrary();
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

// Initialize admin event listeners
document.addEventListener('DOMContentLoaded', () => {
    setupAdminEventListeners();
});
