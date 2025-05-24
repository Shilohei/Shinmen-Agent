import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  }

  connect(userId: string): void {
    if (this.socket?.connected) {
      return;
    }

    const token = localStorage.getItem('token');
    
    this.socket = io(this.baseURL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.joinUserRoom(userId);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinUserRoom(userId: string): void {
    if (this.socket) {
      this.socket.emit('join-room', userId);
    }
  }

  // Event listeners
  onMessageReceived(callback: SocketEvents['message-received']): void {
    if (this.socket) {
      this.socket.on('message-received', callback);
    }
  }

  onTypingStart(callback: SocketEvents['typing-start']): void {
    if (this.socket) {
      this.socket.on('typing-start', callback);
    }
  }

  onTypingStop(callback: SocketEvents['typing-stop']): void {
    if (this.socket) {
      this.socket.on('typing-stop', callback);
    }
  }

  onUserConnected(callback: SocketEvents['user-connected']): void {
    if (this.socket) {
      this.socket.on('user-connected', callback);
    }
  }

  onUserDisconnected(callback: SocketEvents['user-disconnected']): void {
    if (this.socket) {
      this.socket.on('user-disconnected', callback);
    }
  }

  // Event emitters
  emitTypingStart(conversationId: string): void {
    if (this.socket) {
      this.socket.emit('typing-start', { conversationId });
    }
  }

  emitTypingStop(conversationId: string): void {
    if (this.socket) {
      this.socket.emit('typing-stop', { conversationId });
    }
  }

  // Remove event listeners
  offMessageReceived(): void {
    if (this.socket) {
      this.socket.off('message-received');
    }
  }

  offTypingStart(): void {
    if (this.socket) {
      this.socket.off('typing-start');
    }
  }

  offTypingStop(): void {
    if (this.socket) {
      this.socket.off('typing-stop');
    }
  }

  offUserConnected(): void {
    if (this.socket) {
      this.socket.off('user-connected');
    }
  }

  offUserDisconnected(): void {
    if (this.socket) {
      this.socket.off('user-disconnected');
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

export const socketService = new SocketService();
export default socketService;
