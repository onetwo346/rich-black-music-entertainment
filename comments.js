// comments.js - P2P Comment system for RICH&BLACK STUDIO
// Handles comment creation, storage, and P2P synchronization

// Store for comments
let comments = {
  songs: {},  // Comments for songs
  blog: {}    // Comments for blog posts
};

// Global comments storage key
const GLOBAL_COMMENTS_KEY = 'rb_global_comments';

// Function to sync comments with other tabs/windows
function syncComments(event) {
  if (event.key === GLOBAL_COMMENTS_KEY) {
    try {
      const newComments = JSON.parse(event.newValue);
      if (newComments) {
        comments = newComments;
        renderAllComments();
      }
    } catch (e) {
      console.error('Error syncing comments:', e);
    }
  }
}

// Initialize the comments system
function initComments() {
  console.log('Initializing comments system...');
  
  // Load comments from localStorage
  loadComments();
  
  // Setup comment forms
  setupCommentForms();
  
  // Setup comment actions (like, reply)
  setupCommentActions();

  // Listen for changes in other tabs/windows
  window.addEventListener('storage', syncComments);

  // Set up periodic comment sync
  setInterval(loadComments, 5000); // Sync every 5 seconds
  
  // Initialize visitor peer connection (for non-logged in users)
  if (!currentUser) {
    initVisitorPeer();
  }
}

// Initialize a peer connection for visitors
function initVisitorPeer() {
  console.log('Initializing visitor peer connection...');
  // Only create if peer doesn't exist
  if (typeof peer === 'undefined' || !peer) {
    // Generate a temporary visitor ID
    const visitorId = 'visitor_' + Math.random().toString(36).substr(2, 9);
    console.log('Created visitor ID:', visitorId);
    
    // Load PeerJS from CDN if not already loaded
    if (typeof Peer === 'undefined') {
      console.log('Loading PeerJS library...');
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js';
      script.onload = () => {
        setupVisitorPeer(visitorId);
      };
      document.head.appendChild(script);
    } else {
      setupVisitorPeer(visitorId);
    }
  }
}

// Setup peer connection for visitors
function setupVisitorPeer(visitorId) {
  console.log('Setting up visitor peer with ID:', visitorId);
  try {
    // Create a new Peer with the visitor ID
    peer = new Peer(visitorId);
    connections = {};
    
    // Handle connection open
    peer.on('open', (id) => {
      console.log('Visitor peer connected with ID:', id);
      // Connect to known peers
      const knownPeers = JSON.parse(localStorage.getItem('rb_known_peers') || '[]');
      knownPeers.forEach(peerId => {
        if (peerId !== visitorId) {
          connectToPeer(peerId);
        }
      });
    });
    
    // Handle incoming connections
    peer.on('connection', (conn) => {
      console.log('Incoming connection from:', conn.peer);
      handleVisitorConnection(conn);
    });
    
    // Handle errors
    peer.on('error', (err) => {
      console.error('PeerJS error:', err);
    });
  } catch (e) {
    console.error('Error setting up visitor peer:', e);
  }
}

// Connect to a specific peer
function connectToPeer(peerId) {
  console.log('Connecting to peer:', peerId);
  if (!peer) return;
  
  try {
    const conn = peer.connect(peerId);
    if (currentUser) {
      handleConnection(conn);
    } else {
      handleVisitorConnection(conn);
    }
  } catch (e) {
    console.error('Error connecting to peer:', e);
  }
}

// Handle visitor connection
function handleVisitorConnection(conn) {
  console.log('Handling visitor connection:', conn.peer);
  // Store connection
  connections[conn.peer] = conn;
  
  // Handle connection open
  conn.on('open', () => {
    console.log('Visitor connected to peer:', conn.peer);
    
    // Request comments
    conn.send({
      type: 'request_comments'
    });
    
    // Add to known peers
    addKnownPeer(conn.peer);
  });
  
  // Handle incoming data
  conn.on('data', (data) => {
    console.log('Visitor received data:', data);
    handleCommentData(data);
  });
  
  // Handle connection close
  conn.on('close', () => {
    console.log('Visitor connection closed:', conn.peer);
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

// Load comments from localStorage
function loadComments() {
  const savedComments = localStorage.getItem(GLOBAL_COMMENTS_KEY);
  if (savedComments) {
    try {
      const loadedComments = JSON.parse(savedComments);
      
      // Initialize comments structure if needed
      if (!comments.songs) comments.songs = {};
      if (!comments.blog) comments.blog = {};
      
      // Merge loaded comments with existing comments
      for (const contentType in loadedComments) {
        if (!comments[contentType]) comments[contentType] = {};
        
        for (const contentId in loadedComments[contentType]) {
          if (!comments[contentType][contentId]) {
            comments[contentType][contentId] = [];
          }
          
          // Merge comments for this content, avoiding duplicates
          loadedComments[contentType][contentId].forEach(loadedComment => {
            const existingIndex = comments[contentType][contentId].findIndex(c => c.id === loadedComment.id);
            if (existingIndex === -1) {
              comments[contentType][contentId].push(loadedComment);
            }
          });
        }
      }
      
      // Update UI
      renderAllComments();
      
      // Broadcast to peers if connected
      if (typeof peer !== 'undefined' && peer && connections) {
        for (const contentType in comments) {
          for (const contentId in comments[contentType]) {
            comments[contentType][contentId].forEach(comment => {
              broadcastComment(comment, contentType, contentId);
            });
          }
        }
      }
    } catch (e) {
      console.error('Error loading comments:', e);
      // Initialize empty comments if there's an error
      comments = { songs: {}, blog: {} };
    }
  }
}

// Save comments to localStorage and broadcast to other tabs/windows
function saveComments() {
  localStorage.setItem(GLOBAL_COMMENTS_KEY, JSON.stringify(comments));
  
  // Broadcast to peers
  if (peer && connections) {
    for (const peerId in connections) {
      connections[peerId].send({
        type: 'sync_comments',
        comments: comments
      });
    }
  }
}

// Setup comment forms
function setupCommentForms() {
  const commentForms = document.querySelectorAll('.comment-form');
  
  commentForms.forEach(form => {
    form.addEventListener('submit', handleCommentSubmit);
  });
}

// Handle comment form submission
function handleCommentSubmit(e) {
  e.preventDefault();
  
  // Check if user is logged in
  if (!currentUser) {
    showAuthModal('login');
    showNotification('Please log in to comment', 'info');
    return;
  }
  
  const form = e.target;
  const contentType = form.getAttribute('data-content-type'); // 'song' or 'blog'
  const contentId = form.getAttribute('data-content-id');
  const commentText = form.querySelector('textarea').value.trim();
  
  if (!commentText) {
    showNotification('Please enter a comment', 'error');
    return;
  }
  
  // Create comment object
  const comment = {
    id: generateCommentId(),
    userId: currentUser.id,
    username: currentUser.username,
    avatar: currentUser.avatar,
    text: commentText,
    timestamp: new Date().toISOString(),
    likes: [],
    replies: []
  };
  
  // Add comment to local store
  addComment(comment, contentType, contentId);
  
  // Clear form
  form.querySelector('textarea').value = '';
  
  // Broadcast comment to peers
  broadcastComment(comment, contentType, contentId);
}

// Generate a unique comment ID
function generateCommentId() {
  return 'comment_' + Math.random().toString(36).substr(2, 9);
}

// Add a comment to the local store
function addComment(comment, contentType, contentId) {
  // Initialize content type if needed
  if (!comments[contentType]) {
    comments[contentType] = {};
  }
  
  // Initialize content ID if needed
  if (!comments[contentType][contentId]) {
    comments[contentType][contentId] = [];
  }
  
  // Add comment
  comments[contentType][contentId].push(comment);
  
  // Save to localStorage
  saveComments();
  
  // Render comments
  renderComments(contentType, contentId);
}

// Render all comments
function renderAllComments() {
  // Render song comments
  for (const songId in comments.songs) {
    renderComments('songs', songId);
  }
  
  // Render blog comments
  for (const blogId in comments.blog) {
    renderComments('blog', blogId);
  }
}

// Render comments for a specific content
function renderComments(contentType, contentId) {
  const commentsContainer = document.querySelector(`.comments-container[data-content-type="${contentType}"][data-content-id="${contentId}"]`);
  
  if (!commentsContainer) return;
  
  // Get comments for this content
  const contentComments = comments[contentType]?.[contentId] || [];
  
  // Sort comments by timestamp (newest first)
  contentComments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Clear container
  commentsContainer.innerHTML = '';
  
  // Add comment count
  const commentCount = document.createElement('div');
  commentCount.className = 'comment-count';
  commentCount.textContent = `${contentComments.length} Comment${contentComments.length !== 1 ? 's' : ''}`;
  commentsContainer.appendChild(commentCount);
  
  // No comments message
  if (contentComments.length === 0) {
    const noComments = document.createElement('div');
    noComments.className = 'no-comments';
    noComments.textContent = 'Be the first to comment!';
    commentsContainer.appendChild(noComments);
    return;
  }
  
  // Render each comment
  contentComments.forEach(comment => {
    const commentElement = createCommentElement(comment, contentType, contentId);
    commentsContainer.appendChild(commentElement);
  });
}

// Create a comment element
function createCommentElement(comment, contentType, contentId) {
  const isCurrentUserComment = currentUser && comment.userId === currentUser.id;
  const commentElement = document.createElement('div');
  commentElement.className = 'comment';
  commentElement.setAttribute('data-comment-id', comment.id);
  
  // Format timestamp
  const timestamp = new Date(comment.timestamp);
  const timeAgo = getTimeAgo(timestamp);
  
  // Check if current user liked this comment
  const userLiked = currentUser && comment.likes.includes(currentUser.id);
  
  commentElement.innerHTML = `
    <div class="comment-header">
      <img src="${comment.avatar}" alt="${comment.username}" class="comment-avatar">
      <div class="comment-info">
        <div class="comment-username">${comment.username}</div>
        <div class="comment-time" title="${new Date(comment.timestamp).toLocaleString()}">${getTimeAgo(comment.timestamp)}</div>
      </div>
      ${isCurrentUserComment ? `
        <button class="comment-delete-btn" data-comment-id="${comment.id}">
          <i class="fas fa-trash"></i>
        </button>
      ` : ''}
    </div>
    <div class="comment-text">${formatCommentText(comment.text)}</div>
    <div class="comment-actions">
      <button class="like-btn ${userLiked ? 'liked' : ''}" data-comment-id="${comment.id}" data-content-type="${contentType}" data-content-id="${contentId}">
        <i class="fas fa-heart"></i> <span class="like-count">${comment.likes.length}</span>
      </button>
      <button class="reply-btn" data-comment-id="${comment.id}" data-content-type="${contentType}" data-content-id="${contentId}">
        <i class="fas fa-reply"></i> Reply
      </button>
    </div>
    <div class="reply-form-container" style="display: none;">
      <form class="reply-form" data-comment-id="${comment.id}" data-content-type="${contentType}" data-content-id="${contentId}">
        <textarea placeholder="Write a reply..." required></textarea>
        <button type="submit">Reply</button>
      </form>
    </div>
    <div class="replies-container"></div>
  `;
  
  // Render replies if any
  if (comment.replies && comment.replies.length > 0) {
    const repliesContainer = commentElement.querySelector('.replies-container');
    comment.replies.forEach(reply => {
      const replyElement = createReplyElement(reply);
      repliesContainer.appendChild(replyElement);
    });
  }
  
  return commentElement;
}

// Create a reply element
function createReplyElement(reply) {
  const replyElement = document.createElement('div');
  replyElement.className = 'reply';
  
  // Format timestamp
  const timestamp = new Date(reply.timestamp);
  const timeAgo = getTimeAgo(timestamp);
  
  replyElement.innerHTML = `
    <div class="reply-header">
      <img src="${reply.avatar}" alt="${reply.username}" class="reply-avatar">
      <div class="reply-meta">
        <div class="reply-username">${reply.username}</div>
        <div class="reply-timestamp">${timeAgo}</div>
      </div>
    </div>
    <div class="reply-text">${formatCommentText(reply.text)}</div>
  `;
  
  return replyElement;
}

// Format comment text (convert URLs to links, etc.)
function formatCommentText(text) {
  // Convert URLs to links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
}

// Get time ago string from timestamp
function getTimeAgo(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // Format the full date
  const fullDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });

  const fullTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Recent timestamps show relative time
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

  // Older timestamps show actual date and time
  return `${fullDate} at ${fullTime}`;
}

// Setup comment actions (like, reply, delete)
function setupCommentActions() {
  // Setup delete buttons
  document.addEventListener('click', function(e) {
    if (e.target.closest('.comment-delete-btn')) {
      const btn = e.target.closest('.comment-delete-btn');
      const commentId = btn.getAttribute('data-comment-id');
      const comment = btn.closest('.comment');
      const contentType = comment.closest('.comments-container').getAttribute('data-content-type');
      const contentId = comment.closest('.comments-container').getAttribute('data-content-id');
      
      if (confirm('Are you sure you want to delete this comment?')) {
        deleteComment(commentId, contentType, contentId);
      }
    }
  });
  // Use event delegation for dynamically added elements
  document.addEventListener('click', e => {
    // Like button
    if (e.target.closest('.like-btn')) {
      const likeBtn = e.target.closest('.like-btn');
      handleLikeClick(likeBtn);
    }
    
    // Reply button
    if (e.target.closest('.reply-btn')) {
      const replyBtn = e.target.closest('.reply-btn');
      handleReplyClick(replyBtn);
    }
  });
  
  // Reply form submission
  document.addEventListener('submit', e => {
    if (e.target.closest('.reply-form')) {
      handleReplySubmit(e);
    }
  });
}

// Handle like button click
function handleLikeClick(likeBtn) {
  // Check if user is logged in
  if (!currentUser) {
    showAuthModal('login');
    return;
  }
  
  const commentId = likeBtn.getAttribute('data-comment-id');
  const contentType = likeBtn.getAttribute('data-content-type');
  const contentId = likeBtn.getAttribute('data-content-id');
  
  // Find comment
  const contentComments = comments[contentType]?.[contentId] || [];
  const commentIndex = contentComments.findIndex(c => c.id === commentId);
  
  if (commentIndex === -1) return;
  
  const comment = contentComments[commentIndex];
  
  // Toggle like
  const userIndex = comment.likes.indexOf(currentUser.id);
  if (userIndex === -1) {
    // Add like
    comment.likes.push(currentUser.id);
    likeBtn.classList.add('liked');
  } else {
    // Remove like
    comment.likes.splice(userIndex, 1);
    likeBtn.classList.remove('liked');
  }
  
  // Update like count
  const likeCount = likeBtn.querySelector('.like-count');
  likeCount.textContent = comment.likes.length;
  
  // Save to localStorage
  saveComments();
  
  // Broadcast like to peers
  broadcastLike(commentId, comment.likes, contentType, contentId);
}

// Handle reply button click
function handleReplyClick(replyBtn) {
  // Check if user is logged in
  if (!currentUser) {
    showAuthModal('login');
    return;
  }
  
  const commentElement = replyBtn.closest('.comment');
  const replyFormContainer = commentElement.querySelector('.reply-form-container');
  
  // Toggle reply form
  if (replyFormContainer.style.display === 'none' || replyFormContainer.style.display === '') {
    replyFormContainer.style.display = 'block';
    replyFormContainer.querySelector('textarea').focus();
  } else {
    replyFormContainer.style.display = 'none';
  }
}

// Handle reply form submission
function handleReplySubmit(e) {
  e.preventDefault();
  
  // Check if user is logged in
  if (!currentUser) {
    showAuthModal('login');
    return;
  }
  
  const form = e.target;
  const commentId = form.getAttribute('data-comment-id');
  const contentType = form.getAttribute('data-content-type');
  const contentId = form.getAttribute('data-content-id');
  const replyText = form.querySelector('textarea').value.trim();
  
  if (!replyText) {
    showNotification('Please enter a reply', 'error');
    return;
  }
  
  // Create reply object
  const reply = {
    id: generateCommentId(),
    userId: currentUser.id,
    username: currentUser.username,
    avatar: currentUser.avatar,
    text: replyText,
    timestamp: new Date().toISOString()
  };
  
  // Find comment
  const contentComments = comments[contentType]?.[contentId] || [];
  const commentIndex = contentComments.findIndex(c => c.id === commentId);
  
  if (commentIndex === -1) return;
  
  // Add reply
  if (!contentComments[commentIndex].replies) {
    contentComments[commentIndex].replies = [];
  }
  contentComments[commentIndex].replies.push(reply);
  
  // Save to localStorage
  saveComments();
  
  // Render reply
  const commentElement = form.closest('.comment');
  const repliesContainer = commentElement.querySelector('.replies-container');
  const replyElement = createReplyElement(reply);
  repliesContainer.appendChild(replyElement);
  
  // Clear form and hide
  form.querySelector('textarea').value = '';
  form.parentElement.style.display = 'none';
  
  // Broadcast reply to peers
  broadcastReply(commentId, reply, contentType, contentId);
}

// Broadcast a comment to all connected peers
function broadcastComment(comment, contentType, contentId) {
  console.log('Broadcasting comment:', { comment, contentType, contentId });
  
  // First save locally
  if (!comments[contentType]) comments[contentType] = {};
  if (!comments[contentType][contentId]) comments[contentType][contentId] = [];
  
  // Check if comment already exists
  const existingIndex = comments[contentType][contentId].findIndex(c => c.id === comment.id);
  if (existingIndex === -1) {
    comments[contentType][contentId].push(comment);
  }
  
  // Save to localStorage
  saveComments();
  
  // Then broadcast to peers if connected
  if (typeof peer !== 'undefined' && peer && connections) {
    console.log('Broadcasting to peers...');
    const message = {
      type: 'comment',
      comment: comment,
      contentType: contentType,
      contentId: contentId
    };
    
    // Send to all connections
    for (const peerId in connections) {
      try {
        connections[peerId].send(message);
        console.log('Sent to peer:', peerId);
      } catch (e) {
        console.error('Error sending to peer:', e);
      }
    }
  }
  
  // Update UI
  renderComments(contentType, contentId);
}

// Broadcast a like to all connected peers
function broadcastLike(commentId, likes, contentType, contentId) {
  if (!peer || !connections) return;
  
  const message = {
    type: 'like',
    commentId: commentId,
    likes: likes,
    contentType: contentType,
    contentId: contentId
  };
  
  // Send to all connections
  for (const peerId in connections) {
    connections[peerId].send(message);
  }
}

// Broadcast a reply to all connected peers
function broadcastReply(commentId, reply, contentType, contentId) {
  if (!peer || !connections) return;
  
  const message = {
    type: 'reply',
    commentId: commentId,
    reply: reply,
    contentType: contentType,
    contentId: contentId
  };
  
  // Send to all connections
  for (const peerId in connections) {
    connections[peerId].send(message);
  }
}

// Handle incoming comment data from peers
function handleCommentData(data) {
  console.log('Received peer data:', data);

  if (data.type === 'request_comments') {
    console.log('Received request for comments, sending all comments');
    // Send all comments to the requesting peer
    if (data.peerId && connections[data.peerId]) {
      connections[data.peerId].send({
        type: 'sync_comments',
        comments: comments
      });
    } else if (data.conn) {
      data.conn.send({
        type: 'sync_comments',
        comments: comments
      });
    } else {
      // Broadcast to all connections
      for (const peerId in connections) {
        connections[peerId].send({
          type: 'sync_comments',
          comments: comments
        });
      }
    }
  } else if (data.type === 'sync_comments') {
    console.log('Syncing comments from peer');
    // Merge incoming comments with local comments
    for (const contentType in data.comments) {
      if (!comments[contentType]) comments[contentType] = {};
      for (const contentId in data.comments[contentType]) {
        if (!comments[contentType][contentId]) comments[contentType][contentId] = [];
        data.comments[contentType][contentId].forEach(incomingComment => {
          const existingIndex = comments[contentType][contentId].findIndex(c => c.id === incomingComment.id);
          if (existingIndex === -1) {
            console.log('Adding new comment from peer:', incomingComment);
            comments[contentType][contentId].push(incomingComment);
          }
        });
      }
    }
    // Save merged comments and update UI
    saveComments();
    renderAllComments();
  } else if (data.type === 'comment') {
    console.log('Adding new comment from peer');
    addComment(data.comment, data.contentType, data.contentId);
  } else if (data.type === 'like') {
    console.log('Updating like from peer');
    updateLikeCount(data.commentId, data.likes, data.contentType, data.contentId);
  } else if (data.type === 'reply') {
    console.log('Adding reply from peer');
    addReply(data.commentId, data.reply, data.contentType, data.contentId);
  } else if (data.type === 'delete') {
    console.log('Deleting comment from peer');
    deleteComment(data.commentId, data.contentType, data.contentId);
  }
}

// Update like count for a comment
function updateLikeCount(commentId, likes, contentType, contentId) {
  // Find comment
  const contentComments = comments[contentType]?.[contentId] || [];
  const commentIndex = contentComments.findIndex(c => c.id === commentId);
  
  if (commentIndex === -1) return;
  
  // Update likes
  contentComments[commentIndex].likes = likes;
  
  // Save to localStorage
  saveComments();
  
  // Update UI
  const commentElement = document.querySelector(`.comment[data-comment-id="${commentId}"]`);
  if (commentElement) {
    const likeBtn = commentElement.querySelector('.like-btn');
    const likeCount = likeBtn.querySelector('.like-count');
    likeCount.textContent = likes.length;
    
    // Update liked status for current user
    if (currentUser && likes.includes(currentUser.id)) {
      likeBtn.classList.add('liked');
    } else {
      likeBtn.classList.remove('liked');
    }
  }
}

// Add a reply to a comment
function addReply(commentId, reply, contentType, contentId) {
  // Find comment
  const contentComments = comments[contentType]?.[contentId] || [];
  const commentIndex = contentComments.findIndex(c => c.id === commentId);
  
  if (commentIndex === -1) return;
  
  // Add reply
  if (!contentComments[commentIndex].replies) {
    contentComments[commentIndex].replies = [];
  }
  contentComments[commentIndex].replies.push(reply);
  
  // Save to localStorage
  saveComments();
  
  // Update UI
  const commentElement = document.querySelector(`.comment[data-comment-id="${commentId}"]`);
  if (commentElement) {
    const repliesContainer = commentElement.querySelector('.replies-container');
    const replyElement = createReplyElement(reply);
    repliesContainer.appendChild(replyElement);
  }
}

// Delete a comment
function deleteComment(commentId, contentType, contentId) {
  // Find comment
  const contentComments = comments[contentType]?.[contentId] || [];
  const commentIndex = contentComments.findIndex(c => c.id === commentId);
  
  if (commentIndex === -1) return;
  
  // Check if current user is the comment author
  const comment = contentComments[commentIndex];
  if (!currentUser || (currentUser.id !== comment.userId && !currentUser.isAdmin)) {
    showNotification('You can only delete your own comments', 'error');
    return;
  }
  
  // Remove comment
  contentComments.splice(commentIndex, 1);
  
  // Save to localStorage
  saveComments();
  
  // Update UI
  renderComments(contentType, contentId);
  
  // Broadcast delete to peers
  broadcastDelete(commentId, contentType, contentId);
}

// Broadcast comment deletion to peers
function broadcastDelete(commentId, contentType, contentId) {
  if (!peer || !connections) return;
  
  const message = {
    type: 'delete',
    commentId: commentId,
    contentType: contentType,
    contentId: contentId
  };
  
  // Send to all connections
  for (const peerId in connections) {
    connections[peerId].send(message);
  }
}

// Initialize comments when the page loads
document.addEventListener('DOMContentLoaded', initComments);
