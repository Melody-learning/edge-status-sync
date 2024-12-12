// 导入用户服务
import { userService } from '../services/userService.js';
import { activityService } from '../services/activityService.js';

// 页面元素
const pages = {
    joinUs: document.getElementById('joinUsPage'),
    login: document.getElementById('loginPage'),
    pairing: document.getElementById('pairingPage'),
    main: document.getElementById('mainPage')
};

// 检查页面元素是否存在
if (!pages.joinUs || !pages.login || !pages.pairing || !pages.main) {
    console.error('某些页面元素未能正确获取。');
}

// 输入元素
const inputs = {
    joinUs: {
        text: document.getElementById('joinUsText'),
        number: document.getElementById('joinUsNumber'),
        textError: document.getElementById('joinUsTextError'),
        numberError: document.getElementById('joinUsNumberError')
    },
    login: {
        text: document.getElementById('loginText'),
        number: document.getElementById('loginNumber'),
        textError: document.getElementById('loginTextError'),
        numberError: document.getElementById('loginNumberError')
    }
};

// 检查输入元素是否存在
if (!inputs.joinUs.text || !inputs.joinUs.number || !inputs.joinUs.textError || !inputs.joinUs.numberError ||
    !inputs.login.text || !inputs.login.number || !inputs.login.textError || !inputs.login.numberError) {
    console.error('某些输入元素未能正确获取。');
}

// 按钮元素
const buttons = {
    joinUs: document.getElementById('joinUsButton'),
    login: document.getElementById('loginButton'),
    toLogin: document.getElementById('toLoginLink'),
    toJoinUs: document.getElementById('toJoinUsLink'),
    logout: document.getElementById('logoutButton')
};

// 检查按钮元素是否存在
if (!buttons.joinUs || !buttons.login || !buttons.toLogin || !buttons.toJoinUs || !buttons.logout) {
    console.error('某些按钮元素未能正确获取。');
}

// 输入验证规则
const validators = {
    text: {
        // 允许中文和英文字母，禁止特殊字符
        format: /^[\u4e00-\u9fa5a-zA-Z\s]*$/,
        length: {min: 4, max: 8},  // 4-8 个字
        formatError: '只能输入中文或英文哦',
        lengthError: (value) => {
            if (!value) return '请输入文字部分';
            const length = [...value].length;  // 正确计算Unicode字符长度
            if (length < 4) return '太短啦，请输入4~8个字';
            if (length > 8) return '太长啦，请输入4~8个字';
            return null;
        }
    },
    number: {
        format: /^\d*$/,
        length: {min: 3, max: 6},
        formatError: '只能输入数字哦',
        lengthError: (value) => {
            if (!value) return '请输入数字部分';
            if (value.length < 3) return '太短啦，请输入3~6位数字';
            if (value.length > 6) return '太长啦，请输入3~6位数字';
            return null;
        }
    }
};

// 显示错误提示
function showError(element, message) {
    element.textContent = message;
    element.classList.remove('hidden');
}

// 页面切换
function showPage(pageId) {
    console.log('切换页面到:', pageId);
    Object.values(pages).forEach(page => {
        if (page) {
            page.classList.add('hidden');
            console.log(`${page.id} 已隐藏`);
        }
    });
    if (pages[pageId]) {
        pages[pageId].classList.remove('hidden');
        console.log(`${pageId} 已显示`);
    }
}

// 更新用户显示信息
function updateUserDisplay(token) {
    console.log('更新用户显示信息:', token);
    const currentUserToken = document.getElementById('currentUserToken');
    if (currentUserToken) {
        currentUserToken.textContent = token || '未设置口令';
    }
}

// 更新配对状态显示
function updatePairStatus(isPaired) {
    console.log('更新配对状态:', isPaired);
    const pairStatus = document.getElementById('pairStatus');
    if (pairStatus) {
        pairStatus.textContent = isPaired ? '已连接' : '未连接';
        pairStatus.className = `status-badge ${isPaired ? 'paired' : 'unpaired'}`;
    }
}

// 根据配对状态跳转页面
async function navigateByPairStatus(userData) {
    console.log('导航根据配对状态:', userData);
    if (!userData.partnerId) {
        console.log('未配对，跳转到配对页面');
        showPage('pairing');
        updateUserDisplay(`${userData.text}@${userData.number}`);
        updatePairStatus(false);
    } else {
        console.log('已配对，跳转到主页面');
        showPage('main');
        updatePairStatus(true);
        await initMainPage();
    }
}

// 输入验证和错误显示
function validateInput(text, number, textError, numberError) {
    const textLengthError = validators.text.lengthError(text);
    const numberLengthError = validators.number.lengthError(number);
    
    if (textLengthError) {
        showError(textError, textLengthError);
        return false;
    }
    
    if (numberLengthError) {
        showError(numberError, numberLengthError);
        return false;
    }
    
    textError.textContent = '';
    numberError.textContent = '';
    return true;
}

// 设置输入监听器
function setupInputValidation(textInput, numberInput, textError, numberError) {
    // 文字输入框验证
    textInput.addEventListener('input', (e) => {
        const value = e.target.value;
        
        // 检查特殊字符
        if (!validators.text.format.test(value)) {
            e.target.value = value.replace(/[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g, '');
            textError.textContent = validators.text.formatError;
            return;
        }

        // 实时长度检查
        const length = [...value].length;
        if (length > validators.text.length.max) {
            const chars = [...value];
            e.target.value = chars.slice(0, validators.text.length.max).join('');
            textError.textContent = validators.text.lengthError(e.target.value);
        } else {
            textError.textContent = '';
        }
    });

    // 数字输入框验证
    numberInput.addEventListener('input', (e) => {
        const value = e.target.value;
        
        // 只允许数字
        if (!validators.number.format.test(value)) {
            e.target.value = value.replace(/\D/g, '');
            numberError.textContent = validators.number.formatError;
            return;
        }

        // 实时长度检查
        if (value.length > validators.number.length.max) {
            e.target.value = value.slice(0, validators.number.length.max);
            numberError.textContent = validators.number.lengthError(e.target.value);
            return;
        }

        numberError.textContent = '';
    });

    // 失去焦点时检查最小长度
    textInput.addEventListener('blur', () => {
        const error = validators.text.lengthError(textInput.value);
        textError.textContent = error || '';
    });

    numberInput.addEventListener('blur', () => {
        const error = validators.number.lengthError(numberInput.value);
        numberError.textContent = error || '';
    });
}

// 清空输入框
function clearInputs(textInput, numberInput, textError, numberError) {
    if (textInput) textInput.value = '';
    if (numberInput) numberInput.value = '';
    if (textError) textError.textContent = '';
    if (numberError) numberError.textContent = '';
}

// 处理退出登录
async function handleLogout() {
    try {
        // 清除存储的用户信息
        await chrome.storage.local.remove('currentUser');
        // 清空所有输入框
        clearInputs(
            document.getElementById('loginText'),
            document.getElementById('loginNumber'),
            document.getElementById('loginTextError'),
            document.getElementById('loginNumberError')
        );
        clearInputs(
            document.getElementById('partnerText'),
            document.getElementById('partnerNumber'),
            document.getElementById('partnerTextError'),
            document.getElementById('partnerNumberError')
        );
        // 跳转到登录页面
        showPage('login');
    } catch (error) {
        console.error('退出登录失败:', error);
    }
}

// 处理连接操作
async function handlePairing(partnerText, partnerNumber) {
    console.log('处理连接操作:', partnerText, partnerNumber);
    try {
        const partnerToken = `${partnerText}@${partnerNumber}`;
        // 获取当前用户信息
        const storage = await chrome.storage.local.get('currentUser');
        const currentUser = storage.currentUser;
        
        console.log('当前用户信息:', currentUser);
        
        if (!currentUser) {
            throw new Error('未登录状态');
        }

        // 发起配对
        console.log('发起配对请求');
        const pairResult = await userService.initiatePairing(currentUser.userId, partnerToken);
        console.log('配对结果:', pairResult);
        
        if (pairResult.pairStatus === 'paired') {
            // 清空输入框
            clearInputs(
                document.getElementById('partnerText'),
                document.getElementById('partnerNumber'),
                document.getElementById('partnerTextError'),
                document.getElementById('partnerNumberError')
            );
            
            // 更新用户数据并跳转到主页
            console.log('配对成功，跳转到主页');
            navigateByPairStatus({
                ...currentUser,
                partnerId: pairResult.partnerId
            });
        }
    } catch (error) {
        console.error('连接操作失败:', error);
        // 显示错误信息
        const partnerTextError = document.getElementById('partnerTextError');
        if (partnerTextError) {
            partnerTextError.textContent = error.message;
        }
    }
}

// 格式化时间
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// 格式化日期
function formatDate() {
    const date = new Date();
    return `${date.getMonth() + 1}月${date.getDate()}日`;
}

// 创建活动项元素
function createActivityItem(activity) {
    return new Promise((resolve) => {
        chrome.storage.local.get('currentUser', (result) => {
            const currentUser = result.currentUser;
            const isCurrentUser = currentUser && activity.userId === currentUser.userId;
            const displayName = isCurrentUser ? '我' : 'TA';
            const nameColor = isCurrentUser ? 'text-emerald-600' : 'text-[#FF8B7E]';
            
            const div = document.createElement('div');
            div.className = 'activity-item relative';
            
            // 根据活动类型设置动作文本
            let actionText = '';
            let targetText = '';
            
            switch (activity.type) {
                case 'TAB_OPEN':
                    actionText = '打开了';
                    targetText = activity.details.title;
                    break;
                case 'BOOKMARK_ADD':
                    actionText = '收藏了';
                    targetText = activity.details.title;
                    break;
                case 'DOWNLOAD_START':
                    actionText = '开始下载';
                    targetText = activity.details.filename;
                    break;
                case 'DOWNLOAD_COMPLETE':
                    actionText = '下载完成';
                    targetText = activity.details.filename;
                    break;
                case 'USER_OFFLINE':
                    actionText = '离线了';
                    targetText = '';
                    break;
                case 'USER_ONLINE':
                    actionText = '上线了';
                    targetText = '';
                    break;
            }

            div.innerHTML = `
                <!-- 活动内容 -->
                <div class="activity-content">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-1 flex-1 min-w-0">
                            <span class="font-medium ${nameColor} whitespace-nowrap">${displayName}</span>
                            <span class="text-base-content whitespace-nowrap">${actionText}</span>
                            ${targetText ? `<span class="text-base-content truncate">${targetText}</span>` : ''}
                        </div>
                        <span class="text-xs text-base-content/40 whitespace-nowrap">${formatTime(activity.timestamp)}</span>
                    </div>
                </div>
            `;
            
            resolve(div);
        });
    });
}

// 更新活动列表
async function updateActivityList() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;

    // 清空现有内容
    activityList.innerHTML = '';

    try {
        // 获取活动记录
        const activities = await activityService.getActivities(50);
        
        // 按时间倒序排序
        activities.sort((a, b) => b.timestamp - a.timestamp);

        // 添加活动项
        for (const activity of activities) {
            const activityElement = await createActivityItem(activity);
            activityList.appendChild(activityElement);
        }
    } catch (error) {
        console.error('更新活动列表失败:', error);
    }
}

// 更新用户状态显示
function updateUserStatus(userId, isOnline) {
    chrome.storage.local.get('currentUser', (result) => {
        const currentUser = result.currentUser;
        if (!currentUser) return;

        const isCurrentUser = userId === currentUser.userId;
        const statusElement = isCurrentUser ? 'selfStatus' : 'partnerStatus';
        const statusContainer = document.getElementById(statusElement)?.parentElement?.parentElement;
        
        if (statusContainer) {
            // 更新状态圆点
            const statusDot = statusContainer.querySelector('span:first-child');
            if (statusDot) {
                statusDot.classList.remove('bg-emerald-400', 'bg-[#FF8B7E]', 'bg-gray-300');
                if (isOnline) {
                    statusDot.classList.add(isCurrentUser ? 'bg-emerald-400' : 'bg-[#FF8B7E]');
                } else {
                    statusDot.classList.add('bg-gray-300');
                }
            }
            
            // 更新昵称文字颜色
            const statusText = statusContainer.querySelector('#' + statusElement);
            if (statusText) {
                statusText.classList.remove('text-emerald-600', 'text-[#FF8B7E]', 'text-gray-600');
                if (isOnline) {
                    statusText.classList.add(isCurrentUser ? 'text-emerald-600' : 'text-[#FF8B7E]');
                } else {
                    statusText.classList.add('text-gray-600');
                }
            }
        }
    });
}

// 更新活动显示
function updateActivityDisplay(activity, container) {
    // 更新当前活动
    const activityDiv = container.querySelector('.text-sm.text-gray-600');
    if (!activityDiv) return;

    // 更音乐图标显示
    const musicIcon = container.querySelector('.music-icon');
    if (musicIcon) {
        if (activity.type === 'MUSIC_PLAYING') {
            musicIcon.style.display = 'block';
            // TODO: 后续可以添加音乐名称的 tooltip
        } else {
            musicIcon.style.display = 'none';
        }
    }

    // 更新活动文本
    switch (activity.type) {
        case 'TAB_OPEN':
            activityDiv.textContent = `正在玩 ${truncateTitle(activity.details.title, 5)}`;
            break;
        case 'MUSIC_PLAYING':
            // 音乐播放状态不再显示在活动文本中
            break;
        case 'USER_OFFLINE':
            activityDiv.textContent = '离线';
            break;
        case 'USER_ONLINE':
            activityDiv.textContent = '在线';
            break;
        default:
            if (activity.details?.title) {
                activityDiv.textContent = `正在浏览 ${truncateTitle(activity.details.title, 5)}`;
            }
    }
}

// 截断标题
function truncateTitle(title, maxChars = 5) {
    if (!title) return '';
    
    let charCount = 0;
    let result = '';
    
    for (let char of title) {
        const isChineseChar = /[\u4e00-\u9fa5]/.test(char);
        charCount += isChineseChar ? 1 : 0.5;
        
        if (charCount > maxChars) {
            result += '...';
            break;
        }
        result += char;
    }
    
    return result;
}

// 更新用户昵称显示
async function updateUserNicknames() {
    try {
        console.log('开始更新用户昵称...');
        const storage = await chrome.storage.local.get(['currentUser', 'users']);
        console.log('获取到的存储数据:', storage);
        
        const currentUser = storage.currentUser;
        if (!currentUser) {
            console.log('未找到当前用户数据');
            return;
        }

        // 更新自己的昵称
        const selfStatus = document.getElementById('selfStatus');
        if (selfStatus) {
            selfStatus.textContent = currentUser.text || '我';
            updateUserStatus(currentUser.userId, true);
        }

        // 更新伙伴的昵称
        if (currentUser.partnerId) {
            const partner = storage.users?.[currentUser.partnerId];
            const partnerStatus = document.getElementById('partnerStatus');
            if (partnerStatus && partner) {
                partnerStatus.textContent = partner.text || 'TA';
                updateUserStatus(currentUser.partnerId, partner?.isOnline || false);
            }
        }
    } catch (error) {
        console.error('更新用户昵称失败:', error);
    }
}

// 标签相关功能
class StatusTagManager {
    constructor() {
        this.selfTags = document.getElementById('selfTags');
        this.partnerTags = document.getElementById('partnerTags');
        this.addTagButton = this.selfTags?.querySelector('.add-status-tag');
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.addTagButton) {
            this.addTagButton.addEventListener('click', () => this.createNewTag());
        }
    }

    createNewTag() {
        // 创建标签容器
        const tagContainer = document.createElement('div');
        tagContainer.className = 'status-tag';

        // 创建输入框
        const input = document.createElement('input');
        input.className = 'status-tag-input';
        input.maxLength = 12; // 限制最大字符数
        input.placeholder = '输入状态...';

        // 添加到容器
        tagContainer.appendChild(input);

        // 插入到添加按钮之前
        this.addTagButton.parentNode.insertBefore(tagContainer, this.addTagButton);

        // 聚焦输入框
        input.focus();

        // 添加事件监听
        input.addEventListener('blur', () => this.handleTagBlur(tagContainer, input));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            }
        });
    }

    handleTagBlur(tagContainer, input) {
        const text = input.value.trim();
        if (text) {
            // 保存标签
            this.saveTag(text);
            // 将输入框替换为文本
            tagContainer.textContent = text;
            
            // 添加删除按钮
            const deleteBtn = document.createElement('span');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '×';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                this.deleteTag(tagContainer);
            });
            tagContainer.appendChild(deleteBtn);
        } else {
            // 如果没有输入内容，移除标签
            tagContainer.remove();
        }
    }

    async saveTag(text) {
        try {
            // 获取当前用户
            const storage = await chrome.storage.local.get(['currentUser', 'userTags']);
            const currentUser = storage.currentUser;
            if (!currentUser) return;

            // 更新标签存储
            const userTags = storage.userTags || {};
            if (!userTags[currentUser.userId]) {
                userTags[currentUser.userId] = [];
            }
            userTags[currentUser.userId].push({
                text,
                timestamp: Date.now()
            });

            // 保存到存储
            await chrome.storage.local.set({ userTags });

            // 通知后台更新
            chrome.runtime.sendMessage({
                type: 'TAG_UPDATE',
                userId: currentUser.userId,
                tags: userTags[currentUser.userId]
            });
        } catch (error) {
            console.error('保存标签失败:', error);
        }
    }

    async deleteTag(tagContainer) {
        try {
            // 仅允许删除自己的标签
            if (tagContainer.parentNode === this.selfTags) {
                const tagText = tagContainer.textContent.replace('×', '').trim(); // 移除删除按钮的文本
                const storage = await chrome.storage.local.get(['currentUser', 'userTags']);
                const currentUser = storage.currentUser;
                
                if (currentUser && storage.userTags?.[currentUser.userId]) {
                    // 从存储中删除标签
                    const userTags = storage.userTags;
                    userTags[currentUser.userId] = userTags[currentUser.userId].filter(
                        tag => tag.text !== tagText
                    );
                    
                    // 更新存储
                    await chrome.storage.local.set({ userTags });
                    
                    // 通知后台更新
                    chrome.runtime.sendMessage({
                        type: 'TAG_UPDATE',
                        userId: currentUser.userId,
                        tags: userTags[currentUser.userId]
                    });
                }
                
                // 移除标签元素
                tagContainer.remove();
            }
        } catch (error) {
            console.error('删除标签失败:', error);
        }
    }

    // 加载用户标签
    async loadTags() {
        try {
            const storage = await chrome.storage.local.get(['currentUser', 'userTags']);
            const currentUser = storage.currentUser;
            if (!currentUser) return;

            const userTags = storage.userTags || {};
            
            // 加载自己的标签
            if (userTags[currentUser.userId]) {
                this.renderTags(this.selfTags, userTags[currentUser.userId], true);
            }

            // 加载伙伴的标签
            if (currentUser.partnerId && userTags[currentUser.partnerId]) {
                this.renderTags(this.partnerTags, userTags[currentUser.partnerId], false);
            }
        } catch (error) {
            console.error('加载标签失败:', error);
        }
    }

    renderTags(container, tags, isSelf) {
        if (!container) return;

        // 清空现有标签（保留添加按钮）
        const addButton = container.querySelector('.add-status-tag');
        container.innerHTML = '';
        
        // 渲染标签
        tags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'status-tag';
            tagElement.textContent = tag.text;
            
            if (isSelf) {
                // 为自己的标签添加删除按钮
                const deleteBtn = document.createElement('span');
                deleteBtn.className = 'delete-btn';
                deleteBtn.textContent = '×';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // 阻止事件冒泡
                    this.deleteTag(tagElement);
                });
                tagElement.appendChild(deleteBtn);
            }
            
            container.appendChild(tagElement);
        });

        // 如果是自己的标签区域，添加"添加"按钮
        if (isSelf && addButton) {
            container.appendChild(addButton);
        }
    }
}

// 工具栏管理器
class ToolbarManager {
    constructor() {
        this.toolbar = document.querySelector('.toolbar');
        this.toggleBtn = document.querySelector('.toolbar-toggle');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.toggleToolbar());
        }

        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', handleLogout);
        }
    }

    toggleToolbar() {
        const isExpanded = this.toolbar.classList.contains('expanded');
        
        if (isExpanded) {
            // 收起工具栏
            this.toolbar.classList.remove('expanded');
            this.toggleBtn.textContent = '收';
        } else {
            // 展开工具栏
            this.toolbar.classList.add('expanded');
            this.toggleBtn.textContent = '展';
        }
    }
}

// 初始化主页面
async function initMainPage() {
    try {
        console.log('初始化主页面...');
        // 设置当前日期
        const currentDate = document.getElementById('currentDate');
        if (currentDate) {
            currentDate.textContent = formatDate();
        }

        // 更新用户昵称
        await updateUserNicknames();

        // 初始化时隐藏所有音乐图标
        document.querySelectorAll('.music-icon').forEach(icon => {
            icon.style.display = 'none';
        });

        // 初始化标签管理器
        const tagManager = new StatusTagManager();
        await tagManager.loadTags();

        // 初始化工具栏
        const toolbarManager = new ToolbarManager();

        // 获取当前用户信息
        const storage = await chrome.storage.local.get('currentUser');
        const currentUser = storage.currentUser;

        // 初始化活动显示
        await updateLatestActivities();

        // 监听活动更新
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'ACTIVITY_UPDATE') {
                handleActivityUpdate(message.activity);
            }
        });

    } catch (error) {
        console.error('初始化主页面失败:', error);
    }
}

// 格式化活动显示文本
function formatActivityDisplay(activity) {
    const time = new Date(activity.timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
    });

    let actionText = '';
    switch (activity.type) {
        case 'TAB_OPEN':
            actionText = `正在浏览 ${cleanTitle(activity.details.title)}`;
            break;
        case 'BOOKMARK_ADD':
            actionText = `收藏了 ${cleanTitle(activity.details.title)}`;
            break;
        case 'DOWNLOAD_START':
            actionText = `开始下载 ${activity.details.filename}`;
            break;
        case 'DOWNLOAD_COMPLETE':
            actionText = `下载完成 ${activity.details.filename}`;
            break;
        case 'USER_OFFLINE':
            actionText = '离线';
            break;
        case 'USER_ONLINE':
            actionText = '在线';
            break;
        default:
            actionText = '暂无活动';
    }

    // 创建活动显示元素
    const container = document.createElement('div');
    container.className = 'flex justify-between items-center w-full';
    
    const actionSpan = document.createElement('span');
    actionSpan.textContent = actionText;
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'activity-time';
    timeSpan.textContent = time;
    
    container.appendChild(actionSpan);
    container.appendChild(timeSpan);
    
    return container;
}

// 标题清理函数
function cleanTitle(title) {
    if (!title) return '';

    // 网站特定规则
    const sitePatterns = [
        // bilibili - 处理各种特殊情况
        {
            pattern: /^(.+?)(?:\s*[_\-]\s*哔哩哔哩.*|\s*[_\-]\s*bilibili.*|\s*[_\-\(\（].*$|\s*_.*$)/i,
            site: 'bilibili.com'
        },
        // 知乎
        {
            pattern: /^(.+?)(?:\s*-\s*知乎.*|\s*[\(\（].*$)/,
            site: 'zhihu.com'
        },
        // 微博
        {
            pattern: /^(.+?)(?:\s*_\s*微博.*|\s*[\(\（].*$)/,
            site: 'weibo.com'
        },
        // 通用规则 - 处理所有类型的括号和特殊字符
        {
            pattern: /^(.+?)(?:\s*[_\-|]\s*.*|\s*[\(\（\[\【\{\｛].*$|\s*[_\-]\s*.*$)/
        }
    ];

    // 应用规则
    for (const rule of sitePatterns) {
        const match = title.match(rule.pattern);
        if (match && match[1]) {
            // 去除首尾空格并确保没有遗留的特殊字符
            return match[1].trim().replace(/[\(\（\[\【\{\｛].*$/, '').trim();
        }
    }

    return title;
}

// 修改活动更新处理函数
async function handleActivityUpdate(activity) {
    try {
        const storage = await chrome.storage.local.get('currentUser');
        const currentUser = storage.currentUser;
        
        if (!currentUser) return;

        const isSelf = activity.userId === currentUser.userId;
        const activityContainer = document.getElementById(
            isSelf ? 'selfActivity' : 'partnerActivity'
        );

        if (activityContainer) {
            // 清空现有内容
            activityContainer.innerHTML = '';
            // 添加新的格式化显示
            const displayElement = formatActivityDisplay(activity);
            activityContainer.appendChild(displayElement);
        }
    } catch (error) {
        console.error('处理活动更新失败:', error);
    }
}

// 更新最新活动显示
async function updateLatestActivities() {
    try {
        const storage = await chrome.storage.local.get(['currentUser', 'activities']);
        const currentUser = storage.currentUser;
        
        if (!currentUser) return;

        const activities = storage.activities || [];
        
        // 获取每个用户的最新活动
        const latestSelfActivity = activities
            .filter(a => a.userId === currentUser.userId)
            .sort((a, b) => b.timestamp - a.timestamp)[0];
            
        const latestPartnerActivity = activities
            .filter(a => a.userId === currentUser.partnerId)
            .sort((a, b) => b.timestamp - a.timestamp)[0];

        // 更新显示
        if (latestSelfActivity) {
            const selfActivityContainer = document.getElementById('selfActivity');
            if (selfActivityContainer) {
                // 清空现有内容
                selfActivityContainer.innerHTML = '';
                // 添加新的格式化显示
                const displayElement = formatActivityDisplay(latestSelfActivity);
                selfActivityContainer.appendChild(displayElement);
            }
        }

        if (latestPartnerActivity) {
            const partnerActivityContainer = document.getElementById('partnerActivity');
            if (partnerActivityContainer) {
                // 清空现有内容
                partnerActivityContainer.innerHTML = '';
                // 添加新的格式化显示
                const displayElement = formatActivityDisplay(latestPartnerActivity);
                partnerActivityContainer.appendChild(displayElement);
            }
        }
    } catch (error) {
        console.error('更新最新活动失败:', error);
    }
}

// 检查登录状态并导航
async function checkLoginAndNavigate() {
    try {
        console.log('检查登录状态...');
        const storage = await chrome.storage.local.get(['currentUser', 'users']);
        const currentUser = storage.currentUser;

        if (!currentUser) {
            console.log('未登录，显示登录页面');
            showPage('login');
            return;
        }

        console.log('已登录，检查配对状态');
        // 如果已登录，根据配对状态导航
        navigateByPairStatus(currentUser);
    } catch (error) {
        console.error('检查登录状态失败:', error);
        showPage('login');
    }
}

// 获取位置和天气信息
async function getLocationAndWeather() {
    try {
        // 通过 IP-API 获取位置信息（完全免费，无需密钥）
        const locationResponse = await fetch('http://ip-api.com/json/?lang=zh-CN');
        const locationData = await locationResponse.json();
        
        if (locationData.status === 'success') {
            // 显示城市名称
            document.getElementById('locationText').textContent = locationData.city;
            
            // 使用 wttr.in 获取天气信息（完全免费，无需密钥）
            const weatherResponse = await fetch(
                `https://wttr.in/${locationData.city}?format=j1&lang=zh`
            );
            const weatherData = await weatherResponse.json();

            const current = weatherData.current_condition[0];
            document.getElementById('weatherText').textContent = current.lang_zh[0].value;
            document.getElementById('temperatureText').textContent = `${current.temp_C}°C`;
            
            // 设置天气图标
            const weatherIcon = document.getElementById('weatherIcon');
            weatherIcon.innerHTML = getWeatherIcon(current.weatherCode);
        }
    } catch (error) {
        console.error('获取位置或天气信息失败:', error);
        document.getElementById('locationText').textContent = '未知位置';
        document.getElementById('weatherText').textContent = '获取失败';
        document.getElementById('temperatureText').textContent = '--°C';
    }
}

// 获取天气图标的SVG
function getWeatherIcon(weatherCode) {
    // 简化的天气图标映射
    const icons = {
        '113': '<svg class="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="3.5" fill="currentColor"/></svg>', // 晴天
        '116': '<svg class="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3v8" stroke="currentColor" stroke-width="2"/></svg>', // 多云
        'default': '<svg class="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="3.5" fill="currentColor"/></svg>' // 默认图标
    };
    return icons[weatherCode] || icons['default'];
}

// 初始化时获取信息
document.addEventListener('DOMContentLoaded', () => {
    getLocationAndWeather();
    // 每30分钟更新一次天气信息
    setInterval(getLocationAndWeather, 30 * 60 * 1000);
});

// 初始化
document.addEventListener('DOMContentLoaded', async function() {
    console.log('页面加载完成');
    
    // 设置输入验证
    setupInputValidation(
        inputs.joinUs.text,
        inputs.joinUs.number,
        inputs.joinUs.textError,
        inputs.joinUs.numberError
    );
    setupInputValidation(
        inputs.login.text,
        inputs.login.number,
        inputs.login.textError,
        inputs.loginNumberError
    );

    // JOIN US 按钮点击事件
    buttons.joinUs.addEventListener('click', async () => {
        console.log('点击注册按钮');
        const text = inputs.joinUs.text.value;
        const number = inputs.joinUs.number.value;

        if (validateInput(text, number, inputs.joinUs.textError, inputs.joinUs.numberError)) {
            try {
                // 创建用户
                const token = `${text}@${number}`;
                const userId = await userService.createUser(token);

                // 保存当前用户信息
                await chrome.storage.local.set({
                    currentUser: {
                        userId,
                        token,
                        text,
                        number
                    }
                });

                // 清空输入框
                clearInputs(
                    inputs.joinUs.text,
                    inputs.joinUs.number,
                    inputs.joinUs.textError,
                    inputs.joinUs.numberError
                );

                // 根据配对状态跳转
                navigateByPairStatus({ text, number, partnerId: null });
            } catch (error) {
                showError(inputs.joinUs.textError, error.message);
            }
        }
    });

    // 登录按钮点击事件
    buttons.login.addEventListener('click', async () => {
        console.log('点击登录按钮');
        const text = inputs.login.text.value;
        const number = inputs.login.number.value;

        if (validateInput(text, number, inputs.login.textError, inputs.login.numberError)) {
            try {
                // 验证登录
                const token = `${text}@${number}`;
                const { userId, userData } = await userService.verifyUser(token);
                
                // 保存当前用户信息
                await chrome.storage.local.set({
                    currentUser: {
                        userId,
                        token,
                        text,
                        number,
                        ...userData
                    }
                });

                // 清空输入框
                clearInputs(
                    inputs.login.text,
                    inputs.login.number,
                    inputs.login.textError,
                    inputs.login.numberError
                );

                // 根据配对状态跳转
                navigateByPairStatus({ ...userData, text, number });
            } catch (error) {
                showError(inputs.login.textError, error.message);
            }
        }
    });

    // 页面切换事件
    buttons.toLogin.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('login');
    });

    buttons.toJoinUs.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('joinUs');
    });

    // 添加退出登录按钮事件
    buttons.logout?.addEventListener('click', handleLogout);

    // 添加连接按钮事件
    const pairButton = document.getElementById('pairButton');
    const partnerText = document.getElementById('partnerText');
    const partnerNumber = document.getElementById('partnerNumber');
    const partnerTextError = document.getElementById('partnerTextError');
    const partnerNumberError = document.getElementById('partnerNumberError');

    if (pairButton && partnerText && partnerNumber) {
        pairButton.addEventListener('click', async () => {
            console.log('点击连接按钮');
            const text = partnerText.value;
            const number = partnerNumber.value;

            console.log('输入值:', text, number);
            if (validateInput(text, number, partnerTextError, partnerNumberError)) {
                await handlePairing(text, number);
            }
        });
    }

    // 检查登录状态并导航
    await checkLoginAndNavigate();

    // 为配对页面的退出按钮添加事件监听
    const pairingLogoutBtn = document.getElementById('pairingLogoutBtn');
    if (pairingLogoutBtn) {
        pairingLogoutBtn.addEventListener('click', handleLogout);
    }

    // 主页面的退出按钮已经在 ToolbarManager 中处理
    // 在 ToolbarManager 的构造函数中:
    // this.logoutBtn.addEventListener('click', handleLogout);
});
