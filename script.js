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

let countdownIntervals = {};
let autoUpdateTimer = null;
let nextUpdateTime = null;

// ==================== 核心功能 ====================

function colorHexByName(colorName) {
  if (colorName === "green") return "#2ecc71";
  if (colorName === "yellow") return "#f1c40f";
  return "#e74c3c";
}

function calculateAreaStatus() {
  Object.keys(areaData).forEach(key => {
    const area = areaData[key];
    const percentage = (area.visitors / area.capacity) * 100;

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

      // B区特殊：>95% 警告
      if (key === "B" && percentage > 95) {
        area.warning = true;
        area.statusText = "已达上限";
        if (!area.countdown) area.countdown = 20;
      } else {
        area.warning = false;
      }
    }
  });
}

function updateAreaTooltip(areaId) {
  const area = document.getElementById(`area${areaId}`);
  if (!area) return;

  const data = areaData[areaId];
  const percentage = Math.round((data.visitors / data.capacity) * 100);

  area.setAttribute(
    "title",
    `${data.name} (${areaId}区)\n` +
      `当前人数: ${data.visitors}/${data.capacity} (${percentage}%)\n` +
      `状态: ${data.statusText}\n` +
      `预计排队: ${data.queueTime}分钟\n` +
      `点击查看详情`
  );
}

function removeCountdownOverlay(areaId) {
  const countdownElement = document.getElementById(`countdown-${areaId}`);
  if (countdownElement) countdownElement.remove();

  if (countdownIntervals[areaId]) {
    clearInterval(countdownIntervals[areaIdIdId
