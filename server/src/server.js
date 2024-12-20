const express = require('express');
const http = require('http');
const cors = require('cors');
const config = require('./config/default');
const wsService = require('./services/wsService');

// 创建 Express 应用
const app = express();

// 配置中间件
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 基本的健康检查路由
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 创建 HTTP 服务器
const server = http.createServer(app);

// 初始化 WebSocket 服务
wsService.initialize(server);

// 启动服务器
server.listen(config.server.wsPort, () => {
    console.log(`WebSocket server is running on port ${config.server.wsPort}`);
});

// 导出服务器实例（用于测试）
module.exports = server; 