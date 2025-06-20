import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface RankData {
  score: number;
  rank: number;
  province: string;
  subjectType: string;
}

interface UserRankDisplayProps {
  rankData: RankData | null;
}

export function UserRankDisplay({ rankData }: UserRankDisplayProps) {
  if (!rankData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-muted-foreground">请在图表中选择一个数据点</p>
            <p className="text-sm text-muted-foreground">选择后将显示对应的排名信息</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 根据分数计算百分位
  const getPercentile = (score: number) => {
    // 这里可以基于真实数据计算百分位
    const maxScore = 750;
    return Math.round((score / maxScore) * 100);
  };

  // 根据排名判断水平
  const getRankLevel = (rank: number) => {
    if (rank <= 1000) return { label: "顶尖", color: "bg-purple-100 text-purple-800" };
    if (rank <= 5000) return { label: "优秀", color: "bg-blue-100 text-blue-800" };
    if (rank <= 20000) return { label: "良好", color: "bg-green-100 text-green-800" };
    if (rank <= 50000) return { label: "中等", color: "bg-yellow-100 text-yellow-800" };
    return { label: "一般", color: "bg-gray-100 text-gray-800" };
  };

  const percentile = getPercentile(rankData.score);
  const rankLevel = getRankLevel(rankData.rank);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          选中的排名信息
          <Badge variant="outline" className={rankLevel.color}>
            {rankLevel.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">高考分数</div>
            <div className="text-3xl font-bold text-blue-600">{rankData.score}</div>
            <div className="text-xs text-muted-foreground">/ 750分</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">省内排名</div>
            <div className="text-3xl font-bold text-green-600">{rankData.rank.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">第{rankData.rank}名</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">报考省份</div>
            <div className="text-3xl font-bold text-purple-600">{rankData.province}</div>
            <div className="text-xs text-muted-foreground">省份</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">科目类型</div>
            <div className="text-3xl font-bold text-orange-600">{rankData.subjectType}</div>
            <div className="text-xs text-muted-foreground">类别</div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">百分位排名</span>
              <span className="text-lg font-bold">前 {100 - percentile}%</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">竞争激烈程度</span>
              <Badge variant="secondary" className={rankLevel.color}>
                {rankLevel.label}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>提示：</strong>
            根据您的分数 {rankData.score} 分和排名 {rankData.rank.toLocaleString()} 名，
            建议您在志愿查询时重点关注 {rankLevel.label} 层次的院校，
            同时合理搭配冲、稳、保三种策略的院校。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
