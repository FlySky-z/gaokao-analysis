"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconArrowRight } from "@tabler/icons-react"
import { useActionState } from 'react';
import { authenticate } from '@/lib/authorize';
import { useSearchParams } from 'next/navigation';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>登录您的账户</CardTitle>
          <CardDescription>
            输入您的用户名和密码登录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="请输入用户名"
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">密码</Label>
                </div>
                <Input id="password" name="password" type="password" required />
                {errorMessage && (
                    <p className="text-sm text-red-500">{errorMessage}</p>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <input type="hidden" name="redirectTo" value={callbackUrl} />
                <Button type="submit" className="w-full" aria-disabled={isPending}>
                  登录 <IconArrowRight className="ml-auto h-5 w-5 text-gray-50" />
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
