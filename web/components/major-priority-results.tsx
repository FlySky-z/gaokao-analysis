import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { IconEye, IconSchool, IconBook, IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react"

// 辅助函数：格式化专业组代码为两位数字符串
function formatGroupCode(code: string): string {
  if (!code) return code;
  const num = parseInt(code);
  if (isNaN(num)) return code;
  return num.toString().padStart(2, '0');
}

// API返回的专业数据类型（根据最新API文档）
export interface MajorItem {
  class_demand: string; // 选科要求
  college_authority: string; // 院校主管部门
  college_city: string; // 院校城市
  college_code: string; // 院校代码
  college_level: string; // 院校层次
  college_name: string; // 院校名称
  college_ownership: string; // 院校性质
  college_province: string; // 院校省份
  college_tags: string; // 院校标签
  college_type: string; // 院校类型
  education_level: string; // 教育层次
  id: number; // 自增id，对应表格里的id
  is_new_major: boolean; // 是否为新专业
  lowest_points: number; // 专业组录取最低分
  lowest_rank: number; // 专业组录取最低位次
  major_description: string; // 专业描述
  major_min_rank_2024: number; // 24年专业录取最低位次
  major_min_score_2024: number; // 24年专业录取最低分
  professional_name: string; // 专业名称
  special_interest_group_code: string; // 专业组代码
  study_years: string; // 学制
  tuition_fee: number; // 学费
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
    remark?: string; // 专业备注
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
  onPageChange?: (page: number) => void;
  currentQueryData?: {
    class_first_choise: string;
    class_optional_choise: string;
    province: string;
    rank: number;
  } | null; // 添加当前查询参数
}

const strategyLabels = {
  0: { label: '冲一冲', color: 'bg-red-100 text-red-800 border-red-200' },
  1: { label: '稳一稳', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  2: { label: '保一保', color: 'bg-green-100 text-green-800 border-green-200' },
};

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

// 专业描述单元格组件
function MajorDescriptionCell({ description, majorName }: { description: string; majorName: string }) {
  const [open, setOpen] = React.useState(false);
  
  // 截断长文本，显示前50个字符
  const truncatedText = description && description.length > 50 
    ? `${description.substring(0, 50)}...` 
    : description;

  if (!description || description === '—') {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button 
          className="text-left text-sm hover:text-primary hover:underline transition-colors cursor-pointer"
          onClick={() => setOpen(true)}
        >
          {truncatedText}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {majorName} - 专业描述
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            详细的专业介绍和课程内容
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {description}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
          <div className="flex items-center gap-2">
            <span className="font-medium">{major.professional_name}</span>
            {major.is_new_major && (
              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                新专业
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {major.college_name}
          </div>
          <div className="text-xs text-muted-foreground">
            {major.college_city && major.college_province && 
              `${major.college_province} · ${major.college_city}`
            }
            {major.college_type && ` · ${major.college_type}`}
          </div>
          <div className="text-xs text-muted-foreground">
            学制：{major.study_years || '—'} · 学费：{major.tuition_fee ? `${major.tuition_fee}元/年` : '—'}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div>专业组最低分：{major.lowest_points || '—'}</div>
          <div className="text-muted-foreground">
            专业组最低位次：{major.lowest_rank ? major.lowest_rank.toLocaleString() : '—'}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div>专业最低分：{major.major_min_score_2024 || '—'}</div>
          <div className="text-muted-foreground">
            专业最低位次：{major.major_min_rank_2024 ? major.major_min_rank_2024.toLocaleString() : '—'}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div>院校代码：{major.college_code || '—'}</div>
          <div className="text-muted-foreground">
            专业组：{major.special_interest_group_code ? formatGroupCode(major.special_interest_group_code) : '—'}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm">
        {major.class_demand || '—'}
      </TableCell>
      <TableCell className="text-sm">
        <MajorDescriptionCell 
          description={major.major_description || '—'} 
          majorName={major.professional_name || '未知专业'}
        />
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
  selectedMajor,
  loading: sheetLoading,
  currentQueryData
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupDetail: MajorGroupDetail | null;
  selectedMajor: MajorItem | null;
  loading: boolean;
  currentQueryData?: {
    class_first_choise: string;
    class_optional_choise: string;
    province: string;
    rank: number;
  } | null;
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
              {/* 院校信息 */}
              {selectedMajor && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <IconSchool size={20} />
                      院校信息
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* 基本信息 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">院校名称</div>
                          <div className="font-semibold">{selectedMajor.college_name}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">院校代码</div>
                          <div>{selectedMajor.college_code}</div>
                        </div>
                      </div>
                      
                      {/* 地理位置 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">所在省份</div>
                          <div>{selectedMajor.college_province}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">所在城市</div>
                          <div>{selectedMajor.college_city}</div>
                        </div>
                      </div>
                      
                      {/* 院校属性 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">院校类型</div>
                          <div>{selectedMajor.college_type}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">院校层次</div>
                          <div>{selectedMajor.college_level}</div>
                        </div>
                      </div>
                      
                      {/* 办学性质和主管部门 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">办学性质</div>
                          <div>{selectedMajor.college_ownership}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">主管部门</div>
                          <div>{selectedMajor.college_authority}</div>
                        </div>
                      </div>
                      
                      {/* 院校标签 */}
                      {selectedMajor.college_tags && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-2">院校标签</div>
                          <div className="flex flex-wrap gap-2">
                            {selectedMajor.college_tags.split(',').map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag.trim()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

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
                  <TooltipProvider>
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>专业名称</TableHead>
                        <TableHead>录取分数</TableHead>
                        <TableHead>招生信息</TableHead>
                        <TableHead>费用</TableHead>
                        <TableHead>备注</TableHead>
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
                          <TableCell className="text-sm max-w-xs">
                            {major.remark && major.remark !== '—' ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="truncate cursor-pointer text-blue-600 hover:text-blue-800">
                                    {major.remark}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent 
                                  className="max-w-sm p-3 text-sm leading-relaxed !bg-white !border !border-gray-200 shadow-lg z-50"
                                  side="top"
                                  sideOffset={5}
                                >
                                  <p className="text-gray-800 whitespace-pre-wrap !text-left">
                                    {major.remark}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </TooltipProvider>
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
  onViewMajorGroup,
  onPageChange,
  currentQueryData
}: MajorPriorityResultsProps) {
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sheetLoading, setSheetLoading] = React.useState(false);
  const [selectedMajorGroup, setSelectedMajorGroup] = React.useState<MajorGroupDetail | null>(null);
  const [selectedMajor, setSelectedMajor] = React.useState<MajorItem | null>(null);

  // 构建科目字符串的辅助函数
  const buildSubjectsString = React.useCallback(() => {
    if (!currentQueryData) {
      return '物理,化学,生物'; // 默认值
    }

    const firstChoice = currentQueryData.class_first_choise;
    let optionalChoices: string[] = [];
    
    try {
      optionalChoices = JSON.parse(currentQueryData.class_optional_choise || '[]');
    } catch (error) {
      console.warn('解析可选科目失败:', error);
      optionalChoices = [];
    }

    // 构建完整的科目列表：首选科目 + 可选科目
    const allSubjects = [firstChoice, ...optionalChoices].filter(Boolean);
    return allSubjects.join(',');
  }, [currentQueryData]);

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      // 关闭Sheet时清除选中的专业
      setSelectedMajor(null);
      setSelectedMajorGroup(null);
    }
  };

  const handleViewGroup = async (major: MajorItem) => {
    if (!major.special_interest_group_code || !major.college_code) {
      alert('专业组信息不完整，无法查看详情');
      return;
    }

    try {
      setSheetLoading(true);
      setSheetOpen(true);
      setSelectedMajorGroup(null);
      setSelectedMajor(major); // 设置选中的专业

      // 调用API获取专业组详情
      const groupDetail = await onViewMajorGroup({
        group_code: formatGroupCode(major.special_interest_group_code),
        school_code: major.college_code,
        province: currentQueryData?.province || '湖北', // 使用用户选择的省份
        rank: currentQueryData?.rank || major.lowest_rank || 0, // 使用用户输入的位次
        score: major.lowest_points || 0, // 使用专业组最低分
        subjects: buildSubjectsString(), // 使用用户选择的科目组合
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
                  <TableHead>专业组录取信息</TableHead>
                  <TableHead>专业录取信息(2024)</TableHead>
                  <TableHead>代码信息</TableHead>
                  <TableHead>选科要求</TableHead>
                  <TableHead>专业描述</TableHead>
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
        
        {/* 分页控制 */}
        {results.data.conf && results.data.conf.total_page > 1 && onPageChange && (
          <Card>
            <CardContent className="py-4">
              <Pagination
                currentPage={results.data.conf.page}
                totalPages={results.data.conf.total_page}
                onPageChange={onPageChange}
                loading={loading}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* 专业组详情Sheet */}
      <MajorGroupSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        groupDetail={selectedMajorGroup}
        selectedMajor={selectedMajor}
        loading={sheetLoading}
        currentQueryData={currentQueryData}
      />
    </>
  );
}
