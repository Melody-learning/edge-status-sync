// 后台服务工作者
chrome.runtime.onInstalled.addListener(() => {
    console.log('Edge Status Sync 插件已安装');
});

// 监听标签页更新
chrome.tabs.onActivated.addListener((activeInfo) => {
    // TODO: 实现状态同步逻辑
});
