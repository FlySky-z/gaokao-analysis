import { NextRequest, NextResponse } from 'next/server';

// 定义API接口类型
interface ApiRequest {
  citys?: string;
  college_type?: string;
  enrollment_plan?: string;
  max_score?: string;
  min_score?: string;
  profile_id?: string;
  province?: string;
  rank?: number;
  score?: number;
  strategy?: number;
  subjects?: string;
}

// 转换前端查询数据为API格式
function transformQueryData(queryData: unknown): ApiRequest {
  const data = queryData as {
    province: string;
    score: number;
    rank?: number;
    subjects: string[];
    strategy: number;
    collegeTypes?: string[];
    citys?: string[];
    minScore?: number;
    maxScore?: number;
    enrollmentPlan?: string;
  };
  
  return {
    province: data.province,
    score: data.score,
    rank: data.rank,
    subjects: data.subjects.join(','),
    strategy: data.strategy,
    college_type: data.collegeTypes?.join(','),
    citys: data.citys?.join(','),
    min_score: data.minScore?.toString(),
    max_score: data.maxScore?.toString(),
    enrollment_plan: data.enrollmentPlan,
  };
}

export async function POST(request: NextRequest) {
  try {
    const queryData = await request.json();
    
    // 转换查询参数
    const apiParams = transformQueryData(queryData);
    
    // 构建 FormData
    const formData = new FormData();
    Object.entries(apiParams).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        formData.append(key, value.toString());
      }
    });
    
    // 调用后端API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    const apiUrl = `${backendUrl}/api/voluntary/universityPriority`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 检查返回数据格式
    if (data.code !== 200) {
      throw new Error(data.msg || '查询失败');
    }
    
    return NextResponse.json(data.data);
    
  } catch (error) {
    console.error('查询院校数据失败:', error);
    
    return NextResponse.json(
      { 
        error: '查询失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// 健康检查接口
export async function GET() {
  return NextResponse.json({ 
    message: '高考志愿查询API正常运行',
    timestamp: new Date().toISOString()
  });
}
