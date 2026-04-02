"use client"

import { useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { AnimatedScaleButton } from "@/components/layout/client-animation-wrapper"
import { createBooking } from "@/actions/bookings"

export function ReserveButton({
    hotelId,
    roomId,
    basePrice,
    checkIn,
    checkOut
}: {
    hotelId: string,
    roomId: string,
    basePrice: number,
    checkIn?: string,
    checkOut?: string
}) {
    const { data: session } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const resolvedCheckIn = checkIn || new Date().toISOString().split('T')[0]
    const resolvedCheckOut = checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0]

    const dates = useMemo(() => {
        const start = new Date(resolvedCheckIn)
        const end = new Date(resolvedCheckOut)
        const days = []
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            days.push(new Date(d).toISOString().split('T')[0])
        }
        return days
    }, [resolvedCheckIn, resolvedCheckOut])

    const totalAmount = basePrice * dates.length

    const handleReserve = async () => {
        if (!session) {
            router.push(`/login?callbackUrl=/rooms/${roomId}?checkIn=${resolvedCheckIn}&checkOut=${resolvedCheckOut}`)
            return
        }

        setLoading(true)
        try {
            const result = await createBooking({
                hotelId,
                roomId,
                checkInDate: resolvedCheckIn,
                checkOutDate: resolvedCheckOut,
                guestsCount: 2,
                totalAmount,
                guestName: session?.user?.name || "Guest",
                guestEmail: session?.user?.email || "",
                paymentIntentId: "pending"
            })

            if (result && result.success && result.bookingId) {
                router.push(`/checkout/${result.bookingId}`)
            } else {
                throw new Error("Booking creation failed")
            }
        } catch (error: any) {
            console.error(error)
            alert(error.message || "Reservation failed")
            setLoading(false)
        }
    }

    return (
        <AnimatedScaleButton
            className="w-full h-14 md:h-16 bg-white text-black text-base md:text-lg font-black rounded-2xl hover:bg-white/90 shadow-xl shadow-white/5 transition-all"
            onClick={handleReserve}
            disabled={loading}
        >
            {loading ? "Preparing..." : "Reserve Now"}
        </AnimatedScaleButton>
    )
}
