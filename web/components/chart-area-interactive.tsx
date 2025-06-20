"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export const description = "高考一分一段表图表"

// 省份配置
const PROVINCES = [
  { code: "hubei", name: "湖北" },
  // { code: "guangdong", name: "广东" },
  // { code: "jiangsu", name: "江苏" },
  // { code: "zhejiang", name: "浙江" },
]

const PROVINCES_MAP: Record<string, string> = {
  hubei: "湖北",
  // guangdong: "广东",
  // jiangsu: "江苏",
  // zhejiang: "浙江",
}

// 科目类型配置
const SUBJECT_TYPES = [
  { code: "physics", name: "首选物理" },
  { code: "history", name: "首选历史" },
]

// 高考数据接口
interface GaokaoData {
  score: string
  num: number
  accumulate: number
}

// 图表数据接口
interface ChartData {
  score: string
  num: number
  accumulate: number
  scoreNum: number // 用于排序的数字分数
}

const chartConfig = {
  num: {
    label: "当前分数人数",
    color: "hsl(var(--chart-1))",
  },
  accumulate: {
    label: "累计人数",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

interface ChartAreaInteractiveProps {
  onRankSelect?: (score: number, rank: number, province: string, subjectType: string) => void
}

export function ChartAreaInteractive({ onRankSelect }: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile()
  const [scoreRange, setScoreRange] = React.useState("all")
  const [province, setProvince] = React.useState("hubei")
  const [subjectType, setSubjectType] = React.useState("physics")
  const [chartData, setChartData] = React.useState<ChartData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showAccumulate, setShowAccumulate] = React.useState(false)
  const [selectedRank, setSelectedRank] = React.useState<number | null>(null)
  const [chartReady, setChartReady] = React.useState(false)

  // 加载高考数据
  React.useEffect(() => {
    const loadGaokaoData = async () => {
      setChartReady(false) // 重置图表准备状态
      try {
        // 根据省份和科目类型构建API请求路径
        const response = await fetch(`/api/gaokao/data?province=${province}&subject=${subjectType}`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const jsonData = await response.json()

        // 检查是否有错误
        if (jsonData.error) {
          throw new Error(jsonData.error)
        }

        // 处理数据，转换分数为数字用于排序和筛选
        const processedData: ChartData[] = jsonData.data.map((item: GaokaoData) => {
          let scoreNum = 0
          if (item.score === "695-750") {
            scoreNum = 722.5 // 取中位数
          } else {
            scoreNum = parseInt(item.score)
          }

          return {
            ...item,
            scoreNum
          }
        }).reverse() // 反转数组，让分数从低到高排列        
        setChartData(processedData)
        setLoading(false)
        // 添加一个小延迟确保动画能够播放
        setTimeout(() => {
          setChartReady(true)
        }, 50)
      } catch (error) {
        console.error('加载高考数据失败:', error)
        setLoading(false)
      }
    }

    loadGaokaoData()
  }, [province, subjectType]) // 依赖省份和科目类型变化

  // 根据分数范围筛选数据
  const filteredData = React.useMemo(() => {
    if (scoreRange === "all") return chartData

    const [min, max] = scoreRange.split("-").map(Number)
    return chartData.filter((item) => {
      return item.scoreNum >= min && item.scoreNum <= max
    })
  }, [chartData, scoreRange])

  return (
    <Card className="@container/card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle>高考一分一段表</CardTitle>
            <CardDescription>
              <p>
                 {selectedRank && `当前选中位次: ${selectedRank.toLocaleString()}`}
              </p>
            </CardDescription>
          </div>
          <CardAction>
            <div className="flex flex-col gap-4">
              {/* 省份和科目类型选择 */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="province-select" className="text-sm text-gray-700 whitespace-nowrap">
                    省份:
                  </label>
                  <Select value={province} onValueChange={setProvince}>
                    <SelectTrigger id="province-select" className="w-32" size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {PROVINCES.map((p) => (
                        <SelectItem key={p.code} value={p.code} className="rounded-lg">
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="subject-tabs" className="text-sm text-gray-700 whitespace-nowrap">
                    科目:
                  </label>
                  <Tabs value={subjectType} onValueChange={setSubjectType}>
                    <TabsList id="subject-tabs" className="grid w-fit grid-cols-2">
                      {SUBJECT_TYPES.map((subject) => (
                        <TabsTrigger key={subject.code} value={subject.code} className="text-sm">
                          {subject.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              {/* 累计人数开关和分数范围选择 */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show-accumulate"
                    checked={showAccumulate}
                    onChange={(e) => setShowAccumulate(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="show-accumulate" className="text-sm text-gray-700">
                    显示累计人数
                  </label>
                </div>
                <div className="flex-1">
                  <ToggleGroup
                    type="single"
                    value={scoreRange}
                    onValueChange={setScoreRange}
                    variant="outline"
                    className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
                  >
                    <ToggleGroupItem value="all">全部分数</ToggleGroupItem>
                    <ToggleGroupItem value="600-750">600分以上</ToggleGroupItem>
                    <ToggleGroupItem value="650-750">650分以上</ToggleGroupItem>
                    <ToggleGroupItem value="680-750">680分以上</ToggleGroupItem>
                  </ToggleGroup>
                  <Select value={scoreRange} onValueChange={setScoreRange}>
                    <SelectTrigger
                      className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
                      size="sm"
                      aria-label="选择分数范围"
                    >
                      <SelectValue placeholder="全部分数" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all" className="rounded-lg">
                        全部分数
                      </SelectItem>
                      <SelectItem value="600-750" className="rounded-lg">
                        600分以上
                      </SelectItem>
                      <SelectItem value="650-750" className="rounded-lg">
                        650分以上
                      </SelectItem>
                      <SelectItem value="680-750" className="rounded-lg">
                        680分以上
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardAction>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading || !chartReady ? (
          <div className="flex items-center justify-center h-[400px] text-gray-500">
            正在加载数据...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-gray-500">
            没有符合条件的数据
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[400px] w-full"
          >
            <AreaChart
              data={filteredData}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              onClick={(data) => {
                if (data && data.activePayload && data.activePayload[0]) {
                  const payload = data.activePayload[0].payload
                  if (payload && payload.accumulate) {
                    setSelectedRank(payload.accumulate)
                    onRankSelect?.(payload.score, payload.accumulate, PROVINCES_MAP[province], subjectType)
                  }
                }
              }}
            >
              <defs>
                <linearGradient id="fillNum" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-num)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-num)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillAccumulate" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-accumulate)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-accumulate)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="score"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  if (value >= 10000) {
                    return `${(value / 10000).toFixed(1)}万`
                  } else if (value >= 1000) {
                    return `${(value / 1000).toFixed(1)}k`
                  }
                  return value.toString()
                }}
              />
              <ChartTooltip
                cursor={{ stroke: "var(--color-num)", strokeWidth: 1, strokeDasharray: "5 5" }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => `分数: ${value}`}
                    formatter={(value, name, props) => {
                      // 只处理第一个数据项（num），始终显示当前分数人数和累计人数
                      if (name === "num") {
                        const accumulate = props?.payload?.accumulate
                        return [
                          [typeof value === "number" ? value.toLocaleString() : value, "当前分数人数 "],
                          [typeof accumulate === "number" ? accumulate.toLocaleString() : accumulate, "累计人数(位次)"]
                        ]
                      }
                      // 如果是accumulate数据项，返回null避免重复显示
                      if (name === "accumulate") {
                        return null
                      }
                      // 其他情况的默认处理
                      return [
                        typeof value === "number" ? value.toLocaleString() : value,
                        name === "num" ? "当前分数人数" : "累计人数(位次)"
                      ]
                    }}
                  />
                }
              />
              <Area
                dataKey="num"
                type="monotone"
                fill="url(#fillNum)"
                stroke="var(--color-num)"
                strokeWidth={2}
              />
              {showAccumulate && (
                <Area
                  dataKey="accumulate"
                  type="monotone"
                  fill="url(#fillAccumulate)"
                  stroke="var(--color-accumulate)"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ChartContainer>
        )}

      </CardContent>
    </Card>
  )
}
