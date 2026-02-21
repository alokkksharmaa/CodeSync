import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import File from '../models/File.js';
import User from '../models/User.js';
import { logActivity } from '../utils/logger.js';

// ─── POST /api/workspaces ─────────────────────────────────────────────────────
export const createWorkspace = async (req, res) => {
  try {
    const { name, language } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Workspace name is required.' });
    }

    const workspace = await Workspace.create({
      name: name.trim(),
      owner: req.user.id,
      language: language || 'javascript',
    });

    const membership = await WorkspaceMember.create({
      workspaceId: workspace._id,
      userId: req.user.id,
      role: 'owner',
    });

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
        addedAt: m.createdAt,
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

    let files = await File.find({ workspaceId }).sort({ name: 1 });
    files = files.map(f => {
      const doc = f.toObject();
      if (!doc.name) doc.name = 'main.js';
      return doc;
    });

    const members = await WorkspaceMember.find({ workspaceId }).populate(
      'userId',
      'username email'
    );

    return res.status(200).json({
      workspace,
      files,
      members: members.map(m => ({
        _id: m._id,
        user: m.userId,
        role: m.role,
        addedAt: m.createdAt
      })),
      myRole: req.membership.role,
    });
  } catch (error) {
    console.error('[getWorkspace error]', error);
    return res.status(500).json({ message: 'Failed to fetch workspace.' });
  }
};

// ─── DELETE /api/workspaces/:id ──────────────────────────────────────────────
export const deleteWorkspace = async (req, res) => {
  try {
    const workspaceId = req.params.id;

    // Delete files, memberships, logs, and workspace
    await Workspace.findByIdAndDelete(workspaceId);
    await WorkspaceMember.deleteMany({ workspaceId });
    await File.deleteMany({ workspaceId });
    // Activities could stay or go, usually stay for record

    logActivity({
      workspaceId,
      userId: req.user.id,
      actionType: 'WORKSPACE_DELETED'
    });

    return res.status(200).json({ message: 'Workspace and all associated data deleted.' });
  } catch (error) {
    console.error('[deleteWorkspace error]', error);
    return res.status(500).json({ message: 'Failed to delete workspace.' });
  }
};

// ─── PATCH /api/workspaces/:id/settings ──────────────────────────────────────
export const updateWorkspaceSettings = async (req, res) => {
  try {
    const { name, language } = req.body;
    const workspaceId = req.params.id;

    const workspace = await Workspace.findByIdAndUpdate(
      workspaceId,
      { name, language },
      { new: true }
    );

    logActivity({
      workspaceId,
      userId: req.user.id,
      actionType: 'WORKSPACE_UPDATED',
      metadata: { name, language }
    });

    return res.status(200).json(workspace);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update settings.' });
  }
};
