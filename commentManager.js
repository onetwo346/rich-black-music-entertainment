// commentManager.js
// Handles comment deletion and UI updates

document.addEventListener('DOMContentLoaded', function() {
    // Load comments from localStorage
    let comments = JSON.parse(localStorage.getItem('rb_user_comments') || '[]');
    
    // If no comments exist, add demo comments for first-time users
    if (comments.length === 0) {
        comments = [
            {id: 1, author: 'booms', content: 'Great track!', date: '6 minutes ago', post: 'Music'},
            {id: 2, author: 'booms', content: 'Looking forward to more releases', date: '19 minutes ago', post: 'News'},
        ];
        localStorage.setItem('rb_user_comments', JSON.stringify(comments));
    }
    
    function renderComments() {
        const container = document.getElementById('user-comments-container');
        container.innerHTML = '';
        
        // Get current user from localStorage
        const userData = localStorage.getItem('rb_user_data');
        let currentUser = null;
        
        if (userData) {
            try {
                currentUser = JSON.parse(userData);
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
        
        // If no user is logged in or no comments exist
        if (!currentUser || comments.length === 0) {
            container.innerHTML = `<div class='empty-comments-message' style='text-align:center;padding:2rem;'>
                <i class='fas fa-comments' style='font-size:3rem;color:var(--text-muted);margin-bottom:1rem;'></i>
                <p>You haven't made any comments yet.</p>
            </div>`;
            return;
        }
        
        // Sort comments by newest first
        const sortedComments = [...comments].sort((a, b) => {
            return new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date);
        });
        
        sortedComments.forEach(comment => {
            const div = document.createElement('div');
            div.className = 'comment-item';
            let deleteBtn = '';
            
            // Only show delete button for the current user's comments
            if (comment.author === currentUser.username) {
                deleteBtn = `<button class='comment-delete-btn' title='Delete comment' data-id='${comment.id}'>
                    <i class='fas fa-trash'></i>
                </button>`;
            }
            
            div.innerHTML = `
                ${deleteBtn}
                <div class='comment-content'>${comment.content}</div>
                <div class='comment-meta'>
                    <span class='comment-post'>${comment.post}</span>
                    <span class='comment-date'>${comment.date || comment.timestamp}</span>
                </div>
            `;
            container.appendChild(div);
        });
        
        // Add delete event listeners
        document.querySelectorAll('.comment-delete-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = parseInt(this.getAttribute('data-id'));
                if (confirm('Are you sure you want to delete this comment?')) {
                    deleteComment(id);
                }
            });
        });
    }

    function deleteComment(id) {
        const idx = comments.findIndex(c => c.id === id);
        if (idx !== -1) {
            comments.splice(idx, 1);
            
            // Update localStorage
            localStorage.setItem('rb_user_comments', JSON.stringify(comments));
            
            // Re-render comments
            renderComments();
            
            // Show success notification if the notification function exists
            if (typeof showNotification === 'function') {
                showNotification('Comment deleted successfully');
            } else {
                // Fallback notification
                const notificationElement = document.createElement('div');
                notificationElement.className = 'notification success';
                notificationElement.textContent = 'Comment deleted successfully';
                document.body.appendChild(notificationElement);
                
                setTimeout(() => {
                    notificationElement.remove();
                }, 3000);
            }
        }
    }

    // Expose for modal open
    window.loadUserComments = renderComments;

    // If the modal is already open, render comments
    if (document.getElementById('comment-management-modal').style.display === 'flex') {
        renderComments();
    }
});
