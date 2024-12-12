// 活动类型枚举
export const ActivityType = {
    TAB_OPEN: 'TAB_OPEN',
    TAB_CLOSE: 'TAB_CLOSE',
    BOOKMARK_ADD: 'BOOKMARK_ADD',
    DOWNLOAD_START: 'DOWNLOAD_START',
    DOWNLOAD_COMPLETE: 'DOWNLOAD_COMPLETE',
    USER_OFFLINE: 'USER_OFFLINE',
    USER_ONLINE: 'USER_ONLINE'
};

// 不需要记录的URL模式
const IGNORED_URL_PATTERNS = [
    /^chrome:\/\//i,                    // Chrome内置页面
    /^edge:\/\//i,                      // Edge内置页面
    /^about:/i,                         // 浏览器内置页面
    /^chrome-extension:\/\//i,          // 扩展页面
    /^moz-extension:\/\//i,             // Firefox扩展页面
    /^file:\/\//i,                      // 本地文件
    /^data:/i,                          // Data URLs
    /^view-source:/i,                   // 查看源码
    /^newtab/i,                         // 新标签页
    /google\.[^/]+\/search/i,           // Google搜索
    /bing\.com\/search/i,               // Bing搜索
    /search\.yahoo\.com/i,              // Yahoo搜索
    /baidu\.com\/s/i,                   // 百度搜索
    /sogou\.com\/web/i,                 // 搜狗搜索
    /so\.com\/s/i,                      // 360搜索
    /duckduckgo\.com/i                  // DuckDuckGo搜索
];

// 不需要记录的标题关键词
const IGNORED_TITLES = [
    '新标签页',
    'New Tab',
    '空白页',
    'Blank Page',
    '搜索',
    'Search',
    '搜索结果',
    'Search Results'
];

// 标题处理规则
const TITLE_PATTERNS = [
    // 通用分隔符规则
    {
        pattern: /^(.+?)(?:\s*[-|_]\s*.+)/,
        description: "通用分隔符"
    },
    // 括号规则
    {
        pattern: /^(.+?)\s*[（(].+?[)）]/,
        description: "括号描述"
    },
    // 网站特定规则
    {
        pattern: /^(.+?)(?:\s*[-_]\s*腾讯.+)/,
        site: "v.qq.com",
        description: "腾讯视频"
    },
    {
        pattern: /^(.+?)(?:\s*_哔哩哔哩.+)/,
        site: "bilibili.com",
        description: "B站"
    },
    {
        pattern: /^(.+?)(?:\s*[-_]\s*爱奇艺.+)/,
        site: "iqiyi.com",
        description: "爱奇艺"
    },
    {
        pattern: /^(.+?)(?:\s*[-_]\s*优酷.+)/,
        site: "youku.com",
        description: "优酷"
    },
    // NBA赛事特定规则
    {
        pattern: /^(.+?(?:vs|VS).+?)[-_|].+/,
        keywords: ["NBA", "CBA", "比赛"],
        description: "赛事"
    }
];

// 标题长度限制
const TITLE_LENGTH_LIMIT = {
    CHARS: 16,    // 字符数限制
    WORDS: 8      // 汉字数限制
};

// 截取限定长度的标题
function truncateTitle(title) {
    if (!title) return '';
    
    // 计算字符长度（汉字算2个字符）
    let charCount = 0;
    let wordCount = 0;
    let truncatedTitle = '';
    
    for (let i = 0; i < title.length; i++) {
        const char = title[i];
        // 检查是否是汉字（Unicode范围）
        const isChineseChar = /[\u4e00-\u9fa5]/.test(char);
        
        if (isChineseChar) {
            charCount += 2;
            wordCount += 1;
        } else {
            charCount += 1;
            // 非汉字按1/2个汉字计算
            wordCount += 0.5;
        }
        
        // 检查是否超出限制
        if (charCount > TITLE_LENGTH_LIMIT.CHARS || wordCount > TITLE_LENGTH_LIMIT.WORDS) {
            break;
        }
        
        truncatedTitle += char;
    }
    
    // 如果标题被截断，添加省略号
    if (truncatedTitle.length < title.length) {
        truncatedTitle += '...';
    }
    
    return truncatedTitle;
}

// 从URL中提取域名
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch (e) {
        return null;
    }
}

// 检查是否是主页面
function isHomePage(url) {
    try {
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        // 主页面通常是以下情况：
        // 1. 路径为空或只有 "/"
        // 2. 路径只有语言标识如 /en, /zh
        return path === "/" || 
               path === "" || 
               /^\/[a-z]{2}(-[a-z]{2})?$/i.test(path);
    } catch (e) {
        return false;
    }
}

// 智能提取主标题
function extractMainTitle(title, url) {
    if (!title) return '未命名页面';
    
    const domain = url ? extractDomain(url) : null;
    let mainTitle = '';
    
    // 1. 尝试网站特定规则
    if (domain) {
        const sitePattern = TITLE_PATTERNS.find(p => p.site && domain.includes(p.site));
        if (sitePattern) {
            const match = title.match(sitePattern.pattern);
            if (match && match[1]) {
                console.log(`应用网站规则[${sitePattern.description}]: ${match[1]}`);
                mainTitle = match[1].trim();
                return truncateTitle(mainTitle);
            }
        }
    }
    
    // 2. 尝试关键词规则
    const keywordPattern = TITLE_PATTERNS.find(p => {
        if (!p.keywords) return false;
        return p.keywords.some(keyword => title.includes(keyword));
    });
    
    if (keywordPattern) {
        const match = title.match(keywordPattern.pattern);
        if (match && match[1]) {
            console.log(`应用关键词规则[${keywordPattern.description}]: ${match[1]}`);
            mainTitle = match[1].trim();
            return truncateTitle(mainTitle);
        }
    }
    
    // 3. 尝试通用规则
    for (const pattern of TITLE_PATTERNS) {
        if (!pattern.site && !pattern.keywords) {
            const match = title.match(pattern.pattern);
            if (match && match[1]) {
                console.log(`应用通用规则[${pattern.description}]: ${match[1]}`);
                mainTitle = match[1].trim();
                return truncateTitle(mainTitle);
            }
        }
    }
    
    return truncateTitle(title.trim());
}

// 检查URL是否需要被忽略
function shouldIgnoreUrl(url) {
    if (!url) return true;
    return IGNORED_URL_PATTERNS.some(pattern => pattern.test(url));
}

// 检查标题是否需要被忽略
function shouldIgnoreTitle(title) {
    if (!title) return true;
    return IGNORED_TITLES.some(ignored => 
        title.toLowerCase().includes(ignored.toLowerCase())
    );
}

// 活动记录服务
class ActivityService {
    constructor() {
        this.storage = chrome.storage.local;
        this.pendingActivities = new Map();
        this.domainTitles = new Map();
        this.ACTIVITY_THRESHOLD = 15000;
        this.initializeFromStorage();
    }

    // 从存储中初始化域名标题信息
    async initializeFromStorage() {
        try {
            const data = await this.storage.get('domainTitles');
            if (data.domainTitles) {
                // 将存储的对象转换回 Map
                const storedData = data.domainTitles;
                for (const [domain, info] of Object.entries(storedData)) {
                    this.domainTitles.set(domain, {
                        ...info,
                        subPages: new Set(info.subPages)
                    });
                }
                console.log('已从存储加载域名标题信息');
            }
        } catch (error) {
            console.error('加载域名标题信息失败:', error);
        }
    }

    // 保存域名标题信息到存储
    async saveDomainTitles() {
        try {
            // 将 Map 转换为可存储的对象
            const storedData = {};
            for (const [domain, info] of this.domainTitles.entries()) {
                storedData[domain] = {
                    ...info,
                    subPages: Array.from(info.subPages)
                };
            }
            await this.storage.set({ domainTitles: storedData });
            console.log('域名标题信息已保存');
        } catch (error) {
            console.error('保存域名标题信息失败:', error);
        }
    }

    // 查找标题的共同前缀
    findCommonPrefix(titles) {
        if (!titles.length) return null;
        if (titles.length === 1) return titles[0];

        // 移除常见的后缀词
        const cleanTitles = titles.map(title => 
            title.replace(/[-_|].*$/, '').trim()
        );

        // 找出最短的标题长度
        const minLength = Math.min(...cleanTitles.map(t => t.length));
        
        // 查找共同前缀
        let prefixLength = 0;
        for (let i = 0; i < minLength; i++) {
            const char = cleanTitles[0][i];
            if (cleanTitles.every(title => title[i] === char)) {
                prefixLength = i + 1;
            } else {
                break;
            }
        }

        const prefix = cleanTitles[0].substring(0, prefixLength).trim();
        return prefix.length > 1 ? prefix : null;
    }

    // 智能更新域名标题
    async updateDomainTitle(url, title) {
        const domain = extractDomain(url);
        if (!domain) return;

        const isHome = isHomePage(url);
        const mainTitle = extractMainTitle(title, url);
        
        if (!this.domainTitles.has(domain)) {
            // 首次访问该域名
            const domainInfo = {
                mainTitle: isHome ? mainTitle : null,
                lastUpdate: Date.now(),
                subPages: new Set([mainTitle])
            };
            this.domainTitles.set(domain, domainInfo);
            console.log(`新增域名标题信息: ${domain} -> ${mainTitle}`);
        } else {
            const domainInfo = this.domainTitles.get(domain);
            if (isHome) {
                // 更新主页标题
                domainInfo.mainTitle = mainTitle;
                domainInfo.lastUpdate = Date.now();
                console.log(`更新主页标题: ${domain} -> ${mainTitle}`);
            }
            domainInfo.subPages.add(mainTitle);
        }

        // 如果没有主页标题但有子页面，尝试推断主站名称
        const domainInfo = this.domainTitles.get(domain);
        if (!domainInfo.mainTitle && domainInfo.subPages.size > 1) {
            const commonPrefix = this.findCommonPrefix(
                Array.from(domainInfo.subPages)
            );
            if (commonPrefix) {
                domainInfo.mainTitle = commonPrefix;
                console.log(`推断主站名称: ${domain} -> ${commonPrefix}`);
            }
        }

        await this.saveDomainTitles();
    }

    // 获取完整的活动标题
    getFullTitle(url, title) {
        const domain = extractDomain(url);
        if (!domain) return truncateTitle(title);

        const domainInfo = this.domainTitles.get(domain);
        if (!domainInfo || !domainInfo.mainTitle) return truncateTitle(title);

        const mainTitle = extractMainTitle(title, url);
        if (!isHomePage(url) && mainTitle !== domainInfo.mainTitle) {
            // 确保主站名称也遵循长度限制
            const truncatedMainTitle = truncateTitle(mainTitle);
            const truncatedSiteName = truncateTitle(domainInfo.mainTitle);
            return `${truncatedMainTitle}[${truncatedSiteName}]`;
        }
        return truncateTitle(mainTitle);
    }

    // 初始化监听器
    async initialize() {
        // 标签页监听
        chrome.tabs.onCreated.addListener((tab) => this.handleTabCreated(tab));
        chrome.tabs.onRemoved.addListener((tabId, removeInfo) => this.handleTabRemoved(tabId, removeInfo));
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => this.handleTabUpdated(tabId, changeInfo, tab));

        // 书签监听
        chrome.bookmarks.onCreated.addListener((id, bookmark) => this.handleBookmarkCreated(id, bookmark));

        // 下载监听
        chrome.downloads.onCreated.addListener((downloadItem) => this.handleDownloadCreated(downloadItem));
        chrome.downloads.onChanged.addListener((downloadDelta) => this.handleDownloadChanged(downloadDelta));

        // 用户状态监听
        chrome.idle.onStateChanged.addListener((newState) => this.handleIdleStateChanged(newState));
    }

    // 处理标签页创建
    async handleTabCreated(tab) {
        if (!tab.url || shouldIgnoreUrl(tab.url) || shouldIgnoreTitle(tab.title)) {
            console.log('忽略不重要的标签页:', tab.url || tab.title);
            return;
        }

        // 更新域名标题信息
        await this.updateDomainTitle(tab.url, tab.title);

        const pendingActivity = {
            type: ActivityType.TAB_OPEN,
            details: {
                title: this.getFullTitle(tab.url, tab.title),
                url: tab.url,
                domain: extractDomain(tab.url)
            },
            timestamp: Date.now(),
            tabId: tab.id,
            id: crypto.randomUUID(),
            recordTime: Date.now() + this.ACTIVITY_THRESHOLD
        };

        this.pendingActivities.set(tab.id, pendingActivity);

        setTimeout(() => {
            if (this.pendingActivities.has(tab.id)) {
                const activity = this.pendingActivities.get(tab.id);
                if (!shouldIgnoreUrl(activity.details.url) && !shouldIgnoreTitle(activity.details.title)) {
                    this.recordActivity(activity);
                }
                this.pendingActivities.delete(tab.id);
            }
        }, this.ACTIVITY_THRESHOLD);
    }

    // 处理标签页移除
    async handleTabRemoved(tabId, removeInfo) {
        // 如果存在pending活动，则取消它
        if (this.pendingActivities.has(tabId)) {
            this.pendingActivities.delete(tabId);
        }
    }

    // 处理标签页更新
    async handleTabUpdated(tabId, changeInfo, tab) {
        if (changeInfo.status === 'complete') {
            const domain = extractDomain(tab.url);
            if (!domain) return;

            // 更新域名标题信息
            await this.updateDomainTitle(tab.url, tab.title);

            if (this.pendingActivities.has(tabId)) {
                const activity = this.pendingActivities.get(tabId);
                activity.details.title = this.getFullTitle(tab.url, tab.title);
                activity.details.url = tab.url;
                activity.details.domain = domain;

                if (shouldIgnoreUrl(activity.details.url) || shouldIgnoreTitle(activity.details.title)) {
                    console.log('更新后忽略标签页:', activity.details.url || activity.details.title);
                    this.pendingActivities.delete(tabId);
                }
            } else if (tab.url && !shouldIgnoreUrl(tab.url) && !shouldIgnoreTitle(tab.title)) {
                const activity = {
                    type: ActivityType.TAB_OPEN,
                    details: {
                        title: this.getFullTitle(tab.url, tab.title),
                        url: tab.url,
                        domain: domain
                    },
                    timestamp: Date.now(),
                    tabId: tab.id,
                    id: crypto.randomUUID(),
                    recordTime: Date.now() + this.ACTIVITY_THRESHOLD
                };

                this.pendingActivities.set(tabId, activity);
                
                setTimeout(() => {
                    if (this.pendingActivities.has(tabId)) {
                        const currentActivity = this.pendingActivities.get(tabId);
                        if (Date.now() >= currentActivity.recordTime) {
                            this.recordActivity(currentActivity);
                        }
                        this.pendingActivities.delete(tabId);
                    }
                }, this.ACTIVITY_THRESHOLD);
            }
        }
    }

    // 处理书签创建
    async handleBookmarkCreated(id, bookmark) {
        if (!bookmark.url) return; // 如果是文件夹则跳过

        const activity = {
            type: ActivityType.BOOKMARK_ADD,
            details: {
                title: bookmark.title,
                url: bookmark.url
            },
            timestamp: Date.now()
        };

        await this.recordActivity(activity);
    }

    // 处理下载开始
    async handleDownloadCreated(downloadItem) {
        const activity = {
            type: ActivityType.DOWNLOAD_START,
            details: {
                filename: downloadItem.filename.split('\\').pop().split('/').pop(),
                url: downloadItem.url
            },
            timestamp: Date.now(),
            downloadId: downloadItem.id
        };

        await this.recordActivity(activity);
    }

    // 处理下载状态变化
    async handleDownloadChanged(downloadDelta) {
        if (downloadDelta.state && downloadDelta.state.current === 'complete') {
            const activity = {
                type: ActivityType.DOWNLOAD_COMPLETE,
                details: {
                    downloadId: downloadDelta.id
                },
                timestamp: Date.now()
            };

            await this.recordActivity(activity);
        }
    }

    // 处理用户状态变化
    async handleIdleStateChanged(newState) {
        if (newState === 'locked' || newState === 'idle') {
            const activity = {
                type: ActivityType.USER_OFFLINE,
                timestamp: Date.now()
            };
            await this.recordActivity(activity);
        } else if (newState === 'active') {
            const activity = {
                type: ActivityType.USER_ONLINE,
                timestamp: Date.now()
            };
            await this.recordActivity(activity);
        }
    }

    // 记录活动
    async recordActivity(activity) {
        try {
            const storage = await this.storage.get(['currentUser', 'activities']);
            const currentUser = storage.currentUser;
            
            if (!currentUser) {
                console.log('未登录状态，不记录活动');
                return;
            }

            const record = {
                ...activity,
                userId: currentUser.userId,
                userNickname: currentUser.text,
                synced: false,
                id: activity.id
            };

            const activities = storage.activities || [];
            const domain = activity.details.domain;

            // 如果是页面浏览活动，检查是否需要更新同域名的旧记录
            if (activity.type === ActivityType.TAB_OPEN && domain) {
                // 找到同域名的最后一条记录的索引
                const lastDomainActivityIndex = activities.findIndex(a => 
                    a.type === ActivityType.TAB_OPEN && 
                    a.details?.domain === domain &&
                    a.userId === currentUser.userId
                );

                if (lastDomainActivityIndex !== -1) {
                    // 更新同域名的旧记录
                    activities[lastDomainActivityIndex] = record;
                    console.log('更新同域名活动:', domain);
                } else {
                    // 添加新记录
                    activities.push(record);
                    console.log('添加新活动:', record);
                }
            } else {
                // 非页面浏览活动直接添加
                activities.push(record);
            }

            await this.storage.set({ activities });
            this.notifyActivityUpdate(record);

        } catch (error) {
            console.error('记录活动失败:', error);
        }
    }

    // 通知活动更新
    notifyActivityUpdate(activity) {
        // 发送消息给popup
        chrome.runtime.sendMessage({
            type: 'ACTIVITY_UPDATE',
            activity
        });
    }

    // 获取活动记录
    async getActivities(limit = 50) {
        const data = await this.storage.get('activities');
        const activities = data.activities || [];
        
        // 去重并按时间排序
        const uniqueActivities = Array.from(new Map(
            activities.map(activity => [activity.id || `${activity.timestamp}_${activity.userId}_${activity.type}`, activity])
        ).values());
        
        return uniqueActivities
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    // 清除活动记录
    async clearActivities() {
        await this.storage.remove('activities');
    }
}

// 导出服务实例
export const activityService = new ActivityService(); 