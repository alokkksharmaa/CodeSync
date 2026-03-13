import Comment from '../models/Comment.js';
import WorkspaceMember from '../models/WorkspaceMember.js';

/**
 * Get all comments for a workspace
 */
export const getComments = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Verify membership
    const membership = await WorkspaceMember.findOne({
      workspaceId,
      userId: req.user.id,
    });

    if (!membership) {
      return res.status(403).json({ message: 'Not a member of this workspace' });
    }

    const comments = await Comment.find({ workspaceId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json({ comments });
  } catch (error) {
    console.error('[getComments error]', error);
    return res.status(500).json({ message: 'Failed to fetch comments' });
  }
};

/**
 * Create a new comment
 */
export const createComment = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    // Verify membership
    const membership = await WorkspaceMember.findOne({
      workspaceId,
      userId: req.user.id,
    });

    if (!membership) {
      return res.status(403).json({ message: 'Not a member of this workspace' });
    }

    const comment = await Comment.create({
      workspaceId,
      userId: req.user.id,
      username: req.user.username,
      text: text.trim(),
    });

    return res.status(201).json({ comment });
  } catch (error) {
    console.error('[createComment error]', error);
    return res.status(500).json({ message: 'Failed to create comment' });
  }
};

/**
 * Update a comment
 */
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Only the author can edit
    if (comment.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }

    comment.text = text.trim();
    comment.isEdited = true;
    await comment.save();

    return res.json({ comment });
  } catch (error) {
    console.error('[updateComment error]', error);
    return res.status(500).json({ message: 'Failed to update comment' });
  }
};

/**
 * Delete a comment
 */
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Only the author can delete
    if (comment.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(commentId);

    return res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('[deleteComment error]', error);
    return res.status(500).json({ message: 'Failed to delete comment' });
  }
};

/**
 * Add or remove emoji reaction
 */
export const toggleReaction = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ message: 'Emoji is required' });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user already reacted with this emoji
    const existingReactionIndex = comment.reactions.findIndex(
      (r) => r.userId.toString() === req.user.id && r.emoji === emoji
    );

    if (existingReactionIndex > -1) {
      // Remove reaction
      comment.reactions.splice(existingReactionIndex, 1);
    } else {
      // Add reaction
      comment.reactions.push({
        emoji,
        userId: req.user.id,
        username: req.user.username,
      });
    }

    await comment.save();

    return res.json({ comment });
  } catch (error) {
    console.error('[toggleReaction error]', error);
    return res.status(500).json({ message: 'Failed to toggle reaction' });
  }
};
