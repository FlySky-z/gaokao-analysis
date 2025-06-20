import { auth } from "@/auth"
import DashboardClient from "./dashboard-client"
import { redirect } from "next/navigation"
import type { User as AuthUser } from "@/lib/model/authModel"

interface User {
  name: string;
  email: string;
}

export default async function Page() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const authUser = session.user as AuthUser;
  
  // 转换用户数据格式以匹配 AppSidebar 的期望
  const user: User = {
    name: authUser.name || "未知用户",
    email: authUser.email || "",
  };

  return <DashboardClient user={user} />
}
