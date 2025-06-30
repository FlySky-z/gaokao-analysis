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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { IconChevronDown, IconChevronUp, IconSearch, IconFilter } from "@tabler/icons-react"
import { scoreRankConverter } from "@/lib/score-rank-converter"

// API 接口定义
export interface ProvincesResponse {
  /**
   * 响应码
   */
  code: number;
  data: ProvincesData;
  /**
   * 响应消息
   */
  msg: string;
}

export interface ProvincesData {
  /**
   * 可选省份列表
   */
  provinces: Province[];
}

export interface Province {
  /**
   * 对应的城市
   */
  citys: string[];
  /**
   * 省份名称
   */
  province: string;
}

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

  // 省份城市数据状态
  const [provincesData, setProvincesData] = React.useState<Province[]>([]);
  const [loadingProvinces, setLoadingProvinces] = React.useState(false);
  const [selectedProvinces, setSelectedProvinces] = React.useState<string[]>([]);

  // 防抖定时器
  const scoreDebounceRef = React.useRef<NodeJS.Timeout | null>(null);
  const rankDebounceRef = React.useRef<NodeJS.Timeout | null>(null);

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

  // 获取省份城市数据
  const fetchProvincesData = React.useCallback(async () => {
    if (provincesData.length > 0) return;
    
    setLoadingProvinces(true);
    try {
      const response = await fetch('/api/options/provinces');
      if (!response.ok) throw new Error('网络请求失败');
      
      const data = await response.json();
      
      // 解析数据：code 为 0 表示成功
      if (data.code === 0 && data.data?.provinces) {
        setProvincesData(data.data.provinces);
      }
    } catch (error) {
      console.error('获取省份数据失败:', error);
    } finally {
      setLoadingProvinces(false);
    }
  }, [provincesData.length]);

  // 组件挂载时获取省份数据
  React.useEffect(() => {
    fetchProvincesData();
  }, [fetchProvincesData]);

  // 处理省份选择
  const handleProvinceToggle = (provinceName: string) => {
    const province = provincesData.find(p => p.province === provinceName);
    if (!province) return;

    const cities = province.citys || []; // 处理空数组情况
    const isSelected = selectedProvinces.includes(provinceName);
    
    if (isSelected) {
      // 取消选择省份
      setSelectedProvinces(prev => prev.filter(p => p !== provinceName));
      if (cities.length > 0) {
        // 移除该省份下的所有城市（拼接格式）
        const provinceCities = cities.map(city => `${provinceName}${city}`);
        setFormData(prev => ({
          ...prev,
          citys: prev.citys.filter(city => !provinceCities.includes(city))
        }));
      }
    } else {
      // 选择省份
      setSelectedProvinces(prev => [...prev, provinceName]);
      if (cities.length > 0) {
        // 添加该省份下的所有城市（拼接格式）
        const provinceCities = cities.map(city => `${provinceName}${city}`);
        setFormData(prev => ({
          ...prev,
          citys: [...new Set([...prev.citys, ...provinceCities])]
        }));
      }
    }
  };

  // 处理城市选择
  const handleCityToggle = (cityName: string, provinceName: string) => {
    const fullCityName = `${provinceName}${cityName}`;
    
    setFormData(prev => ({
      ...prev,
      citys: prev.citys.includes(fullCityName)
        ? prev.citys.filter(c => c !== fullCityName)
        : [...prev.citys, fullCityName]
    }));
    
    // 更新省份选择状态
    const province = provincesData.find(p => p.province === provinceName);
    if (province) {
      const cities = province.citys || [];
      
      // 计算当前操作后该省份会有多少城市被选中
      const currentSelectedCities = formData.citys.filter(city => 
        city.startsWith(provinceName) && city !== fullCityName
      );
      
      const willBeSelected = !formData.citys.includes(fullCityName);
      const futureSelectedCount = willBeSelected 
        ? currentSelectedCities.length + 1 
        : currentSelectedCities.length;
      
      // 如果该省份的所有城市都将被选中，则标记省份为选中状态
      if (futureSelectedCount === cities.length && !selectedProvinces.includes(provinceName)) {
        setSelectedProvinces(prev => [...prev, provinceName]);
      } 
      // 如果该省份不再有城市被选中，则取消省份选中状态
      else if (futureSelectedCount === 0 && selectedProvinces.includes(provinceName)) {
        setSelectedProvinces(prev => prev.filter(p => p !== provinceName));
      }
      // 如果部分城市被选中，则取消省份的全选状态
      else if (futureSelectedCount > 0 && futureSelectedCount < cities.length && selectedProvinces.includes(provinceName)) {
        setSelectedProvinces(prev => prev.filter(p => p !== provinceName));
      }
    }
  };

  // 避免循环更新的标记
  const isUpdatingFromConversion = React.useRef(false);

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
                      <div className="flex items-center gap-2">
                        <Label className="text-base font-medium">目标城市</Label>
                        {loadingProvinces && (
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {formData.citys.length > 0 && (
                          <Badge variant="outline" className="border-green-500 text-green-700">
                            已选 {formData.citys.length} 个城市
                          </Badge>
                        )}
                      </div>
                      
                      {/* 省份选择网格 */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {provincesData.length === 0 && !loadingProvinces ? (
                          <div className="col-span-full text-center text-muted-foreground py-4">
                            暂无省份数据
                          </div>
                        ) : (
                          provincesData.map((province) => {
                            const cities = province.citys || [];
                            const isProvinceSelected = selectedProvinces.includes(province.province);
                            const selectedCitiesInProvince = cities.filter((city: string) => 
                              formData.citys.includes(`${province.province}${city}`)
                            ).length;
                            
                            return (
                              <div key={province.province} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-muted/50 min-h-[3rem]">
                                {/* 省份复选框 - 选择全部城市 */}
                                <Checkbox
                                  checked={isProvinceSelected}
                                  onCheckedChange={() => handleProvinceToggle(province.province)}
                                />
                                
                                {/* 省份名称 - 点击弹出城市选择 */}
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button className="flex-1 text-left text-sm font-medium hover:text-blue-600 cursor-pointer min-h-[2rem] flex items-center">
                                      <div className="flex items-center flex-wrap gap-1">
                                        <span>{province.province}</span>
                                        {selectedCitiesInProvince > 0 && (
                                          <Badge variant="secondary" className="text-xs">
                                            {selectedCitiesInProvince}/{cities.length}
                                          </Badge>
                                        )}
                                      </div>
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80 p-4" align="start">
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <h4 className="font-medium">{province.province}的城市</h4>
                                        <Badge variant="outline" className="text-xs">
                                          {selectedCitiesInProvince}/{cities.length}
                                        </Badge>
                                      </div>
                                      
                                      {cities.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                          {cities.map((city: string) => {
                                            const fullCityName = `${province.province}${city}`;
                                            return (
                                              <div key={`${province.province}-${city}`} className="flex items-center space-x-2">
                                                <Checkbox
                                                  id={`popover-city-${province.province}-${city}`}
                                                  checked={formData.citys.includes(fullCityName)}
                                                  onCheckedChange={() => handleCityToggle(city, province.province)}
                                                />
                                                <Label 
                                                  htmlFor={`popover-city-${province.province}-${city}`} 
                                                  className="text-sm cursor-pointer flex-1"
                                                >
                                                  {city}
                                                </Label>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <div className="text-center text-muted-foreground text-sm py-4">
                                          暂无城市数据
                                        </div>
                                      )}
                                      
                                      {/* 快捷操作 */}
                                      <div className="flex gap-2 pt-2 border-t">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handleProvinceToggle(province.province)}
                                          disabled={cities.length === 0}
                                        >
                                          {isProvinceSelected ? '取消全选' : '全选'}
                                        </Button>
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            );
                          })
                        )}
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
