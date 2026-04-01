import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-4xl rounded-[32px] border border-white/70 bg-white/80 p-10 shadow-2xl shadow-slate-900/10 backdrop-blur">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="flex flex-col gap-5">
            <span className="w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Financial System V1</span>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950">
              统一录入、规则标记、异常核查与 Excel 导出的一体化报账平台
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              员工端支持普通、差旅、采购三类报销；管理端覆盖异常视图、规则管理、统计与月度导出。
            </p>
            <div className="flex flex-wrap gap-3">
              <Link className="rounded-xl border border-slate-950 bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black" href="/login">
                登录系统
              </Link>
              <Link className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50" href="/register">
                员工注册
              </Link>
            </div>
          </section>
          <section className="grid gap-4 rounded-3xl bg-slate-950 p-6 text-white">
            <div>
              <p className="text-sm text-slate-300">默认测试账号</p>
              <div className="mt-3 rounded-2xl bg-white/10 p-4">
                <p className="text-sm">管理员：admin / Admin1234</p>
                <p className="mt-2 text-sm">员工：employee / Employee1234</p>
              </div>
            </div>
            <div className="grid gap-3 text-sm text-slate-300">
              <p>1. 员工上传票据并提交报销。</p>
              <p>2. 系统自动标记超额、缺发票、采购金额差异。</p>
              <p>3. 管理员按月份核查并导出标准 Excel。</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
