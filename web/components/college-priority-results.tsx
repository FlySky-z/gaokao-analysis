import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { IconChevronDown, IconChevronUp, IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react"

// API返回的数据类型定义
export interface Major {
  code: string;
  id: number;
  min_rank: number;
  min_score: number;
  name: string;
  plan_num: string;
  probability: number;
  remark: string;
  strategy: number;
  study_cost: string;
  study_year: string;
  year: string;
}

export interface MajorGroup {
  group_code: string;
  group_min_rank?: number; // 可选，由前端计算
  group_min_score?: number; // 可选，由前端计算
  major: Major[];
  probability: number;
  strategy: number;
}

export interface University {
  category: string[];
  major_group: MajorGroup[];
  province: string;
  recruit_code: string;
  tags: string[];
  university_name: string;
}

export interface QueryResult {
  list: University[];
  page: number;
  page_num: number;
  page_size: number;
  total: number;
}

interface UniversityResultsProps {
  results: QueryResult | null;
  loading?: boolean;
  onPageChange?: (page: number) => void;
}

const strategyLabels = {
  0: { label: '冲一冲', color: 'bg-red-100 text-red-800 border-red-200' },
  1: { label: '稳一稳', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  2: { label: '保一保', color: 'bg-green-100 text-green-800 border-green-200' },
};

// 计算专业组的最低分和最低位次
function calculateGroupStats(majors: Major[]) {
  if (!majors || majors.length === 0) {
    return { group_min_score: 0, group_min_rank: 0 };
  }

  const validMajors = majors.filter(major => 
    major && 
    typeof major.min_score === 'number' && 
    typeof major.min_rank === 'number' &&
    !isNaN(major.min_score) && 
    !isNaN(major.min_rank)
  );

  if (validMajors.length === 0) {
    return { group_min_score: 0, group_min_rank: 0 };
  }

  const group_min_score = Math.min(...validMajors.map(major => major.min_score));
  const group_min_rank = Math.max(...validMajors.map(major => major.min_rank));

  return { group_min_score, group_min_rank };
}

// 分页组件
function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  loading = false
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void;
  loading?: boolean;
}) {
  const canGoPrevious = currentPage > 1 && !loading;
  const canGoNext = currentPage < totalPages && !loading;

  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(1)}
        disabled={!canGoPrevious}
      >
        <IconChevronsLeft size={16} />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrevious}
      >
        <IconChevronLeft size={16} />
      </Button>
      
      <div className="flex items-center space-x-2 px-4">
        <span className="text-sm font-medium">
          第 {currentPage} / {totalPages} 页
        </span>
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ml-2"></div>
        )}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
      >
        <IconChevronRight size={16} />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(totalPages)}
        disabled={!canGoNext}
      >
        <IconChevronsRight size={16} />
      </Button>
    </div>
  );
}

function ProbabilityBar({ probability }: { probability: number }) {
  const safeProb = typeof probability === 'number' && !isNaN(probability) ? probability : 0;
  
  const getColor = (prob: number) => {
    if (prob >= 80) return 'bg-green-500';
    if (prob >= 60) return 'bg-yellow-500';
    if (prob >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor(safeProb)} transition-all duration-300`}
          style={{ width: `${Math.max(0, Math.min(100, safeProb))}%` }}
        />
      </div>
      <span className="text-sm font-medium">{safeProb}%</span>
    </div>
  );
}

function MajorRow({ major }: { major: Major }) {
  const safeMinScore = typeof major?.min_score === 'number' ? major.min_score : 0;
  const safeMinRank = typeof major?.min_rank === 'number' ? major.min_rank : 0;
  const safeProbability = typeof major?.probability === 'number' ? major.probability : 0;
  const safeStrategy = typeof major?.strategy === 'number' ? major.strategy : 0;

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="font-medium">{major?.name || '未知专业'}</TableCell>
      <TableCell>
        <div className="text-sm">
          <div>最低分：{safeMinScore}</div>
          <div className="text-muted-foreground">最低位次：{safeMinRank.toLocaleString()}</div>
        </div>
      </TableCell>
      <TableCell>
        <ProbabilityBar probability={safeProbability} />
      </TableCell>
      <TableCell className="text-sm">
        <div>计划：{major?.plan_num || '—'}</div>
        <div className="text-muted-foreground">学制：{major?.study_year || '—'}</div>
      </TableCell>
      <TableCell className="text-sm">
        <div>学费：{major?.study_cost || '—'}</div>
        {major?.remark && (
          <div className="text-muted-foreground text-xs mt-1">{major.remark}</div>
        )}
      </TableCell>
      <TableCell>
        <Badge 
          variant="outline" 
          className={strategyLabels[safeStrategy as keyof typeof strategyLabels]?.color || 'bg-gray-100 text-gray-800 border-gray-200'}
        >
          {strategyLabels[safeStrategy as keyof typeof strategyLabels]?.label || '未知'}
        </Badge>
      </TableCell>
    </TableRow>
  );
}

function MajorGroupCard({ group, universityName }: { group: MajorGroup; universityName: string }) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  // 计算专业组的最低分和最低位次
  const { group_min_score, group_min_rank } = React.useMemo(() => {
    return calculateGroupStats(group?.major || []);
  }, [group?.major]);

  const safeProbability = typeof group?.probability === 'number' ? group.probability : 0;
  const safeStrategy = typeof group?.strategy === 'number' ? group.strategy : 0;
  
  return (
    <Card className="mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors w-full text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <CardTitle className="text-lg">
                  专业组 {group?.group_code || '未知'}
                </CardTitle>
                <Badge 
                  variant="outline" 
                  className={strategyLabels[safeStrategy as keyof typeof strategyLabels]?.color || 'bg-gray-100 text-gray-800 border-gray-200'}
                >
                  {strategyLabels[safeStrategy as keyof typeof strategyLabels]?.label || '未知'}
                </Badge>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right text-sm">
                  <div className="font-medium">最低分：{group_min_score}</div>
                  <div className="text-muted-foreground">最低位次：{group_min_rank.toLocaleString()}</div>
                </div>
                <ProbabilityBar probability={safeProbability} />
                <div className="transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <IconChevronDown size={20} />
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1">
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>专业名称</TableHead>
                  <TableHead>录取分数</TableHead>
                  <TableHead>录取概率</TableHead>
                  <TableHead>招生信息</TableHead>
                  <TableHead>费用信息</TableHead>
                  <TableHead>策略</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(group?.major || []).map((major, index) => (
                  <MajorRow key={`${major?.id || index}-${major?.code || index}-${index}`} major={major} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function UniversityCard({ university }: { university: University }) {
  const [isExpanded, setIsExpanded] = React.useState(true); // 默认展开
  
  if (!university) {
    return null;
  }
  
  return (
    <div className="border rounded-lg p-6 space-y-4">
      {/* 大学基本信息 */}
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold">{university.university_name || '未知院校'}</h2>
            <span className="text-sm text-muted-foreground">({university.province || '未知省份'})</span>
          </div>
          
          {/* 标签 */}
          <div className="flex flex-wrap gap-2">
            {(university.tags || []).map((tag, index) => (
              <Badge key={`tag-${index}-${tag}`} variant="secondary" className="bg-blue-100 text-blue-800">
                {tag}
              </Badge>
            ))}
          </div>
          
          {/* 院校类型 */}
          <div className="flex flex-wrap gap-2">
            {(university.category || []).map((cat, index) => (
              <Badge key={`category-${index}-${cat}`} variant="outline">
                {cat}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">院校代码</div>
            <div className="font-mono font-bold text-lg">{university.recruit_code || '—'}</div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            <div className="transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <IconChevronDown size={16} />
            </div>
          </Button>
        </div>
      </div>
      
      {/* 专业组 - 可折叠 */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1">
          <div className="space-y-4 pt-2">
            {(university.major_group || []).map((group, index) => (
              <MajorGroupCard 
                key={`${university.recruit_code}-${group?.group_code || index}-${index}`} 
                group={group} 
                universityName={university.university_name}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function UniversityResults({ results, loading = false, onPageChange }: UniversityResultsProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-muted-foreground">正在查询院校信息...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!results || !results.list || results.list.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium">暂无查询结果</p>
            <p className="text-muted-foreground">请调整筛选条件后重新查询</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 查询结果统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>查询结果</span>
            <Badge variant="outline" className="text-lg px-3 py-1">
              共找到 {results.total || 0} 所院校
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>
      
      {/* 院校列表 */}
      <div className="space-y-6">
        {results.list.map((university, index) => (
          <UniversityCard key={`${university?.recruit_code || index}-${index}`} university={university} />
        ))}
      </div>
      
      {/* 分页控制 */}
      {results.page_num > 1 && onPageChange && (
        <Card>
          <CardContent className="py-4">
            <Pagination
              currentPage={results.page || 1}
              totalPages={results.page_num}
              onPageChange={onPageChange}
              loading={loading}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
