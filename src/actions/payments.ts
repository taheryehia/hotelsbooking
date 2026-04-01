"use server"

import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

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

