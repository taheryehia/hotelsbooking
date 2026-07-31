import { prisma } from "@/lib/prisma"

const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337"
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || ""

function getHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  }
  if (STRAPI_API_TOKEN) {
    headers["Authorization"] = `Bearer ${STRAPI_API_TOKEN}`
  }
  return headers
}

export async function getStrapiHotels() {
  // If STRAPI_URL is pointing to localhost, skip HTTP fetch entirely and query database directly
  const isLocal = STRAPI_URL.includes("localhost") || STRAPI_URL.includes("127.0.0.1")

  if (!isLocal) {
    try {
      const res = await fetch(`${STRAPI_URL}/api/hotels?sort[0]=display_order:asc&filters[is_hidden][$ne]=true&populate=*`, {
        next: { tags: ['strapi-hotels', 'strapi'], revalidate: 3600 },
        signal: AbortSignal.timeout(2000)
      })
      if (res.ok) {
        const json = await res.json()
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          return json.data.map((item: any) => {
            const attributes = item.attributes || item
            return {
              id: attributes.prisma_id || item.id?.toString(),
              strapi_id: item.id,
              name: attributes.name,
              slug: attributes.slug || attributes.name?.toLowerCase().replace(/\s+/g, '-'),
              description: attributes.description,
              address: attributes.address || "",
              city: attributes.city || "",
              country: attributes.country || "",
              star_rating: attributes.star_rating || 5,
              amenities: attributes.amenities || [],
              images: attributes.images || [],
              main_image: attributes.main_image || "https://images.unsplash.com/photo-1566073771259-6a8506099945",
              display_order: attributes.display_order ?? 0,
              is_hidden: attributes.is_hidden ?? false,
              rooms: attributes.base_price ? [{ base_price: attributes.base_price }] : [],
              _count: { favorites: 0 }
            }
          })
        }
      }
    } catch (error) {
      // Fall through to database query
    }
  }

  // Direct database query (instant, no localhost fetch attempts)
  try {
    const cmsHotels: any[] = await prisma.$queryRaw`
      SELECT * FROM cms_hotels WHERE is_hidden IS NOT TRUE ORDER BY display_order ASC
    `
    if (cmsHotels && cmsHotels.length > 0) {
      return cmsHotels.map((item: any) => ({
        id: item.prisma_id || item.id?.toString(),
        strapi_id: item.id,
        name: item.name,
        slug: item.slug || item.name?.toLowerCase().replace(/\s+/g, '-'),
        description: item.description,
        address: item.address || "",
        city: item.city || "",
        country: item.country || "",
        star_rating: item.star_rating || 5,
        amenities: item.amenities || [],
        images: item.images || [],
        main_image: item.main_image || "https://images.unsplash.com/photo-1566073771259-6a8506099945",
        display_order: item.display_order ?? 0,
        is_hidden: item.is_hidden ?? false,
        rooms: item.base_price ? [{ base_price: Number(item.base_price) }] : [],
        _count: { favorites: 0 }
      }))
    }
  } catch (cmsDbErr) {
    // Fallback to prisma.hotel
  }

  const dbHotels = await prisma.hotel.findMany({
    where: { is_active: true },
    include: {
      rooms: { select: { base_price: true } },
      _count: { select: { favorites: true } }
    }
  })
  return dbHotels
}

export async function getHeroBanner() {
  const fallback = {
    badge_text: "Book Now, Pay Later",
    title: "Find Your Perfect Escape",
    subtitle: "Experience boutique luxury with our seamless booking system. Handpicked properties for the discerning traveler.",
    background_image: "https://images.unsplash.com/photo-1596436889106-be35e843f974?q=80&w=2070&auto=format&fit=crop"
  }

  const isLocal = STRAPI_URL.includes("localhost") || STRAPI_URL.includes("127.0.0.1")

  if (!isLocal) {
    try {
      const res = await fetch(`${STRAPI_URL}/api/hero-banner?populate=*`, {
        next: { tags: ['strapi-hero', 'strapi'], revalidate: 3600 },
        signal: AbortSignal.timeout(2000)
      })
      if (res.ok) {
        const json = await res.json()
        const data = json.data?.attributes || json.data
        if (data) {
          return {
            badge_text: data.badge_text || fallback.badge_text,
            title: data.title || fallback.title,
            subtitle: data.subtitle || fallback.subtitle,
            background_image: data.background_image || fallback.background_image
          }
        }
      }
    } catch (error) {
      // Fall through to database query
    }
  }

  // Direct database query (instant, no localhost fetch attempts)
  try {
    const rawResult: any[] = await prisma.$queryRaw`
      SELECT title, subtitle, badge_text, background_image 
      FROM cms_hero_banners 
      ORDER BY id DESC LIMIT 1
    `
    if (rawResult && rawResult.length > 0) {
      const banner = rawResult[0]
      return {
        badge_text: banner.badge_text || fallback.badge_text,
        title: banner.title || fallback.title,
        subtitle: banner.subtitle || fallback.subtitle,
        background_image: banner.background_image || fallback.background_image
      }
    }
  } catch (dbErr) {
    console.error("Hero banner DB fallback error:", dbErr)
  }

  return fallback
}

export async function syncBookingToStrapi(booking: any) {
  try {
    await fetch(`${STRAPI_URL}/api/bookings`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        data: {
          booking_reference: booking.booking_reference,
          guest_name: booking.guest_name,
          guest_email: booking.guest_email,
          check_in_date: booking.check_in_date,
          check_out_date: booking.check_out_date,
          guests_count: booking.guests_count,
          total_amount: booking.total_amount,
          status: booking.status,
          hotel_name: booking.hotel?.name || booking.hotel_id,
          stripe_payment_intent_id: booking.payment?.stripe_payment_intent_id || "N/A"
        }
      })
    })
  } catch (error) {
    console.error("Strapi sync error:", error)
  }
}

export async function syncPaymentToStrapi(payment: any) {
  try {
    await fetch(`${STRAPI_URL}/api/payments`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        data: {
          stripe_payment_intent_id: payment.stripe_payment_intent_id,
          booking_reference: payment.booking?.booking_reference || payment.booking_id,
          amount: payment.amount,
          status: payment.status,
          captured_at: payment.captured_at
        }
      })
    })
  } catch (error) {
    console.error("Strapi payment sync error:", error)
  }
}
