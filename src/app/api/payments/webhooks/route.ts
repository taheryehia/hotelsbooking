import { headers } from "next/headers"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
    const body = await req.text()
    const signature = (await headers()).get("Stripe-Signature") as string

    let event
    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (error: any) {
        return new Response(`Webhook Error: ${error.message}`, { status: 400 })
    }

    if (event.type === "payment_intent.amount_capturable_updated") {
        const intent = event.data.object as any
        const bookingId = intent.metadata?.bookingId

        if (!bookingId) {
            console.error("No bookingId in metadata")
            return new Response(null, { status: 200 })
        }

        const result = await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.update({
                where: { booking_id: bookingId },
                data: { status: "authorized" }
            })

            const booking = await tx.booking.update({
                where: { id: bookingId },
                data: { status: "confirmed" }
            })

            // Clean up any locks for this room/dates
            await tx.roomAvailability.deleteMany({
                where: {
                    room_id: booking.room_id,
                    date: {
                        gte: booking.check_in_date,
                        lt: booking.check_out_date
                    },
                    is_available: true
                }
            })

            return { booking, payment }
        })

        // Import mail utilities dynamically to avoid edge runtime issues if applicable
        const { sendEmail } = await import("@/lib/mail")
        const { EmailTemplates } = await import("@/lib/email-templates")

        await sendEmail({
            to: result.booking.guest_email,
            subject: "Your StayEase Booking is Confirmed",
            text: `Your booking at StayEase is confirmed. Reference: ${result.booking.booking_reference}.`,
            html: EmailTemplates.bookingConfirmed(result.booking.booking_reference, result.booking.check_in_date.toISOString())
        })
    }

    if (event.type === "payment_intent.succeeded") {
        const intent = event.data.object as any
        await prisma.payment.update({
            where: { stripe_payment_intent_id: intent.id },
            data: {
                status: "captured",
                captured_at: new Date()
            }
        })
    }

    return new Response(null, { status: 200 })
}
