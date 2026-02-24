import ActivityLog from '../models/ActivityLog.js';

export const getActivities = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    // Using lean() for better performance as we don't need Mongoose features here
    const activities = await ActivityLog.find({ workspaceId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json(activities);
  } catch (error) {
    console.error('[getActivities error]', error);
    return res.status(500).json({ message: 'Failed to fetch activities.' });
  }
};
