"use client"

import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CreditCard } from "lucide-react"
import { lockRoom, releaseRoomLock } from "@/actions/availability"
import { createBooking } from "@/actions/bookings"
import { formatCurrency } from "@/lib/utils"
// import { StripeElementsProvider, CheckoutForm } from "./checkout-elements" (already written, I will import them here)
import { StripeElementsProvider, CheckoutForm } from "./checkout-elements"

export function BookingForm({
    hotel,
    roomType,
    searchParams
}: {
    hotel: any,
    roomType: any,
    searchParams: any
}) {
    const { data: session } = useSession()
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [locked, setLocked] = useState(false)
    const [clientSecret, setClientSecret] = useState("")
    const [bookingId, setBookingId] = useState("")

    const checkIn = searchParams.checkIn || new Date().toISOString().split('T')[0]
    const checkOut = searchParams.checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0]

    const dates = useMemo(() => {
        const start = new Date(checkIn)
        const end = new Date(checkOut)
        const days = []
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            days.push(new Date(d).toISOString().split('T')[0])
        }
        return days
    }, [checkIn, checkOut])

    useEffect(() => {
        if (session?.user?.id && !locked) {
            lockRoom(roomType.id, dates)
                .then((success) => {
                    if (success) setLocked(true)
                    else alert("Room is no longer available. Please choose another.")
                })
        }

        return () => {
            if (locked && session?.user?.id) {
                releaseRoomLock(roomType.id, dates)
            }
        }
    }, [session, roomType.id, dates, locked])

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!session) return router.push("/login")

        setLoading(true)
        try {
            const totalAmount = roomType.base_price * dates.length

            const result = await createBooking({
                hotelId: hotel.id,
                roomId: roomType.id,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                guestsCount: 2,
                totalAmount: totalAmount,
                guestName: session?.user?.name || "Guest",
                guestEmail: session?.user?.email || "",
                paymentIntentId: "pending"
            })

            if (result && result.success && result.bookingId && result.clientSecret) {
                setClientSecret(result.clientSecret)
                setBookingId(result.bookingId)
            } else {
                throw new Error("Booking creation failed")
            }

        } catch (error: any) {
            console.error(error)
            alert(error.message || "Booking failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
                <div className="rounded-[32px] border border-white/5 p-8 md:p-10 space-y-8 bg-white/[0.02]">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black tracking-tight">Guest Details</h2>
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Personal Information</p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-3">
                            <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">Full Name</label>
                            <input className="w-full h-14 px-5 border border-white/10 rounded-2xl bg-white/5 text-white font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/10 focus:bg-white/[0.08]" defaultValue={session?.user?.name || ""} />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">Email Address</label>
                            <input className="w-full h-14 px-5 border border-white/10 rounded-2xl bg-white/5 text-white font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/10 focus:bg-white/[0.08]" defaultValue={session?.user?.email || ""} />
                        </div>
                    </div>

                    {clientSecret ? (
                        <div className="pt-8 border-t border-white/5 space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black tracking-tight">Payment Details</h2>
                                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Complete your booking securely</p>
                            </div>
                            <StripeElementsProvider clientSecret={clientSecret}>
                                <CheckoutForm
                                    onSuccess={() => router.push(`/booking/confirmation?id=${bookingId}`)}
                                    onCancel={() => setClientSecret("")}
                                />
                            </StripeElementsProvider>
                        </div>
                    ) : (
                        <>
                            <div className="pt-8 border-t border-white/5">
                                <div className="flex flex-col gap-6">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-black tracking-tight">Payment Method</h2>
                                        <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Secure Checkout</p>
                                    </div>

                                    <div className="p-6 border border-white/10 rounded-3xl bg-white/[0.03] space-y-3 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl -mr-16 -mt-16 group-hover:bg-white/10 transition-all duration-500" />
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                                                <CreditCard className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">Credit Card via Stripe</p>
                                                <p className="text-xs text-white/40">Secured 256-bit SSL encrypted payment</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    className="w-full h-16 bg-white text-black hover:bg-white/90 font-black text-lg rounded-2xl shadow-2xl shadow-white/5 transition-all active:scale-[0.98]"
                                    onClick={handleBooking}
                                    disabled={loading || !locked}
                                >
                                    {loading ? "Processing..." : "Complete Booking"}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>

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
                            <p className="font-bold text-white text-lg">{new Date(checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Check-Out</p>
                            <p className="font-bold text-white text-lg">{new Date(checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between items-center group">
                            <div className="space-y-1">
                                <p className="font-bold text-white">{roomType.name}</p>
                                <p className="text-xs text-white/40">Rate for {dates.length} night{dates.length > 1 ? 's' : ''}</p>
                            </div>
                            <span className="font-bold text-white">{formatCurrency(roomType.base_price * dates.length)}</span>
                        </div>

                        <div className="flex justify-between items-center text-white/40">
                            <span className="text-sm font-medium">Service Fees</span>
                            <span className="text-sm font-bold">{formatCurrency(0)}</span>
                        </div>

                        <div className="flex justify-between items-center text-white/40">
                            <span className="text-sm font-medium">Tourism Taxes</span>
                            <span className="text-sm font-bold">{formatCurrency(0)}</span>
                        </div>

                        <div className="pt-6 border-t border-white/10 flex justify-between items-baseline">
                            <span className="text-lg font-black tracking-tight text-white">Grand Total</span>
                            <span className="text-3xl font-black text-white">{formatCurrency(roomType.base_price * dates.length)}</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-[24px] bg-white/[0.01] border border-white/5 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Need help?</h4>
                    <p className="text-xs text-white/30 leading-relaxed font-medium">
                        Our concierge is available 24/7 to assist with your reservation at {hotel.name}.
                        Reach us at <span className="text-white/60">support@stayease.luxury</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
