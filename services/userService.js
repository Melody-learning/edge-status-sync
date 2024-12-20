// 用于生成用户ID
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 用于加密口令
async function hashToken(token) {
    const msgBuffer = new TextEncoder().encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 用户服务类
class UserService {
    constructor() {
        this.storage = chrome.storage.local;
    }

    // 检查口令是否已存在
    async isTokenExists(token) {
        const hashedToken = await hashToken(token);
        const result = await this.storage.get('tokens');
        return !!result.tokens?.[hashedToken];
    }

    // 创建新用户
    async createUser(token) {
        // 检查口令是否已存在
        if (await this.isTokenExists(token)) {
            throw new Error('口令已被使用');
        }

        const userId = generateUserId();
        const hashedToken = await hashToken(token);
        const timestamp = Date.now();
        
        // 解析口令
        const [text, number] = token.split('@');

        // 准备用户数据
        const userData = {
            users: {
                [userId]: {
                    token: hashedToken,
                    text,
                    number,
                    createdAt: timestamp,
                    partnerId: null,
                    pairStatus: 'unpaired'
                }
            },
            tokens: {
                [hashedToken]: userId
            }
        };

        // 获取现有数据并合并
        const existingData = await this.storage.get(['users', 'tokens']);
        const newData = {
            users: { ...(existingData.users || {}), ...userData.users },
            tokens: { ...(existingData.tokens || {}), ...userData.tokens }
        };

        // 保存数据
        await this.storage.set(newData);
        return userId;
    }

    // 验证用户登录
    async verifyUser(token) {
        const hashedToken = await hashToken(token);
        const data = await this.storage.get(['tokens', 'users']);
        
        const userId = data.tokens?.[hashedToken];
        if (!userId || !data.users?.[userId]) {
            throw new Error('口令错误');
        }

        // 解析口令
        const [text, number] = token.split('@');
        
        // 更新 currentUser
        const currentUser = {
            userId,
            text,
            number,
            ...data.users[userId]
        };
        
        // 保存 currentUser
        await this.storage.set({ currentUser });

        return {
            userId,
            userData: currentUser
        };
    }

    // ���起配对请求
    async initiatePairing(userId, partnerToken) {
        const data = await this.storage.get(['users', 'tokens', 'currentUser']);
        const hashedPartnerToken = await hashToken(partnerToken);
        const partnerUserId = data.tokens?.[hashedPartnerToken];

        // 验证
        if (!partnerUserId) {
            throw new Error('对方口令不存在');
        }
        if (partnerUserId === userId) {
            throw new Error('不能与自己配对');
        }
        if (data.users[userId].partnerId) {
            throw new Error('你已经有配对伙伴了');
        }
        if (data.users[partnerUserId].partnerId) {
            throw new Error('对方已经有配对伙伴了');
        }

        // 更新用户数据
        const updatedUsers = {
            ...data.users,
            [userId]: {
                ...data.users[userId],
                partnerId: partnerUserId,
                pairStatus: 'paired'
            },
            [partnerUserId]: {
                ...data.users[partnerUserId],
                partnerId: userId,
                pairStatus: 'paired'
            }
        };

        // 同时更新 currentUser
        const updatedCurrentUser = {
            ...data.currentUser,
            partnerId: partnerUserId,
            pairStatus: 'paired'
        };

        // 一起保存更新
        await this.storage.set({ 
            users: updatedUsers,
            currentUser: updatedCurrentUser
        });

        return {
            userId,
            partnerId: partnerUserId,
            pairStatus: 'paired'
        };
    }

    // 确认配对
    async confirmPairing(userId, partnerUserId) {
        const data = await this.storage.get('users');
        
        // 验证配对状态
        const user = data.users[userId];
        const partner = data.users[partnerUserId];
        
        if (user.pendingPartnerId !== partnerUserId || 
            partner.pendingPartnerId !== userId) {
            throw new Error('配对请求不匹配');
        }

        // 更新配对状态
        const updatedUsers = {
            ...data.users,
            [userId]: {
                ...user,
                partnerId: partnerUserId,
                pairStatus: 'paired',
                pendingPartnerId: null
            },
            [partnerUserId]: {
                ...partner,
                partnerId: userId,
                pairStatus: 'paired',
                pendingPartnerId: null
            }
        };

        await this.storage.set({ users: updatedUsers });
        return true;
    }

    // 解除配对
    async unpair(userId) {
        const data = await this.storage.get('users');
        const user = data.users[userId];
        
        if (!user.partnerId) {
            throw new Error('当前没有配对伙伴');
        }

        const partnerUserId = user.partnerId;
        const updatedUsers = {
            ...data.users,
            [userId]: {
                ...user,
                partnerId: null,
                pairStatus: 'unpaired'
            },
            [partnerUserId]: {
                ...data.users[partnerUserId],
                partnerId: null,
                pairStatus: 'unpaired'
            }
        };

        await this.storage.set({ users: updatedUsers });
        return true;
    }
}

// 导出服务实例
export const userService = new UserService(); 