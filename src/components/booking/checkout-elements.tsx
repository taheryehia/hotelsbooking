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
                    <div className="relative flex justify-center text-[10px] w-full px-4">
                        <span className="bg-[#121212] px-3 py-1 text-white/40 uppercase tracking-widest font-black rounded-full border border-white/5 text-center whitespace-normal leading-tight mx-auto relative z-10 max-w-[80%]">
                            Or pay securely with card
                        </span>
                    </div>
                </div>

                <PaymentElement options={{ layout: "tabs" }} />
            </div>
            {message && <div className="text-red-500 text-sm bg-red-500/10 p-4 rounded-xl">{message}</div>}

            <div className="flex flex-col sm:flex-row gap-4 w-full pt-4">
                <Button
                    type="submit"
                    disabled={!stripe || loading}
                    className="w-full sm:w-auto flex-1 h-14 md:h-16 bg-white text-black text-base md:text-lg font-black rounded-2xl hover:bg-white/90 shadow-xl shadow-white/5 transition-all active:scale-[0.98]"
                >
                    {loading ? "Processing..." : "Complete Order"}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                    className="w-full sm:w-auto flex-1 h-14 md:h-16 bg-transparent border-[1.5px] border-white/10 text-white text-base md:text-lg font-bold rounded-2xl hover:bg-white/5 shadow-xl shadow-transparent transition-all active:scale-[0.98]"
                    disabled={loading}
                >
                    Cancel Payment
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
