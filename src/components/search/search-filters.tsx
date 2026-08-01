"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { format, addDays } from "date-fns"
import { Calendar as CalendarIcon, Search, Users, MapPin, Minus, Plus } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

// Code-split the date picker so react-day-picker only loads when the popover is opened
const Calendar = dynamic(
    () => import("@/components/ui/calendar").then((m) => m.Calendar),
    { ssr: false }
)

export function SearchFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // --- State ---
    const [destination, setDestination] = React.useState(searchParams.get("q") || "")

    // Dates
    const [date, setDate] = React.useState<DateRange | undefined>(() => {
        const from = searchParams.get("checkIn")
        const to = searchParams.get("checkOut")
        if (from || to) {
            return {
                from: from ? new Date(from) : undefined,
                to: to ? new Date(to) : undefined
            }
        }
        return undefined
    })

    // Guests
    const [counts, setCounts] = React.useState({
        adults: parseInt(searchParams.get("adults") || "2"),
        children: parseInt(searchParams.get("children") || "0"),
        rooms: parseInt(searchParams.get("rooms") || "1"),
    })

    // --- Handlers ---

    const updateCount = (key: keyof typeof counts, delta: number) => {
        setCounts(prev => {
            const newVal = prev[key] + delta
            if (newVal < 0) return prev
            if (key === 'adults' && newVal < 1) return prev // Min 1 adult
            if (key === 'rooms' && newVal < 1) return prev // Min 1 room
            return { ...prev, [key]: newVal }
        })
    }

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!destination.trim()) return

        const params = new URLSearchParams()
        params.set("q", destination.trim())

        if (date?.from) params.set("checkIn", date.from.toISOString())
        if (date?.to) params.set("checkOut", date.to.toISOString())

        params.set("adults", counts.adults.toString())
        params.set("children", counts.children.toString())
        params.set("rooms", counts.rooms.toString())
        // Legacy support if needed
        params.set("guests", (counts.adults + counts.children).toString())

        router.push(`/?${params.toString()}`)
    }

    // --- Render ---

    return (
        <div className="w-full max-w-5xl mx-auto">
            <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-2 p-2 bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-3xl ring-1 ring-white/5">

                {/* Destination */}
                <div className="flex-1 relative group">
                    <input
                        type="text"
                        placeholder="Where are you going?"
                        className="h-14 w-full rounded-2xl bg-transparent pl-6 pr-14 text-base font-medium placeholder:text-white/40 focus:outline-none focus:bg-white/10 transition-all duration-300 hover:bg-white/5 focus:scale-[1.02] text-white relative z-0"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none z-10">
                        <Search className="h-5 w-5 text-white/40 group-focus-within:text-white transition-colors" />
                    </div>
                    <div className="hidden lg:block absolute right-0 inset-y-2 w-px bg-border/50" />
                </div>

                {/* Dates */}
                <div className="flex-1 relative lg:max-w-[300px]">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"ghost"}
                                className={cn(
                                    "w-full h-14 justify-start text-left font-normal bg-transparent hover:bg-white/10 rounded-2xl px-4",
                                    !date && "text-white/40"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-5 w-5 text-muted-foreground" />
                                {date?.from ? (
                                    date.to ? (
                                        <span className="font-medium text-foreground">
                                            {format(date.from, "MMM dd")} - {format(date.to, "MMM dd")}
                                        </span>
                                    ) : (
                                        <span className="font-medium text-foreground">{format(date.from, "MMM dd")}</span>
                                    )
                                ) : (
                                    <span className="text-muted-foreground/70 text-base">Check-in - Check-out</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-zinc-950/95 backdrop-blur-2xl shadow-3xl border-white/10 rounded-3xl" align="center">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                                disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                            />
                        </PopoverContent>
                    </Popover>
                    <div className="hidden lg:block absolute right-0 inset-y-2 w-px bg-border/50" />
                </div>

                {/* Guests */}
                <div className="flex-1 relative lg:max-w-[240px]">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                className="w-full h-14 justify-start text-left font-normal bg-transparent hover:bg-white/10 rounded-2xl px-4 text-white"
                            >
                                <Users className="mr-2 h-5 w-5 text-muted-foreground" />
                                <span className="font-medium text-foreground text-base">
                                    {counts.adults} Adults, {counts.rooms} Room
                                </span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-6 bg-zinc-950/95 backdrop-blur-2xl shadow-3xl border-white/10 rounded-3xl" align="center">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium">Adults</div>
                                    <div className="flex items-center gap-3">
                                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateCount('adults', -1)}><Minus className="h-3 w-3" /></Button>
                                        <span className="w-4 text-center">{counts.adults}</span>
                                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateCount('adults', 1)}><Plus className="h-3 w-3" /></Button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium">Children</div>
                                    <div className="flex items-center gap-3">
                                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateCount('children', -1)}><Minus className="h-3 w-3" /></Button>
                                        <span className="w-4 text-center">{counts.children}</span>
                                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateCount('children', 1)}><Plus className="h-3 w-3" /></Button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium">Rooms</div>
                                    <div className="flex items-center gap-3">
                                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateCount('rooms', -1)}><Minus className="h-3 w-3" /></Button>
                                        <span className="w-4 text-center">{counts.rooms}</span>
                                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateCount('rooms', 1)}><Plus className="h-3 w-3" /></Button>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Search Button */}
                <Button
                    type="submit"
                    size="lg"
                    className="h-14 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all text-base font-semibold"
                    disabled={!destination.trim()}
                >
                    Search
                </Button>
            </form>
        </div>
    )
}
