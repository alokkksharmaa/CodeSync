import WorkspaceMember from '../models/WorkspaceMember.js';

export const roles = {
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer'
};

const roleLevels = {
  [roles.OWNER]: 3,
  [roles.EDITOR]: 2,
  [roles.VIEWER]: 1
};

/**
 * requireRole
 * Middleware factory to ensure user has at least the required role in the workspace.
 * Requires req.params.id or req.params.workspaceId or req.body.workspaceId.
 */
export const requireRole = (minRole) => {
  return async (req, res, next) => {
    try {
      console.log('requireRole check - req.body:', req.body, 'req.params:', req.params);
      const workspaceId = req.params.id || req.params.workspaceId || req.body?.workspaceId;
      
      if (!workspaceId) {
        return res.status(400).json({ message: 'Workspace ID is required for permission check.', debug: req.body });
      }

      const membership = await WorkspaceMember.findOne({
        workspaceId,
        userId: req.user.id
      });

      if (!membership) {
        return res.status(403).json({ message: 'Access denied: not a workspace member.' });
      }

      const userLevel = roleLevels[membership.role] || 0;
      const targetLevel = roleLevels[minRole] || 0;

      if (userLevel < targetLevel) {
        return res.status(403).json({ 
          message: `Access denied: requires at least ${minRole} role.` 
        });
      }

      // Attach membership for downstream use
      req.membership = membership;
      next();
    } catch (error) {
      console.error('[requireRole error]', error);
      return res.status(500).json({ message: 'Authorization check failed.' });
    }
  };
};

/**
 * checkRole
 * Middleware to check role on an ALREADY POPULATED req.membership.
 * Useful after verifyFileAccess.
 */
export const checkRole = (minRole) => {
  return (req, res, next) => {
    if (!req.membership) {
      return res.status(403).json({ message: 'Access denied: membership not verified.' });
    }

    const userLevel = roleLevels[req.membership.role] || 0;
    const targetLevel = roleLevels[minRole] || 0;

    if (userLevel < targetLevel) {
      return res.status(403).json({ 
        message: `Access denied: requires at least ${minRole} role.` 
      });
    }

    next();
  };
};

/**
 * isOwner
 * Shorthand for requireRole('owner')
 */
export const isOwner = requireRole(roles.OWNER);

/**
 * isEditor
 * Shorthand for requireRole('editor') — allows editors and owners
 */
export const isEditor = requireRole(roles.EDITOR);
