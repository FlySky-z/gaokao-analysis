#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
处理高考分数数据，从XLSX文件生成JSON格式
"""

import pandas as pd
import json
import os

def process_gaokao_data(province="hubei", score_type="history"):
    """
    处理高考分数数据，从XLSX转换为JSON格式
    
    Args:
        province: 省份代码，如 "hubei"
        score_type: 分数类型，如 "physics" 或 "history"
    """
    # 获取用户主目录
    home_dir = os.path.expanduser("~/Downloads")
    
    # 根据类型构建输入文件名
    type_mapping = {
        "physics": "物理类",
        "history": "历史类"
    }
    type_chinese = type_mapping.get(score_type, "历史类")
    xlsx_file = os.path.join(home_dir, f'25湖北一分一段表{type_chinese}.xlsx')
    
    # 获取当前脚本所在目录用于输出文件
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_file = os.path.join(script_dir, f'ranking_score_{province}_{score_type}.json')

    try:
        # 读取XLSX文件，只读取前三列，score列设置为文本类型
        df = pd.read_excel(xlsx_file, usecols=[0, 1, 2], dtype={0: str})
        
        # 重命名列名以匹配要求的JSON格式
        df.columns = ['score', 'num', 'accumulate']
        
        # 过滤掉分数低于180分的记录
        original_count = len(df)
        df['score_int'] = pd.to_numeric(df['score'], errors='coerce')
        df = df[df['score_int'] >= 120].copy()
        df = df.drop('score_int', axis=1)  # 删除临时列
        filtered_count = len(df)
        
        print(f"原始记录数: {original_count}")
        print(f"过滤后记录数: {filtered_count}")
        print(f"过滤掉 {original_count - filtered_count} 条低于120分的记录")

        # 将DataFrame转换为字典列表
        data_list = df.to_dict('records')
        
        data = {
            "data": data_list
        }
        
        # 生成JSON文件
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"数据处理完成！")
        print(f"输入文件: {xlsx_file}")
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
    
    # 处理物理类数据
    print("\n=== 处理物理类数据 ===")
    physics_result = process_gaokao_data(province="hubei", score_type="physics")
    
    # 处理历史类数据  
    print("\n=== 处理历史类数据 ===")
    history_result = process_gaokao_data(province="hubei", score_type="history")
    
    # 输出总结
    success_count = sum([1 for result in [physics_result, history_result] if result])
    total_count = 2
    
    print(f"\n{'='*50}")
    print(f"处理完成！成功: {success_count}/{total_count}")
    
    if success_count == total_count:
        print("✅ 所有数据处理成功完成！")
    elif success_count > 0:
        print("⚠️ 部分数据处理成功！")
    else:
        print("❌ 数据处理失败！")

if __name__ == "__main__":
    main()