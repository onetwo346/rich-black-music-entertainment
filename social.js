// social.js - Handles social media functionality

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
                
                // Show target section
                if (target === 'feed' && feedContainer) {
                    feedContainer.style.display = 'block';
                } else if (target === 'profile' && profileContainer) {
                    profileContainer.style.display = 'block';
                }
            });
        });
    }
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

// Helper function to get time ago string from timestamp
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

// POSTS DASHBOARD MIRROR FUNCTION
function loadPostsDashboardMirror() {
    console.log('🔍 Loading Posts Dashboard Mirror...');
    
    // Get all posts from localStorage
    const allPosts = JSON.parse(localStorage.getItem('all_posts') || '[]');
    console.log('📦 Posts from localStorage:', allPosts);
    
    const postsListContainer = document.getElementById('postsListMirror');
    console.log('📋 Posts container found:', !!postsListContainer);
    
    if (!postsListContainer) return;
    
    // Update stats
    document.getElementById('totalPostsMirror').textContent = allPosts.length;
    document.getElementById('totalViewsMirror').textContent = allPosts.reduce((sum, post) => sum + (post.views || 0), 0);
    document.getElementById('totalLikesMirror').textContent = allPosts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
    
    // Clear container
    postsListContainer.innerHTML = '';
    
    if (allPosts.length === 0) {
        postsListContainer.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.6); padding: 2rem;">No posts yet.</div>';
        return;
    }
    
    // Sort newest first
    allPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Add each post
    allPosts.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.className = 'post-item';
        
        const timeAgo = getTimeAgo(post.timestamp);
        
        postDiv.innerHTML = `
            <div class="post-header">
                <div class="post-meta">
                    <span class="post-type-badge">${post.type?.toUpperCase() || 'TEXT'}</span>
                    <div class="post-title">${post.title || 'Post'}</div>
                    <div class="post-timestamp">${timeAgo}</div>
                </div>
                <div class="post-actions">
                    <button class="action-btn" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="post-content">${post.content}</div>
            <div class="post-stats">
                <div class="stat">
                    <i class="fas fa-eye"></i>
                    <span>${post.views || 0} views</span>
                </div>
                <div class="stat">
                    <i class="fas fa-heart"></i>
                    <span>${post.likes?.length || 0} likes</span>
                </div>
                <div class="stat">
                    <i class="fas fa-comment"></i>
                    <span>${post.comments?.length || 0} replies</span>
                </div>
            </div>
        `;
        
        postsListContainer.appendChild(postDiv);
    });
}

// Initialize posts dashboard mirror when page loads
document.addEventListener('DOMContentLoaded', function() {
    // FORCE COMMUNITY SECTION TO SHOW
    showCommunitySection();
    
    // Load the posts dashboard
    loadPostsDashboardMirror();
    
    // Check for updates every 1 second for real-time feel
    setInterval(function() {
        loadPostsDashboardMirror();
    }, 1000);
});

// Also call when page is fully loaded
window.addEventListener('load', function() {
    // FORCE COMMUNITY SECTION TO SHOW AGAIN
    showCommunitySection();
    loadPostsDashboardMirror();
});

// Initialize P2P connection for real-time updates
function initializePeerConnection() {
    console.log('Initializing P2P connection...');
    
    // Create a new peer connection
    const peer = new Peer();
    
    peer.on('open', function(id) {
        console.log('Connected with peer ID:', id);
        
        // Listen for connections from admin
        peer.on('connection', function(conn) {
            console.log('Received connection from:', conn.peer);
            
            conn.on('data', function(data) {
                console.log('Received data:', data);
                
                if (data.type === 'new_post') {
                    console.log('New post received:', data.post);
                    // Update posts in localStorage
                    let allPosts = JSON.parse(localStorage.getItem('all_posts') || '[]');
                    allPosts.unshift(data.post);
                    localStorage.setItem('all_posts', JSON.stringify(allPosts));
                    // Refresh posts dashboard
                    loadPostsDashboardMirror();
                }
                
                if (data.type === 'delete_post') {
                    console.log('Post deletion received:', data.postId);
                    // Remove post from localStorage
                    let allPosts = JSON.parse(localStorage.getItem('all_posts') || '[]');
                    allPosts = allPosts.filter(post => post.id !== data.postId);
                    localStorage.setItem('all_posts', JSON.stringify(allPosts));
                    // Refresh posts dashboard
                    loadPostsDashboardMirror();
                }
            });
        });
    });
    
    peer.on('error', function(err) {
        console.error('P2P connection error:', err);
    });
    
    // Store peer instance globally
    window.fanPeer = peer;
}

// Force community section to be visible if it exists
function showCommunitySection() {
    console.log('👀 Trying to show community section...');
    const communitySection = document.getElementById('community');
    console.log('🏠 Community section found:', !!communitySection);
    if (communitySection) {
        communitySection.classList.remove('hidden-section');
        communitySection.classList.add('visible');
        communitySection.style.display = 'block';
        communitySection.style.opacity = '1';
        console.log('✅ Community section should now be visible');
        
        // Clear any hide timeouts that might be running
        if (typeof window.hideTimeout !== 'undefined') {
            clearTimeout(window.hideTimeout);
        }
        
        // Make sure it stays visible by overriding the timeout system
        communitySection.setAttribute('data-permanent-visible', 'true');
        
        console.log('Community section made permanently visible');
    }
}

// Auto-show community section on load if there are posts
setTimeout(() => {
    const allPosts = JSON.parse(localStorage.getItem('all_posts') || '[]');
    console.log('Checking for posts on load:', allPosts.length, allPosts);
    if (allPosts.length > 0) {
        showCommunitySection();
        loadPostsDashboardMirror();
    }
}, 500);

// Also check every 3 seconds to ensure Community Hub stays visible if there are posts
setInterval(() => {
    const allPosts = JSON.parse(localStorage.getItem('all_posts') || '[]');
    if (allPosts.length > 0) {
        const communitySection = document.getElementById('community');
        if (communitySection && !communitySection.classList.contains('visible')) {
            console.log('Posts exist but Community Hub not visible, fixing...');
            showCommunitySection();
            loadPostsDashboardMirror();
        }
    }
}, 3000);

// Add manual function to force show community and load posts
window.forceShowStudioUpdates = function() {
    console.log('Forcing Posts Dashboard to show...');
    console.log('Current localStorage posts:', JSON.parse(localStorage.getItem('all_posts') || '[]'));
    showCommunitySection();
    loadPostsDashboardMirror();
    
    // Also scroll to community section
    const communitySection = document.getElementById('community');
    if (communitySection) {
        communitySection.scrollIntoView({ behavior: 'smooth' });
    }
};

// Add a function to manually test adding a post
window.testAdminPost = function() {
    const testPost = {
        id: Date.now(),
        userId: 'admin',
        username: 'Rich & Black',
        avatar: 'https://ui-avatars.com/api/?name=R+B&background=random',
        title: 'Test Post',
        content: 'Test post from console! This should appear in the Posts Dashboard.',
        type: 'text',
        priority: 'normal',
        timestamp: new Date().toISOString(),
        likes: [],
        comments: [],
        views: 0
    };
    
    let allPosts = JSON.parse(localStorage.getItem('all_posts') || '[]');
    allPosts.unshift(testPost);
    localStorage.setItem('all_posts', JSON.stringify(allPosts));
    console.log('Test post added to localStorage');
    console.log('Current posts:', allPosts);
    showCommunitySection();
    loadPostsDashboardMirror();
    
    // Also scroll to the community section
    setTimeout(() => {
        const communitySection = document.getElementById('community');
        if (communitySection) {
            communitySection.scrollIntoView({ behavior: 'smooth' });
        }
    }, 500);
};

// Quick debug function
window.debugPosts = function() {
    const allPosts = JSON.parse(localStorage.getItem('all_posts') || '[]');
    
    console.log('=== DEBUG POSTS ===');
    console.log('Total posts:', allPosts.length);
    console.log('All posts:', allPosts);
    
    const communitySection = document.getElementById('community');
    const postsListContainer = document.getElementById('postsListMirror');
    
    console.log('Community section visible:', communitySection ? !communitySection.classList.contains('hidden-section') : 'not found');
    console.log('Community section classes:', communitySection ? communitySection.className : 'not found');
    console.log('Posts container found:', !!postsListContainer);
    console.log('Posts container content:', postsListContainer ? postsListContainer.innerHTML : 'not found');
    
    if (allPosts.length > 0) {
        console.log('Posts exist, forcing render...');
        showCommunitySection();
        loadPostsDashboardMirror();
    } else {
        console.log('No posts found. Create one first!');
    }
};