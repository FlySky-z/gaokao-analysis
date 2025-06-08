#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
处理高考分数数据，从CSV文件生成JSON格式
"""

import pandas as pd
import json
import os

def process_gaokao_data():
    """
    处理高考分数数据，从CSV转换为JSON格式
    """
    # 获取当前脚本所在目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_file = os.path.join(script_dir, 'history.csv')
    json_file = os.path.join(script_dir, 'ranking_score_history.json')
    
    try:
        # 读取CSV文件，指定分隔符为制表符
        df = pd.read_csv(csv_file, sep='\t', encoding='utf-8')
        
        # 重命名列名以匹配要求的JSON格式
        df.columns = ['score', 'num', 'accumulate']
        
        # 将DataFrame转换为字典列表
        data_list = df.to_dict('records')
        
        data = {
            "data": data_list
        }
        
        # 生成JSON文件
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"数据处理完成！")
        print(f"输入文件: {csv_file}")
        print(f"输出文件: {json_file}")
        print(f"总计处理了 {len(data_list)} 条记录")
        
        # 显示前几条数据作为预览
        print("\n前5条数据预览:")
        for i, record in enumerate(data_list[:5]):
            print(f"{i+1}. {record}")
            
        return data_list
        
    except Exception as e:
        print(f"处理数据时出错: {e}")
        return None

def main():
    """主函数"""
    print("开始处理高考分数数据...")
    result = process_gaokao_data()
    
    if result:
        print(f"\n✅ 数据处理成功完成！")
    else:
        print(f"\n❌ 数据处理失败！")

if __name__ == "__main__":
    main()