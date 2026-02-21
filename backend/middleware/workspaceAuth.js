import WorkspaceMember from '../models/WorkspaceMember.js';

/**
 * verifyMembership
 * Checks that req.user is a member of the workspace in req.params.id or req.params.workspaceId.
 * Attaches req.membership = { role } on success.
 */
export const verifyMembership = async (req, res, next) => {
  try {
    const workspaceId = req.params.workspaceId || req.params.id;

    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID is required.' });
    }

    const membership = await WorkspaceMember.findOne({
      workspaceId,
      userId: req.user.id,
    });

    if (!membership) {
      return res.status(403).json({ message: 'Access denied: not a workspace member.' });
    }

    req.membership = { role: membership.role };
    next();
  } catch (error) {
    console.error('[workspaceAuth error]', error);
    return res.status(500).json({ message: 'Authorization check failed.' });
  }
};

/**
 * requireRole(...roles)
 * Factory that returns middleware enforcing a minimum role.
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.membership || !roles.includes(req.membership.role)) {
      return res.status(403).json({
        message: `Access denied: requires one of [${roles.join(', ')}] role.`,
      });
    }
    next();
  };
};
