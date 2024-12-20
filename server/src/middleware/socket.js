const jwt = require('jsonwebtoken');
const config = require('../config/default');

// Socket.IO 中间件
const socketAuth = async (socket, next) => {
    console.log('[SocketAuth] Starting authentication');
    console.log('[SocketAuth] Socket ID:', socket.id);
    console.log('[SocketAuth] Transport:', socket.conn.transport.name);
    
    try {
        // 从多个位置尝试获取token
        let token = null;
        
        // 1. 从 authorization header 获取
        const authHeader = socket.handshake.headers?.authorization;
        if (authHeader) {
            console.log('[SocketAuth] Found token in Authorization header');
            token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
            console.log('[SocketAuth] Extracted token:', token.substring(0, 20) + '...');
        }
        
        // 2. 从 handshake auth 获取
        if (!token && socket.handshake.auth?.token) {
            console.log('[SocketAuth] Found token in handshake auth');
            token = socket.handshake.auth.token;
        }
        
        // 3. 从 query 参数获取
        if (!token && socket.handshake.query?.token) {
            console.log('[SocketAuth] Found token in query parameters');
            token = socket.handshake.query.token;
        }
        
        if (!token) {
            console.error('[SocketAuth] No token found in request');
            console.log('[SocketAuth] Handshake details:', {
                headers: socket.handshake.headers,
                auth: socket.handshake.auth,
                query: socket.handshake.query
            });
            throw new Error('Authentication error: Token not provided');
        }

        console.log('[SocketAuth] Verifying token...');
        
        // 验证 token
        const decoded = jwt.verify(token, config.jwt.secret);
        console.log('[SocketAuth] Token verified successfully');
        console.log('[SocketAuth] Decoded user:', decoded);
        
        // 将用户信息添加到 socket 对象
        socket.user = {
            ...decoded,
            connectionTime: new Date(),
            socketId: socket.id
        };
        
        console.log('[SocketAuth] Authentication successful for user:', socket.user);
        
        // 确保调用 next()
        next();
    } catch (error) {
        console.error('[SocketAuth] Authentication failed:', error.message);
        next(new Error('Authentication failed: ' + error.message));
    }
};

// 状态追踪中间件
const socketStatus = async (socket, next) => {
    console.log('[SocketStatus] Setting up user status');
    try {
        if (!socket.user) {
            throw new Error('No user context found');
        }

        // 设置用户在线状态
        socket.user.status = {
            isOnline: true,
            lastActive: new Date(),
            lastStatus: 'online',
            transport: socket.conn.transport.name
        };

        console.log('[SocketStatus] User status set:', {
            userId: socket.user.userId,
            status: socket.user.status
        });

        // 确保调用 next()
        next();
    } catch (error) {
        console.error('[SocketStatus] Error setting user status:', error);
        next(error);
    }
};

// 添加错误处理中间件
const socketErrorHandler = (socket, next) => {
    socket.on('error', (error) => {
        console.error('[SocketError] Socket error:', error);
        // 可以在这里添加错误恢复逻辑
    });

    socket.on('disconnect', (reason) => {
        console.log('[SocketDisconnect] User disconnected:', {
            userId: socket.user?.userId,
            reason,
            socketId: socket.id
        });
    });

    next();
};

module.exports = {
    socketAuth,
    socketStatus,
    socketErrorHandler
}; 