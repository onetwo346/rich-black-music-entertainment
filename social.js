// social.js - Handles social media functionality

// Demo data for posts
const demoUsers = [
  { 
    id: 'user_001', 
    username: 'booms', 
    email: 'booms@example.com',
    avatar: 'https://i.pravatar.cc/150?img=1', 
    isVerified: true,
    bio: 'Music Producer | RICH&BLACK',
    joinDate: new Date('2023-01-15').toISOString(),
    followers: 1500,
    following: 42,
    isAdmin: false
  },
  { 
    id: 'user_002', 
    username: 'acj', 
    email: 'acj@example.com',
    avatar: 'https://i.pravatar.cc/150?img=2', 
    isVerified: true,
    bio: 'Artist | RICH&BLACK',
    joinDate: new Date('2023-02-20').toISOString(),
    followers: 3200,
    following: 28,
    isAdmin: false
  },
  { 
    id: 'user_003', 
    username: 'paaed', 
    email: 'paaed@example.com',
    avatar: 'https://i.pravatar.cc/150?img=3', 
    isVerified: true,
    bio: 'Producer | RICH&BLACK',
    joinDate: new Date('2023-03-10').toISOString(),
    followers: 890,
    following: 35,
    isAdmin: false
  },
  { 
    id: 'user_004', 
    username: 'music_lover', 
    email: 'fan@example.com',
    avatar: 'https://i.pravatar.cc/150?img=4',
    bio: 'Music Enthusiast',
    joinDate: new Date('2023-04-05').toISOString(),
    followers: 120,
    following: 150,
    isAdmin: false
  },
  { 
    id: 'user_005', 
    username: 'ghana_beats', 
    email: 'ghana@example.com',
    avatar: 'https://i.pravatar.cc/150?img=5',
    bio: 'Promoting Ghanaian Music Worldwide',
    joinDate: new Date('2023-01-30').toISOString(),
    followers: 4300,
    following: 210,
    isAdmin: false
  }
];

const demoPosts = [
    {
        id: 1,
        userId: 2,
        content: 'Just dropped a new track! Check out "Sikasem" on our music player 🎵',
        timestamp: '2 hours ago',
        likes: 24,
        comments: [
            { id: 1, userId: 1, content: 'Fire track! 🔥', timestamp: '1 hour ago' },
            { id: 2, userId: 5, content: 'Been waiting for this!', timestamp: '45 minutes ago' }
        ],
        liked: false,
        type: 'music',
        mediaUrl: 'music/sikasem.mp3'
    },
    {
        id: 2,
        userId: 3,
        content: 'Working on some new visuals for the studio. What do you think?',
        timestamp: '5 hours ago',
        likes: 18,
        comments: [
            { id: 3, userId: 2, content: 'Looking good!', timestamp: '4 hours ago' },
            { id: 4, userId: 4, content: 'Can\'t wait to see more', timestamp: '3 hours ago' }
        ],
        liked: true,
        type: 'image',
        mediaUrl: 'https://picsum.photos/id/237/600/400'
    },
    {
        id: 3,
        userId: 1,
        content: 'Just vibing in the studio today. Working on some new material for y\'all!',
        timestamp: '1 day ago',
        likes: 32,
        comments: [],
        liked: false,
        type: 'text'
    },
    {
        id: 4,
        userId: 5,
        content: 'Who\'s excited for the upcoming concert? Drop a 🙌 in the comments!',
        timestamp: '2 days ago',
        likes: 45,
        comments: [
            { id: 5, userId: 1, content: '🙌', timestamp: '2 days ago' },
            { id: 6, userId: 4, content: 'Can\'t wait!', timestamp: '1 day ago' },
            { id: 7, userId: 3, content: 'It\'s going to be epic! 🙌', timestamp: '1 day ago' }
        ],
        liked: true,
        type: 'text'
    }
];

// Current user (for demo)
const currentUser = {
    id: 1,
    username: 'booms',
    avatar: 'https://i.pravatar.cc/150?img=1',
    isVerified: true,
    notifications: 3,
    messages: 2,
    friendRequests: 1
};

// DOM Elements
let sidebarToggle;
let sidebar;
let socialContainer;
let feedContainer;
let profileContainer;
let messagesContainer;
let postCreateForm;
let postsList;

// Initialize social features when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize auth event listeners
    initAuthListeners();
    
    // Check if user is already logged in
    checkLoginStatus();
    
    // Initialize UI elements after they're added to DOM
    setTimeout(initSocialUI, 500);
});

// Initialize auth event listeners
function initAuthListeners() {
    // Login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            
            // Simple validation
            if (username.length < 3) {
                alert('Username must be at least 3 characters');
                return;
            }
            
            if (password.length < 6) {
                alert('Password must be at least 6 characters');
                return;
            }
            
            // Demo login (in production, this would validate against a database)
            loginUser({
                id: 1,
                username: username,
                avatar: 'https://i.pravatar.cc/150?img=1'
            });
            
            // Hide login modal
            document.getElementById('auth-modal').style.display = 'none';
        });
    }
    
    // Signup form submission
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('signup-username').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;
            
            // Simple validation
            if (username.length < 3) {
                alert('Username must be at least 3 characters');
                return;
            }
            
            if (!validateEmail(email)) {
                alert('Please enter a valid email address');
                return;
            }
            
            if (password.length < 6) {
                alert('Password must be at least 6 characters');
                return;
            }
            
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            // Demo signup (in production, this would create a new user in the database)
            loginUser({
                id: 1,
                username: username,
                email: email,
                avatar: 'https://i.pravatar.cc/150?img=1',
                isNewUser: true
            });
            
            // Hide signup modal
            document.getElementById('auth-modal').style.display = 'none';
            
            // Show welcome modal for new users
            document.getElementById('onboarding-modal').style.display = 'flex';
        });
    }
    
    // Logout button
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'logout-btn' || e.target.closest('#logout-btn')) {
            logoutUser();
        }
    });
}

// Initialize social UI elements
function initSocialUI() {
    // Get DOM elements
    sidebarToggle = document.getElementById('sidebar-toggle');
    sidebar = document.getElementById('sidebar');
    socialContainer = document.getElementById('social-container');
    feedContainer = document.getElementById('feed-container');
    profileContainer = document.getElementById('profile-container');
    messagesContainer = document.getElementById('messages-container');
    postCreateForm = document.getElementById('post-create-form');
    postsList = document.getElementById('posts-list');
    
    // Add event listeners if elements exist
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    if (postCreateForm) {
        postCreateForm.addEventListener('submit', createPost);
    }
    
    // Initialize sidebar navigation
    initSidebarNav();
    
    // Render posts if feed exists
    if (postsList) {
        renderPosts();
    }
}

// Toggle sidebar visibility
function toggleSidebar() {
    document.body.classList.toggle('sidebar-open');
}

// Initialize sidebar navigation
function initSidebarNav() {
    const navItems = document.querySelectorAll('.sidebar-nav-item');
    if (navItems.length) {
        navItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all items
                navItems.forEach(i => i.classList.remove('active'));
                
                // Add active class to clicked item
                this.classList.add('active');
                
                // Get target section
                const target = this.getAttribute('data-target');
                
                // Hide all sections
                if (feedContainer) feedContainer.style.display = 'none';
                if (profileContainer) profileContainer.style.display = 'none';
                if (messagesContainer) messagesContainer.style.display = 'none';
                
                // Show target section
                if (target === 'feed' && feedContainer) {
                    feedContainer.style.display = 'block';
                } else if (target === 'profile' && profileContainer) {
                    profileContainer.style.display = 'block';
                } else if (target === 'messages' && messagesContainer) {
                    messagesContainer.style.display = 'block';
                }
            });
        });
    }
}
function createPost(e) {
    e.preventDefault();
    
    // Check if user is logged in
    if (!currentUser || !currentUser.id) {
        if (typeof showNotification === 'function') {
            showNotification('Please log in to create a post', 'error');
        } else {
            alert('Please log in to create a post');
        }
        return;
    }
    
    const postContent = document.getElementById('post-content').value;
    if (!postContent.trim()) {
        if (typeof showNotification === 'function') {
            showNotification('Post content cannot be empty', 'error');
        }
        return;
    }
    
    // Create new post object
    const newPost = {
        id: Date.now(),
        userId: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar,
        content: postContent,
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: [],
        liked: false,
        type: 'text'
    };
    
    // Get existing posts from localStorage or use demo posts
    let posts = JSON.parse(localStorage.getItem('rb_posts') || '[]');
    if (posts.length === 0) {
        posts = [...demoPosts];
    }
    
    // Add to posts array
    posts.unshift(newPost);
    
    // Save to localStorage
    localStorage.setItem('rb_posts', JSON.stringify(posts));
    
    // Clear input
    document.getElementById('post-content').value = '';
    
    // Re-render posts
    renderPosts();
    
    // Show success notification
    if (typeof showNotification === 'function') {
        showNotification('Post created successfully');
    }
}

// Render posts in feed
function renderPosts() {
    if (!postsList) return;
    
    postsList.innerHTML = '';
    
    demoPosts.forEach(post => {
        const user = demoUsers.find(u => u.id === post.userId);
        if (!user) return;
        
        const postElement = document.createElement('div');
        postElement.className = 'post-item';
        postElement.setAttribute('data-post-id', post.id);
        
        // Media content based on post type
        let mediaContent = '';
        if (post.type === 'image' && post.mediaUrl) {
            mediaContent = `<img src="${post.mediaUrl}" alt="Post image" class="post-image">`;
        } else if (post.type === 'music' && post.mediaUrl) {
            mediaContent = `
                <div class="post-audio">
                    <audio controls>
                        <source src="${post.mediaUrl}" type="audio/mpeg">
                        Your browser does not support the audio element.
                    </audio>
                </div>
            `;
        }
        
        // Post options menu (only for current user's posts)
        const postOptions = post.userId === currentUser.id ? `
            <div class="post-options">
                <button class="post-options-btn">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
                <div class="post-options-menu">
                    <div class="post-option edit">
                        <i class="fas fa-edit"></i> Edit
                    </div>
                    <div class="post-option delete">
                        <i class="fas fa-trash"></i> Delete
                    </div>
                </div>
            </div>
        ` : '';
        
        // Verified badge for verified users
        const verifiedBadge = user.isVerified ? '<i class="fas fa-check-circle" style="color: #3b82f6; margin-left: 5px;"></i>' : '';
        
        // Comments HTML
        let commentsHTML = '';
        if (post.comments.length > 0) {
            commentsHTML = '<div class="post-comments">';
            post.comments.forEach(comment => {
                const commentUser = demoUsers.find(u => u.id === comment.userId);
                if (!commentUser) return;
                
                // Delete button for user's own comments
                const deleteBtn = comment.userId === currentUser.id ? `
                    <button class="comment-delete-btn" data-comment-id="${comment.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : '';
                
                commentsHTML += `
                    <div class="post-comment-item" data-comment-id="${comment.id}">
                        <img src="${commentUser.avatar}" alt="${commentUser.username}" class="comment-avatar">
                        <div class="comment-content">
                            ${deleteBtn}
                            <div class="comment-username">${commentUser.username}</div>
                            <div class="comment-text">${comment.content}</div>
                            <div class="comment-time">${comment.timestamp}</div>
                        </div>
                    </div>
                `;
            });
            
            // Add comment form
            commentsHTML += `
                <div class="post-comment-form">
                    <img src="${currentUser.avatar}" alt="${currentUser.username}" class="comment-avatar">
                    <input type="text" class="comment-input" placeholder="Write a comment...">
                    <button class="comment-submit">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            `;
            
            commentsHTML += '</div>';
        }
        
        postElement.innerHTML = `
            <div class="post-header">
                <img src="${user.avatar}" alt="${user.username}" class="post-avatar">
                <div class="post-user-info">
                    <div class="post-username">${user.username}${verifiedBadge}</div>
                    <div class="post-time">${post.timestamp}</div>
                </div>
                ${postOptions}
            </div>
            <div class="post-content">${post.content}</div>
            ${mediaContent}
            <div class="post-actions">
                <div class="post-action ${post.liked ? 'liked' : ''}" data-action="like">
                    <i class="fas fa-heart"></i>
                    <span>${post.likes}</span>
                </div>
                <div class="post-action" data-action="comment">
                    <i class="fas fa-comment"></i>
                    <span>${post.comments.length}</span>
                </div>
                <div class="post-action" data-action="share">
                    <i class="fas fa-share"></i>
                    <span>Share</span>
                </div>
            </div>
            ${commentsHTML}
            ${post.comments.length === 0 ? `
                <div class="post-comment-form">
                    <img src="${currentUser.avatar}" alt="${currentUser.username}" class="comment-avatar">
                    <input type="text" class="comment-input" placeholder="Write a comment...">
                    <button class="comment-submit">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            ` : ''}
        `;
        
        postsList.appendChild(postElement);
    });
    
    // Add event listeners to posts
    addPostEventListeners();
}

// Add event listeners to post elements
function addPostEventListeners() {
    // Post options toggle
    document.querySelectorAll('.post-options-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const menu = this.nextElementSibling;
            menu.classList.toggle('show');
            
            // Close other menus
            document.querySelectorAll('.post-options-menu.show').forEach(m => {
                if (m !== menu) m.classList.remove('show');
            });
        });
    });
    
    // Close menus when clicking outside
    document.addEventListener('click', function() {
        document.querySelectorAll('.post-options-menu.show').forEach(menu => {
            menu.classList.remove('show');
        });
    });
    
    // Post actions (like, comment, share)
    document.querySelectorAll('.post-action').forEach(action => {
        action.addEventListener('click', function() {
            const postId = parseInt(this.closest('.post-item').getAttribute('data-post-id'));
            const actionType = this.getAttribute('data-action');
            
            if (actionType === 'like') {
                toggleLike(postId);
            } else if (actionType === 'comment') {
                focusCommentInput(postId);
            } else if (actionType === 'share') {
                sharePost(postId);
            }
        });
    });
    
    // Comment submission
    document.querySelectorAll('.comment-submit').forEach(btn => {
        btn.addEventListener('click', function() {
            const postId = parseInt(this.closest('.post-item').getAttribute('data-post-id'));
            const input = this.previousElementSibling;
            addComment(postId, input.value);
            input.value = '';
        });
    });
    
    // Comment input enter key
    document.querySelectorAll('.comment-input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const postId = parseInt(this.closest('.post-item').getAttribute('data-post-id'));
                addComment(postId, this.value);
                this.value = '';
            }
        });
    });
    
    // Delete comment
    document.querySelectorAll('.comment-delete-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const postId = parseInt(this.closest('.post-item').getAttribute('data-post-id'));
            const commentId = parseInt(this.getAttribute('data-comment-id'));
            deleteComment(postId, commentId);
        });
    });
    
    // Delete post
    document.querySelectorAll('.post-option.delete').forEach(option => {
        option.addEventListener('click', function() {
            const postId = parseInt(this.closest('.post-item').getAttribute('data-post-id'));
            deletePost(postId);
        });
    });
}

// Toggle like on a post
function toggleLike(postId) {
    const post = demoPosts.find(p => p.id === postId);
    if (!post) return;
    
    if (post.liked) {
        post.likes--;
        post.liked = false;
    } else {
        post.likes++;
        post.liked = true;
    }
    
    renderPosts();
}

// Focus comment input
function focusCommentInput(postId) {
    const postElement = document.querySelector(`.post-item[data-post-id="${postId}"]`);
    if (!postElement) return;
    
    const commentInput = postElement.querySelector('.comment-input');
    if (commentInput) {
        commentInput.focus();
    }
}

// Add a comment to a post
function addComment(postId, content) {
    if (!content.trim()) return;
    
    const post = demoPosts.find(p => p.id === postId);
    if (!post) return;
    
    const newComment = {
        id: post.comments.length > 0 ? Math.max(...post.comments.map(c => c.id)) + 1 : 1,
        userId: currentUser.id,
        content: content,
        timestamp: 'Just now'
    };
    
    post.comments.push(newComment);
    renderPosts();
}

// Delete a comment
function deleteComment(postId, commentId) {
    const post = demoPosts.find(p => p.id === postId);
    if (!post) return;
    
    const commentIndex = post.comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) return;
    
    post.comments.splice(commentIndex, 1);
    renderPosts();
}

// Delete a post
function deletePost(postId) {
    const postIndex = demoPosts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;
    
    demoPosts.splice(postIndex, 1);
    renderPosts();
}

// Share a post (demo)
function sharePost(postId) {
    alert('Sharing post #' + postId + ' (Demo)');
}

// Check if user is logged in
function checkLoginStatus() {
    const user = localStorage.getItem('rb_user_data');
    if (user) {
        // User is logged in
        try {
            const userData = JSON.parse(user);
            loginUser(userData, true);
        } catch (e) {
            console.error('Error parsing user data:', e);
            localStorage.removeItem('rb_user_data');
        }
    }
}

// Login user
function loginUser(user, skipStorage = false) {
    // Set current user
    currentUser.id = user.id;
    currentUser.username = user.username;
    currentUser.avatar = user.avatar;
    currentUser.isVerified = user.isVerified || false;
    currentUser.email = user.email || '';
    
    // Store in localStorage if not skipping
    if (!skipStorage) {
        localStorage.setItem('rb_user_data', JSON.stringify(user));
    }
    
    // Update UI for logged in user
    updateUIForLoggedInUser();
    
    // Show welcome modal for new users
    if (user.isNewUser) {
        setTimeout(() => {
            const onboardingModal = document.getElementById('onboarding-modal');
            if (onboardingModal) {
                onboardingModal.style.display = 'flex';
            }
        }, 500);
    }
    
    // Render posts with the logged-in user context
    renderPosts();
}

// Logout user
function logoutUser() {
    // Clear localStorage (only remove user data, not comments or other data)
    localStorage.removeItem('rb_user_data');
    
    // Reset current user object
    currentUser.id = null;
    currentUser.username = null;
    currentUser.avatar = null;
    currentUser.isVerified = false;
    currentUser.email = null;
    
    // Update UI for logged out user
    updateUIForLoggedOutUser();
    
    // Show notification if function exists
    if (typeof showNotification === 'function') {
        showNotification('You have been logged out');
    }
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
    // Hide login/signup buttons
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
        const loginBtn = document.getElementById('login-btn');
        const signupBtn = document.getElementById('signup-btn');
        const userMenu = document.getElementById('user-menu-btn');
        
        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'flex';
            
            // Update user info
            const avatar = document.getElementById('user-avatar');
            const username = document.getElementById('username-display');
            
            if (avatar) avatar.src = currentUser.avatar;
            if (username) username.textContent = currentUser.username;
        }
    }
    
    // Show social container
    if (socialContainer) socialContainer.style.display = 'block';
    
    // Show sidebar toggle
    if (sidebarToggle) sidebarToggle.style.display = 'flex';
    
    // Update sidebar user info
    const sidebarUsername = document.getElementById('sidebar-username');
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    
    if (sidebarUsername) sidebarUsername.textContent = currentUser.username;
    if (sidebarAvatar) sidebarAvatar.src = currentUser.avatar;
    
    // Show feed by default
    if (feedContainer) feedContainer.style.display = 'block';
    if (profileContainer) profileContainer.style.display = 'none';
    if (messagesContainer) messagesContainer.style.display = 'none';
    
    // Set active nav item
    const feedNavItem = document.querySelector('.sidebar-nav-item[data-target="feed"]');
    if (feedNavItem) feedNavItem.classList.add('active');
}

// Update UI for logged out user
function updateUIForLoggedOutUser() {
    // Show login/signup buttons
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
        const loginBtn = document.getElementById('login-btn');
        const signupBtn = document.getElementById('signup-btn');
        const userMenu = document.getElementById('user-menu-btn');
        
        if (loginBtn) loginBtn.style.display = 'block';
        if (signupBtn) signupBtn.style.display = 'block';
        if (userMenu) userMenu.style.display = 'none';
    }
    
    // Hide social container
    if (socialContainer) socialContainer.style.display = 'none';
    
    // Hide sidebar toggle
    if (sidebarToggle) sidebarToggle.style.display = 'none';
}

// Helper function to validate email
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}
