import { prisma } from "@/lib/prisma"

export async function cleanupUnverifiedAccounts() {
    try {
        // Remove users unverified after 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

        const deletedUsers = await prisma.user.deleteMany({
            where: {
                is_verified: false,
                created_at: {
                    lt: twentyFourHoursAgo
                },

                password: {
                    not: null
                }
            }
        })

        console.log(`Cleaned up ${deletedUsers.count} unverified accounts.`)
        return deletedUsers.count
    } catch (error) {
        console.error("Error cleaning up unverified accounts:", error)
        throw error
    }
}

export async function cleanupExpiredTokens() {
    try {

        const fiveMinutesAfterExpiry = new Date(Date.now() - 5 * 60 * 1000)

        const deletedTokens = await prisma.verificationToken.deleteMany({
            where: {
                expires: {
                    lt: fiveMinutesAfterExpiry
                }
            }
        })

        console.log(`Cleaned up ${deletedTokens.count} expired verification tokens.`)
        return deletedTokens.count
    } catch (error) {
        console.error("Error cleaning up expired tokens:", error)
        throw error
    }
}
export async function performPing() {
    try {
        await prisma.user.count()
        console.log("Database ping successful.")
    } catch (error) {
        console.error("Database ping failed:", error)
        throw error
    }
}
