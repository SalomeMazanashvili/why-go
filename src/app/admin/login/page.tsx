import LoginForm from './LoginForm'

export const dynamic = 'force-dynamic'

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0a] text-white px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="text-2xl font-black tracking-tight">
            WHY<span className="text-[#FFCC00]">GO</span>
          </p>
          <p className="text-[10px] tracking-widest uppercase text-white/40 mt-2">Admin panel</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
