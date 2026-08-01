"use server"

import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Fallback path used only when the client secret is not already available in
// the browser (e.g. direct URL hit). The secret is returned ONLY after
// verifying the booking belongs to the authenticated user.
export async function getPaymentClientSecret(bookingId: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const booking = await prisma.booking.findFirst({
        where: {
            id: bookingId,
            user_id: session.user.id
        },
        include: { payment: true }
    })

    if (!booking?.payment?.stripe_payment_intent_id || booking.payment.stripe_payment_intent_id === "pending") {
        throw new Error("Payment details unavailable")
    }

    const intent = await stripe.paymentIntents.retrieve(booking.payment.stripe_payment_intent_id)
    if (!intent.client_secret) throw new Error("Failed to initialize payment")

    return intent.client_secret
}

export async function createPaymentIntent(amount: number, currency: string = "usd", metadata: any = {}) {
    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        capture_method: "manual",
        metadata: metadata,
        automatic_payment_methods: {
            enabled: true,
        },
    })

    return { clientSecret: paymentIntent.client_secret, id: paymentIntent.id }
}


export async function capturePayment(paymentIntentId: string, amount?: number) {
    const intent = await stripe.paymentIntents.capture(paymentIntentId, {
        amount_to_capture: amount ? Math.round(amount * 100) : undefined
    })
    return intent
}

export async function cancelPayment(paymentIntentId: string) {
    const intent = await stripe.paymentIntents.cancel(paymentIntentId)
    return intent
}

export async function refundPayment(paymentIntentId: string, amount?: number) {
    const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined // if undefined, full refund
    })
    return refund
}

