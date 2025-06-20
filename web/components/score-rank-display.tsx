/**
 * 分数位次显示组件
 * 显示分数与位次的对应关系，支持快速选择，基于历史数据仅供参考
 */

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { IconInfoCircle } from "@tabler/icons-react"
import { scoreRankConverter } from "@/lib/score-rank-converter"

interface ScoreRankDisplayProps {
  province?: string;
  subject?: string;
  onSelect?: (score: number, rank: number) => void;
  className?: string;
}

interface ScoreRankItem {
  score: number;
  rank: number;
  percentage?: number;
}

export function ScoreRankDisplay({ 
  province = 'hubei', 
  subject = 'physics', 
  onSelect,
  className 
}: ScoreRankDisplayProps) {
  const [scoreRankData, setScoreRankData] = React.useState<ScoreRankItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // 预设的分数节点
  const scoreMilestones = React.useMemo(() => [650, 600, 550, 500, 450, 400], []);

  React.useEffect(() => {
    const loadScoreRankData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data: ScoreRankItem[] = [];
        
        for (const score of scoreMilestones) {
          const rank = await scoreRankConverter.scoreToRank(score, province, subject);
          data.push({ score, rank });
        }
        
        setScoreRankData(data);
      } catch (err) {
        console.error('加载分数位次数据失败:', err);
        setError('加载失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    loadScoreRankData();
  }, [province, subject, scoreMilestones]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <span>分数-位次参考</span>
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {scoreMilestones.map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">分数-位次参考</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 600) return 'bg-red-100 text-red-800 border-red-200';
    if (score >= 550) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (score >= 500) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 450) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 600) return '一本线上';
    if (score >= 550) return '一本线';
    if (score >= 500) return '二本线上';
    if (score >= 450) return '二本线';
    return '专科线';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <span>分数-位次参考</span>
          <IconInfoCircle size={16} className="text-muted-foreground" />
        </CardTitle>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {province === 'hubei' ? '湖北' : province} · {subject === 'physics' ? '首选物理' : '首选历史'}
          </p>
          <div className="flex items-center space-x-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
            <IconInfoCircle size={12} />
            <span>基于2024年数据，仅供参考，实际录取以当年数据为准</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {scoreRankData.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={getScoreColor(item.score)}>
                {item.score}分
              </Badge>
              <span className="text-sm text-muted-foreground">
                {getScoreLabel(item.score)}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                第 {item.rank.toLocaleString()} 位
              </span>
              {onSelect && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelect(item.score, item.rank)}
                  className="h-8 px-3"
                >
                  选择
                </Button>
              )}
            </div>
          </div>
        ))}
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800 text-center">
            💡 数据基于真实高考一分一段表，点击"选择"可快速填入表单
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
