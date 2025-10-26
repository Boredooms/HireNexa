import { DashboardNav, DashboardSidebar } from '@/components/DashboardNav'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Just render children - each page handles its own layout
  // This allows:
  // - /dashboard to show student sidebar
  // - /dashboard/recruiter to show recruiter sidebar
  // - /dashboard/admin to show admin sidebar
  return <>{children}</>
}
