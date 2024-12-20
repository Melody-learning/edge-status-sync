const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 导入配置
const config = require('./src/config/default');

// 导入服务
const socketService = require('./src/services/socketService');
const statusService = require('./src/services/statusService');

// 导入中间件
const { socketAuth, socketStatus, socketErrorHandler } = require('./src/middleware/socket');

// 导入路由
const userRoutes = require('./src/routes/userRoutes');
const statusRoutes = require('./src/routes/statusRoutes');

// 导入错误处理中间件
const errorHandler = require('./src/middleware/error');

// 创建 Express 应用
const app = express();
const server = http.createServer(app);

// 设置 CORS
const corsOptions = {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true
};

// CORS 中间件应该最先注册
app.use(cors(corsOptions));

// 设置 Socket.IO
console.log('[Server] Creating Socket.IO server');
const io = new Server(server, {
    cors: corsOptions,
    allowEIO3: true,
    path: '/socket.io/',
    transports: ['websocket', 'polling'],
    connectTimeout: 45000,
    pingTimeout: 30000,
    pingInterval: 25000,
    upgradeTimeout: 10000,
    maxHttpBufferSize: 1e8
});

// 调试所有传入的 upgrade 请求
server.on('upgrade', (request, socket, head) => {
    console.log('[Server] Upgrade request received:', {
        url: request.url,
        headers: request.headers
    });
});

// Engine 级别的事件监听
io.engine.on('initial_headers', (headers, req) => {
    console.log('[Engine] Initial headers:', headers);
});

io.engine.on('headers', (headers, req) => {
    console.log('[Engine] Headers:', headers);
});

io.engine.on('connection', (socket) => {
    console.log('[Engine] Raw connection received');
});

// Socket.IO 中间件链
// 1. 错误处理中间件（最先注册，以捕获所有错误）
io.use(socketErrorHandler);

// 2. 认证中间件
io.use(socketAuth);

// 3. 状态中间件
io.use(socketStatus);

// 连接事件监听
io.on('connection', (socket) => {
    console.log('[Socket.IO] New connection established');
    console.log('[Socket.IO] Socket ID:', socket.id);
    console.log('[Socket.IO] User:', socket.user);
    
    // 将连接处理委托给 socketService
    socketService.handleConnection(socket);
});

// 错误事件监听
io.on('connect_error', (error) => {
    console.error('[Socket.IO] Connection error:', error);
});

io.engine.on('connection_error', (error) => {
    console.error('[Engine] Connection error:', error);
});

// Express 中间件
app.use(express.json());

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// 路由
app.use('/api/users', userRoutes);
app.use('/api/status', statusRoutes);

// 基础路由
app.get('/', (req, res) => {
    res.json({ 
        message: 'Edge Status Sync Server is running',
        version: process.env.npm_package_version,
        environment: process.env.NODE_ENV
    });
});

// 错误处理
app.use(errorHandler);

// 初始化服务
console.log('[Server] Initializing services');
socketService.initialize(io);
statusService.initialize();

// 启动服务器
const PORT = process.env.PORT || config.server.port;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Client Origin: ${process.env.CLIENT_ORIGIN || '*'}`);
}); 