import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  fetchComments,
  createComment,
  updateComment,
  deleteComment,
  toggleReaction,
} from '../services/commentApi';
import './CommentsPanel.css';

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '🎉', '🚀', '👀', '🔥', '💯'];

const CommentsPanel = ({ workspaceId, socket }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const commentsEndRef = useRef(null);

  // Load comments
  useEffect(() => {
    const loadComments = async () => {
      try {
        const data = await fetchComments(workspaceId);
        setComments(data.reverse()); // Show oldest first
        setLoading(false);
      } catch (error) {
        toast.error('Failed to load comments');
        setLoading(false);
      }
    };
    loadComments();
  }, [workspaceId]);

  // Socket.IO listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.on('new_comment', (comment) => {
      setComments((prev) => [...prev, comment]);
      scrollToBottom();
    });

    socket.on('comment_updated', (updatedComment) => {
      setComments((prev) =>
        prev.map((c) => (c._id === updatedComment._id ? updatedComment : c))
      );
    });

    socket.on('comment_deleted', ({ commentId }) => {
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    });

    socket.on('reaction_updated', (updatedComment) => {
      setComments((prev) =>
        prev.map((c) => (c._id === updatedComment._id ? updatedComment : c))
      );
    });

    return () => {
      socket.off('new_comment');
      socket.off('comment_updated');
      socket.off('comment_deleted');
      socket.off('reaction_updated');
    };
  }, [socket]);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const comment = await createComment(workspaceId, newComment);
      setComments((prev) => [...prev, comment]);
      setNewComment('');
      
      // Notify others via socket
      socket?.emit('comment_added', { workspaceId, comment });
      
      scrollToBottom();
    } catch (error) {
      toast.error('Failed to post comment');
    }
  };

  const handleEdit = async (commentId) => {
    if (!editText.trim()) return;

    try {
      const updated = await updateComment(commentId, editText);
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? updated : c))
      );
      setEditingId(null);
      setEditText('');
      
      // Notify others via socket
      socket?.emit('comment_updated', { workspaceId, comment: updated });
      
      toast.success('Comment updated');
    } catch (error) {
      toast.error('Failed to update comment');
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      
      // Notify others via socket
      socket?.emit('comment_deleted', { workspaceId, commentId });
      
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  const handleReaction = async (commentId, emoji) => {
    try {
      const updated = await toggleReaction(commentId, emoji);
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? updated : c))
      );
      
      // Notify others via socket
      socket?.emit('reaction_toggled', { workspaceId, comment: updated });
      
      setShowEmojiPicker(null);
    } catch (error) {
      toast.error('Failed to add reaction');
    }
  };

  const startEdit = (comment) => {
    setEditingId(comment._id);
    setEditText(comment.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const groupReactions = (reactions) => {
    const grouped = {};
    reactions.forEach((r) => {
      if (!grouped[r.emoji]) {
        grouped[r.emoji] = [];
      }
      grouped[r.emoji].push(r);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="comments-panel">
        <div className="comments-panel-header">
          <h3 className="comments-panel-title">💬 Comments</h3>
        </div>
        <div className="comments-loading">
          <div className="loading-spinner"></div>
          Loading comments...
        </div>
      </div>
    );
  }

  return (
    <div className="comments-panel">
      {/* Header */}
      <div className="comments-panel-header">
        <h3 className="comments-panel-title">
          💬 Comments
          <span className="comments-count">{comments.length}</span>
        </h3>
      </div>

      {/* Comments List */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="comments-empty">
            <div className="comments-empty-icon">💬</div>
            <p className="comments-empty-text">No comments yet</p>
            <p className="comments-empty-subtext">Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="comment-item">
              {/* Header */}
              <div className="comment-header">
                <div className="comment-user-info">
                  <div className="comment-avatar">
                    {comment.username[0].toUpperCase()}
                  </div>
                  <div className="comment-user-details">
                    <div className="comment-username">{comment.username}</div>
                    <div className="comment-timestamp">
                      {formatTime(comment.createdAt)}
                      {comment.isEdited && (
                        <span className="comment-edited-badge">(edited)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions for own comments */}
                {comment.userId === user?.id && (
                  <div className="comment-actions">
                    <button
                      onClick={() => startEdit(comment)}
                      className="comment-action-btn"
                      title="Edit"
                      aria-label="Edit comment"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(comment._id)}
                      className="comment-action-btn delete-btn"
                      title="Delete"
                      aria-label="Delete comment"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>

              {/* Comment Text */}
              {editingId === comment._id ? (
                <div className="comment-edit-form">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="comment-edit-textarea"
                    rows="3"
                    autoFocus
                    maxLength={1000}
                  />
                  <div className="comment-edit-actions">
                    <button
                      onClick={() => handleEdit(comment._id)}
                      className="comment-edit-btn save-btn"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="comment-edit-btn cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="comment-text">{comment.text}</p>
              )}

              {/* Reactions */}
              <div className="comment-reactions">
                {Object.entries(groupReactions(comment.reactions || [])).map(
                  ([emoji, users]) => {
                    const hasReacted = users.some((u) => u.userId === user?.id);
                    return (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(comment._id, emoji)}
                        className={`reaction-btn ${hasReacted ? 'reacted' : ''}`}
                        title={users.map((u) => u.username).join(', ')}
                        aria-label={`${emoji} reaction by ${users.length} user${users.length > 1 ? 's' : ''}`}
                      >
                        <span className="reaction-emoji">{emoji}</span>
                        <span className="reaction-count">{users.length}</span>
                      </button>
                    );
                  }
                )}

                {/* Add Reaction Button */}
                <div className="add-reaction-wrapper">
                  <button
                    onClick={() =>
                      setShowEmojiPicker(
                        showEmojiPicker === comment._id ? null : comment._id
                      )
                    }
                    className="add-reaction-btn"
                    title="Add reaction"
                    aria-label="Add reaction"
                  >
                    ➕
                  </button>

                  {/* Emoji Picker */}
                  {showEmojiPicker === comment._id && (
                    <div className="emoji-picker">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(comment._id, emoji)}
                          className="emoji-option"
                          aria-label={`React with ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="comments-input-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="comments-textarea"
          rows="3"
          maxLength={1000}
        />
        <div className="comments-input-footer">
          <span
            className={`char-counter ${
              newComment.length > 900
                ? newComment.length > 980
                  ? 'error'
                  : 'warning'
                : ''
            }`}
          >
            {newComment.length}/1000
          </span>
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="post-comment-btn"
          >
            Post
          </button>
        </div>
      </form>
    </div>
  );
};

export default CommentsPanel;
