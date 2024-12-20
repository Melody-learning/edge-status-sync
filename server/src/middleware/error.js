// 错误处理中间件
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // 根据错误类型返回不同的状态码
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            message: err.message
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid Token',
            message: err.message
        });
    }

    // 默认错误响应
    res.status(err.status || 500).json({
        error: err.name || 'Internal Server Error',
        message: err.message || 'Something went wrong'
    });
};

module.exports = errorHandler; 