document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const refreshBtn = document.getElementById('refreshBtn');
    const totalVisitors = document.getElementById('totalVisitors');
    const recommendedAreas = document.getElementById('recommendedAreas');
    const updateTime = document.getElementById('updateTime');
    const lastUpdate = document.getElementById('lastUpdate');
    const timeElements = {
        A: document.getElementById('timeA'),
        B: document.getElementById('timeB'),
        C: document.getElementById('timeC'),
        D: document.getElementById('timeD')
    };
    
    // 获取所有区域元素
    const areaElements = document.querySelectorAll('.area');
    
    // 模拟数据 - 在实际应用中，这些数据应该来自API
    const areaData = {
        A: { recommended: true, density: "适中", visitors: 280 },
        B: { recommended: false, density: "拥挤", visitors: 450 },
        C: { recommended: true, density: "较少", visitors: 150 },
        D: { recommended: false, density: "拥挤", visitors: 365 }
    };
    
    // 初始化页面
    function initPage() {
        updateAllData();
        setupAreaHoverEffects();
        updateLastUpdateTime();
    }
    
    // 更新所有数据
    function updateAllData() {
        updateAreaStatus();
        updateStatistics();
        updateTimeStamps();
    }
    
    // 更新区域状态
    function updateAreaStatus() {
        areaElements.forEach(area => {
            const areaId = area.getAttribute('data-area');
            const data = areaData[areaId];
            
            // 更新区域颜色
            if (data.recommended) {
                area.classList.remove('not-recommended');
                area.classList.add('recommended');
            } else {
                area.classList.remove('recommended');
                area.classList.add('not-recommended');
            }
            
            // 更新tooltip
            const statusText = data.recommended ? "推荐游览" : "不推荐游览";
            area.setAttribute('title', `区域${areaId} - 人流密度: ${data.density} - ${statusText}`);
        });
    }
    
    // 更新统计信息
    function updateStatistics() {
        // 计算总人数
        let total = 0;
        let recommendedCount = 0;
        
        Object.keys(areaData).forEach(key => {
            total += areaData[key].visitors;
            if (areaData[key].recommended) {
                recommendedCount++;
            }
        });
        
        // 添加一些随机变化（模拟实时数据）
        const randomChange = Math.floor(Math.random() * 40) - 20;
        total += randomChange;
        
        // 更新显示
        totalVisitors.textContent = total.toLocaleString();
        recommendedAreas.textContent = recommendedCount;
        
        // 更新当前时间
        const now = new Date();
        const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                          now.getMinutes().toString().padStart(2, '0');
        updateTime.textContent = timeString;
    }
    
    // 更新时间戳
    function updateTimeStamps() {
        const now = new Date();
        const minutes = now.getMinutes();
        
        Object.keys(timeElements).forEach(key => {
            // 模拟不同区域的最后更新时间
            const randomMinutesAgo = Math.floor(Math.random() * 5);
            const updateTime = new Date(now.getTime() - randomMinutesAgo * 60000);
            const timeString = updateTime.getHours().toString().padStart(2, '0') + ':' + 
                              updateTime.getMinutes().toString().padStart(2, '0');
            
            if (randomMinutesAgo === 0) {
                timeElements[key].textContent = "刚刚";
            } else {
                timeElements[key].textContent = `${randomMinutesAgo}分钟前`;
            }
        });
    }
    
    // 设置区域悬停效果
    function setupAreaHoverEffects() {
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
    
    // 显示区域详情（简单示例）
    function showAreaDetails(areaId) {
        const data = areaData[areaId];
        const status = data.recommended ? "推荐游览" : "不推荐游览";
        const color = data.recommended ? "#2ecc71" : "#e74c3c";
        
        alert(`区域 ${areaId} 详情\n\n` +
              `状态: ${status}\n` +
              `人流密度: ${data.density}\n` +
              `预估人数: ${data.visitors}\n` +
              `建议: ${data.recommended ? '适合当前游览' : '建议避开或错峰游览'}`);
    }
    
    // 更新最后更新时间
    function updateLastUpdateTime() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('zh-CN');
        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0');
        lastUpdate.textContent = `${dateStr} ${timeStr}`;
    }
    
    // 模拟数据刷新
    function simulateDataRefresh() {
        // 随机改变一些区域的状态（模拟实时变化）
        Object.keys(areaData).forEach(key => {
            // 20%的概率改变推荐状态
            if (Math.random() < 0.2) {
                areaData[key].recommended = !areaData[key].recommended;
                areaData[key].density = areaData[key].recommended ? 
                    (Math.random() > 0.5 ? "适中" : "较少") : "拥挤";
            }
            
            // 更新人数（随机变化）
            const change = Math.floor(Math.random() * 60) - 30;
            areaData[key].visitors = Math.max(50, areaData[key].visitors + change);
        });
        
        updateAllData();
        updateLastUpdateTime();
        
        // 显示刷新提示
        showNotification("数据已刷新", "success");
    }
    
    // 显示通知
    function showNotification(message, type) {
        // 移除可能存在的旧通知
        const oldNotification = document.querySelector('.notification');
        if (oldNotification) {
            oldNotification.remove();
        }
        
        // 创建新通知
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // 添加样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background-color: ${type === 'success' ? '#2ecc71' : '#e74c3c'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
        `;
        
        // 3秒后自动移除
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // 添加CSS动画
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            color: white;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .notification.success {
            background-color: #2ecc71;
        }
        
        .notification.error {
            background-color: #e74c3c;
        }
    `;
    document.head.appendChild(style);
    
    // 绑定刷新按钮事件
    refreshBtn.addEventListener('click', simulateDataRefresh);
    // 在 initPage 函数中添加这个调用
function initPage() {
    updateAllData();
    setupAreaHoverEffects();
    updateLastUpdateTime();
    forceSetAreaColors(); // 添加这行
}

// 添加这个新函数
function forceSetAreaColors() {
    const areaA = document.getElementById('areaA');
    const areaB = document.getElementById('areaB');
    const areaC = document.getElementById('areaC');
    const areaD = document.getElementById('areaD');
    
    if (areaA) areaA.style.fill = '#2ecc71';
    if (areaB) areaB.style.fill = '#e74c3c';
    if (areaC) areaC.style.fill = '#2ecc71';
    if (areaD) areaD.style.fill = '#e74c3c';
    
    // 同时设置描边
    [areaA, areaB, areaC, areaD].forEach(area => {
        if (area) {
            area.style.stroke = 'white';
            area.style.strokeWidth = '3px';
        }
    });
}
    // 模拟自动刷新（每30秒）
    setInterval(simulateDataRefresh, 30000);
    
    // 初始化页面
    initPage();
});
