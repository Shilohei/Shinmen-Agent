const express = require('express');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const ApiConfig = require('../models/ApiConfig');
const { authenticateToken } = require('../middleware/auth');
const { validatePasswordUpdate } = require('../middleware/validation');

const router = express.Router();

// Get user dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get conversation count
    const conversations = await Conversation.findByUserId(userId, 5, 0);
    const conversationCount = conversations.length;

    // Get API config count
    const apiConfigs = await ApiConfig.findByUserId(userId);
    const apiConfigCount = apiConfigs.length;

    // Get recent activity
    const recentConversations = conversations.slice(0, 3).map(conv => conv.getSummary());

    res.json({
      dashboard: {
        user: req.user.toJSON(),
        stats: {
          conversationCount,
          apiConfigCount,
          totalMessages: conversations.reduce((total, conv) => total + conv.messages.length, 0)
        },
        recentActivity: {
          conversations: recentConversations
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Update user preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const { preferences } = req.body;

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ error: 'Invalid preferences data' });
    }

    const updatedUser = await req.user.update({ preferences });

    res.json({
      message: 'Preferences updated successfully',
      user: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Get user activity summary
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const userId = req.user.id;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));

    // Get conversations in date range
    const conversations = await Conversation.findByUserId(userId, 100, 0);
    
    const activityData = conversations
      .filter(conv => new Date(conv.createdAt) >= startDate)
      .map(conv => ({
        date: conv.createdAt.toISOString().split('T')[0],
        conversationId: conv.id,
        title: conv.title,
        messageCount: conv.messages.length
      }));

    // Group by date
    const groupedActivity = activityData.reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          conversationCount: 0,
          totalMessages: 0,
          conversations: []
        };
      }
      acc[date].conversationCount++;
      acc[date].totalMessages += item.messageCount;
      acc[date].conversations.push({
        id: item.conversationId,
        title: item.title,
        messageCount: item.messageCount
      });
      return acc;
    }, {});

    res.json({
      activity: Object.values(groupedActivity).sort((a, b) => new Date(b.date) - new Date(a.date))
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to fetch activity data' });
  }
});

// Export user data
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all user data
    const conversations = await Conversation.findByUserId(userId, 1000, 0);
    const apiConfigs = await ApiConfig.findByUserId(userId);

    const exportData = {
      user: req.user.toJSON(),
      conversations: conversations.map(conv => conv.toJSON()),
      apiConfigs: apiConfigs.map(config => config.toSafeJSON()),
      exportedAt: new Date().toISOString()
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="user-data-${userId}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to export user data' });
  }
});

// Delete user account
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { confirmPassword } = req.body;

    if (!confirmPassword) {
      return res.status(400).json({ error: 'Password confirmation required' });
    }

    // Verify password
    const isValidPassword = await req.user.verifyPassword(confirmPassword);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const userId = req.user.id;

    // Delete user's conversations
    const conversations = await Conversation.findByUserId(userId, 1000, 0);
    for (const conversation of conversations) {
      await conversation.delete();
    }

    // Soft delete API configurations
    await ApiConfig.updateMany(
      { userId },
      { isActive: false }
    );

    // Delete user account (you might want to soft delete instead)
    // For now, we'll just mark as inactive in preferences
    await req.user.update({
      preferences: { ...req.user.preferences, accountDeleted: true }
    });

    res.json({ message: 'Account deletion initiated successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;
