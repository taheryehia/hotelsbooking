"use client"

import Link from "next/link"
import Image from "next/image"
import { Star, MapPin, ArrowRight, ShieldCheck, Heart } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"
import { motion } from "framer-motion"

export function HotelCard({ hotel, checkIn, checkOut }: { hotel: any, checkIn?: string, checkOut?: string }) {
    const prices = hotel.rooms?.map((r: any) => r.base_price) || []
    const lowestPrice = prices.length > 0 ? Math.min(...prices) : null

    const dateParams = checkIn && checkOut ? `?checkIn=${checkIn}&checkOut=${checkOut}` : ""

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="group relative"
        >
            <Link href={`/hotels/${hotel.slug}${dateParams}`} className="block">
                <div className="card-section overflow-hidden h-full flex flex-col border-white/10 group-hover:border-white/20 transition-colors duration-500">
                    <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                            src={hotel.main_image || hotel.images?.[0] || "/placeholder.jpg"}
                            alt={hotel.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            quality={60}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />

                        {/* Tags */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                            {hotel.is_verified && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white">
                                    <ShieldCheck className="h-3.5 w-3.5 text-success" />
                                    <span className="text-[10px] font-black uppercase tracking-wider">Verified</span>
                                </div>
                            )}
                        </div>

                        {/* Rating Badge */}
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 group-hover:border-white/30 transition-all duration-500 shadow-2xl">
                            <Star className="h-3.5 w-3.5 fill-accent text-accent animate-pulse" />
                            <span className="text-xs font-black text-white">{hotel.star_rating}.0</span>
                        </div>

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

                        {/* Floating Price on Image (Optional but looks cool) */}
                        <div className="absolute bottom-4 left-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">Starting from</p>
                            <p className="text-2xl font-black text-white tracking-tight">
                                {lowestPrice !== null ? formatCurrency(lowestPrice) : "TBA"}
                            </p>
                        </div>
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-primary transition-colors line-clamp-1">
                                {hotel.name}
                            </h3>
                            <div className="flex items-center gap-2 text-white/50 mb-6">
                                <MapPin className="h-4 w-4 text-accent" />
                                <span className="text-sm font-medium tracking-tight">{hotel.city}, {hotel.country}</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-5 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                    <Heart className="w-4 h-4 fill-red-500" />
                                </div>
                                <span className="text-xs font-black text-white/60">{(hotel as any)._count?.favorites || 0}</span>
                            </div>

                            <div className="flex items-center gap-2 group/btn cursor-pointer">
                                <span className="text-xs font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Explore</span>
                                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all duration-300">
                                    <ArrowRight className="w-5 h-5 text-white group-hover:text-black transition-colors" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}
