import { Header } from "@/components/layout/header"
import { SearchFilters } from "@/components/search/search-filters"
import { HotelCard } from "@/components/hotels/hotel-card"
import { getHeroBanner, getStrapiHotels } from "@/lib/strapi"
import Link from "next/link"
import Image from "next/image"

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams
  const query = typeof params.q === 'string' ? params.q.trim() : undefined
  const checkIn = typeof params.checkIn === 'string' ? new Date(params.checkIn) : undefined
  const checkOut = typeof params.checkOut === 'string' ? new Date(params.checkOut) : undefined

  const hero = await getHeroBanner()
  let hotels = await getStrapiHotels()
  const isSearch = !!query || (!!checkIn && !!checkOut)

  if (query) {
    const qLower = query.toLowerCase()
    hotels = hotels.filter((h: any) =>
      h.name?.toLowerCase().includes(qLower) ||
      h.city?.toLowerCase().includes(qLower) ||
      h.country?.toLowerCase().includes(qLower)
    )
  }

  hotels = hotels.filter((h: any) => !h.is_hidden)
  hotels.sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))

  return (
    <div className="flex min-h-screen flex-col bg-background-alt">
      <Header />
      <main className="flex-1 w-full">
        <section className="relative h-screen min-h-[700px] w-full flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              src={hero.background_image}
              alt="Luxury Hotel"
              fill
              className="object-cover"
              priority
              quality={75}
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background-alt via-background-alt/80 to-transparent" />
          </div>

          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 pt-20">
            <div className="space-y-4 animate-fade-in-up">
              <span className="inline-block px-4 py-1.5 bg-accent text-accent-foreground text-sm font-semibold rounded-full shadow-lg">
                {hero.badge_text}
              </span>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-tight drop-shadow-md">
                {hero.title}
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-sm font-medium">
                {hero.subtitle}
              </p>
            </div>
          </div>
        </section>

        <section className="relative z-20 -mt-24 pb-16">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-fade-in-up stagger-2">
              <SearchFilters />
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24" id="results">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 animate-fade-in">
              <div>
                <span className="section-title">{isSearch ? "Search Results" : "Explore"}</span>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  {isSearch ? `Found ${hotels.length} properties for "${query}"` : "Featured Destinations"}
                </h2>
                <p className="text-muted-foreground mt-2">
                  {isSearch ? "Best matches for your search" : "Handpicked properties for your next adventure"}
                </p>
              </div>
            </div>

            {hotels.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {hotels.map((hotel: any, index: number) => (
                  <div key={hotel.id} className={`animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}>
                    <HotelCard
                      hotel={hotel}
                      checkIn={typeof params.checkIn === 'string' ? params.checkIn : undefined}
                      checkOut={typeof params.checkOut === 'string' ? params.checkOut : undefined}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-card rounded-2xl border border-border">
                <h3 className="text-xl font-semibold mb-2">No hotels found</h3>
                <p className="text-muted-foreground">Try adjusting your search terms</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-card border-t border-border">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-primary">StayEase</span>
              <span className="text-sm text-muted-foreground">© 2026. Demo project.</span>
            </div>
            <nav className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="/partner" className="hover:text-primary transition-colors">Partner</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
