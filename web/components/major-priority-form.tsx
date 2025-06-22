import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { IconChevronDown, IconChevronUp, IconSearch, IconFilter } from "@tabler/icons-react"
import { scoreRankConverter } from "@/lib/score-rank-converter"

// 专业优先查询表单数据类型
export interface MajorPriorityFormData {
  // 基础信息（必填）
  class_first_choise: string; // 首选学科：物理 | 历史
  class_optional_choise: string; // 补充学科，格式：["化学","生物"]
  province: string; // 生源地，目前仅限湖北
  rank: number; // 用户位次
  college_location: string; // 大学所在地，格式：["湖北"]

  // 可选筛选条件
  interest?: string; // 意向专业方向，格式：["理科","工科"]
  strategy?: number; // 冲稳保策略 0 冲 1 稳 2 保，默认0冲
  page?: string; // 页码
  page_size?: string; // 每页大小
}

interface MajorPriorityFormProps {
  onSubmit: (data: MajorPriorityFormData) => void;
  loading?: boolean;
}

// 首选科目选项
const firstChoiceSubjects = [
  { value: '物理', label: '物理' },
  { value: '历史', label: '历史' },
];

// 可选科目选项
const optionalSubjects = [
  { value: '化学', label: '化学' },
  { value: '生物', label: '生物' },
  { value: '政治', label: '政治' },
  { value: '地理', label: '地理' },
];

// 院校所在地选项
const collegeLocationOptions = [
  { value: '福建', label: '福建' },
  { value: '云南', label: '云南' },
  { value: '宁夏', label: '宁夏' },
  { value: '河南', label: '河南' },
  { value: '吉林', label: '吉林' },
  { value: '山东', label: '山东' },
  { value: '湖南', label: '湖南' },
  { value: '广东', label: '广东' },
  { value: '浙江', label: '浙江' },
  { value: '内蒙古', label: '内蒙古' },
  { value: '湖北', label: '湖北' },
  { value: '广西', label: '广西' },
  { value: '青海', label: '青海' },
  { value: '山西', label: '山西' },
  { value: '陕西', label: '陕西' },
  { value: '四川', label: '四川' },
  { value: '黑龙江', label: '黑龙江' },
  { value: '江西', label: '江西' },
  { value: '天津', label: '天津' },
  { value: '辽宁', label: '辽宁' },
  { value: '西藏', label: '西藏' },
  { value: '安徽', label: '安徽' },
  { value: '上海', label: '上海' },
  { value: '贵州', label: '贵州' },
  { value: '重庆', label: '重庆' },
  { value: '北京', label: '北京' },
  { value: '河北', label: '河北' },
  { value: '海南', label: '海南' },
  { value: '新疆', label: '新疆' },
  { value: '江苏', label: '江苏' },
  { value: '甘肃', label: '甘肃' },
];

// 专业兴趣方向
const interestOptions = [
  { value: '理科', label: '理科' },
  { value: '工科', label: '工科' },
  { value: '文科（非经管法）', label: '文科（非经管法）' },
  { value: '经管法', label: '经管法' },
  { value: '医科', label: '医科' },
  { value: '设计与艺术类', label: '设计与艺术类' },
  { value: '语言类', label: '语言类' },
];

// 策略选项
const strategyOptions = [
  { value: 0, label: '冲', fullLabel: '冲一冲', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 1, label: '稳', fullLabel: '稳一稳', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 2, label: '保', fullLabel: '保一保', color: 'bg-green-100 text-green-800 border-green-200' },
];

export function MajorPriorityForm({ onSubmit, loading = false }: MajorPriorityFormProps) {
  const [formData, setFormData] = React.useState<MajorPriorityFormData>({
    class_first_choise: '',
    class_optional_choise: '',
    province: '湖北', // 目前仅限湖北
    rank: 0,
    college_location: JSON.stringify([]), // 默认不选择具体地区
    strategy: 0, // 默认冲一冲
    page: '1',
    page_size: '20',
  });

  const [selectedOptionalSubjects, setSelectedOptionalSubjects] = React.useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = React.useState<string[]>([]);
  const [selectedCollegeLocations, setSelectedCollegeLocations] = React.useState<string[]>([]);
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [scoreInput, setScoreInput] = React.useState('');
  const [rankInput, setRankInput] = React.useState('');
  const [isConverting, setIsConverting] = React.useState(false);
  const [inputMode, setInputMode] = React.useState<'score' | 'rank'>('score');

  // 防抖定时器
  const scoreDebounceRef = React.useRef<NodeJS.Timeout | null>(null);
  const rankDebounceRef = React.useRef<NodeJS.Timeout | null>(null);

  // 避免循环更新的标记
  const isUpdatingFromConversion = React.useRef(false);

  // 获取当前科目类型（确保与首选科目强相关）
  const getCurrentSubject = React.useCallback(() => {
    return formData.class_first_choise === '物理' ? 'physics' :
      formData.class_first_choise === '历史' ? 'history' : null;
  }, [formData.class_first_choise]);

  // 分数转排名（内部函数）
  const convertScoreToRank = React.useCallback(async (score: number) => {
    if (score <= 0) return 0;

    const subject = getCurrentSubject();
    if (!subject) {
      console.warn('未选择首选科目，无法进行分数位次转换');
      return Math.max(1, Math.floor((750 - score) * 100));
    }

    try {
      const rank = await scoreRankConverter.scoreToRank(score, 'hubei', subject);
      return rank;
    } catch (error) {
      console.error('分数转位次失败:', error);
      return Math.max(1, Math.floor((750 - score) * 100));
    }
  }, [getCurrentSubject]);

  // 排名转分数（内部函数）
  const convertRankToScore = React.useCallback(async (rank: number) => {
    if (rank <= 0) return 0;

    const subject = getCurrentSubject();
    if (!subject) {
      console.warn('未选择首选科目，无法进行位次分数转换');
      return Math.max(200, 750 - Math.floor(rank / 100));
    }

    try {
      const score = await scoreRankConverter.rankToScore(rank, 'hubei', subject);
      return score;
    } catch (error) {
      console.error('位次转分数失败:', error);
      return Math.max(200, 750 - Math.floor(rank / 100));
    }
  }, [getCurrentSubject]);

  // 处理分数输入变化
  const handleScoreChange = React.useCallback((value: string) => {
    // 如果是从转换操作触发的更新，直接返回避免循环
    if (isUpdatingFromConversion.current) {
      return;
    }

    setScoreInput(value);
    setInputMode('score');

    // 清除之前的防抖定时器
    if (scoreDebounceRef.current) {
      clearTimeout(scoreDebounceRef.current);
      scoreDebounceRef.current = null;
    }

    const score = parseInt(value);
    if (isNaN(score) || score <= 0) {
      setFormData(prev => ({ ...prev, rank: 0 }));
      isUpdatingFromConversion.current = true;
      setRankInput('');
      isUpdatingFromConversion.current = false;
      return;
    }

    // 检查是否选择了首选科目，如果选择了才进行转换
    const subject = getCurrentSubject();
    if (subject) {
      // 防抖转换位次
      scoreDebounceRef.current = setTimeout(async () => {
        setIsConverting(true);
        try {
          const rank = await convertScoreToRank(score);
          setFormData(prev => ({ ...prev, rank }));

          // 标记为转换更新，避免触发输入事件
          isUpdatingFromConversion.current = true;
          setRankInput(rank.toString());
          isUpdatingFromConversion.current = false;
        } finally {
          setIsConverting(false);
        }
      }, 300);
    }
  }, [convertScoreToRank, getCurrentSubject]);

  // 处理排名输入变化
  const handleRankChange = React.useCallback((value: string) => {
    // 如果是从转换操作触发的更新，直接返回避免循环
    if (isUpdatingFromConversion.current) {
      return;
    }

    setRankInput(value);
    setInputMode('rank');

    // 清除之前的防抖定时器
    if (rankDebounceRef.current) {
      clearTimeout(rankDebounceRef.current);
      rankDebounceRef.current = null;
    }

    const rank = parseInt(value);
    if (isNaN(rank) || rank <= 0) {
      setFormData(prev => ({ ...prev, rank: 0 }));
      isUpdatingFromConversion.current = true;
      setScoreInput('');
      isUpdatingFromConversion.current = false;
      return;
    }

    // 立即更新位次
    setFormData(prev => ({ ...prev, rank }));

    // 检查是否选择了首选科目，如果选择了才进行转换
    const subject = getCurrentSubject();
    if (subject) {
      // 防抖转换分数
      rankDebounceRef.current = setTimeout(async () => {
        setIsConverting(true);
        try {
          const score = await convertRankToScore(rank);

          // 标记为转换更新，避免触发输入事件
          isUpdatingFromConversion.current = true;
          setScoreInput(score.toString());
          isUpdatingFromConversion.current = false;
        } finally {
          setIsConverting(false);
        }
      }, 300);
    }
  }, [convertRankToScore, getCurrentSubject]);

  // 清理防抖定时器
  React.useEffect(() => {
    return () => {
      if (scoreDebounceRef.current) {
        clearTimeout(scoreDebounceRef.current);
      }
      if (rankDebounceRef.current) {
        clearTimeout(rankDebounceRef.current);
      }
    };
  }, []);

  // 当科目变化时，重新计算排名
  React.useEffect(() => {
    if (inputMode === 'score' && scoreInput) {
      handleScoreChange(scoreInput);
    } else if (inputMode === 'rank' && rankInput) {
      handleRankChange(rankInput);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.class_first_choise]); // 仅依赖科目变化

  // 处理可选科目选择
  const handleOptionalSubjectToggle = (subject: string) => {
    const newSubjects = selectedOptionalSubjects.includes(subject)
      ? selectedOptionalSubjects.filter(s => s !== subject)
      : [...selectedOptionalSubjects, subject];

    // 最多选择2门
    if (newSubjects.length <= 2) {
      setSelectedOptionalSubjects(newSubjects);
      setFormData(prev => ({
        ...prev,
        class_optional_choise: JSON.stringify(newSubjects)
      }));
    }
  };

  // 处理兴趣方向选择
  const handleInterestToggle = (interest: string) => {
    const newInterests = selectedInterests.includes(interest)
      ? selectedInterests.filter(i => i !== interest)
      : [...selectedInterests, interest];

    setSelectedInterests(newInterests);
    setFormData(prev => ({
      ...prev,
      interest: newInterests.length > 0 ? JSON.stringify(newInterests) : undefined
    }));
  };

  // 处理院校所在地选择
  const handleCollegeLocationToggle = (location: string) => {
    const newLocations = selectedCollegeLocations.includes(location)
      ? selectedCollegeLocations.filter(l => l !== location)
      : [...selectedCollegeLocations, location];

    setSelectedCollegeLocations(newLocations);
    setFormData(prev => ({
      ...prev,
      college_location: JSON.stringify(newLocations)
    }));
  };

  // 按钮提交
  const handleButtonSubmit = () => {
    // 验证必填项
    if (!formData.class_first_choise) {
      alert('请选择首选科目');
      return;
    }

    if (selectedOptionalSubjects.length !== 2) {
      alert('请选择2门可选科目');
      return;
    }

    if (!formData.rank || formData.rank <= 0) {
      alert('请输入有效的位次');
      return;
    }

    onSubmit(formData);
  };

  // 表单验证
  const isFormValid = formData.class_first_choise &&
    selectedOptionalSubjects.length === 2 &&
    formData.rank > 0;

  return (
    <div className="space-y-6">
      {/* 基础信息卡片 */}
      <Card>
        <div className="space-y-6">
          <CardHeader>
            <CardTitle className="text-lg">基础信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 第一行：首选科目和生源地 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="province" className="text-base font-medium">
                  生源地
                </Label>
                <Select value={formData.province} onValueChange={(value) => setFormData(prev => ({ ...prev, province: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="湖北">湖北省</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstChoice" className="text-base font-medium">
                  首选科目 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.class_first_choise}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, class_first_choise: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择首选科目" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="物理">物理</SelectItem>
                    <SelectItem value="历史">历史</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 第二行：可选科目 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-base font-medium">
                  再选科目 <span className="text-red-500">*</span>
                </Label>
                <Badge variant="outline" className={selectedOptionalSubjects.length === 2 ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'}>
                  已选 {selectedOptionalSubjects.length}/2 门
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {optionalSubjects.map((subject) => (
                  <div key={subject.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={subject.value}
                      checked={selectedOptionalSubjects.includes(subject.value)}
                      onCheckedChange={() => handleOptionalSubjectToggle(subject.value)}
                      disabled={!selectedOptionalSubjects.includes(subject.value) && selectedOptionalSubjects.length >= 2}
                    />
                    <Label htmlFor={subject.value} className="cursor-pointer">
                      {subject.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* 第三行：分数与位次输入 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="score" className="text-base font-medium">
                  高考分数
                </Label>
                <Input
                  id="score"
                  type="number"
                  placeholder="请输入分数"
                  value={scoreInput}
                  onChange={(e) => handleScoreChange(e.target.value)}
                  max={750}
                  min={0}
                  disabled={isConverting}
                />
                {isConverting && inputMode === 'score' && (
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>正在计算位次...</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rank" className="text-base font-medium">
                  位次 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="rank"
                  type="number"
                  placeholder="请输入您的位次"
                  value={rankInput}
                  onChange={(e) => handleRankChange(e.target.value)}
                  min="1"
                  disabled={isConverting}
                />
                {isConverting && inputMode === 'rank' && (
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>正在计算分数...</span>
                  </div>
                )}
              </div>
            </div>

            {/* 高级筛选 */}
            <Card className="cursor-pointer">
              <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                <CollapsibleTrigger asChild>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <IconFilter size={20} />
                        <CardTitle>高级筛选</CardTitle>
                        <Badge variant="secondary">可选</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                          {advancedOpen ? '收起筛选' : '展开筛选'}
                        </span>
                        {advancedOpen ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1">
                  <CardContent className="pt-6 space-y-6">
                    {/* 专业兴趣方向 */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">专业兴趣方向</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {interestOptions.map((interest) => (
                          <div key={interest.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={interest.value}
                              checked={selectedInterests.includes(interest.value)}
                              onCheckedChange={() => handleInterestToggle(interest.value)}
                            />
                            <Label htmlFor={interest.value} className="text-sm cursor-pointer">
                              {interest.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 院校所在地 */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-base font-medium">院校所在地</Label>
                        <Badge variant="outline" className="text-xs">
                          已选 {selectedCollegeLocations.length} 个地区
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                        {collegeLocationOptions.map((location) => (
                          <div key={location.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`location-${location.value}`}
                              checked={selectedCollegeLocations.includes(location.value)}
                              onCheckedChange={() => handleCollegeLocationToggle(location.value)}
                            />
                            <Label htmlFor={`location-${location.value}`} className="text-sm cursor-pointer">
                              {location.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* 提交按钮 */}
            <div className="flex gap-3">
              <Button
                onClick={handleButtonSubmit}
                disabled={loading}
                className="flex-1"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    查询中...
                  </>
                ) : (
                  <>
                    <IconSearch size={18} className="mr-2" />
                    查询专业推荐
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* 策略选择 */}
      <Card>
        <CardContent>
          <div className="space-y-3">
            <Label className="text-base font-medium">志愿策略</Label>
            <Tabs
              value={formData.strategy?.toString() || '0'}
              onValueChange={(value) => {
                const newStrategy = parseInt(value);
                setFormData(prev => ({ ...prev, strategy: newStrategy }));

                // 如果表单已填写完整，切换策略时自动重新查询
                if (isFormValid) {
                  const updatedFormData = { ...formData, strategy: newStrategy };
                  onSubmit(updatedFormData);
                }
              }}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3">
                {strategyOptions.map((strategy) => (
                  <TabsTrigger
                    key={strategy.value}
                    value={strategy.value.toString()}
                    className="flex items-center gap-2"
                  >
                    <span>{strategy.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {strategyOptions.map((strategy) => (
                <TabsContent key={strategy.value} value={strategy.value.toString()} className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={strategy.color}>
                      {strategy.fullLabel}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {strategy.value === 0 && '选择录取分数线较高的专业，有一定风险但可能获得更好的专业。'}
                      {strategy.value === 1 && '选择录取分数线适中的专业，比较稳妥的选择。'}
                      {strategy.value === 2 && '选择录取分数线较低的专业，确保能够被录取。'}
                    </span>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
