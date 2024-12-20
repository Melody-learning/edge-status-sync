const jwt = require('jsonwebtoken');
const config = require('../config/default');

// 用户状态常量
const USER_STATUS = {
    OFFLINE: 'offline',
    ONLINE: 'online'
};

class UserService {
    constructor() {
        // 用于存储用户数据的内存映射
        this.users = new Map();
        // 用于存储用户配对关系的内存映射
        this.pairs = new Map();
    }

    // 验证用户口令
    async verifyToken(token) {
        const [text, number] = token.split('@');
        
        // 验证口令格式
        if (!text || !number) {
            throw new Error('Invalid token format');
        }

        // 生成用户ID（使用口令的哈希作为ID）
        const userId = await this._hashToken(token);
        
        // 检查用户是否已存在
        let user = this.users.get(userId);
        
        if (!user) {
            // 创建新用户，设置默认状态
            user = {
                userId,
                token: {
                    text,
                    number
                },
                isOnline: false,
                lastActive: null,
                partnerId: null,
                status: USER_STATUS.OFFLINE  // 设置默认状态为离线
            };
            this.users.set(userId, user);
        }

        return user;
    }

    // 生成 JWT token
    generateAuthToken(user) {
        const token = jwt.sign(
            { 
                userId: user.userId,
                token: user.token 
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );
        return token;
    }

    // 处理用户配对
    async pairUsers(userId, partnerToken) {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // 验证伙伴的口令
        const partner = await this.verifyToken(partnerToken);
        
        // 验证配对条件
        if (userId === partner.userId) {
            throw new Error('Cannot pair with yourself');
        }
        
        if (user.partnerId) {
            throw new Error('You already have a partner');
        }
        
        if (partner.partnerId) {
            throw new Error('Partner already paired with someone else');
        }

        // 建立配对关系
        user.partnerId = partner.userId;
        partner.partnerId = user.userId;

        // 保存配对关系
        const pairId = this._generatePairId(userId, partner.userId);
        this.pairs.set(pairId, {
            user1: userId,
            user2: partner.userId,
            createdAt: new Date()
        });

        return { user, partner };
    }

    // 解除配对
    async unpairUsers(userId) {
        const user = this.users.get(userId);
        if (!user || !user.partnerId) {
            throw new Error('No active pairing found');
        }

        const partner = this.users.get(user.partnerId);
        if (partner) {
            partner.partnerId = null;
        }

        user.partnerId = null;

        // 删除配对记录
        const pairId = this._generatePairId(userId, partner.userId);
        this.pairs.delete(pairId);

        return { user, partner };
    }

    // 获取用户信息
    getUser(userId) {
        return this.users.get(userId);
    }

    // 获取配对信息
    getPair(userId) {
        const user = this.users.get(userId);
        if (!user || !user.partnerId) {
            return null;
        }
        return this.users.get(user.partnerId);
    }

    // 生成配对ID
    _generatePairId(userId1, userId2) {
        return [userId1, userId2].sort().join(':');
    }

    // 哈希口令
    async _hashToken(token) {
        const encoder = new TextEncoder();
        const data = encoder.encode(token);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
}

module.exports = new UserService(); 