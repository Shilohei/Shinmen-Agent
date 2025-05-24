const mongoose = require('mongoose');
const crypto = require('crypto');

const apiConfigSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  providerName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  endpointUrl: {
    type: String,
    required: true,
    trim: true
  },
  authType: {
    type: String,
    enum: ['apiKey', 'bearer', 'oauth'],
    required: true
  },
  credentials: {
    apiKey: String,
    bearerToken: String,
    clientId: String,
    clientSecret: String
  },
  modelName: {
    type: String,
    trim: true
  },
  requestTemplate: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  responseMapping: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  rateLimit: {
    requestsPerMinute: {
      type: Number,
      default: 60
    },
    requestsPerDay: {
      type: Number,
      default: 1000
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Encryption key from environment
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

// Encrypt sensitive data before saving
apiConfigSchema.pre('save', function(next) {
  if (this.isModified('credentials')) {
    for (const [key, value] of Object.entries(this.credentials)) {
      if (value && typeof value === 'string') {
        this.credentials[key] = encrypt(value);
      }
    }
  }
  next();
});

// Decrypt sensitive data after loading
apiConfigSchema.post('init', function() {
  if (this.credentials) {
    for (const [key, value] of Object.entries(this.credentials)) {
      if (value && typeof value === 'string') {
        try {
          this.credentials[key] = decrypt(value);
        } catch (error) {
          console.error(`Error decrypting ${key}:`, error);
        }
      }
    }
  }
});

// Instance methods
apiConfigSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

apiConfigSchema.methods.testConnection = async function() {
  // This would implement actual API testing logic
  // For now, return a mock response
  return {
    success: true,
    message: 'Connection test successful',
    responseTime: Math.random() * 1000
  };
};

apiConfigSchema.methods.toSafeJSON = function() {
  const obj = this.toObject();
  
  // Remove sensitive credentials from response
  if (obj.credentials) {
    obj.credentials = Object.keys(obj.credentials).reduce((acc, key) => {
      acc[key] = obj.credentials[key] ? '***' : null;
      return acc;
    }, {});
  }
  
  return obj;
};

// Static methods
apiConfigSchema.statics.findByUserId = function(userId) {
  return this.find({ userId, isActive: true }).sort({ updatedAt: -1 });
};

apiConfigSchema.statics.findActiveByUserAndProvider = function(userId, providerName) {
  return this.findOne({ userId, providerName, isActive: true });
};

// Encryption utilities
function encrypt(text) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipher(algorithm, key);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

module.exports = mongoose.model('ApiConfig', apiConfigSchema);
