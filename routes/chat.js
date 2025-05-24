const express = require('express');
const Conversation = require('../models/Conversation');
const { authenticateToken } = require('../middleware/auth');
const { validateChatMessage, validateConversation, validateUUIDParam } = require('../middleware/validation');
const { generateAIResponse } = require('../utils/aiService');

const router = express.Router();

// Get all conversations for user
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const conversations = await Conversation.findByUserId(
      req.user.id,
      parseInt(limit),
      parseInt(offset)
    );

    const summaries = conversations.map(conv => conv.getSummary());

    res.json({
      conversations: summaries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: conversations.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get specific conversation
router.get('/conversations/:id', authenticateToken, validateUUIDParam('id'), async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ conversation: conversation.toJSON() });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Create new conversation
router.post('/conversations', authenticateToken, validateConversation, async (req, res) => {
  try {
    const { title } = req.body;

    const conversation = await Conversation.create({
      userId: req.user.id,
      title,
      messages: []
    });

    res.status(201).json({
      message: 'Conversation created successfully',
      conversation: conversation.toJSON()
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Send message to conversation
router.post('/conversations/:id/messages', authenticateToken, validateUUIDParam('id'), validateChatMessage, async (req, res) => {
  try {
    const { message, attachments = [] } = req.body;

    let conversation = await Conversation.findById(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Add user message
    conversation = await conversation.addMessage({
      role: 'user',
      content: message,
      attachments
    });

    // Generate AI response
    try {
      const aiResponse = await generateAIResponse(conversation.messages, req.user);
      
      // Add AI response to conversation
      conversation = await conversation.addMessage({
        role: 'assistant',
        content: aiResponse.content,
        attachments: aiResponse.attachments || []
      });

      // Emit real-time update via Socket.io
      const io = req.app.get('io');
      if (io) {
        io.to(`user-${req.user.id}`).emit('message-received', {
          conversationId: conversation.id,
          message: conversation.messages[conversation.messages.length - 1]
        });
      }

    } catch (aiError) {
      console.error('AI response error:', aiError);
      
      // Add error message
      conversation = await conversation.addMessage({
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        attachments: []
      });
    }

    res.json({
      message: 'Message sent successfully',
      conversation: conversation.toJSON()
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Update conversation title
router.put('/conversations/:id', authenticateToken, validateUUIDParam('id'), async (req, res) => {
  try {
    const { title } = req.body;

    let conversation = await Conversation.findById(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    conversation = await conversation.updateTitle(title);

    res.json({
      message: 'Conversation updated successfully',
      conversation: conversation.toJSON()
    });
  } catch (error) {
    console.error('Update conversation error:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

// Delete conversation
router.delete('/conversations/:id', authenticateToken, validateUUIDParam('id'), async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    await conversation.delete();

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

module.exports = router;
