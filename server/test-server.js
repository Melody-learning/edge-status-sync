const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const JWT_SECRET = 'test-secret';

// 内存存储
const users = new Map();
const pairs = new Map();

// 中间件
app.use(cors());
app.use(express.json());

// 用户验证 API
app.post('/api/users/verify', (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            throw new Error('Token is required');
        }

        // 解析 token
        const [text, number] = token.split('@');
        if (!text || !number) {
            throw new Error('Invalid token format');
        }

        // 生成用户 ID
        const userId = Buffer.from(`${text}:${number}`).toString('base64');
        
        // 获取或创建用户
        let user = users.get(userId);
        if (!user) {
            user = {
                userId,
                token: { text, number },
                isOnline: false,
                lastActive: null,
                partnerId: null,
                status: 'offline'
            };
            users.set(userId, user);
        }

        // 生成 JWT
        const authToken = jwt.sign({ userId, token: user.token }, JWT_SECRET);

        res.json({ user, token: authToken });

    } catch (error) {
        console.error('[API] Verify error:', error);
        res.status(400).json({
            error: 'Verification failed',
            message: error.message
        });
    }
});

// 配对 API
app.post('/api/users/pair', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new Error('No authorization token');
        }

        const token = authHeader.startsWith('Bearer ') ? 
            authHeader.substring(7) : authHeader;

        // 验证 JWT
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        const { partnerToken } = req.body;
        if (!partnerToken) {
            throw new Error('Partner token is required');
        }

        // 解析伙伴 token
        const [partnerText, partnerNumber] = partnerToken.split('@');
        if (!partnerText || !partnerNumber) {
            throw new Error('Invalid partner token format');
        }
        
        const partnerId = Buffer.from(`${partnerText}:${partnerNumber}`).toString('base64');

        // 验证配对条件
        if (userId === partnerId) {
            throw new Error('Cannot pair with yourself');
        }

        const user = users.get(userId);
        const partner = users.get(partnerId);

        if (!user || !partner) {
            throw new Error('User or partner not found');
        }

        if (user.partnerId) {
            throw new Error('You already have a partner');
        }

        if (partner.partnerId) {
            throw new Error('Partner already paired with someone else');
        }

        // 直接建立配对关系（不需要对方确认）
        user.partnerId = partnerId;
        partner.partnerId = userId;

        // 保存配对关系
        const pairId = [userId, partnerId].sort().join(':');
        pairs.set(pairId, {
            user1: userId,
            user2: partnerId,
            createdAt: new Date()
        });

        res.json({ user, partner });

    } catch (error) {
        console.error('[API] Pair error:', error);
        res.status(400).json({
            error: 'Pairing failed',
            message: error.message
        });
    }
});

// 解除配对 API
app.post('/api/users/unpair', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new Error('No authorization token');
        }

        const token = authHeader.startsWith('Bearer ') ? 
            authHeader.substring(7) : authHeader;

        // 验证 JWT
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        const user = users.get(userId);
        if (!user || !user.partnerId) {
            throw new Error('No active pairing found');
        }

        const partner = users.get(user.partnerId);
        const partnerId = user.partnerId;

        // 解除配对关系
        user.partnerId = null;
        if (partner) {
            partner.partnerId = null;
        }

        // 删除配对记录
        const pairId = [userId, partnerId].sort().join(':');
        pairs.delete(pairId);

        res.json({ user, partner });

    } catch (error) {
        console.error('[API] Unpair error:', error);
        res.status(400).json({
            error: 'Unpairing failed',
            message: error.message
        });
    }
});

// 创建 HTTP 服务器
const server = http.createServer(app);

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ server });

// WebSocket 连接处理
wss.on('connection', function connection(ws, req) {
    console.log('New WebSocket connection');
    
    // 解析 URL 中的 token
    const url = new URL(req.url, 'ws://localhost:3001');
    const token = url.searchParams.get('token');
    
    if (!token) {
        console.log('No token provided');
        ws.close(1008, 'Token required');
        return;
    }

    try {
        // 验证 JWT
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;
        
        // 获取用户
        const user = users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // 关联用户和 WebSocket 连接
        ws.user = user;
        user.isOnline = true;
        user.lastActive = new Date();
        user.status = 'online';

        // 发送欢迎消息
        ws.send(JSON.stringify({
            type: 'welcome',
            message: 'Welcome to WebSocket server!',
            user: {
                userId: user.userId,
                isOnline: user.isOnline,
                status: user.status
            }
        }));

        // 如果有配对用户，通知对方上线
        if (user.partnerId) {
            const partner = users.get(user.partnerId);
            if (partner) {
                // 查找伙伴的 WebSocket 连接
                for (const client of wss.clients) {
                    if (client.user && client.user.userId === partner.userId) {
                        client.send(JSON.stringify({
                            type: 'partner:online',
                            user: {
                                userId: user.userId,
                                status: user.status
                            }
                        }));
                        break;
                    }
                }
            }
        }
        
        // 处理接收到的消息
        ws.on('message', function incoming(message) {
            try {
                const data = JSON.parse(message);
                console.log('Received message:', data);

                // 处理状态更新
                if (data.type === 'status:update') {
                    ws.user.status = data.status;
                    ws.user.lastActive = new Date();

                    // 发送状态更新确认
                    ws.send(JSON.stringify({
                        type: 'status:updated',
                        status: data.status,
                        timestamp: new Date().toISOString()
                    }));

                    // 通知配对用户
                    if (ws.user.partnerId) {
                        for (const client of wss.clients) {
                            if (client.user && client.user.userId === ws.user.partnerId) {
                                client.send(JSON.stringify({
                                    type: 'partner:status',
                                    status: data.status,
                                    timestamp: new Date().toISOString()
                                }));
                                break;
                            }
                        }
                    }
                }
                
            } catch (error) {
                console.log('Received raw message:', message.toString());
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid message format',
                    received: message.toString()
                }));
            }
        });

        // 处理连接关闭
        ws.on('close', function close() {
            if (!ws.user) return;

            console.log('Client disconnected:', ws.user.userId);
            ws.user.isOnline = false;
            ws.user.lastActive = new Date();
            ws.user.status = 'offline';

            // 通知配对用户
            if (ws.user.partnerId) {
                for (const client of wss.clients) {
                    if (client.user && client.user.userId === ws.user.partnerId) {
                        client.send(JSON.stringify({
                            type: 'partner:offline',
                            timestamp: new Date().toISOString()
                        }));
                        break;
                    }
                }
            }
        });

    } catch (error) {
        console.error('WebSocket authentication failed:', error);
        ws.close(1008, 'Authentication failed');
    }
});

// 启动服务器
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 