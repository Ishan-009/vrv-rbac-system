const express = require('express');
const router = express.Router();
const authRoutes = require('./auth-routes');
const userRoutes = require('./user-routes');
const roleRoutes = require('./role-routes');
const activityRoutes = require('./activity-routes');
const postRoutes = require('./post-routes');
router.get('/healthy', (req, res) => {
  return res
    .json({ message: 'API V1 Healthy Server', status: true })
    .status(200);
});
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/posts', postRoutes);
router.use('/activity', activityRoutes);
module.exports = router;
