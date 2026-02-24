import ActivityLog from '../models/ActivityLog.js';

export const getActivities = async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    
    console.log('[getActivities] Request for workspaceId:', workspaceId);
    console.log('[getActivities] User:', req.user?.id);
    
    const activities = await ActivityLog.find({ workspaceId })
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    console.log('[getActivities] Found activities:', activities.length);

    // Enrich activities with username from populated userId
    const enrichedActivities = activities.map(act => ({
      ...act,
      metadata: {
        ...act.metadata,
        username: act.metadata?.username || act.userId?.username || 'Unknown User'
      }
    }));

    console.log('[getActivities] Returning enriched activities:', enrichedActivities.length);
    return res.status(200).json(enrichedActivities);
  } catch (error) {
    console.error('[getActivities error]', error);
    return res.status(500).json({ message: 'Failed to fetch activities.' });
  }
};
