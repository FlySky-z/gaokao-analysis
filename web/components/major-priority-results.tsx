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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { IconEye, IconSchool, IconBook } from "@tabler/icons-react"

// API返回的专业数据类型（根据TODO文档）
export interface MajorItem {
  class_demand?: string; // 选科要求
  colledge_code?: string; // 院校代码
  colledge_name?: string; // 院校名称
  description?: string; // 备注
  id?: number; // 自增id
  lowest_points?: number; // 录取最低分
  lowest_rank?: number; // 录取最低位次
  professional_name: string; // 专业名称
  special_interest_group_code?: string; // 专业组代码
}

export interface MajorPriorityResult {
  code: number; // 状态码
  data: {
    conf?: {
      page: number;
      page_size: number;
      total_number: number;
      total_page: number;
    };
    list: MajorItem[]; // 专业列表
  };
  msg: string; // 状态信息
}

// 专业组详情数据类型（用于Sheet展示）
export interface MajorGroupDetail {
  group_code?: string; // 专业组代码
  major?: {
    code?: string; // 专业代码
    id?: number; // 专业id
    min_rank?: number; // 录取最低位次
    min_score?: number; // 录取最低分
    name?: string; // 专业名称
    plan_num?: string; // 计划数
    probability?: number; // 录取概率
    strategy?: number; // 策略
    study_cost?: string; // 学费
    study_year?: string; // 学制
    year?: string; // 信息年份
  }[];
  probability?: number; // 专业组概率
  strategy?: number; // 策略
}

interface MajorPriorityResultsProps {
  results: MajorPriorityResult | null;
  loading?: boolean;
  onViewMajorGroup: (params: {
    group_code: string;
    school_code: string;
    province: string;
    rank: number;
    score: number;
    subjects: string;
  }) => Promise<MajorGroupDetail>;
}

const strategyLabels = {
  0: { label: '冲一冲', color: 'bg-red-100 text-red-800 border-red-200' },
  1: { label: '稳一稳', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  2: { label: '保一保', color: 'bg-green-100 text-green-800 border-green-200' },
};

function MajorRow({ 
  major, 
  onViewGroup 
}: { 
  major: MajorItem; 
  onViewGroup: (major: MajorItem) => void;
}) {
  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="font-medium">
        <div className="space-y-1">
          <div className="font-medium">{major.professional_name}</div>
          <div className="text-sm text-muted-foreground">
            {major.colledge_name}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div>最低分：{major.lowest_points || '—'}</div>
          <div className="text-muted-foreground">
            最低位次：{major.lowest_rank ? major.lowest_rank.toLocaleString() : '—'}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div>院校代码：{major.colledge_code || '—'}</div>
          <div className="text-muted-foreground">
            专业组：{major.special_interest_group_code || '—'}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm">
        {major.class_demand || '—'}
      </TableCell>
      <TableCell className="text-sm">
        {major.description || '—'}
      </TableCell>
      <TableCell>
        {major.special_interest_group_code && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewGroup(major)}
            className="text-sm"
          >
            <IconEye size={14} className="mr-1" />
            查看专业组
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

function MajorGroupSheet({ 
  open, 
  onOpenChange, 
  groupDetail, 
  loading: sheetLoading 
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupDetail: MajorGroupDetail | null;
  loading: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <IconBook size={20} />
            专业组详情
          </SheetTitle>
          <SheetDescription>
            {groupDetail?.group_code ? `专业组代码：${groupDetail.group_code}` : '加载中...'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {sheetLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : groupDetail ? (
            <>
              {/* 专业组统计信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">专业组统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">录取概率</div>
                      <div className="text-lg font-semibold">{groupDetail.probability || 0}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">策略</div>
                      <Badge className={strategyLabels[groupDetail.strategy as keyof typeof strategyLabels]?.color || 'bg-gray-100 text-gray-800'}>
                        {strategyLabels[groupDetail.strategy as keyof typeof strategyLabels]?.label || '未知'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 专业列表 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">专业详情</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>专业名称</TableHead>
                        <TableHead>录取分数</TableHead>
                        <TableHead>招生信息</TableHead>
                        <TableHead>费用</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(groupDetail.major || []).map((major, index) => (
                        <TableRow key={major.id || index}>
                          <TableCell className="font-medium">
                            {major.name || '未知专业'}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>最低分：{major.min_score || '—'}</div>
                              <div className="text-muted-foreground">
                                最低位次：{major.min_rank ? major.min_rank.toLocaleString() : '—'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>计划：{major.plan_num || '—'}</div>
                              <div className="text-muted-foreground">学制：{major.study_year || '—'}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {major.study_cost || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">暂无数据</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MajorPriorityResults({ 
  results, 
  loading = false, 
  onViewMajorGroup 
}: MajorPriorityResultsProps) {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sheetLoading, setSheetLoading] = React.useState(false);
  const [selectedMajorGroup, setSelectedMajorGroup] = React.useState<MajorGroupDetail | null>(null);

  const handleViewGroup = async (major: MajorItem) => {
    if (!major.special_interest_group_code || !major.colledge_code) {
      alert('专业组信息不完整，无法查看详情');
      return;
    }

    try {
      setSheetLoading(true);
      setSheetOpen(true);
      setSelectedMajorGroup(null);

      // 调用API获取专业组详情
      const groupDetail = await onViewMajorGroup({
        group_code: major.special_interest_group_code,
        school_code: major.colledge_code,
        province: '湖北',
        rank: major.lowest_rank || 0,
        score: major.lowest_points || 0,
        subjects: '物理,化学,生物', // 这里需要根据实际用户选择的科目传入
      });

      setSelectedMajorGroup(groupDetail);
    } catch (error) {
      console.error('获取专业组详情失败:', error);
      alert('获取专业组详情失败，请稍后重试');
      setSheetOpen(false);
    } finally {
      setSheetLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-muted-foreground">正在查询专业信息...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!results || !results.data || !results.data.list || results.data.list.length === 0) {
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
    <>
      <div className="space-y-6">
        {/* 查询结果统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>专业推荐结果</span>
              <Badge variant="outline" className="text-lg px-3 py-1">
                共找到 {results.data.conf?.total_number || results.data.list.length} 个专业
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
        
        {/* 专业列表 */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>专业 & 院校</TableHead>
                  <TableHead>录取分数</TableHead>
                  <TableHead>代码信息</TableHead>
                  <TableHead>选科要求</TableHead>
                  <TableHead>备注</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.data.list.map((major, index) => (
                  <MajorRow 
                    key={major.id || index} 
                    major={major} 
                    onViewGroup={handleViewGroup}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* 分页信息 */}
        {results.data.conf && results.data.conf.total_page > 1 && (
          <Card>
            <CardContent className="flex items-center justify-center py-4">
              <div className="text-sm text-muted-foreground">
                第 {results.data.conf.page} / {results.data.conf.total_page} 页，每页 {results.data.conf.page_size} 条
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 专业组详情Sheet */}
      <MajorGroupSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        groupDetail={selectedMajorGroup}
        loading={sheetLoading}
      />
    </>
  );
}
