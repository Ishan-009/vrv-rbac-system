const { StatusCodes } = require('http-status-codes');
const activityService = require('../services/activity-service');
const getActivityLogs = async (req, res, next) => {
  try {
    const logs = await activityService.getActivityLogs(req.user.role);
    return res.sendSuccess(logs, 'Activity Logs Data', StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivityLogs,
};
