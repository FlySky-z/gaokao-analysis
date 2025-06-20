"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconLayoutColumns,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { List } from "@/lib/model/collegeModel"

interface RankData {
  score: number;
  rank: number;
  province: string;
  subjectType: string;
}

interface DataTableProps {
  rankData: RankData | null;
}

const columns: ColumnDef<List>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "colledge_name",
    header: "院校名称",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("colledge_name")}</div>
    ),
  },
  {
    accessorKey: "professional_name",
    header: "专业名称",
    cell: ({ row }) => (
      <div className="max-w-48 truncate">{row.getValue("professional_name")}</div>
    ),
  },
  {
    accessorKey: "lowest_points",
    header: () => <div className="text-right">录取最低分</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono">
        {row.getValue("lowest_points") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "lowest_rank",
    header: () => <div className="text-right">录取最低位次</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono">
        {row.getValue("lowest_rank")?.toLocaleString() || "-"}
      </div>
    ),
  },
  {
    accessorKey: "class_demand",
    header: "选科要求",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {row.getValue("class_demand") || "不限"}
      </Badge>
    ),
  },
  {
    accessorKey: "description",
    header: "备注",
    cell: ({ row }) => {
      const description = row.getValue("description") as string
      if (!description || description === "-") {
        return <span className="w-64 text-muted-foreground">-</span>
      }
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="max-w-xs truncate text-sm text-muted-foreground cursor-help">
              {description}
            </p>
          </TooltipTrigger>
            <TooltipContent side="top" className="max-w-2xs text-wrap">
            <p>{description}</p>
          </TooltipContent>
        </Tooltip>
      )
    },
    size: 200,
    enableHiding: false,
  },
]

export function DataTable({ rankData }: DataTableProps) {
  const [data, setData] = React.useState<List[]>([])
  const [loading, setLoading] = React.useState(false)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 20,
  })
  const [totalPages, setTotalPages] = React.useState(0)
  const [totalRecords, setTotalRecords] = React.useState(0)

  // 获取院校数据
  const fetchCollegeData = async (rank: number, province: string, subjectType: string, page = 1) => {
    setLoading(true)
    try {
      // 构建查询参数
      const params = new URLSearchParams({
        class_comb: subjectType === "physics" ? "123" : "456", // 物理：123，历史：456
        page: page.toString(),
        page_size: "20",
        province: province,
        rank: rank.toString(),
      })

      const response = await fetch(`/api/report/get?${params}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.code === 0) {
        setData(result.data.list)
        setTotalPages(result.data.conf?.total_page || 0)
        setTotalRecords(result.data.conf?.total_number || 0)

        // 重置分页到第一页
        if (page === 1) {
          setPagination(prev => ({ ...prev, pageIndex: 0 }))
        }
      } else {
        toast.error(`获取数据失败: ${result.msg}`)
        setData([])
      }
    } catch (error) {
      console.error('获取院校数据失败:', error)
      toast.error('获取院校数据失败，请检查网络连接')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  // 当位次数据变化时获取院校数据
  React.useEffect(() => {
    if (rankData) {
      setHasInitialized(true)
    } else {
      setData([])
      setTotalPages(0)
      setTotalRecords(0)
      setHasInitialized(false)
    }
  }, [rankData])

  // 当分页变化时获取数据（但跳过初始加载）
  const [hasInitialized, setHasInitialized] = React.useState(false)

  React.useEffect(() => {
    if (rankData && hasInitialized) {
      fetchCollegeData(rankData.rank, rankData.province, rankData.subjectType, pagination.pageIndex + 1)
    }
  }, [pagination.pageIndex, rankData, hasInitialized])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    pageCount: totalPages,
    manualPagination: true,
    getRowId: (row) => row.id?.toString() || Math.random().toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  if (!rankData) {
    return (
      <Card className="mx-4 lg:mx-6">
        <CardHeader>
          <CardTitle>可选院校信息</CardTitle>
          <CardDescription>
            点击上方图表中的任意位置查看对应位次的可选院校
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            请先在图表中选择位次
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-4 lg:mx-6">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle>可选院校信息</CardTitle>
            <CardDescription>
              分数 {rankData.score.toLocaleString()} 位次 {rankData.rank.toLocaleString()} 的可选院校 (共 {totalRecords.toLocaleString()} 条记录)
            </CardDescription>
          </div>

          {/* 筛选工具栏 */}
          <div className="flex items-center space-x-2">
            <Input
              placeholder="搜索院校或专业..."
              value={(table.getColumn("colledge_name")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("colledge_name")?.setFilterValue(event.target.value)
              }
              className="h-8 w-[150px] lg:w-[250px]"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconLayoutColumns className="mr-2 h-4 w-4" />
                  显示列
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id === "colledge_name" && "院校名称"}
                        {column.id === "professional_name" && "专业名称"}
                        {column.id === "lowest_points" && "录取最低分"}
                        {column.id === "lowest_rank" && "录取最低位次"}
                        {column.id === "class_demand" && "选科要求"}
                        {column.id === "description" && "备注"}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">

          {/* 数据表格 */}
          <div className="rounded-md border relative">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      没有找到相关数据
                    </TableCell>
                  </TableRow>
                ) : (
                  // 初次加载时显示占位行
                  Array.from({ length: pagination.pageSize }, (_, index) => (
                    <TableRow key={`placeholder-${index}`}>
                      <TableCell colSpan={columns.length} className="h-12">
                        <div className="w-full h-4 bg-muted/20 rounded"></div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* 加载遮罩层 */}
            {loading && data.length > 0 && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex items-center space-x-2 bg-background border rounded-lg px-4 py-2 shadow-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">正在加载数据...</span>
                </div>
              </div>
            )}
          </div>

          {/* 分页控件 */}
          <div className="flex items-center justify-between px-2">
            <div className="flex-1 text-sm text-muted-foreground">
              已选择 {table.getFilteredSelectedRowModel().rows.length} / {table.getFilteredRowModel().rows.length} 行
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">每页显示</p>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value))
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                第 {table.getState().pagination.pageIndex + 1} / {totalPages} 页
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">跳到第一页</span>
                  <IconChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">上一页</span>
                  <IconChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">下一页</span>
                  <IconChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(totalPages - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">跳到最后一页</span>
                  <IconChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
