import { NotifyForm } from "@/components/admin-panels";
import { PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";

export default async function AdminNotificationsPage() {
  const { supabase } = await requireAdmin();
  const { data: users } = await supabase.from("profiles").select("id, username").order("username").limit(500);

  return (
    <div>
      <PageHeader title="الإشعارات" subtitle="ابعت رسالة للاعب واحد أو لكل اللاعبين." />
      <NotifyForm users={users ?? []} />
    </div>
  );
}
