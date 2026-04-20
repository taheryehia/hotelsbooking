import { NextResponse } from "next/server"
import { performPing, cleanupExpiredTokens, cleanupUnverifiedAccounts } from "@/lib/db-maintenance"

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 })
    }

    try {
        await performPing()
        await cleanupExpiredTokens()
        await cleanupUnverifiedAccounts()

        return NextResponse.json({ success: true, message: "Maintenance completed" })
    } catch (error) {
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
    }
}
