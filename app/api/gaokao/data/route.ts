import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: Request) {
  try {
    // 解析URL参数
    const { searchParams } = new URL(request.url)
    const province = searchParams.get('province') || 'hubei'
    const subject = searchParams.get('subject') || 'physics'
    
    // 根据省份和科目类型构建数据文件路径
    const fileName = `ranking_score_${province}_${subject}.json`
    const dataPath = path.join(process.cwd(), 'data', fileName)
    
    // 检查文件是否存在
    if (!fs.existsSync(dataPath)) {
      return NextResponse.json(
        { error: `数据文件不存在: ${fileName}` },
        { status: 404 }
      )
    }

    // 读取文件内容
    const fileContent = fs.readFileSync(dataPath, 'utf8')
    const jsonData = JSON.parse(fileContent)
    
    // 返回数据，包含省份和科目信息
    return NextResponse.json({
      ...jsonData,
      province,
      subject
    })
  } catch (error) {
    console.error('读取高考数据失败:', error)
    return NextResponse.json(
      { error: '读取数据失败' },
      { status: 500 }
    )
  }
}
