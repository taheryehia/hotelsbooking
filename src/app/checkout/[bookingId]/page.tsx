import { Header } from "@/components/layout/header"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Clock, ShieldCheck, Sparkles } from "lucide-react"
import { ClientContentWrapper, AnimatedSection } from "@/components/layout/client-animation-wrapper"
import { formatCurrency } from "@/lib/utils"
import { StripeElementsProvider, CheckoutForm } from "@/components/booking/checkout-elements"
import { stripe } from "@/lib/stripe"

export const dynamic = 'force-dynamic'

export default async function CheckoutPage({
    params
}: {
    params: Promise<{ bookingId: string }>
}) {
    const { bookingId } = await params
    const session = await auth()

    if (!session) {
        redirect(`/login?callbackUrl=/checkout/${bookingId}`)
    }

    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { hotel: true, room: true, payment: true }
    })

    if (!booking || booking.user_id !== session.user?.id) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
                <p className="text-xl font-black uppercase tracking-widest text-white/20">Booking not found or not authorized</p>
            </div>
        )
    }

    if (booking.status !== "pending") {
        redirect(`/booking/confirmation?id=${booking.id}`)
    }

    const payment = booking.payment
    if (!payment?.stripe_payment_intent_id || payment.stripe_payment_intent_id === "pending") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
                <p className="text-xl font-black uppercase tracking-widest text-white/20">Payment details unavailable</p>
            </div>
        )
    }

    const intent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id)
    const clientSecret = intent.client_secret

    if (!clientSecret) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
                <p className="text-xl font-black uppercase tracking-widest text-white/20">Failed to initialize payment</p>
            </div>
        )
    }

    const checkIn = new Date(booking.check_in_date).toISOString().split('T')[0]
    const checkOut = new Date(booking.check_out_date).toISOString().split('T')[0]

    return (
        <div className="flex min-h-screen flex-col bg-neutral-950 text-white selection:bg-white selection:text-black">
            <Header />
            <main className="flex-1 container mx-auto px-4 pt-40 pb-24">
                <ClientContentWrapper className="max-w-6xl mx-auto space-y-12">

                    {/* Header Section */}
                    <AnimatedSection>
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-accent">
                                <Sparkles className="w-3.5 h-3.5" />
                                Secured Reservation
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">Confirm Your Stay</h1>
                            <p className="text-white/40 font-medium text-lg">Finishing the details for your experience at <span className="text-white">{booking.hotel.name}</span></p>
                        </div>
                    </AnimatedSection>

                    {/* Lock Message / Timer UI */}
                    <AnimatedSection delay={0.1}>
                        <div className="relative overflow-hidden group max-w-4xl mx-auto">
                            <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            <div className="relative p-8 rounded-[32px] bg-white/[0.02] border border-white/10 flex flex-col md:flex-row items-center gap-6 shadow-2xl">
                                <div className="w-16 h-16 rounded-2xl bg-accent/20 border border-accent/20 flex items-center justify-center text-accent animate-pulse">
                                    <Clock className="w-8 h-8" />
                                </div>
                                <div className="flex-1 text-center md:text-left space-y-1">
                                    <h3 className="text-xl font-bold tracking-tight">Temporary Reservation Lock</h3>
                                    <p className="text-white/40 text-sm font-medium leading-relaxed">
                                        We&apos;ve exclusively locked the <span className="text-white font-bold">{booking.room.name}</span> for you.
                                        Please complete your payment to guarantee this rate.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </AnimatedSection>

                    {/* Main Layout */}
                    <AnimatedSection delay={0.2}>
                        <div className="grid lg:grid-cols-3 gap-8 items-start">
                            {/* Payment Column */}
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-white/[0.02] rounded-[32px] border border-white/5 p-8 md:p-10 shadow-2xl backdrop-blur-xl">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <h2 className="text-2xl font-black tracking-tight">Payment Details</h2>
                                            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Complete your booking securely</p>
                                        </div>
                                        <StripeElementsProvider clientSecret={clientSecret}>
                                            <CheckoutForm
                                                bookingId={booking.id}
                                            />
                                        </StripeElementsProvider>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Column */}
                            <div className="space-y-10">
                                <div className="rounded-[32px] border border-white/5 p-8 md:p-10 bg-white/[0.02] shadow-2xl backdrop-blur-xl space-y-8">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-black tracking-tight">Your Stay</h2>
                                        <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Reservation Summary</p>
                                    </div>

                                    {/* Dates Display */}
                                    <div className="grid grid-cols-2 gap-4 py-6 border-y border-white/5">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Check-In</p>
                                            <p className="font-bold text-white text-lg">{new Date(booking.check_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Check-Out</p>
                                            <p className="font-bold text-white text-lg">{new Date(booking.check_out_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center group">
                                            <div className="space-y-1">
                                                <p className="font-bold text-white">{booking.room.name}</p>
                                                <p className="text-xs text-white/40">Rate for {booking.guests_count} guests</p>
                                            </div>
                                            <span className="font-bold text-white">{formatCurrency(booking.total_amount)}</span>
                                        </div>

                                        <div className="pt-6 border-t border-white/10 flex justify-between items-baseline">
                                            <span className="text-lg font-black tracking-tight text-white">Grand Total</span>
                                            <span className="text-3xl font-black text-white">{formatCurrency(booking.total_amount)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-[24px] bg-white/[0.01] border border-white/5 space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Need help?</h4>
                                    <p className="text-xs text-white/30 leading-relaxed font-medium">
                                        Our concierge is available 24/7 to assist with your reservation at {booking.hotel.name}.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </AnimatedSection>

                    {/* Trust Signals */}
                    <AnimatedSection delay={0.3}>
                        <div className="flex flex-wrap justify-center gap-8 pt-8 opacity-40 hover:opacity-100 transition-opacity duration-500">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                <ShieldCheck className="w-4 h-4" />
                                PCI DSS Compliant
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                <ShieldCheck className="w-4 h-4" />
                                Secured by Stripe
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                <ShieldCheck className="w-4 h-4" />
                                Handled with Care
                            </div>
                        </div>
                    </AnimatedSection>

                </ClientContentWrapper>
            </main>
        </div>
    )
}
