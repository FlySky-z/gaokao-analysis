#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
获取省份城市选择数据
执行SQL查询并转换为JSON格式
"""

import json
import os
import sys
from typing import Dict, List
import clickhouse_connect
from datetime import datetime

run_sql = """
SELECT
    school_province,
    groupArray(DISTINCT school_city) as cities
FROM gaokao2025 
WHERE school_province IS NOT NULL 
  AND school_province != ''
  AND school_city IS NOT NULL 
  AND school_city != ''
GROUP BY school_province
ORDER BY school_province
"""

# 添加项目根目录到路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# 读取环境变量
from dotenv import load_dotenv

load_dotenv("./.env")

class CityChoiceExtractor:
    """城市选择数据提取器"""
    
    def __init__(self):
        """初始化ClickHouse连接"""
        # ClickHouse连接配置
        self.host = os.getenv('CLICKHOUSE_HOST', 'localhost')
        self.port = int(os.getenv('CLICKHOUSE_PORT', 8123))
        self.username = os.getenv('CLICKHOUSE_USER', 'default')
        self.password = os.getenv('CLICKHOUSE_PASSWORD', '')
        self.database = os.getenv('CLICKHOUSE_DATABASE', 'default')
        
        if self.port == 19000:
            self.port = 18123  # 修正端口号为HTTP端口
        
        try:
            self.client = clickhouse_connect.get_client(
                host=self.host,
                port=self.port,
                username=self.username,
                password=self.password,
                database=self.database
            )
            print(f"✅ 成功连接到ClickHouse: {self.host}:{self.port}")
        except Exception as e:
            print(f"❌ 连接ClickHouse失败: {e}")
            sys.exit(1)

    def load_sql_query(self) -> str:
        """加载SQL查询文件"""
        try:
            return run_sql
        except Exception as e:
            print(f"❌ 加载SQL文件失败: {e}")
            sys.exit(1)
    
    def execute_query(self, sql_query: str) -> Dict[str, List[str]]:
        """执行SQL查询"""
        try:
            print("🔍 执行SQL查询...")
            print(f"SQL: {sql_query}")
            
            result = self.client.query(sql_query)
            
            # 转换为省份-城市映射字典，与province_city.json格式一致
            province_city_map = {}
            for row in result.result_rows:
                province = row[0]
                cities = row[1] if row[1] else []
                # 确保城市列表是字符串列表
                province_city_map[province] = [str(city) for city in cities]
            
            print(f"✅ 查询完成，获得 {len(province_city_map)} 个省份数据")
            return province_city_map
            
        except Exception as e:
            print(f"❌ 执行SQL查询失败: {e}")
            sys.exit(1)
    
    def save_to_json(self, data: Dict[str, List[str]], output_path: str) -> None:
        """保存数据为JSON格式，与province_city.json格式一致"""
        try:
            # 创建输出目录
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # 直接保存省份-城市映射，不包含元数据
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            print(f"✅ 成功保存JSON文件: {output_path}")
            
        except Exception as e:
            print(f"❌ 保存JSON文件失败: {e}")
            sys.exit(1)
    
    def generate_summary(self, data: Dict[str, List[str]]) -> None:
        """生成数据摘要"""
        print("\n📊 数据摘要:")
        print(f"   省份总数: {len(data)}")
        
        total_cities = sum(len(cities) for cities in data.values())
        print(f"   城市总数: {total_cities}")
        
        # 显示前5个省份的城市数量
        print("\n🏙️ 各省份城市数量 (前5个):")
        sorted_provinces = sorted(data.items(), key=lambda x: len(x[1]), reverse=True)
        for i, (province, cities) in enumerate(sorted_provinces[:5]):
            print(f"   {i+1}. {province}: {len(cities)} 个城市")
            
        # 显示示例省份的城市列表
        if sorted_provinces:
            example_province, example_cities = sorted_provinces[0]
            print(f"\n🏙️ 示例 - {example_province} 的城市:")
            for city in example_cities[:10]:  # 只显示前10个城市
                print(f"   • {city}")
            if len(example_cities) > 10:
                print(f"   ... 还有 {len(example_cities) - 10} 个城市")

    def run(self, output_path: str) -> None:
        """执行完整流程"""
        print("🚀 开始获取省份城市数据...")
        
        # 1. 加载SQL查询
        sql_query = self.load_sql_query()
        
        # 2. 执行查询
        data = self.execute_query(sql_query)
        
        # 3. 生成摘要
        self.generate_summary(data)
        
        # 4. 保存JSON
        self.save_to_json(data, output_path)
        
        print("🎉 数据提取完成!")

def main():
    """主函数"""
    # 文件路径配置
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(script_dir, 'province_city.json')  # 更改输出文件名以匹配格式
    
    # 创建提取器实例
    extractor = CityChoiceExtractor()
    
    # 执行数据提取
    extractor.run(output_file)

if __name__ == '__main__':
    main()
