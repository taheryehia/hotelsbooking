import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ id: string }> }) {
    const { id } = await searchParams
    return (
        <div className="flex min-h-screen flex-col bg-neutral-950 text-white selection:bg-white selection:text-black">
            <Header />
            <main className="flex-1 container mx-auto flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="p-6 rounded-full bg-success/10 border border-success/20 mb-8 animate-fade-in-up">
                    <CheckCircle2 className="w-16 h-16 md:w-20 md:h-20 text-success" />
                </div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 relative animate-fade-in-up stagger-1">
                    Reservation Confirmed!
                </h1>
                <p className="text-lg md:text-xl text-white/50 mb-12 max-w-lg font-medium leading-relaxed animate-fade-in-up stagger-2">
                    Your booking (Ref: <span className="text-white font-bold">{id}</span>) has been securely processed. We&apos;ve sent the itinerary details to your email.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in-up stagger-3">
                    <Link href="/account/bookings">
                        <Button className="w-full sm:w-auto h-14 px-8 bg-white text-black hover:bg-white/90 font-black text-lg rounded-2xl shadow-xl shadow-white/5 transition-all active:scale-[0.98]">
                            View My Bookings
                        </Button>
                    </Link>
                    <Link href="/">
                        <Button className="w-full sm:w-auto h-14 px-8 border border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold text-lg rounded-2xl transition-all active:scale-[0.98]">
                            Return Home
                        </Button>
                    </Link>
                </div>
            </main>
        </div>
    )
}
