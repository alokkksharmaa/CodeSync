import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import File from '../models/File.js';
import User from '../models/User.js';

// ─── POST /api/workspaces ─────────────────────────────────────────────────────
export const createWorkspace = async (req, res) => {
  try {
    const { name, language } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Workspace name is required.' });
    }

    // 1. Create workspace
    const workspace = await Workspace.create({
      name: name.trim(),
      owner: req.user.id,
      language: language || 'javascript',
    });

    // 2. Create owner membership
    const membership = await WorkspaceMember.create({
      workspaceId: workspace._id,
      userId: req.user.id,
      role: 'owner',
    });

    // 3. Create initial main file
    const file = await File.create({
      workspaceId: workspace._id,
      name: 'main.js',
      path: '/',
      content: '// Welcome to CodeSync\nconsole.log("Hello World");',
      language: language || 'javascript',
      lastEditedBy: req.user.id,
    });

    return res.status(201).json({ workspace, membership, file });
  } catch (error) {
    console.error('[createWorkspace error]', error);
    return res.status(500).json({ message: 'Failed to create workspace.' });
  }
};

// ─── GET /api/workspaces ──────────────────────────────────────────────────────
export const getWorkspaces = async (req, res) => {
  try {
    const memberships = await WorkspaceMember.find({ userId: req.user.id })
      .populate({
        path: 'workspaceId',
        populate: { path: 'owner', select: 'username email' },
      })
      .sort({ addedAt: -1 });

    const workspaces = memberships
      .filter((m) => m.workspaceId) 
      .map((m) => ({
        workspace: m.workspaceId,
        role: m.role,
        addedAt: m.addedAt,
      }));

    return res.status(200).json(workspaces);
  } catch (error) {
    console.error('[getWorkspaces error]', error);
    return res.status(500).json({ message: 'Failed to fetch workspaces.' });
  }
};

// ─── GET /api/workspaces/:id ──────────────────────────────────────────────────
export const getWorkspace = async (req, res) => {
  try {
    const workspaceId = req.params.id;

    const workspace = await Workspace.findById(workspaceId).populate(
      'owner',
      'username email'
    );

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found.' });
    }

    // Load ALL files for this workspace
    const files = await File.find({ workspaceId }).sort({ name: 1 });

    // Load all members with user info
    const members = await WorkspaceMember.find({ workspaceId }).populate(
      'userId',
      'username email'
    );

    return res.status(200).json({
      workspace,
      files,
      members,
      myRole: req.membership.role,
    });
  } catch (error) {
    console.error('[getWorkspace error]', error);
    return res.status(500).json({ message: 'Failed to fetch workspace.' });
  }
};

// ─── POST /api/workspaces/:id/share ──────────────────────────────────────────
export const shareWorkspace = async (req, res) => {
  try {
    const workspaceId = req.params.id;
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role are required.' });
    }

    if (!['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ message: 'Role must be "editor" or "viewer".' });
    }

    if (req.membership.role !== 'owner') {
      return res.status(403).json({ message: 'Only workspace owners can share.' });
    }

    const targetUser = await User.findOne({ email: email.toLowerCase() });
    if (!targetUser) {
      return res.status(404).json({ message: 'No user found with that email.' });
    }

    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot share a workspace with yourself.' });
    }

    try {
      await WorkspaceMember.create({
        workspaceId,
        userId: targetUser._id,
        role,
      });
    } catch (err) {
      if (err.code === 11000) {
        await WorkspaceMember.findOneAndUpdate(
          { workspaceId, userId: targetUser._id },
          { role },
          { new: true }
        );
      } else {
        throw err;
      }
    }

    const members = await WorkspaceMember.find({ workspaceId }).populate(
      'userId',
      'username email'
    );

    return res.status(200).json({ message: `Shared with ${targetUser.username}.`, members });
  } catch (error) {
    console.error('[shareWorkspace error]', error);
    return res.status(500).json({ message: 'Failed to share workspace.' });
  }
};
