import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数（如果需要的话）
    const { searchParams } = new URL(request.url);
    
    // 调用后端API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    const response = await fetch(`${backendUrl}/api/options/provinces`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);
      
      return NextResponse.json(
        { 
          code: response.status,
          msg: `后端API调用失败: ${response.status}`,
          data: null
        },
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
        code: 500,
        msg: error instanceof Error ? error.message : '内部服务器错误',
        data: null
      },
      { status: 500 }
    );
  }
}
