// social-features.js - Connects all social media features
document.addEventListener('DOMContentLoaded', () => {
    initSocialFeatures();
    setupAdminLoginButton();
});

// Initialize all social features
function initSocialFeatures() {
    // Link all scripts
    loadScripts();
    
    // Add profile modal to the page
    addProfileModal();
    
    // Setup comment username click to view profile
    setupCommentProfileLinks();
    
    // Setup admin login button
    setupAdminLoginButton();
}

// Load all required scripts
function loadScripts() {
    // Make sure all scripts are loaded
    const scripts = [
        { id: 'profile-script', src: 'profile.js' },
        { id: 'notifications-script', src: 'notifications.js' }
    ];
    
    scripts.forEach(script => {
        if (!document.getElementById(script.id)) {
            const scriptElement = document.createElement('script');
            scriptElement.id = script.id;
            scriptElement.src = script.src;
            document.body.appendChild(scriptElement);
        }
    });
}

// Add profile modal to the page
function addProfileModal() {
    if (!document.getElementById('profile-modal')) {
        const modal = document.createElement('div');
        modal.id = 'profile-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
}

// Setup comment username click to view profile
function setupCommentProfileLinks() {
    document.addEventListener('click', function(e) {
        if (e.target.matches('.comment-username')) {
            const commentElement = e.target.closest('.comment');
            if (commentElement) {
                const userId = commentElement.getAttribute('data-user-id');
                if (userId && window.viewUserProfile) {
                    viewUserProfile(userId);
                }
            }
        }
    });
}

// Setup admin login button
function setupAdminLoginButton() {
    // Admin login disabled - use admin.html directly
    const adminLoginBtn = document.getElementById('admin-login-btn');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', () => {
            window.open('admin.html', '_blank');
        });
    }
}

// Show admin login modal - disabled, redirect to admin.html
function showAdminLoginModal() {
    window.open('admin.html', '_blank');
}

// Create user profile if it doesn't exist
function createUserProfile(user) {
    if (!user) return;
    
    // Get user profiles from localStorage
    const profilesData = localStorage.getItem('user_profiles');
    let userProfiles = {};
    
    if (profilesData) {
        userProfiles = JSON.parse(profilesData);
    }
    
    // Check if profile already exists
    if (!userProfiles[user.id]) {
        // Create new profile
        userProfiles[user.id] = {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            bio: user.bio || 'No bio yet',
            followers: [],
            following: [],
            posts: [],
            joinDate: user.joinDate || new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('user_profiles', JSON.stringify(userProfiles));
    }
}

// Helper function to get random avatar
function getRandomAvatar(username) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;
}

// Add this function to the global scope
window.createUserProfile = createUserProfile;
window.getRandomAvatar = getRandomAvatar;