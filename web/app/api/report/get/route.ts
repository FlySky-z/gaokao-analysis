import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 从query参数中提取参数
    const class_first_choise = searchParams.get('class_first_choise');
    const class_optional_choise = searchParams.get('class_optional_choise');
    const province = searchParams.get('province');
    const rank = searchParams.get('rank');
    const college_location = searchParams.get('college_location');
    const interest = searchParams.get('interest');
    const strategy = searchParams.get('strategy') || '1';
    const page = searchParams.get('page') || '1';
    const page_size = searchParams.get('page_size') || '20';

    // 构建要发送到后端的查询参数
    const apiParams = new URLSearchParams();
    if (class_first_choise) apiParams.append('class_first_choise', class_first_choise);
    if (class_optional_choise) apiParams.append('class_optional_choise', class_optional_choise);
    if (province) apiParams.append('province', province);
    if (rank) apiParams.append('rank', rank);
    if (college_location) apiParams.append('college_location', college_location);
    if (interest) apiParams.append('interest', interest);
    apiParams.append('strategy', strategy);
    apiParams.append('page', page);
    apiParams.append('page_size', page_size);

    // 调用后端API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    const response = await fetch(`${backendUrl}/api/report/get?${apiParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
