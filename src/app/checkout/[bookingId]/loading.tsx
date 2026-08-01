import { Header } from "@/components/layout/header"

export default function Loading() {
    return (
        <div className="flex min-h-screen flex-col bg-neutral-950">
            <Header />
            <main className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="relative">
                    <div className="w-20 h-20 border-3 border-white/5 rounded-full animate-spin border-t-white" />
                    <p className="mt-8 text-white/40 text-xs font-black uppercase tracking-[0.3em] animate-pulse">
                        Preparing Payment
                    </p>
                </div>
            </main>
        </div>
    )
}
