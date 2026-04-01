"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { sendEmail } from "@/lib/mail"
import { EmailTemplates } from "@/lib/email-templates"

const bookingSchema = z.object({
    hotelId: z.string(),
    roomId: z.string(),
    checkInDate: z.string(),
    checkOutDate: z.string(),
    guestsCount: z.number().int().positive(),
    totalAmount: z.number().positive(),
    guestName: z.string().min(1),
    guestEmail: z.string().email(),
    guestPhone: z.string().optional(),
    paymentIntentId: z.string().min(1)
}).refine(data => new Date(data.checkOutDate) > new Date(data.checkInDate), {
    message: "Check-out date must be after check-in date",
    path: ["checkOutDate"]
})

export async function createBooking(data: z.infer<typeof bookingSchema>) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const validated = bookingSchema.parse(data)

    const result = await prisma.$transaction(async (tx) => {
        // 1. Check if room exists and dates are within its availability range
        const room = await tx.roomType.findUnique({
            where: { id: validated.roomId }
        })

        if (!room) throw new Error("Room not found")

        const checkIn = new Date(validated.checkInDate)
        const checkOut = new Date(validated.checkOutDate)

        if (room.available_from && checkIn < room.available_from) {
            throw new Error(`Room is only available from ${room.available_from.toLocaleDateString()}`)
        }
        if (room.available_until && checkOut > room.available_until) {
            throw new Error(`Room is only available until ${room.available_until.toLocaleDateString()}`)
        }

        // 2. Check for overlapping confirmed bookings or recent pending bookings
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)

        const overlappingBooking = await tx.booking.findFirst({
            where: {
                room_id: validated.roomId,
                AND: [
                    { check_in_date: { lt: checkOut } },
                    { check_out_date: { gt: checkIn } },
                    {
                        OR: [
                            { status: 'confirmed' },
                            {
                                status: 'pending',
                                created_at: { gt: tenMinutesAgo }
                            }
                        ]
                    }
                ]
            }
        })

        if (overlappingBooking) {
            throw new Error("Room is already booked for these dates.")
        }

        // 3. Check for manual blocks in RoomAvailability
        const blockedDates = await tx.roomAvailability.findMany({
            where: {
                room_id: validated.roomId,
                is_available: false,
                AND: [
                    { date: { gte: checkIn } },
                    { date: { lt: checkOut } }
                ]
            }
        })

        if (blockedDates.length > 0) {
            throw new Error("Some of the selected dates are blocked for maintenance.")
        }

        // 4. Create the booking
        const booking = await tx.booking.create({
            data: {
                booking_reference: `BK-${Math.random().toString(36).toUpperCase().substring(2, 10)}`,
                user_id: session.user.id,
                hotel_id: validated.hotelId,
                room_id: validated.roomId,
                check_in_date: checkIn,
                check_out_date: checkOut,
                guests_count: validated.guestsCount,
                total_amount: validated.totalAmount,
                guest_name: validated.guestName,
                guest_email: validated.guestEmail,
                status: 'pending',
            }
        })

        // 5. Create Payment Record
        await tx.payment.create({
            data: {
                booking_id: booking.id,
                stripe_payment_intent_id: validated.paymentIntentId,
                amount: validated.totalAmount,
                status: 'pending'
            }
        })

        // 6. Clear our lock if it exists
        await tx.roomAvailability.deleteMany({
            where: {
                room_id: validated.roomId,
                locked_by: session.user.id,
                date: {
                    gte: checkIn,
                    lt: checkOut
                }
            }
        })

        return booking
    })

    const { createPaymentIntent } = await import("./payments")
    const paymentIntent = await createPaymentIntent(validated.totalAmount, "usd", { bookingId: result.id })

    await prisma.payment.update({
        where: { booking_id: result.id },
        data: { stripe_payment_intent_id: paymentIntent.id }
    })

    return { success: true, bookingId: result.id, clientSecret: paymentIntent.clientSecret }
}

export async function cancelBooking(bookingId: string, reason: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const booking = await prisma.booking.findFirst({
        where: {
            id: bookingId,
            user_id: session.user.id
        },
        include: { payment: true }
    })

    if (!booking) throw new Error("Booking not found or access denied")

    const checkIn = new Date(booking.check_in_date)
    const today = new Date()
    const diffDays = Math.ceil((checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    let refundAmount = 0
    if (diffDays > 7) refundAmount = booking.total_amount
    else if (diffDays > 3) refundAmount = booking.total_amount * 0.75
    else if (diffDays > 1) refundAmount = booking.total_amount * 0.5

    const penaltyAmount = booking.total_amount - refundAmount

    // Payment Handling Logic
    const { refundPayment, cancelPayment, capturePayment } = await import("./payments")

    if (booking.payment?.stripe_payment_intent_id && booking.payment.stripe_payment_intent_id !== "pending") {
        try {
            if (booking.payment.status === "authorized") {
                if (penaltyAmount > 0) {
                    await capturePayment(booking.payment.stripe_payment_intent_id, penaltyAmount)
                    await prisma.payment.update({
                        where: { id: booking.payment.id },
                        data: { status: "captured_penalty", amount: penaltyAmount }
                    })
                } else {
                    await cancelPayment(booking.payment.stripe_payment_intent_id)
                    await prisma.payment.update({
                        where: { id: booking.payment.id },
                        data: { status: "cancelled" }
                    })
                }
            } else if (booking.payment.status === "captured" || booking.payment.status === "succeeded") {
                if (refundAmount > 0) {
                    await refundPayment(booking.payment.stripe_payment_intent_id, refundAmount)
                    await prisma.payment.update({
                        where: { id: booking.payment.id },
                        data: { status: "refunded", amount: penaltyAmount }
                    })
                }
            }
        } catch (e) {
            console.error("Payment action failed in Stripe:", e)
        }
    }

    await prisma.$transaction(async (tx) => {
        await tx.booking.update({
            where: { id: bookingId },
            data: { status: 'cancelled' }
        })

        await tx.cancellation.create({
            data: {
                booking_id: bookingId,
                cancelled_by: session.user.id,
                reason: reason,
                refund_amount: refundAmount,
                penalty_amount: penaltyAmount
            }
        })
    })

    // Revalidate paths to update UI
    const bookingWithHotel = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { hotel: true }
    })

    if (bookingWithHotel) {
        revalidatePath(`/hotels/${bookingWithHotel.hotel.slug}`)
        revalidatePath(`/rooms/${bookingWithHotel.room_id}`)
        revalidatePath('/')
        revalidatePath('/account/bookings')
    }

    // Send cancellation email
    await sendEmail({
        to: booking.guest_email,
        subject: "Your StayEase Booking has been Cancelled",
        text: `Your booking (Ref: ${booking.booking_reference}) has been cancelled. Refund amount: $${refundAmount}.`,
        html: EmailTemplates.bookingCancelled(booking.booking_reference, refundAmount)
    })

    return { success: true, refundAmount }
}


export async function checkInGuest(bookingId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { payment: true, hotel: true }
    })

    if (!booking) throw new Error("Booking not found")

    if (booking.hotel.owner_id !== session.user.id && session.user.role !== "platform_admin") {
        throw new Error("Unauthorized access to this booking")
    }

    if (booking.payment?.status === "captured" || booking.payment?.status === "succeeded") {
        return { success: true, message: "Already captured" }
    }

    if (!booking.payment?.stripe_payment_intent_id || booking.payment.stripe_payment_intent_id === "pending") {
        return { success: false, error: "No valid payment method found" }
    }

    try {
        const { capturePayment } = await import("./payments")
        await capturePayment(booking.payment.stripe_payment_intent_id)

        await prisma.payment.update({
            where: { id: booking.payment.id },
            data: {
                status: "captured",
                captured_at: new Date()
            }
        })

        // Optionally update booking status if needed, but 'confirmed' is fine.
        return { success: true }
    } catch (error: any) {
        console.error("Capture failed:", error)
        return { success: false, error: error.message || "Failed to capture payment" }
    }
}
