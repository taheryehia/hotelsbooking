import Image from "next/image"

export default function AuthLayout({
    children
}: {
    children: React.ReactNode
}) {
    return (
        <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-neutral-950">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <Image
                    src="https://images.unsplash.com/photo-1612278675615-7b093b07772d?q=80&w=2560&auto=format&fit=crop"
                    alt="Background"
                    fill
                    className="object-cover"
                    priority
                    quality={60}
                    sizes="100vw"
                />
                <div className="absolute inset-0 bg-black/50" />
            </div>

            <div className="relative z-10 w-full max-w-[min(420px,100%)]">
                {children}
            </div>
        </div>
    )
}
