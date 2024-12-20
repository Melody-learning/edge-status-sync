const express = require('express');
const router = express.Router();
const statusService = require('../services/statusService');
const auth = require('../middleware/auth');

// 获取用户状态
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const status = statusService.getStatus(userId);
        
        res.json(status);
    } catch (error) {
        res.status(400).json({
            error: 'Failed to get status',
            message: error.message
        });
    }
});

// 获取配对用户状态
router.get('/partner', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const status = statusService.getPairStatus(userId);
        
        if (!status) {
            return res.status(404).json({
                error: 'Partner not found',
                message: 'No paired user found'
            });
        }
        
        res.json(status);
    } catch (error) {
        res.status(400).json({
            error: 'Failed to get partner status',
            message: error.message
        });
    }
});

// 更新用户状态
router.put('/', auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { status } = req.body;
        
        const result = await statusService.updateStatus(userId, status);
        
        res.json(result);
    } catch (error) {
        res.status(400).json({
            error: 'Failed to update status',
            message: error.message
        });
    }
});

module.exports = router; 