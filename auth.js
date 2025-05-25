// auth.js - Authentication system for RICH&BLACK STUDIO
// Handles user registration, login, and session management with P2P functionality

// PeerJS library will be used for P2P connections
let peer;
let connections = {};
let currentUser = null;
let userList = [];

// Initialize the authentication system
function initAuth() {
  // Check if user is already logged in
  checkLoginStatus();
  
  // Setup login/signup modal triggers
  setupAuthTriggers();
  
  // Initialize PeerJS for P2P connections
  initPeerConnection();
}

// Check if user is already logged in from localStorage
function checkLoginStatus() {
  const userData = localStorage.getItem('rb_user_data');
  if (userData) {
    try {
      currentUser = JSON.parse(userData);
      updateUIForLoggedInUser();
      console.log('User logged in:', currentUser.username);
    } catch (e) {
      console.error('Error parsing user data:', e);
      localStorage.removeItem('rb_user_data');
    }
  }
}

// Handle forgot password
function handleForgotPassword(e) {
  e.preventDefault();
  const email = document.getElementById('forgot-email').value;
  
  if (!email) {
    showNotification('Please enter your email address', 'error');
    return;
  }
  
  if (!validateEmail(email)) {
    showNotification('Please enter a valid email address', 'error');
    return;
  }
  
  // Find user with this email
  const users = JSON.parse(localStorage.getItem('rb_users') || '[]');
  const user = users.find(u => u.email === email);
  
  if (!user) {
    showNotification('No account found with this email', 'error');
    return;
  }
  
  // Generate temporary password
  const tempPassword = Math.random().toString(36).slice(-8);
  
  // Update user's password
  user.password = tempPassword;
  localStorage.setItem('rb_users', JSON.stringify(users));
  
  // In a real app, you would send this via email
  // For demo, we'll show it in a notification
  showNotification(`Your temporary password is: ${tempPassword}\nPlease login and change it immediately.`, 'info', 10000);
  
  // Switch back to login form
  toggleAuthForms('login');
}

// Setup login/signup modal triggers
function setupAuthTriggers() {
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const authModal = document.getElementById('auth-modal');
  const closeModalBtn = document.getElementById('close-auth-modal');
  const switchToSignupBtn = document.getElementById('switch-to-signup');
  const switchToLoginBtn = document.getElementById('switch-to-login');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      showAuthModal('login');
    });
  }
  

  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeAuthModal);
  }
  
  if (switchToSignupBtn) {
    switchToSignupBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleAuthForms('signup');
    });
  }
  
  if (switchToLoginBtn) {
    switchToLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleAuthForms('login');
    });
  }
  
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }
  
  // Setup forgot password form
  const forgotForm = document.getElementById('forgot-password-form');
  if (forgotForm) {
    forgotForm.addEventListener('submit', handleForgotPassword);
  }
  
  // Setup forgot password link
  const forgotLink = document.getElementById('forgot-password-link');
  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('login-form-container').style.display = 'none';
      document.getElementById('signup-form-container').style.display = 'none';
      document.getElementById('forgot-password-container').style.display = 'block';
    });
  }
}

// Close the authentication modal
function closeAuthModal() {
  const authModal = document.getElementById('auth-modal');
  const modalContainer = document.getElementById('auth-modal-container');
  if (authModal && modalContainer) {
    // Remove active class from both overlay and container
    authModal.classList.remove('active');
    modalContainer.classList.remove('active');
    
    // Reset forms
    document.getElementById('login-form')?.reset();
    document.getElementById('signup-form')?.reset();
    
    // Remove event listeners
    authModal.removeEventListener('click', handleModalOutsideClick);
  }
}

// Handle clicks outside the modal
function handleModalOutsideClick(e) {
  const modalContainer = document.getElementById('auth-modal-container');
  if (e.target.id === 'auth-modal' && !modalContainer.contains(e.target)) {
    closeAuthModal();
  }
}

// Show the authentication modal
function showAuthModal(formType = 'login') {
  const authModal = document.getElementById('auth-modal');
  const modalContainer = document.getElementById('auth-modal-container');
  if (authModal && modalContainer) {
    // Add active class to both overlay and container
    authModal.classList.add('active');
    modalContainer.classList.add('active');
    toggleAuthForms(formType);
    
    // Add click outside to close
    authModal.addEventListener('click', handleModalOutsideClick);
  }
}

// Toggle between login and signup forms
function toggleAuthForms(showForm) {
  const loginForm = document.getElementById('login-form-container');
  const signupForm = document.getElementById('signup-form-container');
  
  if (loginForm && signupForm) {
    if (showForm === 'login') {
      loginForm.style.display = 'block';
      signupForm.style.display = 'none';
    } else {
      loginForm.style.display = 'none';
      signupForm.style.display = 'block';
    }
  }
}

// Validate email format
function validateEmail(email) {
  const re = /\S+@\S+\.\S+/; // Basic email validation
  return re.test(String(email).toLowerCase());
}


// Handle login form submission
function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  
  // Check for admin credentials
  if (username === 'admin' && password === 'guru') {
    // Admin login successful
    currentUser = {
      id: 'admin',
      username: 'Administrator',
      email: 'admin@richandblack.com',
      avatar: generateAvatar('Administrator'),
      isAdmin: true,
      joinDate: new Date('2023-01-01').toISOString()
    };
    
    // Save admin status
    localStorage.setItem('adminLoggedIn', 'true');
    localStorage.setItem('rb_user_data', JSON.stringify(currentUser));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Close modal
    const authModal = document.getElementById('auth-modal');
    if (authModal) authModal.classList.remove('active');
    
    // Show admin portal
    showAdminPortal();
    
    // Show welcome notification
    showNotification('Welcome, Administrator!');
    return;
  }
  
  // Regular user login
  const users = JSON.parse(localStorage.getItem('rb_users') || '[]');
  
  // Find user
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    // Login successful
    currentUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar || generateAvatar(user.username),
      isAdmin: false,
      joinDate: user.joinDate
    };
    
    // Save current user to localStorage (without password)
    localStorage.setItem('rb_user_data', JSON.stringify(currentUser));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Update UI
    updateUIForLoggedInUser();
    
    // Close modal
    const authModal = document.getElementById('auth-modal');
    if (authModal) authModal.classList.remove('active');
    
    // Connect to P2P network
    connectToPeers();
    
    // Show welcome notification
    showNotification(`Welcome back, ${username}!`);
  } else {
    // Login failed
    showNotification('Invalid username or password', 'error');
  }
}

// Handle signup form submission
function handleSignup(e) {
  e.preventDefault();
  
  const username = document.getElementById('signup-username').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-confirm-password').value;
  
  // Validate input
  if (!username || !email || !password || !confirmPassword) {
    showNotification('Please fill in all fields', 'error');
    return;
  }
  
  if (username.length < 3) {
    showNotification('Username must be at least 3 characters', 'error');
    return;
  }
  
  if (password.length < 6) {
    showNotification('Password must be at least 6 characters', 'error');
    return;
  }
  
  if (password !== confirmPassword) {
    showNotification('Passwords do not match', 'error');
    return;
  }
  
  // Validate email format
  if (!validateEmail(email)) {
    showNotification('Please enter a valid email address', 'error');
    return;
  }
  
  // Check if username already exists
  const existingUsers = JSON.parse(localStorage.getItem('rb_users') || '[]');
  const userExists = existingUsers.some(user => user.username === username);
  
  if (userExists) {
    showNotification('Username already exists', 'error');
    return;
  }
  
  // Create new user
  const userId = generateUserId();
  const avatar = generateAvatar(username);
  
  const newUser = {
    id: userId,
    username,
    email,
    password, // Store password as plain text (not secure, but as requested)
    avatar,
    isAdmin: false,
    joinDate: new Date().toISOString(),
    isNewUser: true // Flag for welcome modal
  };
  
  // Add user to users list
  existingUsers.push(newUser);
  localStorage.setItem('rb_users', JSON.stringify(existingUsers));
  
  // Set current user
  currentUser = {
    id: userId,
    username,
    email,
    avatar,
    isAdmin: false,
    joinDate: new Date().toISOString(),
    isNewUser: true // Flag for welcome modal
  };
  
  // Save to localStorage
  localStorage.setItem('rb_user_data', JSON.stringify(currentUser));
  
  // Close modal
  closeAuthModal();
  
  // Update UI
  updateUIForLoggedInUser();
  
  // Show notification
  showNotification('Account created successfully!');
  
  // Show welcome modal
  setTimeout(() => {
    showOnboardingModal();
  }, 500);
  
  // Clear form
  document.getElementById('signup-form').reset();
}

// Handle logout
function handleLogout() {
  // Disconnect from peers
  if (peer) {
    peer.disconnect();
  }
  
  // Clear user data
  localStorage.removeItem('rb_user_data');
  currentUser = null;
  
  // Update UI
  updateUIForLoggedOutUser();
  
  // Show message
  showNotification('You have been logged out');
}

// Update UI elements for logged in user
function updateUIForLoggedInUser() {
  if (!currentUser) return;
  
  // Update nav buttons
  const loginBtn = document.getElementById('login-btn');
  const userMenuBtn = document.getElementById('user-menu-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userAvatar = document.getElementById('user-avatar');
  const usernameDisplay = document.getElementById('username-display');
  
  if (loginBtn) loginBtn.style.display = 'none';
  if (userMenuBtn) userMenuBtn.style.display = 'flex';
  if (logoutBtn) logoutBtn.style.display = 'block';
  
  // Set user avatar and name
  if (userAvatar) userAvatar.src = currentUser.avatar;
  if (usernameDisplay) usernameDisplay.textContent = currentUser.username;
  
  // Enable comment forms
  enableCommentForms();
  
  // Load user comments
  loadComments();
}

// Update UI elements for logged out user
function updateUIForLoggedOutUser() {
  // Update nav buttons
  const loginBtn = document.getElementById('login-btn');
  const userMenuBtn = document.getElementById('user-menu-btn');
  const logoutBtn = document.getElementById('logout-btn');
  
  if (loginBtn) loginBtn.style.display = 'block';
  if (userMenuBtn) userMenuBtn.style.display = 'none';
  if (logoutBtn) logoutBtn.style.display = 'none';
  
  // Disable comment forms
  disableCommentForms();
}

// Enable comment forms for logged in users
function enableCommentForms() {
  const commentForms = document.querySelectorAll('.comment-form');
  commentForms.forEach(form => {
    form.classList.remove('disabled');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = false;
  });
}

// Disable comment forms for logged out users
function disableCommentForms() {
  const commentForms = document.querySelectorAll('.comment-form');
  commentForms.forEach(form => {
    form.classList.add('disabled');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
  });
}

// Show onboarding modal for new users
function showOnboardingModal() {
  const onboardingModal = document.getElementById('onboarding-modal');
  if (!onboardingModal) return;
  
  // Show modal
  onboardingModal.style.display = 'flex';
  
  // Add event listener to close button
  const closeBtn = document.getElementById('close-onboarding-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      onboardingModal.style.display = 'none';
      
      // Update user to no longer be new
      if (currentUser) {
        currentUser.isNewUser = false;
        localStorage.setItem('rb_user_data', JSON.stringify(currentUser));
      }
    });
  }
  
  // Add event listener to get started button
  const getStartedBtn = document.getElementById('get-started-btn');
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => {
      onboardingModal.style.display = 'none';
      
      // Update user to no longer be new
      if (currentUser) {
        currentUser.isNewUser = false;
        localStorage.setItem('rb_user_data', JSON.stringify(currentUser));
      }
    });
  }
}

// Show admin portal
function showAdminPortal() {
  document.body.classList.add('admin-mode');
  
  // Hide main content and dashboard
  const mainContent = document.getElementById('main-content');
  const dashboard = document.getElementById('dashboard');
  const adminPortal = document.getElementById('admin-portal');
  
  if (mainContent) mainContent.style.display = 'none';
  if (dashboard) dashboard.style.display = 'none';
  if (adminPortal) adminPortal.style.display = 'block';
  
  // Load admin data
  if (window.loadAdminData) {
    window.loadAdminData();
  }
}

// Show notification
function showNotification(message, type = 'success', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Show notification
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Generate a random user ID
function generateUserId() {
  return 'user_' + Math.random().toString(36).substr(2, 9);
}

// Generate avatar based on username
function generateAvatar(username) {
  // Generate random avatar using UI Avatars API
  const colors = ['f72585', '7209b7', '3a0ca3', '4361ee', '4cc9f0', '480ca8', '3f37c9', '4895ef', '560bad'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=${randomColor}&color=fff&size=150&bold=true`;
}

// Initialize PeerJS for P2P connections
function initPeerConnection() {
  if (!currentUser) return;
  
  // Load PeerJS from CDN if not already loaded
  if (typeof Peer === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js';
    script.onload = setupPeer;
    document.head.appendChild(script);
  } else {
    setupPeer();
  }
}

// Setup PeerJS connection
function setupPeer() {
  if (!currentUser) return;
  
  // Create a new Peer with the user's ID
  peer = new Peer(currentUser.id);
  
  // Handle connection open
  peer.on('open', (id) => {
    console.log('My peer ID is: ' + id);
    broadcastPresence();
  });
  
  // Handle incoming connections
  peer.on('connection', (conn) => {
    handleConnection(conn);
  });
  
  // Handle errors
  peer.on('error', (err) => {
    console.error('PeerJS error:', err);
  });
}

// Broadcast presence to known peers
function broadcastPresence() {
  // In a real app, you would have a signaling server to discover peers
  // For this demo, we'll use a simple approach with localStorage
  
  // Get known peers from localStorage
  const knownPeers = JSON.parse(localStorage.getItem('rb_known_peers') || '[]');
  
  // Connect to each known peer
  knownPeers.forEach(peerId => {
    if (peerId !== currentUser.id) {
      connectToPeer(peerId);
    }
  });
}

// Connect to a specific peer
function connectToPeer(peerId) {
  if (!peer) return;
  
  const conn = peer.connect(peerId);
  handleConnection(conn);
}

// Connect to all known peers
function connectToPeers() {
  if (!currentUser) return;
  
  initPeerConnection();
}

// Handle a peer connection
function handleConnection(conn) {
  // Store connection
  connections[conn.peer] = conn;
  
  // Handle connection open
  conn.on('open', () => {
    console.log('Connected to peer:', conn.peer);
    
    // Send user info
    conn.send({
      type: 'user_info',
      user: {
        id: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar
      }
    });
    
    // Add to known peers
    addKnownPeer(conn.peer);
  });
  
  // Handle incoming data
  conn.on('data', (data) => {
    handlePeerData(conn.peer, data);
  });
  
  // Handle connection close
  conn.on('close', () => {
    console.log('Connection closed:', conn.peer);
    delete connections[conn.peer];
  });
}

// Add a peer to known peers
function addKnownPeer(peerId) {
  // Get known peers from localStorage
  const knownPeers = JSON.parse(localStorage.getItem('rb_known_peers') || '[]');
  
  // Add peer if not already in list
  if (!knownPeers.includes(peerId)) {
    knownPeers.push(peerId);
    localStorage.setItem('rb_known_peers', JSON.stringify(knownPeers));
  }
}

// Handle data received from a peer
function handlePeerData(peerId, data) {
  console.log('Received data from peer:', peerId, data);
  
  switch (data.type) {
    case 'user_info':
      // Add user to user list
      addUserToList(data.user);
      break;
    case 'comment':
      // Add comment to the appropriate section
      addComment(data.comment);
      break;
    case 'like':
      // Update like count for a comment
      updateLikeCount(data.commentId, data.likes);
      break;
    default:
      console.log('Unknown data type:', data.type);
  }
}

// Add a user to the user list
function addUserToList(user) {
  // Check if user is already in list
  const existingUser = userList.find(u => u.id === user.id);
  if (!existingUser) {
    userList.push(user);
    updateOnlineUsersList();
  }
}

// Update the online users list in the UI
function updateOnlineUsersList() {
  const onlineUsersList = document.getElementById('online-users-list');
  if (!onlineUsersList) return;
  
  // Clear list
  onlineUsersList.innerHTML = '';
  
  // Add users
  userList.forEach(user => {
    const userItem = document.createElement('div');
    userItem.className = 'online-user';
    userItem.innerHTML = `
      <img src="${user.avatar}" alt="${user.username}" class="user-avatar-small">
      <span>${user.username}</span>
    `;
    onlineUsersList.appendChild(userItem);
  });
}

// Initialize the auth system when the page loads
document.addEventListener('DOMContentLoaded', initAuth);
