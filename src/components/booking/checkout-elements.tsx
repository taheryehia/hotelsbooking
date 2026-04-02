"use client"

import { useState } from "react"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { Button } from "@/components/ui/button"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_mock")

export function CheckoutForm({ bookingId }: { bookingId: string }) {
    const stripe = useStripe()
    const elements = useElements()
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!stripe || !elements) return

        setLoading(true)
        const { error } = await stripe.confirmPayment({
            elements,
            redirect: "if_required",
            confirmParams: {
                // Return URL for fallback if 3D Secure redirect is required.
                return_url: window.location.origin + "/booking/confirmation",
            }
        })

        if (error) {
            setMessage(error.message || "An unexpected error occurred.")
            setLoading(false)
        } else {
            window.location.href = `/booking/confirmation?id=${bookingId}`
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                <PaymentElement options={{ layout: "tabs" }} />
            </div>
            {message && <div className="text-red-500 text-sm bg-red-500/10 p-4 rounded-xl">{message}</div>}

            <div className="flex gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                    className="flex-1 rounded-2xl h-16 border-white/10 text-white hover:bg-white/5"
                    disabled={loading}
                >
                    Cancel Payment
                </Button>
                <Button
                    type="submit"
                    disabled={!stripe || loading}
                    className="flex-1 bg-white text-black hover:bg-white/90 font-bold h-16 rounded-2xl"
                >
                    {loading ? "Processing..." : "Complete Order"}
                </Button>
            </div>
        </form>
    )
}

export function StripeElementsProvider({ clientSecret, children }: { clientSecret: string, children: React.ReactNode }) {
    return (
        <Elements
            stripe={stripePromise}
            options={{
                clientSecret,
                appearance: {
                    theme: 'night',
                    variables: {
                        colorPrimary: '#ffffff',
                        colorBackground: '#0a0a0a',
                        colorText: '#ffffff',
                        colorDanger: '#ef4444',
                        fontFamily: 'inherit',
                        borderRadius: '16px',
                    }
                }
            }}
        >
            {children}
        </Elements>
    )
}
