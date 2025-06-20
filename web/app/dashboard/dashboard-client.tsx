"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SiteHeader } from "@/components/site-header"
import { QueryForm, QueryFormData } from "@/components/query-form"
import { UniversityResults, QueryResult } from "@/components/university-results"
import { MajorPriorityForm, MajorPriorityFormData } from "@/components/major-priority-form"
import { MajorPriorityResults, MajorPriorityResult, MajorGroupDetail } from "@/components/major-priority-results"
import { UserRankDisplay } from "@/components/user-rank-display"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/data-table"

interface User {
  name: string;
  email: string;
}

interface RankData {
  score: number;
  rank: number;
  province: string;
  subjectType: string;
}

interface DashboardClientProps {
  user: User;
}

// API调用函数 - 院校优先
async function queryColleges(queryData: QueryFormData): Promise<QueryResult> {
  try {
    const response = await fetch('/api/voluntary/universityPriority', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.message || '查询失败');
    }

    return data;
  } catch (error) {
    console.error('API调用失败:', error);

    // 如果API调用失败，返回模拟数据用于演示
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      list: [],
      page: 1,
      page_num: 1,
      page_size: 10,
      total: 0
    };
  }
}

// API调用函数 - 专业优先
async function queryMajors(queryData: MajorPriorityFormData): Promise<MajorPriorityResult> {
  try {
    // 构建查询参数
    const searchParams = new URLSearchParams();
    searchParams.append('class_first_choise', queryData.class_first_choise);
    searchParams.append('class_optional_choise', queryData.class_optional_choise);
    searchParams.append('province', queryData.province);
    searchParams.append('rank', queryData.rank.toString());
    searchParams.append('college_location', queryData.college_location);
    
    if (queryData.interest) searchParams.append('interest', queryData.interest);
    if (queryData.strategy !== undefined) searchParams.append('strategy', queryData.strategy.toString());
    if (queryData.page) searchParams.append('page', queryData.page);
    if (queryData.page_size) searchParams.append('page_size', queryData.page_size);

    const response = await fetch(`/api/report/get?${searchParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.message || '查询失败');
    }

    return data;
  } catch (error) {
    console.error('专业优先API调用失败:', error);

    // 如果API调用失败，返回模拟数据用于演示
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      code: 200,
      data: {
        conf: {
          page: 1,
          page_size: 20,
          total_number: 0,
          total_page: 1
        },
        list: []
      },
      msg: '查询完成'
    };
  }
}

// API调用函数 - 专业组详情
async function queryMajorGroup(params: {
  group_code: string;
  school_code: string;
  province: string;
  rank: number;
  score: number;
  subjects: string;
}): Promise<MajorGroupDetail> {
  try {
    const response = await fetch('/api/voluntary/majorGroup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.message || '查询失败');
    }

    // 返回专业组详情数据
    return data.data || {};
  } catch (error) {
    console.error('专业组详情API调用失败:', error);

    // 如果API调用失败，返回空数据
    return {
      group_code: params.group_code,
      major: [],
      probability: 0,
      strategy: 1
    };
  }
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const [rankData, setRankData] = React.useState<RankData | null>(null);
  const [queryResults, setQueryResults] = React.useState<QueryResult | null>(null);
  const [majorResults, setMajorResults] = React.useState<MajorPriorityResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [majorLoading, setMajorLoading] = React.useState(false);

  const handleRankSelect = (score: number, rank: number, province: string, subjectType: string) => {
    setRankData({ score, rank, province, subjectType });
  };

  const handleQuery = async (queryData: QueryFormData) => {
    try {
      setLoading(true);
      const results = await queryColleges(queryData);
      setQueryResults(results);
    } catch (error) {
      console.error('查询失败:', error);
      // 这里可以添加错误提示
    } finally {
      setLoading(false);
    }
  };

  const handleMajorQuery = async (queryData: MajorPriorityFormData) => {
    try {
      setMajorLoading(true);
      const results = await queryMajors(queryData);
      setMajorResults(results);
    } catch (error) {
      console.error('专业查询失败:', error);
      // 这里可以添加错误提示
    } finally {
      setMajorLoading(false);
    }
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

              <Tabs defaultValue="query" className="px-4 lg:px-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="analysis">数据分析</TabsTrigger>
                  <TabsTrigger value="query">志愿查询</TabsTrigger>
                </TabsList>

                <TabsContent value="analysis" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>用户排名图表</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartAreaInteractive onRankSelect={handleRankSelect} />
                    </CardContent>
                  </Card>

                  {rankData && (
                    <>
                      <UserRankDisplay rankData={rankData} />
                      <DataTable rankData={rankData} />
                    </>
                  )}
                </TabsContent>

                <TabsContent value="query" className="space-y-6">
                  <Tabs defaultValue="university" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="university">院校优先</TabsTrigger>
                      <TabsTrigger value="major">专业优先</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="university" className="space-y-6">
                      <QueryForm onSubmit={handleQuery} loading={loading} />
                      <UniversityResults results={queryResults} loading={loading} />
                    </TabsContent>
                    
                    <TabsContent value="major" className="space-y-6">
                      <MajorPriorityForm onSubmit={handleMajorQuery} loading={majorLoading} />
                      <MajorPriorityResults 
                        results={majorResults} 
                        loading={majorLoading}
                        onViewMajorGroup={queryMajorGroup}
                      />
                    </TabsContent>
                  </Tabs>
                </TabsContent>
              </Tabs>

            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
