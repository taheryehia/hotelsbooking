"use client"

import { useState } from "react"
import { Elements, PaymentElement, ExpressCheckoutElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { Button } from "@/components/ui/button"

const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_mock",
    {
        // @ts-ignore
        developerTools: {
            assistant: { enabled: false }
        }
    }
)

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

    const handleExpressConfirm = async () => {
        if (!stripe || !elements) return

        setLoading(true)
        const { error } = await stripe.confirmPayment({
            elements,
            redirect: "if_required",
            confirmParams: {
                return_url: window.location.origin + `/booking/confirmation?id=${bookingId}`,
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
                <ExpressCheckoutElement onConfirm={handleExpressConfirm} />

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-[10px]">
                        <span className="bg-[#121212] px-4 text-white/40 uppercase tracking-widest font-black rounded-full border border-white/5">
                            Or pay securely with card
                        </span>
                    </div>
                </div>

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
                fonts: [
                    {
                        cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&display=swap'
                    }
                ],
                appearance: {
                    theme: 'flat',
                    variables: {
                        colorPrimary: '#ffffff',
                        colorBackground: '#0a0a0a',
                        colorText: '#ffffff',
                        colorDanger: '#ef4444',
                        fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
                        borderRadius: '16px',
                    }
                }
            }}
        >
            {children}
        </Elements>
    )
}
