// dashboard.js - Handles the social media dashboard functionality
let currentUser = null;
let posts = [];
let notifications = [];

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    setupEventListeners();
});

// Check if user is logged in
function checkLoginStatus() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentUser = JSON.parse(userData);
        showDashboard();
        loadUserData();
    } else {
        hideDashboard();
    }
}

// Show dashboard
function showDashboard() {
    document.body.classList.add('dashboard-active');
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('main-content').style.display = 'none';
    
    // Update user info
    updateUserInfo();
    
    // Load feed
    loadFeed();
    
    // Load notifications
    loadNotifications();
}

// Hide dashboard
function hideDashboard() {
    document.body.classList.remove('dashboard-active');
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
}

// Update user info in dashboard
function updateUserInfo() {
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const userBio = document.getElementById('user-bio');
    
    if (userAvatar) userAvatar.src = currentUser.avatar || 'default-avatar.png';
    if (userName) userName.textContent = currentUser.username;
    if (userBio) userBio.textContent = currentUser.bio || 'No bio yet';
}

// Load user data from localStorage
function loadUserData() {
    // Load posts
    const savedPosts = localStorage.getItem('user_posts');
    if (savedPosts) {
        posts = JSON.parse(savedPosts);
    }
    
    // Load notifications
    const savedNotifications = localStorage.getItem('user_notifications');
    if (savedNotifications) {
        notifications = JSON.parse(savedNotifications);
    }
}

// Create a new post
function createPost(content, type = 'text', mediaUrl = null) {
    const post = {
        id: Date.now(),
        userId: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar,
        content: content,
        type: type,
        mediaUrl: mediaUrl,
        timestamp: new Date().toISOString(),
        likes: [],
        comments: []
    };
    
    // Add to posts array
    posts.unshift(post);
    
    // Save to localStorage
    localStorage.setItem('user_posts', JSON.stringify(posts));
    
    // Update feed
    renderFeed();
    
    return post;
}

// Load feed with posts
function loadFeed() {
    const feedContainer = document.getElementById('feed');
    if (!feedContainer) return;
    
    renderFeed();
}

// Render feed
function renderFeed() {
    const feedContainer = document.getElementById('feed');
    if (!feedContainer) return;
    
    feedContainer.innerHTML = '';
    
    // Add post creation form
    feedContainer.innerHTML = `
        <div class="post-create">
            <img src="${currentUser.avatar}" alt="${currentUser.username}" class="post-avatar">
            <form id="post-form">
                <textarea placeholder="What's on your mind?" required></textarea>
                <div class="post-actions">
                    <button type="button" class="post-action" data-type="photo">
                        <i class="fas fa-image"></i> Photo
                    </button>
                    <button type="button" class="post-action" data-type="music">
                        <i class="fas fa-music"></i> Music
                    </button>
                    <button type="submit">Post</button>
                </div>
            </form>
        </div>
    `;
    
    // Render each post
    posts.forEach(post => {
        const postElement = createPostElement(post);
        feedContainer.appendChild(postElement);
    });
}

// Create a post element
function createPostElement(post) {
    const div = document.createElement('div');
    div.className = 'post';
    div.setAttribute('data-post-id', post.id);
    
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
    
    div.innerHTML = `
        <div class="post-header">
            <img src="${post.avatar}" alt="${post.username}" class="post-avatar">
            <div class="post-info">
                <div class="post-username">${post.username}</div>
                <div class="post-time" title="${new Date(post.timestamp).toLocaleString()}">${getTimeAgo(post.timestamp)}</div>
            </div>
            ${post.userId === currentUser.id ? `
                <button class="post-delete" data-post-id="${post.id}">
                    <i class="fas fa-trash"></i>
                </button>
            ` : ''}
        </div>
        <div class="post-content">${post.content}</div>
        ${mediaContent}
        <div class="post-actions">
            <button class="like-btn ${post.likes.includes(currentUser.id) ? 'liked' : ''}" data-post-id="${post.id}">
                <i class="fas fa-heart"></i>
                <span class="like-count">${post.likes.length}</span>
            </button>
            <button class="comment-btn" data-post-id="${post.id}">
                <i class="fas fa-comment"></i>
                <span class="comment-count">${post.comments.length}</span>
            </button>
            <button class="share-btn" data-post-id="${post.id}">
                <i class="fas fa-share"></i>
            </button>
        </div>
        <div class="post-comments" id="comments-${post.id}">
            ${renderPostComments(post)}
        </div>
    `;
    
    return div;
}

// Render comments for a post
function renderPostComments(post) {
    if (!post.comments.length) return '';
    
    let html = '<div class="comments-list">';
    post.comments.forEach(comment => {
        html += `
            <div class="comment" data-comment-id="${comment.id}">
                <img src="${comment.avatar}" alt="${comment.username}" class="comment-avatar">
                <div class="comment-content">
                    <div class="comment-info">
                        <span class="comment-username">${comment.username}</span>
                        <span class="comment-time">${getTimeAgo(comment.timestamp)}</span>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                </div>
                ${comment.userId === currentUser.id ? `
                    <button class="comment-delete" data-comment-id="${comment.id}">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </div>
        `;
    });
    html += '</div>';
    return html;
}

// Add a comment to a post
function addComment(postId, text) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const comment = {
        id: Date.now(),
        userId: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar,
        text: text,
        timestamp: new Date().toISOString()
    };
    
    post.comments.push(comment);
    
    // Save to localStorage
    localStorage.setItem('user_posts', JSON.stringify(posts));
    
    // Update UI
    const commentsContainer = document.getElementById(`comments-${postId}`);
    if (commentsContainer) {
        commentsContainer.innerHTML = renderPostComments(post);
    }
    
    // Update comment count
    const commentCount = document.querySelector(`.post[data-post-id="${postId}"] .comment-count`);
    if (commentCount) {
        commentCount.textContent = post.comments.length;
    }
}

// Toggle like on a post
function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const userIndex = post.likes.indexOf(currentUser.id);
    if (userIndex === -1) {
        post.likes.push(currentUser.id);
    } else {
        post.likes.splice(userIndex, 1);
    }
    
    // Save to localStorage
    localStorage.setItem('user_posts', JSON.stringify(posts));
    
    // Update UI
    const likeBtn = document.querySelector(`.post[data-post-id="${postId}"] .like-btn`);
    const likeCount = document.querySelector(`.post[data-post-id="${postId}"] .like-count`);
    
    if (likeBtn) {
        likeBtn.classList.toggle('liked');
    }
    if (likeCount) {
        likeCount.textContent = post.likes.length;
    }
}

// Delete a post
function deletePost(postId) {
    const index = posts.findIndex(p => p.id === postId);
    if (index === -1) return;
    
    posts.splice(index, 1);
    
    // Save to localStorage
    localStorage.setItem('user_posts', JSON.stringify(posts));
    
    // Update UI
    const postElement = document.querySelector(`.post[data-post-id="${postId}"]`);
    if (postElement) {
        postElement.remove();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Post form submission
    document.addEventListener('submit', function(e) {
        if (e.target.id === 'post-form') {
            e.preventDefault();
            const content = e.target.querySelector('textarea').value.trim();
            if (content) {
                createPost(content);
                e.target.querySelector('textarea').value = '';
            }
        }
    });
    
    // Post actions (like, comment, delete)
    document.addEventListener('click', function(e) {
        const postId = parseInt(e.target.closest('.post')?.getAttribute('data-post-id'));
        
        if (e.target.closest('.like-btn')) {
            toggleLike(postId);
        } else if (e.target.closest('.comment-btn')) {
            const commentsContainer = document.getElementById(`comments-${postId}`);
            if (commentsContainer) {
                commentsContainer.style.display = commentsContainer.style.display === 'none' ? 'block' : 'none';
            }
        } else if (e.target.closest('.post-delete')) {
            if (confirm('Are you sure you want to delete this post?')) {
                deletePost(postId);
            }
        }
    });
    
    // Handle file uploads
    document.addEventListener('click', function(e) {
        if (e.target.closest('.post-action[data-type="photo"]')) {
            // Implement photo upload
            console.log('Photo upload clicked');
        } else if (e.target.closest('.post-action[data-type="music"]')) {
            // Implement music upload
            console.log('Music upload clicked');
        }
    });
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
            return `${minutes}m`;
        }
        return `${hours}h`;
    } else if (days < 7) {
        return `${days}d`;
    }

    return date.toLocaleDateString();
}
