const express = require('express');
const ApiConfig = require('../models/ApiConfig');
const { authenticateToken } = require('../middleware/auth');
const { validateApiConfig } = require('../middleware/validation');

const router = express.Router();

// Get all API configurations for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const apiConfigs = await ApiConfig.findByUserId(req.user.id);
    
    // Return safe version without sensitive credentials
    const safeConfigs = apiConfigs.map(config => config.toSafeJSON());

    res.json({
      apiConfigs: safeConfigs
    });
  } catch (error) {
    console.error('Get API configs error:', error);
    res.status(500).json({ error: 'Failed to fetch API configurations' });
  }
});

// Get specific API configuration
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const apiConfig = await ApiConfig.findById(req.params.id);

    if (!apiConfig || apiConfig.userId !== req.user.id) {
      return res.status(404).json({ error: 'API configuration not found' });
    }

    res.json({
      apiConfig: apiConfig.toSafeJSON()
    });
  } catch (error) {
    console.error('Get API config error:', error);
    res.status(500).json({ error: 'Failed to fetch API configuration' });
  }
});

// Create new API configuration
router.post('/', authenticateToken, validateApiConfig, async (req, res) => {
  try {
    const {
      providerName,
      description,
      endpointUrl,
      authType,
      credentials,
      modelName,
      requestTemplate,
      responseMapping,
      rateLimit
    } = req.body;

    // Check if provider already exists for this user
    const existingConfig = await ApiConfig.findActiveByUserAndProvider(req.user.id, providerName);
    if (existingConfig) {
      return res.status(400).json({ 
        error: 'API configuration for this provider already exists' 
      });
    }

    const apiConfig = new ApiConfig({
      userId: req.user.id,
      providerName,
      description,
      endpointUrl,
      authType,
      credentials,
      modelName,
      requestTemplate,
      responseMapping,
      rateLimit
    });

    await apiConfig.save();

    res.status(201).json({
      message: 'API configuration created successfully',
      apiConfig: apiConfig.toSafeJSON()
    });
  } catch (error) {
    console.error('Create API config error:', error);
    res.status(500).json({ error: 'Failed to create API configuration' });
  }
});

// Update API configuration
router.put('/:id', authenticateToken, validateApiConfig, async (req, res) => {
  try {
    const apiConfig = await ApiConfig.findById(req.params.id);

    if (!apiConfig || apiConfig.userId !== req.user.id) {
      return res.status(404).json({ error: 'API configuration not found' });
    }

    const {
      providerName,
      description,
      endpointUrl,
      authType,
      credentials,
      modelName,
      requestTemplate,
      responseMapping,
      rateLimit,
      isActive
    } = req.body;

    // Update fields
    if (providerName) apiConfig.providerName = providerName;
    if (description !== undefined) apiConfig.description = description;
    if (endpointUrl) apiConfig.endpointUrl = endpointUrl;
    if (authType) apiConfig.authType = authType;
    if (credentials) apiConfig.credentials = credentials;
    if (modelName !== undefined) apiConfig.modelName = modelName;
    if (requestTemplate) apiConfig.requestTemplate = requestTemplate;
    if (responseMapping) apiConfig.responseMapping = responseMapping;
    if (rateLimit) apiConfig.rateLimit = rateLimit;
    if (isActive !== undefined) apiConfig.isActive = isActive;

    await apiConfig.save();

    res.json({
      message: 'API configuration updated successfully',
      apiConfig: apiConfig.toSafeJSON()
    });
  } catch (error) {
    console.error('Update API config error:', error);
    res.status(500).json({ error: 'Failed to update API configuration' });
  }
});

// Test API configuration
router.post('/:id/test', authenticateToken, async (req, res) => {
  try {
    const apiConfig = await ApiConfig.findById(req.params.id);

    if (!apiConfig || apiConfig.userId !== req.user.id) {
      return res.status(404).json({ error: 'API configuration not found' });
    }

    const testResult = await apiConfig.testConnection();

    res.json({
      message: 'API test completed',
      result: testResult
    });
  } catch (error) {
    console.error('Test API config error:', error);
    res.status(500).json({ error: 'Failed to test API configuration' });
  }
});

// Delete API configuration
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const apiConfig = await ApiConfig.findById(req.params.id);

    if (!apiConfig || apiConfig.userId !== req.user.id) {
      return res.status(404).json({ error: 'API configuration not found' });
    }

    // Soft delete by setting isActive to false
    apiConfig.isActive = false;
    await apiConfig.save();

    res.json({ message: 'API configuration deleted successfully' });
  } catch (error) {
    console.error('Delete API config error:', error);
    res.status(500).json({ error: 'Failed to delete API configuration' });
  }
});

// Get API usage statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const apiConfig = await ApiConfig.findById(req.params.id);

    if (!apiConfig || apiConfig.userId !== req.user.id) {
      return res.status(404).json({ error: 'API configuration not found' });
    }

    res.json({
      stats: {
        usageCount: apiConfig.usageCount,
        lastUsed: apiConfig.lastUsed,
        createdAt: apiConfig.createdAt,
        isActive: apiConfig.isActive
      }
    });
  } catch (error) {
    console.error('Get API stats error:', error);
    res.status(500).json({ error: 'Failed to fetch API statistics' });
  }
});

module.exports = router;
