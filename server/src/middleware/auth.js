const jwt = require('jsonwebtoken');
const config = require('../config/default');

const auth = async (req, res, next) => {
    try {
        // 从请求头获取 token
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            throw new Error('No token provided');
        }

        // 验证 token
        const decoded = jwt.verify(token, config.jwt.secret);
        
        // 将解码后的用户信息添加到请求对象
        req.user = decoded;
        
        next();
    } catch (error) {
        res.status(401).json({ 
            error: 'Authentication failed',
            message: error.message 
        });
    }
};

module.exports = auth; 