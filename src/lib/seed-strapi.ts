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

export async function syncPrismaToStrapi() {
  const hotels = await prisma.hotel.findMany({
    include: {
      rooms: true
    }
  })

  let hotelSyncCount = 0
  for (let index = 0; index < hotels.length; index++) {
    const hotel = hotels[index]
    const minPrice = hotel.rooms.length > 0
      ? Math.min(...hotel.rooms.map(r => r.base_price))
      : 150

    try {
      const res = await fetch(`${STRAPI_URL}/api/hotels`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          data: {
            name: hotel.name,
            slug: hotel.slug,
            description: hotel.description,
            address: hotel.address,
            city: hotel.city,
            country: hotel.country,
            star_rating: hotel.star_rating,
            base_price: minPrice,
            main_image: hotel.main_image || (hotel.images[0] ?? ""),
            display_order: index + 1,
            is_hidden: !hotel.is_active,
            prisma_id: hotel.id
          }
        })
      })
      if (res.ok) hotelSyncCount++
    } catch (e) {
      console.error(`Failed to sync hotel ${hotel.name}:`, e)
    }
  }

  const bookings = await prisma.booking.findMany({
    include: {
      hotel: true,
      payment: true
    }
  })

  let bookingSyncCount = 0
  for (const booking of bookings) {
    try {
      const res = await fetch(`${STRAPI_URL}/api/bookings`, {
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
            hotel_name: booking.hotel.name,
            stripe_payment_intent_id: booking.payment?.stripe_payment_intent_id || "N/A"
          }
        })
      })
      if (res.ok) bookingSyncCount++
    } catch (e) {
      console.error(`Failed to sync booking ${booking.booking_reference}:`, e)
    }
  }

  const payments = await prisma.payment.findMany({
    include: {
      booking: true
    }
  })

  let paymentSyncCount = 0
  for (const payment of payments) {
    try {
      const res = await fetch(`${STRAPI_URL}/api/payments`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          data: {
            stripe_payment_intent_id: payment.stripe_payment_intent_id,
            booking_reference: payment.booking.booking_reference,
            amount: payment.amount,
            status: payment.status,
            captured_at: payment.captured_at
          }
        })
      })
      if (res.ok) paymentSyncCount++
    } catch (e) {
      console.error(`Failed to sync payment ${payment.id}:`, e)
    }
  }

  try {
    await fetch(`${STRAPI_URL}/api/hero-banner`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        data: {
          badge_text: "Book Now, Pay Later",
          title: "Find Your Perfect Escape",
          subtitle: "Experience boutique luxury with our seamless booking system. Handpicked properties for the discerning traveler.",
          background_image: "https://images.unsplash.com/photo-1596436889106-be35e843f974?q=80&w=2070&auto=format&fit=crop"
        }
      })
    })
  } catch (e) {
    console.error("Failed to sync hero banner:", e)
  }

  return {
    hotels: hotelSyncCount,
    bookings: bookingSyncCount,
    payments: paymentSyncCount
  }
}
