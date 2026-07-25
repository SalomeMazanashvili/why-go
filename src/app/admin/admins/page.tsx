import { requireAdmin, currentAdminId, ENV_ADMIN_ID, ENV_ADMIN_EMAIL } from '@/lib/adminAuth'
import { listAdmins } from '@/lib/admins'
import { hasAdminSupabase } from '@/lib/supabase/admin'
import AdminsTable from './AdminsTable'
import NewAdminForm from './NewAdminForm'

export const dynamic = 'force-dynamic'

export default async function AdminsPage() {
  requireAdmin()
  const admins = await listAdmins()
  const connected = hasAdminSupabase()
  const meId = currentAdminId()
  const meLabel = meId === ENV_ADMIN_ID ? `${ENV_ADMIN_EMAIL} (env)` : meId ?? ''

  return (
    <div className="p-8 lg:p-12 max-w-5xl">
      <header className="mb-8">
        <p className="text-[10px] font-bold tracking-widest uppercase text-[#FFCC00] mb-2">Admins</p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Admin accounts</h1>
        <p className="text-white/40 text-sm mt-2">
          Signed in as <span className="text-white/80 font-mono">{meLabel}</span>.
        </p>
        {!connected && (
          <p className="text-white/40 text-sm mt-2">
            Supabase not configured — you can still sign in via the ADMIN_PASSWORD env var, but the
            admins table is unreachable.
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <AdminsTable initial={admins} currentId={meId} />
        <NewAdminForm disabled={!connected} />
      </div>
    </div>
  )
}
