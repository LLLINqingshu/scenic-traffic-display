// 景区人流量监控系统 - 主脚本文件

// ==================== 数据模型 ====================
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

// ==================== 初始化 ====================
function init() {
    console.log("初始化景区监控系统...");
    updateAllData();
    setupInteractions();
    startAutoUpdate();
}

// 更新所有数据
function updateAllData() {
    updateAreaColors();
    updateStatistics();
    updateTimeDisplay();
}

// 强制设置区域颜色
function updateAreaColors() {
    ['A', 'B', 'C', 'D'].forEach(areaId => {
        const area = document.getElementById(`area${areaId}`);
        if (!area) return;
        
        const data = areaData[areaId];
        
        // 移除所有颜色类
        area.classList.remove('area-green', 'area-yellow', 'area-red');
        
        // 根据状态添加对应颜色类
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
        
        // 设置边框
        area.style.stroke = 'white';
        area.style.strokeWidth = '3px';
        area.style.opacity = '0.9';
        
        // 更新tooltip
        updateTooltip(areaId);
    });
}

// 更新tooltip
function updateTooltip(areaId) {
    const area = document.getElementById(`area${areaId}`);
    if (!area) return;
    
    const data = areaData[areaId];
    const percentage = Math.round((data.visitors / data.capacity) * 100);
    
    area.setAttribute('title', 
        `${data.name} (${areaId}区)\n` +
        `人数: ${data.visitors}/${data.capacity} (${percentage}%)\n` +
        `状态: ${data.statusText}\n` +
        `排队: ${data.queueTime}分钟\n` +
        `点击查看详情`
    );
}

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
        
        // 更新右侧状态
        updateStatusItem(key, area);
    });
    
    // 更新总人数
    const totalElement = document.getElementById('totalVisitors');
    if (totalElement) {
        totalElement.textContent = totalVisitors.toLocaleString();
    }
    
    // 更新舒适区域数
    const comfortableElement = document.getElementById('comfortableAreas');
    if (comfortableElement) {
        comfortableElement.textContent = comfortableCount;
    }
    
    // 更新时间
    updateCurrentTime();
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
        } else if (data.color === 'yellow') {
            indicator.classList.add('status-yellow');
        } else {
            indicator.classList.add('status-red');
        }
        indicator.textContent = data.statusText;
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

// 更新时间显示
function updateTimeDisplay() {
    const now = new Date();
    const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                      now.getMinutes().toString().padStart(2, '0');
    
    const updateTimeElement = document.getElementById('updateTime');
    if (updateTimeElement) {
        updateTimeElement.textContent = timeString;
    }
    
    // 更新最后更新时间
    const dateStr = now.toLocaleDateString('zh-CN');
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                   now.getMinutes().toString().padStart(2, '0');
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement) {
        lastUpdateElement.textContent = `${dateStr} ${timeStr}`;
    }
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

// 设置交互功能
function setupInteractions() {
    // 区域点击事件
    const areas = document.querySelectorAll('.area');
    areas.forEach(area => {
        area.addEventListener('click', function() {
            const areaId = this.getAttribute('data-area');
            showAreaDetails(areaId);
        });
        
        // 悬停效果
        area.addEventListener('mouseenter', function() {
            this.style.filter = 'brightness(1.2)';
            this.style.transform = 'scale(1.02)';
        });
        
        area.addEventListener('mouseleave', function() {
            this.style.filter = '';
            this.style.transform = '';
        });
    });
    
    // 刷新按钮
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', simulateDataRefresh);
    }
}

// 显示区域详情
function showAreaDetails(areaId) {
    const data = areaData[areaId];
    const percentage = Math.round((data.visitors / data.capacity) * 100);
    
    let statusIndicator = '';
    if (data.color === 'green') {
        statusIndicator = `<span class="status-indicator status-green">${data.statusText}</span>`;
    } else if (data.color === 'yellow') {
        statusIndicator = `<span class="status-indicator status-yellow">${data.statusText}</span>`;
    } else {
        statusIndicator = `<span class="status-indicator status-red">${data.statusText}</span>`;
    }
    
    alert(
        `${data.name} (${areaId}区)\n\n` +
        `当前人数: ${data.visitors}/${data.capacity} (${percentage}%)\n` +
        `状态: ${data.statusText}\n` +
        `预计排队: ${data.queueTime}分钟\n` +
        `建议前往: ${data.recommendedTime}${data.alternative ? '\n推荐替代: ' + data.alternative : ''}`
    );
}

// 模拟数据刷新
function simulateDataRefresh() {
    console.log('刷新数据...');
    
    // 简单模拟数据变化
    Object.keys(areaData).forEach(key => {
        const area = areaData[key];
        const change = Math.floor(Math.random() * 20) - 10;
        area.visitors = Math.max(10, Math.min(area.capacity, area.visitors + change));
        
        // 重新计算状态
        const percentage = (area.visitors / area.capacity) * 100;
        if (percentage < 70) {
            area.status = "comfortable";
            area.statusText = "舒适";
            area.color = "green";
            area.queueTime = Math.floor(Math.random() * 5) + 1;
            area.recommendedTime = "现在";
        } else if (percentage >= 70 && percentage <= 85) {
            area.status = "normal";
            area.statusText = "一般";
            area.color = "yellow";
            area.queueTime = Math.floor(Math.random() * 10) + 5;
            area.recommendedTime = "10分钟后";
        } else {
            area.status = "crowded";
            area.statusText = "拥挤";
            area.color = "red";
            area.queueTime = Math.floor(Math.random() * 15) + 10;
            area.recommendedTime = "20分钟后";
        }
    });
    
    updateAllData();
    
    // 简单通知
    const notification = document.createElement('div');
    notification.textContent = '数据已刷新！';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2ecc71;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
        animation: fadeInOut 2s ease;
    `;
    
    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateX(100%); }
            20% { opacity: 1; transform: translateX(0); }
            80% { opacity: 1; transform: translateX(0); }
            100% { opacity: 0; transform: translateX(100%); }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    setTimeout(() => {
        if (notification.parentNode) {
            document.body.removeChild(notification);
        }
    }, 2000);
}

// 自动更新
function startAutoUpdate() {
    // 每30秒自动更新一次
    setInterval(() => {
        simulateDataRefresh();
    }, 30000);
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
