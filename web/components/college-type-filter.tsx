import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export interface CollegeType {
  value: string;
  label: string;
  category: '办学类型' | '院校特色' | '院校类型';
}

const collegeTypes: CollegeType[] = [
  // 办学类型
  { value: '公办', label: '公办', category: '办学类型' },
  { value: '民办', label: '民办', category: '办学类型' },
  { value: '军事', label: '军事', category: '办学类型' },
  { value: '研究生院', label: '研究生院', category: '办学类型' },
  { value: '保研', label: '保研', category: '办学类型' },
  { value: '本科', label: '本科', category: '办学类型' },
  { value: '省部共建', label: '省部共建', category: '办学类型' },
  { value: '部委院校', label: '部委院校', category: '办学类型' },
  { value: '省属', label: '省属', category: '办学类型' },
  { value: '省重点', label: '省重点', category: '办学类型' },
  { value: '国家重点', label: '国家重点', category: '办学类型' },
  
  // 院校特色
  { value: '985', label: '985', category: '院校特色' },
  { value: '211', label: '211', category: '院校特色' },
  { value: '双一流', label: '双一流', category: '院校特色' },
  { value: '101计划', label: '101计划', category: '院校特色' },
  { value: 'C9', label: 'C9', category: '院校特色' },
  { value: 'E9', label: 'E9', category: '院校特色' },
  { value: '两电一邮', label: '两电一邮', category: '院校特色' },
  { value: '国防七子', label: '国防七子', category: '院校特色' },
  { value: '建筑老八校', label: '建筑老八校', category: '院校特色' },
  { value: '建筑新八校', label: '建筑新八校', category: '院校特色' },
  { value: '八大美院', label: '八大美院', category: '院校特色' },
  { value: '五院四系', label: '五院四系', category: '院校特色' },
  
  // 院校类型
  { value: '综合', label: '综合', category: '院校类型' },
  { value: '理工', label: '理工', category: '院校类型' },
  { value: '师范', label: '师范', category: '院校类型' },
  { value: '财经', label: '财经', category: '院校类型' },
  { value: '医药', label: '医药', category: '院校类型' },
  { value: '农林', label: '农林', category: '院校类型' },
  { value: '语言', label: '语言', category: '院校类型' },
  { value: '政法', label: '政法', category: '院校类型' },
  { value: '体育', label: '体育', category: '院校类型' },
  { value: '民族', label: '民族', category: '院校类型' },
  { value: '艺术', label: '艺术', category: '院校类型' },
];

interface CollegeTypeFilterProps {
  selectedTypes: string[];
  onTypeChange: (types: string[]) => void;
}

export function CollegeTypeFilter({ selectedTypes, onTypeChange }: CollegeTypeFilterProps) {
  const categories = ['办学类型', '院校特色', '院校类型'] as const;

  const handleTypeToggle = (value: string) => {
    if (selectedTypes.includes(value)) {
      onTypeChange(selectedTypes.filter(type => type !== value));
    } else {
      onTypeChange([...selectedTypes, value]);
    }
  };

  const renderCategory = (category: typeof categories[number]) => {
    const categoryTypes = collegeTypes.filter(type => type.category === category);
    
    return (
      <div key={category} className="space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground">{category}</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {categoryTypes.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox
                id={type.value}
                checked={selectedTypes.includes(type.value)}
                onCheckedChange={() => handleTypeToggle(type.value)}
              />
              <Label
                htmlFor={type.value}
                className="text-sm font-normal cursor-pointer"
              >
                {type.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {categories.map((category, index) => (
        <React.Fragment key={category}>
          {renderCategory(category)}
          {index < categories.length - 1 && <Separator />}
        </React.Fragment>
      ))}
    </div>
  );
}
