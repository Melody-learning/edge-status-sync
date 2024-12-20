const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');
const config = require('../config/default');

class WebSocketService {
    constructor() {
        this.wss = null;
        this.users = new Map();
        this.middlewareManager = null;
    }

    initialize(server) {
        console.log('[WSService] Initializing WebSocket service');
        
        // 创建中间件管理器
        this.setupMiddlewareManager();
        
        // 创建 WebSocket 服务器
        this.wss = new WebSocket.Server({ 
            server,
            verifyClient: (info, cb) => this.verifyClient(info, cb)
        });

        // 设置连接处理
        this.wss.on('connection', (ws, req) => this.handleConnection(ws, req));
        
        console.log('[WSService] WebSocket server initialized');
    }

    setupMiddlewareManager() {
        this.middlewareManager = {
            middlewares: [],
            use(fn) {
                this.middlewares.push(fn);
            },
            async executeChain(ws, req) {
                let index = 0;
                const next = async () => {
                    if (index < this.middlewares.length) {
                        const middleware = this.middlewares[index];
                        index++;
                        try {
                            await middleware(ws, req, next);
                        } catch (error) {
                            console.error('[WSService] Middleware error:', error);
                            ws.close(1008, 'Middleware error');
                        }
                    }
                };
                await next();
            }
        };

        // 注册中间件
        this.middlewareManager.use(this.authMiddleware.bind(this));
        this.middlewareManager.use(this.stateMiddleware.bind(this));
    }

    async verifyClient(info, cb) {
        console.log('[WSService] New connection attempt');
        try {
            const { query } = url.parse(info.req.url, true);
            const token = query.token || info.req.headers['authorization'];
            
            if (!token) {
                console.log('[WSService] No token provided');
                cb(false, 401, 'Unauthorized');
                return;
            }

            // 基本的 token 验证，详细验证在中间件中进行
            jwt.verify(token, config.jwt.secret);
            cb(true);
        } catch (error) {
            console.error('[WSService] Client verification failed:', error.message);
            cb(false, 401, 'Invalid token');
        }
    }

    async authMiddleware(ws, req, next) {
        try {
            const { query } = url.parse(req.url, true);
            const token = query.token || req.headers['authorization'];
            
            const decoded = jwt.verify(token, config.jwt.secret);
            const user = this.users.get(decoded.userId) || {
                userId: decoded.userId,
                token: decoded.token,
                isOnline: false,
                lastActive: null,
                status: 'offline'
            };

            ws.user = user;
            this.users.set(user.userId, user);
            
            console.log('[WSService] User authenticated:', user.userId);
            await next();
        } catch (error) {
            console.error('[WSService] Authentication failed:', error.message);
            ws.close(1008, 'Authentication failed');
        }
    }

    async stateMiddleware(ws, req, next) {
        try {
            if (!ws.user) {
                throw new Error('No user context');
            }

            ws.user.isOnline = true;
            ws.user.lastActive = new Date();
            ws.user.status = 'online';

            console.log('[WSService] User state updated:', ws.user.userId);
            await next();
        } catch (error) {
            console.error('[WSService] State middleware error:', error.message);
            ws.close(1008, error.message);
        }
    }

    async handleConnection(ws, req) {
        try {
            await this.middlewareManager.executeChain(ws, req);

            // 发送欢迎消息
            this.sendToClient(ws, {
                type: 'welcome',
                message: 'Welcome to WebSocket server!',
                user: ws.user
            });

            // 设置消息处理
            ws.on('message', (message) => this.handleMessage(ws, message));
            ws.on('close', () => this.handleDisconnection(ws));
            ws.on('error', (error) => this.handleError(ws, error));

        } catch (error) {
            console.error('[WSService] Connection handling error:', error);
            ws.close(1011, 'Internal server error');
        }
    }

    handleMessage(ws, message) {
        try {
            const data = JSON.parse(message);
            console.log('[WSService] Received message:', data);

            switch (data.type) {
                case 'status:update':
                    this.handleStatusUpdate(ws, data);
                    break;
                default:
                    this.sendToClient(ws, {
                        type: 'message:received',
                        message: `Server received: ${data.message || message}`,
                        timestamp: new Date().toISOString()
                    });
            }
        } catch (error) {
            console.log('[WSService] Invalid message:', message.toString());
            this.sendToClient(ws, {
                type: 'error',
                message: 'Invalid message format',
                received: message.toString()
            });
        }
    }

    handleStatusUpdate(ws, data) {
        if (!ws.user) return;

        ws.user.status = data.status;
        ws.user.lastActive = new Date();

        // 通知状态更新成功
        this.sendToClient(ws, {
            type: 'status:updated',
            status: data.status,
            timestamp: new Date().toISOString()
        });

        // 通知配对用户（如果存在）
        if (ws.user.partnerId) {
            this.notifyPartner(ws.user.partnerId, {
                type: 'partner:status',
                status: data.status,
                timestamp: new Date().toISOString()
            });
        }
    }

    handleDisconnection(ws) {
        if (!ws.user) return;

        console.log('[WSService] Client disconnected:', ws.user.userId);
        ws.user.isOnline = false;
        ws.user.lastActive = new Date();
        ws.user.status = 'offline';

        // 通知配对用户
        if (ws.user.partnerId) {
            this.notifyPartner(ws.user.partnerId, {
                type: 'partner:offline',
                timestamp: new Date().toISOString()
            });
        }
    }

    handleError(ws, error) {
        console.error('[WSService] WebSocket error:', error);
    }

    sendToClient(ws, data) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }

    notifyPartner(partnerId, data) {
        this.wss.clients.forEach(client => {
            if (client.user && client.user.userId === partnerId) {
                this.sendToClient(client, data);
            }
        });
    }

    // 获取用户连接状态
    getUserStatus(userId) {
        const user = this.users.get(userId);
        return user ? {
            isOnline: user.isOnline,
            status: user.status,
            lastActive: user.lastActive
        } : null;
    }
}

module.exports = new WebSocketService(); 