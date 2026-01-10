import cv2
import numpy as np
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import base64
import io
from PIL import Image
import time
import threading
import json
import os
from datetime import datetime
import random

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 景区数据存储
scenic_data = {
    "areas": {
        "A": {"name": "广场", "visitors": 120, "capacity": 300, "status": "crowded", "queueTime": 15},
        "B": {"name": "观景台", "visitors": 190, "capacity": 200, "status": "warning", "queueTime": 25},
        "C": {"name": "花园", "visitors": 120, "capacity": 250, "status": "comfortable", "queueTime": 5},
        "D": {"name": "步道", "visitors": 150, "capacity": 180, "status": "normal", "queueTime": 10}
    },
    "last_update": datetime.now().isoformat(),
    "total_visitors": 580,
    "comfortable_areas": 1,
    "alert_areas": 2
}

# 模拟YOLO检测的类别
CLASS_NAMES = ['person', 'car', 'bus', 'truck', 'bicycle', 'motorcycle', 'dog', 'cat', 'backpack', 'umbrella']

@app.route('/')
def index():
    return jsonify({
        "name": "景区人流量监控系统API",
        "version": "2.0.0",
        "description": "提供景区数据管理和YOLO视频分析服务",
        "endpoints": {
            "/api/health": "GET - 健康检查",
            "/api/scenic-data": "GET - 获取景区数据, POST - 更新景区数据",
            "/api/detect": "POST - YOLO图像检测",
            "/api/video/stream": "POST - 视频流分析",
            "/api/simulate/update": "POST - 模拟数据更新"
        }
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy", 
        "model": "yolo-v8-simulated",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/scenic-data', methods=['GET'])
def get_scenic_data():
    """获取景区数据"""
    # 更新总人数
    scenic_data["total_visitors"] = sum(
        area["visitors"] for area in scenic_data["areas"].values()
    )
    
    # 更新舒适和预警区域数量
    comfortable = sum(1 for area in scenic_data["areas"].values() if area["status"] == "comfortable")
    alert = sum(1 for area in scenic_data["areas"].values() if area["status"] in ["crowded", "warning"])
    
    scenic_data["comfortable_areas"] = comfortable
    scenic_data["alert_areas"] = alert
    scenic_data["last_update"] = datetime.now().isoformat()
    
    return jsonify(scenic_data)

@app.route('/api/scenic-data', methods=['POST'])
def update_scenic_data():
    """更新景区数据（管理端调用）"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # 更新区域数据
        if "areas" in data:
            for area_id, area_data in data["areas"].items():
                if area_id in scenic_data["areas"]:
                    scenic_data["areas"][area_id].update(area_data)
        
        # 更新其他数据
        if "total_visitors" in data:
            scenic_data["total_visitors"] = data["total_visitors"]
        
        scenic_data["last_update"] = datetime.now().isoformat()
        
        return jsonify({
            "message": "Data updated successfully",
            "data": scenic_data
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/detect', methods=['POST'])
def detect_objects():
    """
    接收base64编码的图片，返回YOLO检测结果（模拟版）
    """
    try:
        data = request.json
        if not data or 'image' not in data:
            return jsonify({"error": "No image provided"}), 400
        
        # 获取置信度阈值
        confidence_threshold = data.get('confidence_threshold', 0.5)
        
        # 解码base64图片（仅用于获取图像尺寸）
        image_data = data['image']
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        width, height = image.size
        
        # 生成模拟的检测结果
        detections = []
        num_detections = random.randint(3, 15)  # 随机生成3-15个检测结果
        
        for _ in range(num_detections):
            # 随机生成边界框
            x1 = random.randint(0, width - 100)
            y1 = random.randint(0, height - 100)
            x2 = x1 + random.randint(50, 200)
            y2 = y1 + random.randint(50, 200)
            
            # 确保边界框在图像内
            x2 = min(x2, width)
            y2 = min(y2, height)
            
            # 随机选择类别
            class_name = random.choice(CLASS_NAMES)
            
            # 生成置信度（确保高于阈值）
            confidence = max(confidence_threshold + random.random() * 0.3, 0.95)
            
            detections.append({
                "bbox": [float(x1), float(y1), float(x2), float(y2)],
                "confidence": float(confidence),
                "class": class_name,
                "class_id": CLASS_NAMES.index(class_name)
            })
        
        # 确保至少有一个人
        if not any(d["class"] == "person" for d in detections):
            x1 = random.randint(0, width - 100)
            y1 = random.randint(0, height - 100)
            x2 = x1 + 80
            y2 = y1 + 160
            
            detections.append({
                "bbox": [float(x1), float(y1), float(x2), float(y2)],
                "confidence": float(0.85 + random.random() * 0.1),
                "class": "person",
                "class_id": 0
            })
        
        # 统计人数
        person_count = sum(1 for d in detections if d["class"] == "person")
        
        return jsonify({
            "detections": detections,
            "person_count": person_count,
            "total_detections": len(detections),
            "frame_size": [height, width],
            "timestamp": datetime.now().isoformat(),
            "inference_time": random.randint(30, 80)  # 模拟推理时间
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/video/stream', methods=['POST'])
def video_stream_analysis():
    """视频流分析（模拟）"""
    try:
        data = request.json
        area = data.get('area', 'A')
        duration = data.get('duration', 10)  # 分析时长（秒）
        
        # 根据区域模拟不同的人流量
        area_multipliers = {
            'A': 2.0,  # 广场人多
            'B': 1.5,  # 观景台较多
            'C': 1.0,  # 花园正常
            'D': 0.8   # 步道人少
        }
        
        multiplier = area_multipliers.get(area, 1.0)
        base_count = scenic_data["areas"][area]["visitors"] if area in scenic_data["areas"] else 100
        
        # 生成模拟检测结果
        person_count = int(base_count * multiplier * random.uniform(0.8, 1.2))
        
        # 更新景区数据
        if area in scenic_data["areas"]:
            scenic_data["areas"][area]["visitors"] = person_count
            
            # 更新状态
            capacity = scenic_data["areas"][area]["capacity"]
            percentage = (person_count / capacity) * 100
            
            if percentage < 70:
                status = "comfortable"
            elif percentage < 85:
                status = "normal"
            else:
                status = "crowded"
            
            scenic_data["areas"][area]["status"] = status
            
            # 更新总人数
            total = sum(area["visitors"] for area in scenic_data["areas"].values())
            scenic_data["total_visitors"] = total
            scenic_data["last_update"] = datetime.now().isoformat()
        
        return jsonify({
            "area": area,
            "person_count": person_count,
            "total_visitors": scenic_data["total_visitors"],
            "status": scenic_data["areas"].get(area, {}).get("status", "unknown"),
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/simulate/update', methods=['POST'])
def simulate_update():
    """模拟数据更新（用于演示）"""
    try:
        # 随机更新各区域人数
        for area_id, area_data in scenic_data["areas"].items():
            # 根据区域类型决定变化范围
            if area_id == 'B':  # 观景台容易满
                change = random.randint(-10, 15)
            elif area_id == 'C':  # 花园比较稳定
                change = random.randint(-5, 8)
            else:
                change = random.randint(-8, 12)
            
            # 应用变化，确保在合理范围内
            current = area_data["visitors"]
            capacity = area_data["capacity"]
            new_count = max(10, min(capacity, current + change))
            
            area_data["visitors"] = new_count
            
            # 更新排队时间
            if new_count < capacity * 0.3:
                area_data["queueTime"] = random.randint(1, 5)
            elif new_count < capacity * 0.7:
                area_data["queueTime"] = random.randint(5, 15)
            else:
                area_data["queueTime"] = random.randint(15, 30)
            
            # 更新状态
            percentage = (new_count / capacity) * 100
            if percentage < 70:
                area_data["status"] = "comfortable"
            elif percentage < 85:
                area_data["status"] = "normal"
            else:
                area_data["status"] = "crowded"
        
        # 更新总人数
        scenic_data["total_visitors"] = sum(
            area["visitors"] for area in scenic_data["areas"].values()
        )
        scenic_data["last_update"] = datetime.now().isoformat()
        
        return jsonify({
            "message": "Data simulated successfully",
            "data": scenic_data
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/logs', methods=['GET'])
def get_logs():
    """获取系统日志"""
    logs = [
        {"time": "15:30:45", "action": "系统启动", "type": "info"},
        {"time": "15:32:10", "action": "数据更新完成", "type": "success"},
        {"time": "15:35:22", "action": "B区达到上限警告", "type": "warning"},
        {"time": "15:40:18", "action": "视频分析系统连接", "type": "info"},
        {"time": datetime.now().strftime("%H:%M:%S"), "action": "API请求成功", "type": "success"}
    ]
    return jsonify({"logs": logs})

@app.route('/api/reset', methods=['POST'])
def reset_data():
    """重置数据到初始状态"""
    global scenic_data
    
    scenic_data = {
        "areas": {
            "A": {"name": "广场", "visitors": 120, "capacity": 300, "status": "crowded", "queueTime": 15},
            "B": {"name": "观景台", "visitors": 190, "capacity": 200, "status": "warning", "queueTime": 25},
            "C": {"name": "花园", "visitors": 120, "capacity": 250, "status": "comfortable", "queueTime": 5},
            "D": {"name": "步道", "visitors": 150, "capacity": 180, "status": "normal", "queueTime": 10}
        },
        "last_update": datetime.now().isoformat(),
        "total_visitors": 580,
        "comfortable_areas": 1,
        "alert_areas": 2
    }
    
    return jsonify({
        "message": "Data reset to default",
        "data": scenic_data
    })

# 后台数据更新线程
def background_updater():
    """每2分钟自动更新一次数据"""
    while True:
        time.sleep(120)  # 2分钟
        try:
            # 模拟自然数据变化
            for area_id, area_data in scenic_data["areas"].items():
                # 模拟人数变化
                change = random.randint(-10, 10)
                current = area_data["visitors"]
                capacity = area_data["capacity"]
                area_data["visitors"] = max(10, min(capacity, current + change))
                
                # 更新状态
                percentage = (area_data["visitors"] / capacity) * 100
                if percentage < 70:
                    area_data["status"] = "comfortable"
                elif percentage < 85:
                    area_data["status"] = "normal"
                else:
                    area_data["status"] = "crowded"
            
            # 更新总人数
            scenic_data["total_visitors"] = sum(
                area["visitors"] for area in scenic_data["areas"].values()
            )
            scenic_data["last_update"] = datetime.now().isoformat()
            
            print(f"[{datetime.now().strftime('%H:%M:%S')}] 数据自动更新完成")
            
        except Exception as e:
            print(f"后台更新出错: {e}")

if __name__ == '__main__':
    # 启动后台更新线程
    thread = threading.Thread(target=background_updater, daemon=True)
    thread.start()
    
    print("=" * 60)
    print("景区人流量监控系统 API 服务器")
    print("=" * 60)
    print(f"启动时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"服务器地址: http://localhost:5000")
    print("=" * 60)
    print("API端点:")
    print("  GET  /              - API文档")
    print("  GET  /api/health    - 健康检查")
    print("  GET  /api/scenic-data - 获取景区数据")
    print("  POST /api/scenic-data - 更新景区数据")
    print("  POST /api/detect    - YOLO图像检测（模拟）")
    print("  POST /api/video/stream - 视频流分析")
    print("  POST /api/simulate/update - 模拟数据更新")
    print("  GET  /api/logs      - 获取系统日志")
    print("  POST /api/reset     - 重置数据")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=5000, debug=True)
