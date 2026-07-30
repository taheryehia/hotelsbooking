import { Header } from "@/components/layout/header"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Building2, FileText, ChevronRight, Shield, Settings, Database } from "lucide-react"
import Link from "next/link"
import { AnimatedSection, ClientContentWrapper } from "@/components/layout/client-animation-wrapper"

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'platform_admin') redirect("/login")

    const hotelCount = await prisma.hotel.count()
    const userCount = await prisma.user.count()
    const pendingApps = await prisma.hotelApplication.count({
        where: { status: 'pending' }
    })

    return (
        <div className="flex min-h-screen flex-col bg-neutral-950 text-white selection:bg-white selection:text-black">
            <Header />
            <main className="flex-1 container mx-auto px-6 py-24 max-w-4xl pt-40">
                <ClientContentWrapper className="space-y-16">

                    <AnimatedSection>
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-accent">
                                <Shield className="w-3.5 h-3.5" />
                                Platform Authority
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">Administration</h1>
                            <p className="text-white/40 font-medium text-lg">Platform governance and Strapi CMS control panel</p>
                        </div>
                    </AnimatedSection>

                    <AnimatedSection delay={0.1}>
                        <div className="grid gap-6 md:grid-cols-3">
                            {[
                                { label: 'Total Hotels', value: hotelCount, icon: Building2, color: 'text-white' },
                                { label: 'Total Users', value: userCount, icon: Shield, color: 'text-white' },
                                { label: 'Pending Apps', value: pendingApps, icon: FileText, color: 'text-accent' }
                            ].map((stat, i) => (
                                <div key={i} className="card-section p-8 bg-white/[0.02] flex flex-col items-center text-center gap-4 group hover:bg-white/[0.04] transition-colors">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">{stat.label}</p>
                                        <p className="text-4xl font-black tracking-tight">{stat.value || 0}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AnimatedSection>

                    <AnimatedSection delay={0.2}>
                        <div className="grid gap-6 md:grid-cols-2">
                            <Link href="/admin/applications" className="block group">
                                <div className="card-section p-8 bg-white/[0.02] flex flex-col items-center text-center gap-6 border-white/10 group-hover:border-white/20 transition-all duration-500 relative overflow-hidden h-full">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-16 h-16 rounded-[20px] bg-white/5 border border-white/10 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-500">
                                        <FileText className="w-7 h-7 text-white group-hover:text-accent transition-colors" />
                                    </div>
                                    <div className="relative z-10 space-y-2">
                                        <h3 className="text-xl font-black tracking-tight">Review Applications</h3>
                                        <p className="text-white/40 text-sm font-medium leading-relaxed">Validate and onboard the next wave of luxury hospitality partners.</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white relative z-10 group-hover:gap-4 transition-all mt-auto">
                                        Access Module <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </Link>

                            <a href="http://localhost:1337/admin" target="_blank" rel="noreferrer" className="block group">
                                <div className="card-section p-8 bg-white/[0.02] flex flex-col items-center text-center gap-6 border-white/10 group-hover:border-white/20 transition-all duration-500 relative overflow-hidden h-full">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="w-16 h-16 rounded-[20px] bg-white/5 border border-white/10 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-500">
                                        <Database className="w-7 h-7 text-accent group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="relative z-10 space-y-2">
                                        <h3 className="text-xl font-black tracking-tight">Strapi CMS Panel</h3>
                                        <p className="text-white/40 text-sm font-medium leading-relaxed">Manage hero texts, images, card orders, card visibility, bookings, and payments.</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent relative z-10 group-hover:gap-4 transition-all mt-auto">
                                        Launch Control Panel <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </a>
                        </div>
                    </AnimatedSection>

                </ClientContentWrapper>
            </main>
        </div>
    )
}
