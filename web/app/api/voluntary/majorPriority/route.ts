import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 从请求体中提取参数
    const {
      class_first_choise,
      class_optional_choise,
      province,
      rank,
      college_location,
      interest,
      strategy = 1,
      page = '1',
      page_size = '20'
    } = body;

    // 构建要发送到后端的参数
    const apiParams = {
      class_first_choise,
      class_optional_choise,
      province,
      rank,
      college_location,
      interest,
      strategy,
      page,
      page_size
    };

    // 调用后端API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    const response = await fetch(`${backendUrl}/api/report/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiParams),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);
      
      return NextResponse.json(
        { error: true, message: `后端API调用失败: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // 返回后端数据
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('API route error:', error);
    
    return NextResponse.json(
      { 
        error: true, 
        message: error instanceof Error ? error.message : '内部服务器错误' 
      },
      { status: 500 }
    );
  }
}
