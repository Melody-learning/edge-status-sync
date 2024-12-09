// 基础UI交互逻辑
document.addEventListener('DOMContentLoaded', function() {
    const generateCodeBtn = document.getElementById('generateCode');
    const submitCodeBtn = document.getElementById('submitCode');
    const pairCodeInput = document.getElementById('pairCode');
    const connectionStatus = document.getElementById('connectionStatus');

    // 检查元素是否存在
    if (!generateCodeBtn || !submitCodeBtn || !pairCodeInput || !connectionStatus) {
        console.error('某些按钮或输入框未能正确获取。');
    }

    // 生成配对码按钮点击事件
    generateCodeBtn.addEventListener('click', function() {
        // MVP阶段：生成简单的随机码
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        connectionStatus.textContent = `配对码: ${code}`;
    });

    // 提交配对码按钮点击事件
    submitCodeBtn.addEventListener('click', function() {
        const code = pairCodeInput.value.trim();
        if (code) {
            connectionStatus.textContent = `正在尝试配对...`;
            // TODO: 实现配对逻辑
        }
    });
});

// 页面元素
const pages = {
    login: document.getElementById('loginPage'),
    register: document.getElementById('registerPage'),
    bind: document.getElementById('bindPage'),
    success: document.getElementById('successPage')
};

// 检查页面元素是否存在
if (!pages.login || !pages.register || !pages.bind || !pages.success) {
    console.error('某些页面元素未能正确获取。');
}

// 输入元素
const inputs = {
    login: {
        text: document.getElementById('loginText'),
        number: document.getElementById('loginNumber'),
        error: document.getElementById('loginError'),
        tooltip: document.getElementById('loginTooltip')
    },
    register: {
        text: document.getElementById('registerText'),
        number: document.getElementById('registerNumber'),
        error: document.getElementById('registerError'),
        tooltip: document.getElementById('registerTooltip')
    },
    bind: {
        text: document.getElementById('bindText'),
        number: document.getElementById('bindNumber'),
        error: document.getElementById('bindError'),
        tooltip: document.getElementById('bindTooltip')
    }
};

// 检查输入元素是否存在
if (!inputs.login.text || !inputs.login.number || !inputs.login.error || !inputs.login.tooltip ||
    !inputs.register.text || !inputs.register.number || !inputs.register.error || !inputs.register.tooltip ||
    !inputs.bind.text || !inputs.bind.number || !inputs.bind.error || !inputs.bind.tooltip) {
    console.error('某些输入元素未能正确获取。');
}

// 按钮元素
const buttons = {
    login: document.getElementById('loginButton'),
    register: document.getElementById('registerButton'),
    bind: document.getElementById('bindButton'),
    toRegister: document.getElementById('toRegister'),
    toLogin: document.getElementById('toLogin'),
    logout: document.getElementById('logoutButton'),
    unbind: document.getElementById('unbindButton')
};

// 检查按钮元素是否存在
if (!buttons.login || !buttons.register || !buttons.bind || !buttons.toRegister || !buttons.toLogin || !buttons.logout || !buttons.unbind) {
    console.error('某些按钮元素未能正确获取。');
}

// 显示气泡提示
function showTooltip(tooltipElement, message) {
    tooltipElement.textContent = message;
    tooltipElement.classList.remove('hidden');
    tooltipElement.classList.add('tooltip', 'tooltip-open', 'tooltip-error');
    setTimeout(() => {
        tooltipElement.classList.add('hidden');
        tooltipElement.classList.remove('tooltip', 'tooltip-open', 'tooltip-error');
    }, 1500);
}

// 输入验证规则
const validators = {
    text: {
        format: /^[\u4e00-\u9fa5a-zA-Z]*$/,
        length: {min: 8, max: 16},
        formatError: '只能输入中文或英文字符',
        lengthError: (value) => {
            if (!value) return '请输入文字部分';
            if (value.length < 8) return '文字长度不能少于8个字符';
            return null;  // 不需要检查最大长度，因为 maxlength 会限制
        }
    },
    number: {
        format: /^\d*$/,
        length: {min: 3, max: 6},
        formatError: '只能输入数字',
        lengthError: (value) => {
            if (!value) return '请输入数字部分';
            if (value.length < 3) return '数字长度不能少于3位';
            return null;  // 不需要检查最大长度，因为 maxlength 会限制
        }
    }
};

// 页面切换
function showPage(pageId) {
    Object.values(pages).forEach(page => {
        page.classList.add('hidden');
        page.classList.remove('active');
    });
    pages[pageId].classList.remove('hidden');
    pages[pageId].classList.add('active');
}

// 输入验证和错误显示
function validateInput(type, text, number, errorElement) {
    const textLengthError = validators.text.lengthError(text);
    const numberLengthError = validators.number.lengthError(number);
    
    if (textLengthError) {
        errorElement.textContent = textLengthError;
        return false;
    }
    
    if (numberLengthError) {
        errorElement.textContent = numberLengthError;
        return false;
    }
    
    errorElement.textContent = '';
    return true;
}

// 设置输入监听器
Object.values(inputs).forEach(input => {
    // 文字输入框
    input.text.addEventListener('keypress', (e) => {
        // 检查输入字符是否符合格式
        if (!validators.text.format.test(e.key)) {
            e.preventDefault();
            showTooltip(input.tooltip, validators.text.formatError);
        }
    });

    input.text.addEventListener('input', (e) => {
        input.error.textContent = '';
    });

    // 数字输入框
    input.number.addEventListener('keypress', (e) => {
        if (!validators.number.format.test(e.key)) {
            e.preventDefault();
            showTooltip(input.tooltip, validators.number.formatError);
        }
    });

    input.number.addEventListener('input', (e) => {
        input.error.textContent = '';
    });

    // 失去焦点时验证长度
    input.text.addEventListener('blur', () => {
        const error = validators.text.lengthError(input.text.value);
        input.error.textContent = error || '';
    });

    input.number.addEventListener('blur', () => {
        const error = validators.number.lengthError(input.number.value);
        input.error.textContent = error || '';
    });

    // 获得焦点时清除错误
    input.text.addEventListener('focus', () => {
        input.error.textContent = '';
    });

    input.number.addEventListener('focus', () => {
        input.error.textContent = '';
    });
});

// 登录页面
buttons.login?.addEventListener('click', () => {
    const text = inputs.login.text.value;
    const number = inputs.login.number.value;
    
    if (validateInput('login', text, number, inputs.login.error)) {
        showPage('bind');
    }
});

// 注册页面
buttons.register?.addEventListener('click', () => {
    const text = inputs.register.text.value;
    const number = inputs.register.number.value;
    
    if (validateInput('register', text, number, inputs.register.error)) {
        showPage('login');
    }
});

// 绑定页面
buttons.bind?.addEventListener('click', () => {
    const text = inputs.bind.text.value;
    const number = inputs.bind.number.value;
    
    if (validateInput('bind', text, number, inputs.bind.error)) {
        showPage('success');
    }
});

// 页面切换
buttons.toRegister?.addEventListener('click', () => showPage('register'));
buttons.toLogin?.addEventListener('click', () => showPage('login'));

// 调试按钮
buttons.logout?.addEventListener('click', () => {
    showPage('login');
});

buttons.unbind?.addEventListener('click', () => {
    inputs.bind.error.textContent = '已解除绑定';
});
