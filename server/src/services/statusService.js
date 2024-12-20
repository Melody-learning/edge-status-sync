const config = require('../config/default');
const socketService = require('./socketService');
const userService = require('./userService');

class StatusService {
    constructor() {
        this.statusChecks = new Map();
    }

    // 初始化状态检查
    initialize() {
        // 定期检查所有用户状态
        setInterval(() => {
            this._checkAllUsersStatus();
        }, config.status.checkInterval);
    }

    // 更新用户状态
    async updateStatus(userId, status) {
        const user = userService.getUser(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // 更新状态
        user.status = status;
        user.lastActive = new Date();

        // 通知配对用户
        socketService.broadcastToPair(userId, 'partner:status', { status });

        return user;
    }

    // 获取用户状态
    getStatus(userId) {
        const user = userService.getUser(userId);
        if (!user) {
            throw new Error('User not found');
        }

        return {
            isOnline: user.isOnline,
            status: user.status,
            lastActive: user.lastActive
        };
    }

    // 获取配对用户状态
    getPairStatus(userId) {
        const partner = userService.getPair(userId);
        if (!partner) {
            return null;
        }

        return {
            isOnline: partner.isOnline,
            status: partner.status,
            lastActive: partner.lastActive
        };
    }

    // 检查所有用户状态
    _checkAllUsersStatus() {
        const now = Date.now();
        
        // 遍历所有在线用户
        for (const [userId, user] of userService.users) {
            if (user.isOnline && user.lastActive) {
                const timeSinceLastActive = now - user.lastActive.getTime();
                
                // 如果超过离线超时时间，标记为离线
                if (timeSinceLastActive > config.status.offlineTimeout) {
                    this._markUserOffline(userId);
                }
            }
        }
    }

    // 标记用户离线
    _markUserOffline(userId) {
        const user = userService.getUser(userId);
        if (user && user.isOnline) {
            user.isOnline = false;
            user.lastActive = new Date();

            // 通知配对用户
            socketService.broadcastToPair(userId, 'partner:offline');
        }
    }
}

module.exports = new StatusService(); 