const { pgPool } = require('../config/database');

class Conversation {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.title = data.title;
    this.messages = data.messages || [];
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Create a new conversation
  static async create({ userId, title, messages = [] }) {
    try {
      const query = `
        INSERT INTO conversations (user_id, title, messages)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      
      const result = await pgPool.query(query, [userId, title, JSON.stringify(messages)]);
      return new Conversation(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Find conversation by ID
  static async findById(id, userId = null) {
    try {
      let query = 'SELECT * FROM conversations WHERE id = $1';
      let params = [id];
      
      if (userId) {
        query += ' AND user_id = $2';
        params.push(userId);
      }
      
      const result = await pgPool.query(query, params);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Conversation(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Find conversations by user ID
  static async findByUserId(userId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT * FROM conversations 
        WHERE user_id = $1 
        ORDER BY updated_at DESC 
        LIMIT $2 OFFSET $3
      `;
      
      const result = await pgPool.query(query, [userId, limit, offset]);
      return result.rows.map(row => new Conversation(row));
    } catch (error) {
      throw error;
    }
  }

  // Add message to conversation
  async addMessage(message) {
    try {
      const newMessage = {
        id: require('crypto').randomUUID(),
        role: message.role,
        content: message.content,
        timestamp: new Date().toISOString(),
        attachments: message.attachments || []
      };

      this.messages.push(newMessage);

      const query = `
        UPDATE conversations 
        SET messages = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await pgPool.query(query, [JSON.stringify(this.messages), this.id]);
      return new Conversation(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Update conversation title
  async updateTitle(title) {
    try {
      const query = `
        UPDATE conversations 
        SET title = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      
      const result = await pgPool.query(query, [title, this.id]);
      return new Conversation(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Delete conversation
  async delete() {
    try {
      const query = 'DELETE FROM conversations WHERE id = $1';
      await pgPool.query(query, [this.id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get conversation summary for list view
  getSummary() {
    return {
      id: this.id,
      title: this.title,
      messageCount: this.messages.length,
      lastMessage: this.messages.length > 0 ? this.messages[this.messages.length - 1] : null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Get full conversation data
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      messages: this.messages,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Conversation;
