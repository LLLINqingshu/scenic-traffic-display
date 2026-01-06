// 景区人流量监控系统 - 主脚本文件

// ==================== 数据模型 ====================

// 区域数据
const areaData = {
    A: { 
        name: "广场",
        capacity: 300,
        visitors: 120,
        queueTime: 15,
        recommendedTime: "30分钟后",
        status: "crowded",
        statusText: "拥挤",
        color: "red",
        warning: false,
        countdown: 0,
        alternative: "C区（花园）"
    },
    B: { 
        name: "观景台",
        capacity: 200,
        visitors: 190,
        queueTime: 25,
        recommendedTime: "40分钟后",
        status: "warning",
        statusText: "已达上限",
        color: "red",
        warning: true,
        countdown: 20,
        alternative: "C区（花园）"
    },
    C: { 
        name: "花园",
        capacity: 250,
        visitors: 120,
        queueTime: 5,
        recommendedTime: "现在",
        status: "comfortable",
        statusText: "舒适",
        color: "green",
        warning: false,
        countdown: 0,
        alternative: ""
    },
    D: { 
        name: "步道",
        capacity: 180,
        visitors: 150,
        queueTime: 10,
        recommendedTime: "15分钟后",
        status: "normal",
        statusText: "一般",
        color: "yellow",
        warning: false,
        countdown: 0,
        alternative: ""
    }
};

// 倒计时定时器存储
let countdownIntervals = {};
// 自动更新定时器
let autoUpdateTimer = null;
// 下次更新时间（2分钟后）
let nextUpdateTime = null;

// ==================== 核心功能 ====================

// 强制设置区域颜色（解决黑色显示问题）
function forceSetAreaColors() {
    console.log("强制设置地图颜色...");
    
    Object.keys(areaData).forEach(key => {
        const area = document.getElementById(`area${key}`);
        const data = areaData[key];
        
        if (area && data) {
            // 移除所有颜色类
            area.classList.remove('area-green', 'area-yellow', 'area-red', 'area-warning');
            
            // 根据颜色添加对应的类
            if (data.color === 'green') {
                area.classList.add('area-green');
                area.style.fill = '#2ecc71';
            } else if (data.color === 'yellow') {
                area.classList.add('area-yellow');
                area.style.fill = '#f1c40f';
            } else if (data.color === 'red') {
                area.classList.add('area-red');
                area.style.fill = '#e74c3c';
            }
            
            // 设置边框样式
            area.style.stroke = 'white';
            area.style.strokeWidth = '3px';
            area.style.strokeOpacity = '1';
            area.style.opacity = '0.9';
            
            console.log(`已设置 area${key} 的颜色为 ${data.color}`);
        }
    });
}

// 计算区域状态
function calculateAreaStatus() {
    Object.keys(areaData).forEach(key => {
        const area = areaData[key];
        const percentage = (area.visitors / area.capacity) * 100;
        
        // 根据百分比确定状态
        if (percentage < 70) {
            area.status = "comfortable";
            area.statusText = "舒适";
            area.color = "green";
            area.queueTime = Math.floor(Math.random() * 5) + 1;
            area.recommendedTime = "现在";
            area.warning = false;
        } else if (percentage >= 70 && percentage <= 85) {
            area.status = "normal";
            area.statusText = "一般";
            area.color = "yellow";
            area.queueTime = Math.floor(Math.random() * 10) + 5;
            area.recommendedTime = `${Math.floor(Math.random() * 10) + 10}分钟后`;
            area.warning = false;
        } else {
            area.status = "crowded";
            area.statusText = "拥挤";
            area.color = "red";
            area.queueTime = Math.floor(Math.random() * 15) + 10;
            area.recommendedTime = `${Math.floor(Math.random() * 20) + 20}分钟后`;
            
            // B区特殊处理：超过95%时警告
            if (key === 'B' && percentage > 95) {
                area.warning = true;
                area.statusText = "已达上限";
                if (!area.countdown) area.countdown = 20;
            } else {
                area.warning = false;
            }
        }
    });
}

// 更新区域状态显示
function updateAreaStatus() {
    const areaElements = document.querySelectorAll('.area');
    areaElements.forEach(area => {
        const areaId = area.getAttribute('data-area');
        const data = areaData[areaId];
        
        if (!data) return;
        
        // 移除所有颜色类
        area.classList.remove('area-green', 'area-yellow', 'area-red', 'area-warning');
        
        // 添加对应的颜色类
        if (data.color === 'green') {
            area.classList.add('area-green');
            area.style.fill = '#2ecc71';
        } else if (data.color === 'yellow') {
            area.classList.add('area-yellow');
            area.style.fill = '#f1c40f';
        } else if (data.color === 'red') {
            area.classList.add('area-red');
            area.style.fill = '#e74c3c';
        }
        
        // 设置边框确保可见
        area.style.stroke = 'white';
        area.style.strokeWidth = '3px';
        area.style.strokeOpacity = '1';
        
        // 如果是B区且达到上限，添加警告闪烁
        if (areaId === 'B' && data.warning) {
            area.classList.add('area-warning');
            area.style.animation = 'blink 1s infinite';
            createCountdownOverlay(areaId, data.countdown);
        } else {
            removeCountdownOverlay(areaId);
            area.style.animation = '';
        }
        
        // 更新tooltip
        updateAreaTooltip(areaId);
    });
}

// 创建倒计时叠加层
function createCountdownOverlay(areaId, countdown) {
    removeCountdownOverlay(areaId);
    
    const area = document.getElementById(`area${areaId}`);
    if (!area) return;
    
    const bbox = area.getBBox();
    const svg = area.closest('svg');
    
    const countdownElement = document.createElementNS("http://www.w3.org/2000/svg", "text");
    countdownElement.setAttribute("class", "countdown-overlay");
    countdownElement.setAttribute("id", `countdown-${areaId}`);
    countdownElement.setAttribute("x", bbox.x + bbox.width / 2);
    countdownElement.setAttribute("y", bbox.y - 10);
    countdownElement.setAttribute("text-anchor", "middle");
    countdownElement.setAttribute("dominant-baseline", "middle");
    countdownElement.textContent = `预计${countdown}分钟后恢复`;
    
    svg.appendChild(countdownElement);
    
    // 启动倒计时
    startCountdown(areaId, countdown);
}

// 移除倒计时叠加层
function removeCountdownOverlay(areaId) {
    const countdownElement = document.getElementById(`countdown-${areaId}`);
    if (countdownElement) {
        countdownElement.remove();
    }
    
    // 清除定时器
    if (countdownIntervals[areaId]) {
        clearInterval(countdownIntervals[areaId]);
        delete countdownIntervals[areaId];
    }
}

// 启动倒计时
function startCountdown(areaId, minutes) {
    let remaining = minutes * 60;
    
    const interval = setInterval(() => {
        remaining--;
        
        if (remaining <= 0) {
            clearInterval(interval);
            delete countdownIntervals[areaId];
            
            // 倒计时结束，移除警告状态
            if (areaData[areaId]) {
                areaData[areaId].warning = false;
                areaData[areaId].countdown = 0;
                updateAreaStatus();
                updateStatistics();
            }
            return;
        }
        
        // 更新倒计时显示
        const countdownElement = document.getElementById(`countdown-${areaId}`);
        if (countdownElement) {
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            countdownElement.textContent = `预计${mins}分${secs}秒后恢复`;
        }
    }, 1000);
    
    countdownIntervals[areaId] = interval;
}

// 更新区域tooltip
function updateAreaTooltip(areaId) {
    const area = document.getElementById(`area${areaId}`);
    if (!area) return;
    
    const data = areaData[areaId];
    const percentage = Math.round((data.visitors / data.capacity) * 100);
    
    area.setAttribute('title', 
        `${data.name} (${areaId}区)\n` +
        `当前人数: ${data.visitors}/${data.capacity} (${percentage}%)\n` +
        `状态: ${data.statusText}\n` +
        `预计排队: ${data.queueTime}分钟\n` +
        `点击查看详情`
    );
}

// ==================== 弹窗功能 ====================

// 显示区域详情弹窗
function showAreaDetails(areaId) {
    const data = areaData[areaId];
    const percentage = Math.round((data.visitors / data.capacity) * 100);
    
    // 创建模态框
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    
    // 创建状态指示器
    let statusIndicator = '';
    if (data.color === 'green') {
        statusIndicator = `<span class="status-indicator status-green">${data.statusText} 🟢</span>`;
    } else if (data.color === 'yellow') {
        statusIndicator = `<span class="status-indicator status-yellow">${data.statusText} 🟡</span>`;
    } else {
        statusIndicator = `<span class="status-indicator status-red">${data.statusText} 🔴</span>`;
    }
    
    // 创建警告HTML（如果有）
    let warningHTML = '';
    if (data.warning) {
        warningHTML = `
            <div class="warning-section">
                <div class="warning-title">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>⚠️ 人流警告</span>
                </div>
                <div class="warning-content">
                    <p>${data.name}（${areaId}区）人数已达上限</p>
                    <p>当前不建议前往</p>
                    <p>预计等候时间: ${data.queueTime}分钟</p>
                </div>
            </div>
        `;
    }
    
    // 创建推荐HTML（如果有）
    let recommendationHTML = '';
    if (data.alternative) {
        const altAreaId = data.alternative.charAt(0);
        const altData = areaData[altAreaId] || {};
        recommendationHTML = `
            <div class="recommendation">
                <div class="recommendation-title">
                    <i class="fas fa-lightbulb"></i>
                    <span>推荐替代</span>
                </div>
                <p>${data.alternative}当前${altData.statusText || "舒适"}</p>
            </div>
        `;
    }
    
    modalOverlay.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title">${data.name}（${areaId}区）详情</div>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="detail-item">
                    <span class="detail-label">当前人数</span>
                    <span class="detail-value">${data.visitors}/${data.capacity}人 (${percentage}%)</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">舒适度</span>
                    <span class="detail-value">${statusIndicator}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">预计排队时间</span>
                    <span class="detail-value">${data.queueTime}分钟</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">建议前往时间</span>
                    <span class="detail-value">${data.recommendedTime}</span>
                </div>
                
                ${warningHTML}
                ${recommendationHTML}
                
                <div style="margin-top: 20px; font-size: 12px; color: #95a5a6; text-align: center;">
                    <i class="fas fa-info-circle"></i> 数据每2分钟更新一次
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
    
    // 关闭功能
    const closeBtn = modalOverlay.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
    });
    
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            document.body.removeChild(modalOverlay);
        }
    });
    
    document.addEventListener('keydown', function closeOnEsc(e) {
        if (e.key === 'Escape') {
            document.body.removeChild(modalOverlay);
            document.removeEventListener('keydown', closeOnEsc);
        }
    });
}

// ==================== 区域交互 ====================

// 设置区域悬停和点击效果
function setupAreaHoverEffects() {
    const areaElements = document.querySelectorAll('.area');
    
    areaElements.forEach(area => {
        // 确保每个区域都有正确的点击事件
        area.addEventListener('click', function(e) {
            e.stopPropagation();
            const areaId = this.getAttribute('data-area');
            console.log(`点击了区域 ${areaId}`);
            showAreaDetails(areaId);
        });
        
        area.addEventListener('mouseenter', function() {
            this.style.filter = 'brightness(1.2) drop-shadow(0 0 8px rgba(0,0,0,0.3))';
            this.style.transform = 'scale(1.02)';
            this.style.transformOrigin = 'center';
            this.style.strokeWidth = '4px';
        });
        
        area.addEventListener('mouseleave', function() {
            this.style.filter = '';
            this.style.transform = '';
            this.style.strokeWidth = '3px';
        });
    });
}

// ==================== 数据统计 ====================

// 更新统计信息
function updateStatistics() {
    let totalVisitors = 0;
    let comfortableCount = 0;
    
    Object.keys(areaData).forEach(key => {
        const area = areaData[key];
        totalVisitors += area.visitors;
        
        if (area.status === "comfortable") {
            comfortableCount++;
        }
        
        // 更新右侧状态项
        updateStatusItem(key, area);
    });
    
    // 更新总人数
    const totalVisitorsElement = document.getElementById('totalVisitors');
    if (totalVisitorsElement) {
        totalVisitorsElement.textContent = totalVisitors.toLocaleString();
    }
    
    // 更新舒适区域数
    const comfortableAreasElement = document.getElementById('comfortableAreas');
    if (comfortableAreasElement) {
        comfortableAreasElement.textContent = comfortableCount;
    }
    
    // 更新当前时间
    updateCurrentTime();
    
    // 更新下次更新时间
    updateNextUpdateTime();
}

// 更新右侧状态项
function updateStatusItem(areaId, data) {
    const statusItem = document.querySelector(`.status-item[data-area="${areaId}"]`);
    if (!statusItem) return;
    
    // 更新状态指示器
    const indicator = statusItem.querySelector('.status-indicator');
    if (indicator) {
        indicator.className = 'status-indicator';
        if (data.color === 'green') {
            indicator.classList.add('status-green');
            indicator.textContent = data.statusText;
        } else if (data.color === 'yellow') {
            indicator.classList.add('status-yellow');
            indicator.textContent = data.statusText;
        } else {
            indicator.classList.add('status-red');
            indicator.textContent = data.statusText;
        }
    }
    
    // 更新描述
    const desc = statusItem.querySelector('.status-desc');
    if (desc) {
        const percentage = Math.round((data.visitors / data.capacity) * 100);
        desc.innerHTML = `当前人数: <strong>${data.visitors}/${data.capacity}</strong> (${percentage}%)`;
    }
    
    // 更新排队时间
    const queueSpan = document.getElementById(`queue${areaId}`);
    if (queueSpan) {
        queueSpan.textContent = data.queueTime;
    }
}

// 更新时间戳
function updateTimeStamps() {
    const now = new Date();
    const minutes = now.getMinutes();
    
    // 更新各区域的更新时间显示
    ['A', 'B', 'C', 'D'].forEach(key => {
        const element = document.getElementById(`time${key}`);
        if (element) {
            const randomMinutesAgo = Math.floor(Math.random() * 5);
            if (randomMinutesAgo === 0) {
                element.textContent = "刚刚";
            } else {
                element.textContent = `${randomMinutesAgo}分钟前`;
            }
        }
    });
}

// 更新当前时间
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                      now.getMinutes().toString().padStart(2, '0');
    const updateTimeElement = document.getElementById('updateTime');
    if (updateTimeElement) {
        updateTimeElement.textContent = timeString;
    }
}

// 设置下次更新时间
function setNextUpdateTime() {
    const now = new Date();
    // 2分钟后
    nextUpdateTime = new Date(now.getTime() + 2 * 60 * 1000);
    updateNextUpdateTime();
    
    // 启动倒计时
    startUpdateCountdown();
}

// 更新下次更新时间显示
function updateNextUpdateTime() {
    if (!nextUpdateTime) {
        setNextUpdateTime();
        return;
    }
    
    const now = new Date();
    const diffMs = nextUpdateTime - now;
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    const diffSecs = Math.max(0, Math.floor((diffMs % 60000) / 1000));
    
    const nextUpdateElement = document.getElementById('nextUpdate');
    if (nextUpdateElement) {
        nextUpdateElement.textContent = `${diffMins}:${diffSecs.toString().padStart(2, '0')}`;
    }
    
    const nextUpdateTimeElement = document.getElementById('nextUpdateTime');
    if (nextUpdateTimeElement) {
        if (diffMins > 0) {
            nextUpdateTimeElement.textContent = `${diffMins}分钟后`;
        } else {
            nextUpdateTimeElement.textContent = `${diffSecs}秒后`;
        }
    }
}

// 启动更新倒计时
function startUpdateCountdown() {
    // 清除现有定时器
    if (autoUpdateTimer) {
        clearInterval(autoUpdateTimer);
    }
    
    autoUpdateTimer = setInterval(() => {
        updateNextUpdateTime();
        
        const now = new Date();
        if (now >= nextUpdateTime) {
            // 时间到，自动更新数据
            simulateDataRefresh();
            // 重置下次更新时间
            setNextUpdateTime();
        }
    }, 1000);
}

// 更新最后更新时间
function updateLastUpdateTime() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN');
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                   now.getMinutes().toString().padStart(2, '0');
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = `${dateStr} ${timeStr}`;
    }
}

// ==================== 刷新功能 ====================

// 模拟数据刷新
function simulateDataRefresh() {
    console.log('刷新数据...');
    
    // 随机改变一些区域的状态（模拟实时变化）
    Object.keys(areaData).forEach(key => {
        const area = areaData[key];
        
        // 模拟人数变化（随机变化）
        const change = Math.floor(Math.random() * 30) - 15;
        area.visitors = Math.max(10, Math.min(area.capacity, area.visitors + change));
        
        // 对于B区，模拟警告状态
        if (key === 'B') {
            const percentage = (area.visitors / area.capacity) * 100;
            if (percentage > 95) {
                area.warning = true;
                if (!area.countdown || area.countdown <= 0) {
                    area.countdown = 20;
                }
            } else if (percentage < 85) {
                area.warning = false;
                area.countdown = 0;
            }
        }
    });
    
    // 重新计算状态
    calculateAreaStatus();
    
    // 更新显示
    updateAllData();
    updateLastUpdateTime();
    
    // 显示刷新提示
    showNotification("数据已刷新", "success");
}

// ==================== 通知功能 ====================

// 显示通知
function showNotification(message, type) {
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== 微信优化 ====================

// 微信浏览器检测和优化
function checkWeChatBrowser() {
    const ua = navigator.userAgent.toLowerCase();
    const isWeChat = ua.indexOf('micromessenger') !== -1;
    
    if (isWeChat) {
        console.log('检测到微信浏览器，启用优化模式');
        
        // 添加微信专用样式
        const wechatStyle = document.createElement('style');
        wechatStyle.textContent = `
            /* 微信专用优化 */
            body {
                -webkit-overflow-scrolling: touch !important;
            }
            
            /* 修复微信中点击延迟 */
            * {
                -webkit-tap-highlight-color: rgba(0,0,0,0);
            }
            
            /* 确保按钮在微信中可点击 */
            button, .area {
                cursor: pointer;
            }
        `;
        document.head.appendChild(wechatStyle);
    }
    
    return isWeChat;
}

// ==================== 初始化 ====================

// 更新所有数据
function updateAllData() {
    // 1. 重新计算状态
    calculateAreaStatus();
    
    // 2. 强制设置区域颜色（确保颜色正确）
    forceSetAreaColors();
    
    // 3. 更新区域状态显示
    updateAreaStatus();
    
    // 4. 更新统计信息
    updateStatistics();
    
    // 5. 更新时间戳
    updateTimeStamps();
}

// 页面初始化
function initPage() {
    console.log("初始化页面...");
    
    // 1. 初始化数据
    calculateAreaStatus();
    
    // 2. 强制设置区域颜色（解决黑色显示问题）
    forceSetAreaColors();
    
    // 3. 更新所有显示
    updateAllData();
    
    // 4. 设置区域交互（修复点击响应）
    setupAreaHoverEffects();
    
    // 5. 更新最后更新时间
    updateLastUpdateTime();
    
    // 6. 设置下次更新时间并启动倒计时
    setNextUpdateTime();
    
    // 7. 微信优化
    checkWeChatBrowser();
    
    // 8. 设置刷新按钮
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            simulateDataRefresh();
            // 重置下次更新时间
            setNextUpdateTime();
        });
    }
    
    console.log('景区人流量监控系统初始化完成');
}

// ==================== 启动 ====================

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initPage);

// 添加CSS动画样式
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease;
        color: white;
        font-weight: bold;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes blink {
        0% { opacity: 1; }
        50% { opacity: 0.6; }
        100% { opacity: 1; }
    }
`;
document.head.appendChild(style);
