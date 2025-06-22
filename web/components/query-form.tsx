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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { IconChevronDown, IconChevronUp, IconSearch, IconFilter } from "@tabler/icons-react"
import { scoreRankConverter } from "@/lib/score-rank-converter"

export interface QueryFormData {
  // 基础信息
  province: string;
  score: number;
  rank?: number;
  subjects: string[];

  // 筛选条件
  strategy: number;
  collegeTypes: string[];
  citys: string[];
  minScore?: number;
  maxScore?: number;
  enrollmentPlan?: string;
}

interface QueryFormProps {
  onSubmit: (data: QueryFormData) => void;
  loading?: boolean;
}

const subjects = [
  { value: '物理', label: '物理', type: 'required' },
  { value: '历史', label: '历史', type: 'required' },
  { value: '化学', label: '化学', type: 'optional' },
  { value: '生物', label: '生物', type: 'optional' },
  { value: '政治', label: '政治', type: 'optional' },
  { value: '地理', label: '地理', type: 'optional' },
];

const hubeiCities = [
  '湖北武汉市'
];

const strategyOptions = [
  { 
    value: 0, 
    label: '冲', 
    fullLabel: '冲一冲',
    color: 'bg-red-100 text-red-800 border-red-200'
  },
  { 
    value: 1, 
    label: '稳', 
    fullLabel: '稳一稳',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  { 
    value: 2, 
    label: '保', 
    fullLabel: '保一保',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
];

const collegeTypeCategories = {
  '办学性质': {
    icon: '🏛️',
    types: ['公办', '民办', '军事', '中外合作'],
    description: '按办学主体分类'
  },
  '院校层次': {
    icon: '⭐',
    types: ['985', '211', '双一流', 'C9', 'E9', '两电一邮', '国防七子'],
    description: '按院校声誉分类'
  },
  '专业特色': {
    icon: '🎓',
    types: ['建筑老八校', '建筑新八校', '八大美院', '五院四系', '101计划'],
    description: '按专业特色分类'
  },
  '院校类型': {
    icon: '📚',
    types: ['综合', '理工', '师范', '财经', '医药', '农林', '语言', '政法', '体育', '民族', '艺术'],
    description: '按学科门类分类'
  }
};

export function QueryForm({ onSubmit, loading = false }: QueryFormProps) {
  const [formData, setFormData] = React.useState<QueryFormData>({
    province: '湖北',
    score: 0,
    subjects: [],
    strategy: 1, // 默认稳一稳
    collegeTypes: [],
    citys: [],
  });

  const [showAdvanced, setShowAdvanced] = React.useState(false);
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
    const hasPhysics = formData.subjects.includes('物理');
    const hasHistory = formData.subjects.includes('历史');
    if (hasPhysics && hasHistory) {
      // 如果同时选了物理和历史，以最近选择的为准，默认物理
      return 'physics';
    }
    return hasPhysics ? 'physics' : hasHistory ? 'history' : null;
  }, [formData.subjects]);

  // 分数转排名（内部函数）
  const convertScoreToRank = React.useCallback(async (score: number) => {
    if (score <= 0) return 0;

    const subject = getCurrentSubject();
    if (!subject) {
      console.warn('未选择首选科目，无法进行分数排名转换');
      return Math.max(1, Math.floor((750 - score) * 100));
    }

    try {
      const rank = await scoreRankConverter.scoreToRank(score, 'hubei', subject);
      return rank;
    } catch (error) {
      console.error('分数转排名失败:', error);
      return Math.max(1, Math.floor((750 - score) * 100));
    }
  }, [getCurrentSubject]);

  // 排名转分数（内部函数）
  const convertRankToScore = React.useCallback(async (rank: number) => {
    if (rank <= 0) return 0;

    const subject = getCurrentSubject();
    if (!subject) {
      console.warn('未选择首选科目，无法进行排名分数转换');
      return Math.max(200, 750 - Math.floor(rank / 100));
    }

    try {
      const score = await scoreRankConverter.rankToScore(rank, 'hubei', subject);
      return score;
    } catch (error) {
      console.error('排名转分数失败:', error);
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
      setFormData(prev => ({ ...prev, score: 0, rank: 0 }));
      isUpdatingFromConversion.current = true;
      setRankInput('');
      isUpdatingFromConversion.current = false;
      return;
    }

    // 立即更新分数到 formData
    setFormData(prev => ({
      ...prev,
      score,
      minScore: score - 20,
      maxScore: score + 20,
    }));

    // 检查是否选择了首选科目，如果选择了才进行转换
    const subject = getCurrentSubject();
    if (subject) {
      // 防抖转换排名
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
      setFormData(prev => ({ ...prev, score: 0, rank: 0 }));
      isUpdatingFromConversion.current = true;
      setScoreInput('');
      isUpdatingFromConversion.current = false;
      return;
    }

    // 立即更新排名到 formData
    setFormData(prev => ({ ...prev, rank }));

    // 检查是否选择了首选科目，如果选择了才进行转换
    const subject = getCurrentSubject();
    if (subject) {
      // 防抖转换分数
      rankDebounceRef.current = setTimeout(async () => {
        setIsConverting(true);
        try {
          const score = await convertRankToScore(rank);
          setFormData(prev => ({
            ...prev,
            score,
            minScore: score - 20,
            maxScore: score + 20,
          }));

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
    if (inputMode === 'score' && formData.score > 0) {
      handleScoreChange(formData.score.toString());
    } else if (inputMode === 'rank' && formData.rank && formData.rank > 0) {
      handleRankChange(formData.rank.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.subjects]); // 仅依赖科目变化

  const handleSubjectToggle = (subject: string) => {
    setFormData(prev => {
      const newSubjects = prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject];

      // 确保选择了物理或历史中的一个
      const hasPhysics = newSubjects.includes('物理');
      const hasHistory = newSubjects.includes('历史');

      if (!hasPhysics && !hasHistory && (subject === '物理' || subject === '历史')) {
        return { ...prev, subjects: [subject] };
      }

      if (hasPhysics && hasHistory) {
        return { ...prev, subjects: newSubjects.filter(s => s === subject || (s !== '物理' && s !== '历史')) };
      }

      return { ...prev, subjects: newSubjects };
    });
  };

  const handleCollegeTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      collegeTypes: prev.collegeTypes.includes(type)
        ? prev.collegeTypes.filter(t => t !== type)
        : [...prev.collegeTypes, type]
    }));
  };

  const handleCityToggle = (city: string) => {
    setFormData(prev => ({
      ...prev,
      citys: prev.citys.includes(city)
        ? prev.citys.filter(c => c !== city)
        : [...prev.citys, city]
    }));
  };

  const handleSubmit = () => {
    if (!formData.score || formData.subjects.length !== 3) {
      alert('请填写完整的基础信息：分数和三门科目');
      return;
    }

    const hasPhysicsOrHistory = formData.subjects.includes('物理') || formData.subjects.includes('历史');
    if (!hasPhysicsOrHistory) {
      alert('必须选择物理或历史中的一门');
      return;
    }

    onSubmit(formData);
  };

  const handleQuickQuery = () => {
    if (!formData.score || formData.subjects.length !== 3) {
      alert('请先填写基础信息：分数和三门科目');
      return;
    }

    onSubmit({
      ...formData,
      strategy: 1,
      collegeTypes: [],
      citys: [],
    });
  };

  const isFormValid = formData.score > 0 && formData.subjects.length === 3 &&
    (formData.subjects.includes('物理') || formData.subjects.includes('历史'));

  return (
    <div className="space-y-6">
      {/* 基础信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">基础信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 第一行：报考省份和首选科目 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="province" className="text-base font-medium">
                生源地
              </Label>
              <Select
                value={formData.province}
                onValueChange={(value) => setFormData(prev => ({ ...prev, province: value }))}
              >
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
                value={formData.subjects.includes('物理') ? '物理' : formData.subjects.includes('历史') ? '历史' : ''}
                onValueChange={(value) => {
                  // 清除所有首选科目，然后添加新选择的
                  const newSubjects = formData.subjects.filter(s => s !== '物理' && s !== '历史');
                  if (value) {
                    newSubjects.push(value);
                  }
                  setFormData(prev => ({ ...prev, subjects: newSubjects }));
                }}
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

          {/* 第二行：再选科目 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-base font-medium">
                再选科目 <span className="text-red-500">*</span>
              </Label>
              <Badge variant="outline" className={
                formData.subjects.filter(s => s !== '物理' && s !== '历史').length === 2
                  ? 'border-green-500 text-green-700'
                  : 'border-red-500 text-red-700'
              }>
                已选 {formData.subjects.filter(s => s !== '物理' && s !== '历史').length}/2 门
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {subjects.filter(s => s.type === 'optional').map((subject) => (
                <div key={subject.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={subject.value}
                    checked={formData.subjects.includes(subject.value)}
                    onCheckedChange={() => handleSubjectToggle(subject.value)}
                    disabled={
                      !formData.subjects.includes(subject.value) &&
                      formData.subjects.filter(s => s !== '物理' && s !== '历史').length >= 2
                    }
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
                高考分数 <span className="text-red-500">*</span>
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
                位次
              </Label>
              <Input
                id="rank"
                type="number"
                placeholder="可手动输入位次"
                value={rankInput}
                onChange={(e) => handleRankChange(e.target.value)}
                min={1}
                disabled={isConverting}
              />
            </div>
          </div>

          {/* 高级筛选 */}
          <Card>
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <IconFilter size={20} />
                      <CardTitle>高级筛选</CardTitle>
                      <Badge variant="secondary">可选</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {showAdvanced ? '收起筛选' : '展开筛选'}
                      </span>
                      {showAdvanced ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1">
                <CardContent className="space-y-6">
                  {/* 院校类型 */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">院校类型</Label>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {Object.entries(collegeTypeCategories).map(([category, info]) => (
                        <div key={category} className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{info.icon}</span>
                            <span className="font-medium">{category}</span>
                            <span className="text-sm text-muted-foreground">({info.description})</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {info.types.map((type) => (
                              <div key={`${category}-${type}`} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`college-${category}-${type}`}
                                  checked={formData.collegeTypes.includes(type)}
                                  onCheckedChange={() => handleCollegeTypeToggle(type)}
                                />
                                <Label htmlFor={`college-${category}-${type}`} className="text-sm cursor-pointer">
                                  {type}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* 地区和分数范围 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 目标城市 */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">目标城市</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {hubeiCities.map((city) => (
                          <div key={city} className="flex items-center space-x-2">
                            <Checkbox
                              id={`city-${city}`}
                              checked={formData.citys.includes(city)}
                              onCheckedChange={() => handleCityToggle(city)}
                            />
                            <Label htmlFor={`city-${city}`} className="text-sm cursor-pointer">
                              {city}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 分数范围 */}
                    <div className="space-y-4">
                      <Label className="text-base font-medium">分数范围</Label>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="minScore" className="text-sm">最低分</Label>
                            <Input
                              id="minScore"
                              type="number"
                              value={formData.minScore || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, minScore: Number(e.target.value) }))}
                              placeholder="最低分数"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="maxScore" className="text-sm">最高分</Label>
                            <Input
                              id="maxScore"
                              type="number"
                              value={formData.maxScore || ''}
                              onChange={(e) => setFormData(prev => ({ ...prev, maxScore: Number(e.target.value) }))}
                              placeholder="最高分数"
                            />
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground p-3 bg-blue-50 rounded-lg">
                          💡 分数范围默认为您的分数上下20分，可手动调整扩大搜索范围
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* 查询按钮 */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={loading || !isFormValid}
              className="flex-1"
              size="lg"
            >
              <IconSearch size={16} className="mr-2" />
              {loading ? '查询中...' : '查询推荐院校'}
            </Button>
          </div>
        </CardContent>
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
