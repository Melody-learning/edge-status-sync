const config = require('../config/default');
const userService = require('./userService');

class SocketService {
    constructor() {
        this.connections = new Map();
        this.io = null;
    }

    initialize(io) {
        console.log('[SocketService] Initializing socket service');
        this.io = io;
        
        // 不在这里监听connection事件
        // 而是提供方法供外部调用
    }

    handleConnection(socket) {
        try {
            console.log('[SocketService] Handling new connection');
            console.log('[SocketService] Socket ID:', socket.id);
            console.log('[SocketService] User:', socket.user);
            
            // 存储连接
            this.connections.set(socket.user.userId, socket);
            
            // 设置事件监听器
            this._setupEventListeners(socket, socket.user.userId);
        } catch (error) {
            console.error('[SocketService] Error handling connection:', error);
            socket.disconnect();
        }
    }

    _setupEventListeners(socket, userId) {
        // 状态更新事件
        socket.on('status:update', (data) => {
            console.log('[SocketService] Status update received:', { userId, data });
            
            try {
                // 解析状态数据
                const statusData = typeof data === 'string' ? JSON.parse(data) : data;
                console.log('[SocketService] Parsed status data:', statusData);
                
                if (!statusData || typeof statusData.status !== 'string') {
                    throw new Error('Invalid status format');
                }
                
                // 更新状态
                const user = userService.getUser(userId);
                if (!user) {
                    throw new Error('User not found');
                }
                
                user.status = statusData.status;
                console.log('[SocketService] Updated user status:', user);
                
                // 通知配对用户
                const partner = userService.getPair(userId);
                if (partner) {
                    const partnerSocket = this.connections.get(partner.userId);
                    if (partnerSocket) {
                        console.log('[SocketService] Notifying partner:', partner.userId);
                        partnerSocket.emit('partner:status', {
                            status: statusData.status,
                            timestamp: new Date()
                        });
                    }
                }
                
                // 发送确认
                socket.emit('status:updated', {
                    status: statusData.status,
                    timestamp: new Date()
                });
                
            } catch (error) {
                console.error('[SocketService] Status update error:', error.message);
                socket.emit('error', { message: error.message });
            }
        });

        // 断开连接事件
        socket.on('disconnect', (reason) => {
            console.log('[SocketService] User disconnected:', userId);
            console.log('[SocketService] Disconnect reason:', reason);
            this.connections.delete(userId);
            
            // 通知配对用户
            const partner = userService.getPair(userId);
            if (partner) {
                const partnerSocket = this.connections.get(partner.userId);
                if (partnerSocket) {
                    partnerSocket.emit('partner:offline', {
                        timestamp: new Date()
                    });
                }
            }
        });

        // 错误事件
        socket.on('error', (error) => {
            console.error('[SocketService] Socket error:', error);
        });
    }

    isUserOnline(userId) {
        return this.connections.has(userId);
    }
}

module.exports = new SocketService(); 