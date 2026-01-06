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

// ==================== 核心功能 ====================

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
    calculateAreaStatus();
    
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
        } else if (data.color === 'yellow') {
            area.classList.add('area-yellow');
        } else if (data.color === 'red') {
            area.classList.add('area-red');
        }
        
        // 如果是B区且达到上限，添加警告闪烁
        if (areaId === 'B' && data.warning) {
            area.classList.add('area-warning');
            createCountdownOverlay(areaId, data.countdown);
        } else {
            removeCountdownOverlay(areaId);
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
                    <i class="fas fa-info-circle"></i> 数据每5分钟更新一次
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
        area.addEventListener('mouseenter', function() {
            const areaId = this.getAttribute('data-area');
            highlightArea(areaId, true);
        });
        
        area.addEventListener('mouseleave', function() {
            const areaId = this.getAttribute('data-area');
            highlightArea(areaId, false);
        });
        
        area.addEventListener('click', function() {
            const areaId = this.getAttribute('data-area');
            showAreaDetails(areaId);
        });
    });
}

// 高亮区域
function highlightArea(areaId, isHighlighted) {
    const area = document.getElementById(`area${areaId}`);
    if (!area) return;
    
    if (isHighlighted) {
        area.style.filter = 'brightness(1.2) drop-shadow(0 0 8px rgba(0,0,0,0.3))';
        area.style.transform = 'scale(1.02)';
        area.style.transformOrigin = 'center';
    } else {
        area.style.filter = '';
        area.style.transform = '';
    }
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
    document.getElementById('totalVisitors').textContent = totalVisitors.toLocaleString();
    
    // 更新舒适区域数
    document.getElementById('comfortableAreas').textContent = comfortableCount;
    
    // 更新当前时间
    const now = new Date();
    const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                      now.getMinutes().toString().padStart(2, '0');
    document.getElementById('updateTime').textContent = timeString;
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
    const queueSpan = statusItem.querySelector('.status-time span');
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

// 更新最后更新时间
function updateLastUpdateTime() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN');
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                   now.getMinutes().toString().padStart(2, '0');
    document.getElementById('lastUpdate').textContent = `${dateStr} ${timeStr}`;
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

// ==================== 二维码功能 ====================

// 生成二维码
function generateQRCode() {
    try {
        let url = window.location.href;
        
        // 如果当前是本地文件，使用GitHub Pages URL
        if (url.startsWith('file://')) {
            url = "https://lllinqingshu.github.io/scenic-traffic-display/";
        }
        
        const qrContainer = document.getElementById('qrCanvas');
        if (!qrContainer) return;
        
        const ctx = qrContainer.getContext('2d');
        ctx.clearRect(0, 0, qrContainer.width, qrContainer.height);
        
        QRCode.toCanvas(qrContainer, url, {
            width: 170,
            height: 170,
            margin: 1,
            color: {
                dark: '#2c3e50',
                light: '#ffffff'
            },
            errorCorrectionLevel: 'H'
        }, function(error) {
            if (error) {
                console.error('生成二维码失败:', error);
                showQRCodeError();
            } else {
                console.log('二维码生成成功:', url);
                addLogoToQRCode();
                setupQRButtons(url);
            }
        });
        
    } catch (error) {
        console.error('二维码生成异常:', error);
        showQRCodeError();
    }
}

// 在二维码中心添加logo
function addLogoToQRCode() {
    const canvas = document.getElementById('qrCanvas');
    const ctx = canvas.getContext('2d');
    
    ctx.save();
    
    // 绘制白色背景
    ctx.fillStyle = 'white';
    ctx.fillRect(85, 85, 30, 30);
    
    // 绘制logo
    ctx.fillStyle = '#9b59b6';
    ctx.beginPath();
    ctx.arc(100, 100, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px FontAwesome';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⛰', 100, 100);
    
    ctx.restore();
}

// 设置二维码按钮功能
function setupQRButtons(url) {
    // 下载按钮
    const downloadBtn = document.getElementById('downloadQR');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            downloadQRCode(url);
        });
    }
    
    // 刷新按钮
    const refreshBtn = document.getElementById('refreshQR');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            generateQRCode();
            showNotification('二维码已刷新', 'success');
        });
    }
}

// 下载二维码
function downloadQRCode(url) {
    try {
        const canvas = document.getElementById('qrCanvas');
        const link = document.createElement('a');
        link.download = `景区人流量监控-${new Date().toISOString().slice(0,10)}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('二维码下载成功！', 'success');
    } catch (error) {
        console.error('下载二维码失败:', error);
        showNotification('下载失败，请重试', 'error');
    }
}

// 显示二维码错误
function showQRCodeError() {
    const qrContainer = document.getElementById('qrCodeContainer');
    if (qrContainer) {
        qrContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #e74c3c;">
                <i class="fas fa-exclamation-triangle" style="font-size: 40px;"></i>
                <p style="margin-top: 10px;">生成二维码失败</p>
            </div>
        `;
    }
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
    updateAreaStatus();
    updateStatistics();
    updateTimeStamps();
}

// 页面初始化
function initPage() {
    // 初始化数据
    calculateAreaStatus();
    
    // 更新所有显示
    updateAllData();
    
    // 设置区域交互
    setupAreaHoverEffects();
    
    // 更新最后更新时间
    updateLastUpdateTime();
    
    // 生成二维码
    setTimeout(() => {
        generateQRCode();
    }, 500);
    
    // 微信优化
    checkWeChatBrowser();
    
    // 设置刷新按钮
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', simulateDataRefresh);
    }
    
    // 模拟自动刷新（每30秒）
    setInterval(simulateDataRefresh, 30000);
    
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
`;
document.head.appendChild(style);
