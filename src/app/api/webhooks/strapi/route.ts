import { revalidatePath, revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-strapi-revalidate-secret") || req.nextUrl.searchParams.get("secret")
    const expectedSecret = process.env.STRAPI_REVALIDATE_SECRET

    // If a secret token is configured, verify it
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ message: "Invalid secret token" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const model = body?.model || body?.event || "content"

    // Revalidate the home page path
    revalidatePath("/")

    // Revalidate tags
    revalidateTag("strapi")
    revalidateTag("strapi-hotels")
    revalidateTag("strapi-hero")

    console.log(`[Strapi Webhook] Revalidated path '/' and 'strapi' tags for event: ${model}`)

    return NextResponse.json({
      revalidated: true,
      message: `Revalidated '/' for model '${model}' at ${new Date().toISOString()}`
    })
  } catch (error: any) {
    console.error("[Strapi Webhook Error]", error)
    return NextResponse.json({ message: "Error revalidating", error: error?.message }, { status: 500 })
  }
}
