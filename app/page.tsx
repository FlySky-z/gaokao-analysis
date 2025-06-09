import Image from "next/image";
import Link from "next/link";
import {
  IconBrain,
  IconChartBar,
  IconSchool,
  IconTargetArrow,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  // 高考结束时间：2025年6月8日
  const examEndDate = new Date(2025, 5, 8);
  const currentDate = new Date();
  const timeLeft = examEndDate.getTime() - currentDate.getTime();
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* 导航栏 */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between p-4 max-w-[1280px] mx-auto">
          <div className="flex items-center gap-2">
            <IconSchool className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">高考志愿分析系统</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium">
              首页
            </Link>
            <Link href="#features" className="text-sm font-medium">
              功能特点
            </Link>
            <Link href="#about" className="text-sm font-medium">
              关于我们
            </Link>
          </nav>
          <div>
            <Button asChild>
              <Link href="/login">登录</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="flex-1 max-w-[1280px] mx-auto px-4">
        {/* 英雄区域 */}
        <section className="py-12 md:py-24 lg:py-32">
          <div className="grid gap-12 md:grid-cols-2 md:gap-16 items-center">
            <div className="flex flex-col gap-6">
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
                {daysLeft > 0
                  ? `距离高考结束还有 ${daysLeft} 天`
                  : `高考结束 ${Math.abs(daysLeft)} 天`}
                </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                智能分析，精准定位理想大学
              </h1>
              <p className="text-xl text-muted-foreground">
                基于历年高考数据和院校招生情况，为您提供个性化的志愿填报建议，助您踏入理想学府。
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href="/login">开始分析</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#features">了解更多</Link>
                </Button>
              </div>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
              <Image
                src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                alt="大学校园"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </section>

        {/* 功能特点 */}
        <section id="features" className="py-12 md:py-24 lg:py-32 bg-muted/50">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-6 text-center">
            <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">
              功能特点
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              我们的志愿分析系统能够帮助您做出更加明智的选择
            </p>
            <Separator className="my-4" />
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-12 px-6">
            <Card>
              <CardHeader>
                <IconChartBar className="h-10 w-10 text-primary mb-2" />
                <CardTitle>分数线趋势分析</CardTitle>
                <CardDescription>
                  分析历年各高校各专业的分数线走势，科学预测今年的录取线
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <IconBrain className="h-10 w-10 text-primary mb-2" />
                <CardTitle>智能志愿推荐</CardTitle>
                <CardDescription>
                  根据您的分数、兴趣和地域偏好，智能推荐最适合的院校和专业
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <IconTargetArrow className="h-10 w-10 text-primary mb-2" />
                <CardTitle>院校专业对比</CardTitle>
                <CardDescription>
                  多维度对比不同院校和专业，助您做出最优选择
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* 关于我们 */}
        <section id="about" className="py-12 md:py-24 lg:py-32">
          <div className="mx-auto grid gap-10 md:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">关于我们</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                我们是一支由教育专家和数据分析师组成的团队，致力于利用大数据和人工智能技术，
                为高考学生提供科学、精准的志愿填报指导。
              </p>
              <p className="mt-4 text-lg text-muted-foreground">
                自系统上线以来，已成功帮助超过10万名学生找到理想的大学和专业，
                满意度高达95%以上。
              </p>
            </div>
            <div className="flex justify-center">
              <div className="relative h-[400px] w-full overflow-hidden rounded-xl">
                <Image
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                  alt="我们的团队"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 号召行动 */}
        <section className="py-12 md:py-24 lg:py-32 bg-primary/5">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-6 text-center">
            <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">
              准备好开始您的志愿填报之旅了吗？
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              立即登录系统，开始您的志愿分析，迈向理想的未来。
            </p>
            <Button size="lg" asChild className="mt-4">
              <Link href="/login">立即登录</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="border-t py-8 md:py-12">
        <div className="flex flex-col items-center justify-center gap-4 md:gap-8 md:flex-row">
          <div className="flex items-center gap-2">
            <IconSchool className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">高考志愿分析系统</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            © 2025 高考志愿分析系统 版权所有
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              隐私政策
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              使用条款
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              联系我们
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
