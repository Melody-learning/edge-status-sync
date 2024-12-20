const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const auth = require('../middleware/auth');

// 用户验证（登录/注册）
router.post('/verify', async (req, res) => {
    try {
        const { token } = req.body;
        
        // 验证用户口令
        const user = await userService.verifyToken(token);
        
        // 生成 JWT
        const authToken = userService.generateAuthToken(user);
        
        res.json({
            user,
            token: authToken
        });
    } catch (error) {
        res.status(400).json({
            error: 'Verification failed',
            message: error.message
        });
    }
});

// 配对用户
router.post('/pair', auth, async (req, res) => {
    try {
        const { partnerToken } = req.body;
        const userId = req.user.userId;
        
        const result = await userService.pairUsers(userId, partnerToken);
        
        res.json(result);
    } catch (error) {
        res.status(400).json({
            error: 'Pairing failed',
            message: error.message
        });
    }
});

// 解除配对
router.post('/unpair', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        
        const result = await userService.unpairUsers(userId);
        
        res.json(result);
    } catch (error) {
        res.status(400).json({
            error: 'Unpairing failed',
            message: error.message
        });
    }
});

// 获取用户信息
router.get('/me', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = userService.getUser(userId);
        
        if (!user) {
            throw new Error('User not found');
        }
        
        res.json(user);
    } catch (error) {
        res.status(404).json({
            error: 'User not found',
            message: error.message
        });
    }
});

module.exports = router; 