import { activityService } from '../services/activityService.js';

// 初始化活动监听服务
activityService.initialize().then(() => {
    console.log('活动监听服务已启动');
}).catch(error => {
    console.error('活动监听服务启动失败:', error);
});

// 后台服务工作者
chrome.runtime.onInstalled.addListener(() => {
    console.log('Edge Status Sync 插件已安装');
});

// 监听标签页更新
chrome.tabs.onActivated.addListener((activeInfo) => {
    // TODO: 实现状态同步逻辑
});
