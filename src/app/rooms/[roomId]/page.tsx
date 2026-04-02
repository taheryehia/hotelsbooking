
import { Header } from "@/components/layout/header"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Image from "next/image"
import { Users, Bed, Maximize, Wifi, Coffee, Tv, Info, ArrowLeft, ShieldCheck, CheckCircle2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ClientContentWrapper, AnimatedSection, AnimatedScaleButton } from "@/components/layout/client-animation-wrapper"
import { formatCurrency } from "@/lib/utils"
import { ReserveButton } from "@/components/booking/reserve-button"

export const dynamic = 'force-dynamic'

export default async function RoomPage({
    params,
    searchParams
}: {
    params: Promise<{ roomId: string }>,
    searchParams: Promise<{ checkIn?: string, checkOut?: string }>
}) {
    const { roomId } = await params
    const { checkIn, checkOut } = await searchParams

    const searchCheckIn = checkIn ? new Date(checkIn) : undefined
    const searchCheckOut = checkOut ? new Date(checkOut) : undefined

    const session = await auth()

    const room = await prisma.roomType.findUnique({
        where: { id: roomId },
        include: {
            hotel: true,
            bookings: {
                where: {
                    AND: [
                        {
                            OR: [
                                { status: 'confirmed' },
                                {
                                    status: 'pending',
                                    created_at: { gt: new Date(Date.now() - 10 * 60 * 1000) }
                                }
                            ]
                        },
                        ...(searchCheckIn && searchCheckOut ? [{
                            check_in_date: { lt: searchCheckOut },
                            check_out_date: { gt: searchCheckIn }
                        }] : [{
                            check_in_date: { lte: new Date() },
                            check_out_date: { gte: new Date() }
                        }])
                    ]
                }
            },
            availability: {
                where: {
                    OR: [
                        { is_available: false },
                        {
                            id: { not: undefined },
                            locked_until: { gt: new Date() }
                        }
                    ],
                    ...(searchCheckIn && searchCheckOut ? {
                        AND: [
                            { date: { gte: searchCheckIn } },
                            { date: { lt: searchCheckOut } }
                        ]
                    } : {
                        date: {
                            gte: new Date(new Date().setHours(0, 0, 0, 0)),
                            lt: new Date(new Date().setHours(23, 59, 59, 999))
                        }
                    })
                }
            }
        }
    })

    if (!room) return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
            <Header />
            <div className="text-center">
                <p className="text-xl font-bold uppercase tracking-widest text-white/40">Room not found</p>
                <Link href="/" className="mt-4 block text-accent hover:underline">Return to search</Link>
            </div>
        </div>
    )

    const isBooked = room.bookings.length > 0
    const isBlocked = (room as any).availability?.length > 0
    const isLocked = isBooked || isBlocked

    return (
        <div className="flex min-h-screen flex-col bg-neutral-950 text-white">
            <Header />
            <main className="flex-1 container mx-auto px-4 pt-24 md:pt-32 pb-24">
                <ClientContentWrapper className="max-w-6xl mx-auto space-y-8 md:space-y-12">

                    {/* Back Navigation */}
                    <AnimatedSection>
                        <Link href={`/hotels/${room.hotel.slug}`}>
                            <AnimatedScaleButton className="flex items-center gap-2 text-white/40 hover:text-white transition-colors font-black uppercase tracking-widest text-[10px]">
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden xs:inline">Back to</span> {room.hotel.name}
                            </AnimatedScaleButton>
                        </Link>
                    </AnimatedSection>

                    {/* Layout Grid */}
                    <div className="grid lg:grid-cols-5 gap-8 md:gap-12 items-start">

                        {/* Imagery & Details */}
                        <div className="lg:col-span-3 space-y-8 md:space-y-12 order-2 lg:order-1">
                            <AnimatedSection>
                                <div className="rounded-[32px] md:rounded-[40px] border border-white/10 bg-white/[0.02] p-2 md:p-3 shadow-2xl overflow-hidden group">
                                    <div className="relative aspect-[4/3] md:aspect-[16/10] overflow-hidden rounded-[24px] md:rounded-[32px]">
                                        <Image
                                            src={(room as any).main_image || (room as any).images?.[0] || "/placeholder.jpg"}
                                            alt={room.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-1000"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                        <div className="absolute top-4 left-4 md:top-6 md:left-6">
                                            <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/20">
                                                <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-accent animate-pulse" />
                                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Premium Collection</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </AnimatedSection>

                            {/* Gallery Thumbnails */}
                            <AnimatedSection>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                                    {(room as any).images?.slice(0, 4).map((img: string, idx: number) => (
                                        <div key={idx} className="relative aspect-square rounded-xl md:rounded-2xl overflow-hidden border border-white/10 group cursor-pointer">
                                            <Image
                                                src={img}
                                                alt={`${room.name} ${idx + 1}`}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </AnimatedSection>

                            {/* Long Description */}
                            <AnimatedSection>
                                <div className="space-y-4 md:space-y-6">
                                    <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/40">The Suite Story</h2>
                                    <p className="text-lg md:text-xl leading-relaxed text-white/70 font-medium">
                                        {room.description || "Designed with meticulous attention to detail, this space offers an oasis of tranquility. Featuring high-end finishes, ambient lighting, and panoramic views, it represents the pinnacle of modern hospitality."}
                                    </p>
                                </div>
                            </AnimatedSection>

                            {/* Features Grid */}
                            <AnimatedSection>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                                    <div className="flex items-center gap-4 p-5 md:p-6 rounded-3xl bg-white/5 border border-white/10">
                                        <Users className="h-5 w-5 md:h-6 md:w-6 text-accent" />
                                        <div>
                                            <p className="text-[9px] md:text-[10px] text-white/40 font-black uppercase tracking-widest">Guests</p>
                                            <p className="text-base md:text-lg font-bold">Up to {room.max_guests}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-5 md:p-6 rounded-3xl bg-white/5 border border-white/10">
                                        <Bed className="h-5 w-5 md:h-6 md:w-6 text-accent" />
                                        <div>
                                            <p className="text-[9px] md:text-[10px] text-white/40 font-black uppercase tracking-widest">Bed Type</p>
                                            <p className="text-base md:text-lg font-bold">{room.bed_configuration || "King Size"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-5 md:p-6 rounded-3xl bg-white/5 border border-white/10">
                                        <Maximize className="h-5 w-5 md:h-6 md:w-6 text-accent" />
                                        <div>
                                            <p className="text-[9px] md:text-[10px] text-white/40 font-black uppercase tracking-widest">Space</p>
                                            <p className="text-base md:text-lg font-bold">{room.size_sqm || "45"} m²</p>
                                        </div>
                                    </div>
                                </div>
                            </AnimatedSection>
                        </div>

                        {/* Booking Sidebar */}
                        <div className="lg:col-span-2 lg:sticky lg:top-32 space-y-6 md:space-y-8 order-1 lg:order-2">
                            <AnimatedSection>
                                <div className="card-section p-6 md:p-10 bg-white/[0.02] border-white/10 shadow-3xl relative overflow-hidden rounded-[32px] md:rounded-[40px]">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-[80px] -mr-16 -mt-16 rounded-full" />

                                    <div className="space-y-6 md:space-y-8 relative z-10">
                                        <div>
                                            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 leading-tight">{room.name}</h1>
                                            <p className="text-white/40 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Managed by {room.hotel.name}</p>
                                        </div>

                                        <div className="py-6 md:py-8 border-y border-white/5">
                                            <div className="flex flex-row justify-between items-end gap-4">
                                                <div>
                                                    <p className="text-[9px] md:text-[10px] text-white/40 font-black uppercase tracking-widest mb-1 md:mb-2">Price per Night</p>
                                                    <div className="flex items-baseline gap-1 md:gap-2">
                                                        <span className="text-3xl md:text-5xl font-black">{formatCurrency(room.base_price)}</span>
                                                        <span className="text-white/40 font-bold text-xs md:text-base">/ night</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] md:text-xs font-bold text-success flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        <span className="hidden xs:inline">Best Choice</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {room.amenities && room.amenities.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 md:gap-2">
                                                    {room.amenities.slice(0, 4).map((a, i) => (
                                                        <div key={i} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] md:text-[10px] font-bold text-white/60">
                                                            {a}
                                                        </div>
                                                    ))}
                                                    {room.amenities.length > 4 && <div className="text-[9px] md:text-[10px] font-bold text-white/20 ml-1">+{room.amenities.length - 4} more</div>}
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-2 md:pt-4">
                                            {(!isBooked && room.available_from && searchCheckIn && new Date(room.available_from) > searchCheckIn) ||
                                                (!isBooked && room.available_until && searchCheckOut && new Date(room.available_until) < searchCheckOut) ? (
                                                <div className="p-5 md:p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center space-y-2">
                                                    <p className="font-black text-red-500 uppercase tracking-widest text-[10px] md:text-xs">Date Conflict</p>
                                                    <p className="text-[10px] md:text-xs text-white/40 font-medium leading-relaxed">This room has specific availability limits for the selected dates.</p>
                                                </div>
                                            ) : isLocked ? (
                                                <div className="p-5 md:p-6 bg-white/5 border border-white/10 rounded-2xl text-center space-y-2 grayscale opacity-50">
                                                    <p className="font-black text-white/40 uppercase tracking-widest text-[10px] md:text-xs">Reserved Suite</p>
                                                    <p className="text-[10px] md:text-xs text-white/20 font-medium leading-relaxed">
                                                        {isBooked ? "This room is currently occupied for your selected dates." : "This room is currently locked by another guest. Please try again in 10 minutes."}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="w-full">
                                                    <ReserveButton
                                                        hotelId={room.hotel_id}
                                                        roomId={room.id}
                                                        basePrice={room.base_price}
                                                        checkIn={checkIn}
                                                        checkOut={checkOut}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 md:gap-4 pt-2 md:pt-4 text-center justify-center">
                                            <div className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/20 whitespace-nowrap">
                                                <ShieldCheck className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                Secure Booking
                                            </div>
                                            <div className="h-1 w-1 rounded-full bg-white/10 shrink-0" />
                                            <div className="flex items-center gap-1.5 md:gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/20 whitespace-nowrap">
                                                <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                                Verified Luxury
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </AnimatedSection>

                            <AnimatedSection delay={0.2}>
                                <div className="card-section p-6 md:p-8 border-white/5 bg-white/[0.01] rounded-[24px] md:rounded-[32px]">
                                    <h4 className="font-black text-[9px] md:text-[10px] uppercase tracking-widest text-white/40 mb-4 md:mb-6">Cancellation Policy</h4>
                                    <p className="text-[10px] md:text-xs leading-relaxed text-white/50 font-medium">
                                        This establishment offers a 48-hour free cancellation notice. Any changes made within the 48-hour arrival window may incur a service fee. Verified by StayEase protection.
                                    </p>
                                </div>
                            </AnimatedSection>
                        </div>

                    </div>
                </ClientContentWrapper>
            </main>
        </div>
    )
}
