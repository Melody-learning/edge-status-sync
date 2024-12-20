class SocketService {
    constructor() {
        this.socket = null;
        this.serverUrl = 'ws://localhost:3001';
        this.eventHandlers = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
    }

    // 连接到 WebSocket 服务器
    async connect(token) {
        if (this.socket) {
            this.socket.close();
        }

        try {
            // 创建 WebSocket 连接
            this.socket = new WebSocket(`${this.serverUrl}?token=${token}`);

            // 设置基本事件监听
            this.socket.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                this._notifyHandlers('connect');
            };

            this.socket.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason);
                this._notifyHandlers('disconnect');
                this._handleReconnect(token);
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this._notifyHandlers('error', error);
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('Received message:', data);

                    switch (data.type) {
                        case 'welcome':
                            this._notifyHandlers('welcome', data);
                            break;
                        case 'partner:online':
                            this._notifyHandlers('partner:online', data);
                            break;
                        case 'partner:offline':
                            this._notifyHandlers('partner:offline', data);
                            break;
                        case 'partner:status':
                            this._notifyHandlers('partner:status', data);
                            break;
                        case 'status:updated':
                            this._notifyHandlers('status:updated', data);
                            break;
                        case 'error':
                            this._notifyHandlers('error', data);
                            break;
                    }
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            };
        } catch (error) {
            console.error('Connection error:', error);
            this._notifyHandlers('error', error);
        }
    }

    // 重连逻辑
    _handleReconnect(token) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log(`Reconnecting... Attempt ${this.reconnectAttempts + 1}`);
            setTimeout(() => {
                this.reconnectAttempts++;
                this.connect(token);
            }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
        } else {
            console.log('Max reconnection attempts reached');
            this._notifyHandlers('reconnect_failed');
        }
    }

    // 发送状态更新
    updateStatus(status) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.error('WebSocket is not connected');
            return;
        }

        const message = {
            type: 'status:update',
            status: status
        };

        this.socket.send(JSON.stringify(message));
    }

    // 断开连接
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    // 注册事件处理器
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    // 移除事件处理器
    off(event, handler) {
        if (!this.eventHandlers.has(event)) return;
        const handlers = this.eventHandlers.get(event);
        const index = handlers.indexOf(handler);
        if (index !== -1) {
            handlers.splice(index, 1);
        }
    }

    // 通知所有事件处理器
    _notifyHandlers(event, data) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in ${event} handler:`, error);
                }
            });
        }
    }

    // 检查连接状态
    isConnected() {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    }
}

export const socketService = new SocketService(); 