"use client"

import React, { useCallback } from "react"
import { motion, useMotionTemplate, useSpring } from "framer-motion"
import { cn } from "@/lib/utils"

interface LiquidGlassProps {
    children: React.ReactNode
    className?: string
    animate?: boolean
}

export function LiquidGlass({
    children,
    className,
    animate = true
}: LiquidGlassProps) {
    // We use spring for smooth mouse tracking as it returns naturally to the center
    const mouseX = useSpring(0.5, { stiffness: 400, damping: 30 })
    const mouseY = useSpring(0.5, { stiffness: 400, damping: 30 })

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!animate) return
        const { currentTarget, clientX, clientY } = e
        const { left, top, width, height } = currentTarget.getBoundingClientRect()

        mouseX.set((clientX - left) / width)
        mouseY.set((clientY - top) / height)
    }, [mouseX, mouseY, animate])

    const handleMouseLeave = useCallback(() => {
        if (!animate) return
        mouseX.set(0.5)
        mouseY.set(0.5)
    }, [mouseX, mouseY, animate])

    return (
        <motion.div
            className={cn(
                "relative overflow-hidden rounded-2xl",
                "bg-white/10",
                "backdrop-blur-[3px] backdrop-saturate-150",
                "border border-white/60",
                className
            )}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileHover={animate ? {
                scale: 1.015,
            } : {}}
            whileTap={animate ? { scale: 0.99 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
            {/* Top highlight gradient (replicates shader topHighlight = pow(1.0 - uv.y, 2.0)) */}
            <div className="absolute inset-x-0 top-0 h-[60%] bg-gradient-to-b from-white-[0.15] to-transparent pointer-events-none z-0" />

            {/* Static specular center-top (replicates shader specular around 0.5, 0.2) */}
            <div className="absolute -top-[15%] left-[20%] right-[20%] aspect-square bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_0%,transparent_60%)] pointer-events-none z-0" />

            {/* Dynamic Mouse Highlight tracked via motion template */}
            <motion.div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                    background: useMotionTemplate`radial-gradient(circle at calc(${mouseX} * 100%) calc(${mouseY} * 100%), rgba(255, 255, 255, 0.15) 0%, transparent 50%)`
                }}
            />

            {/* Original Bottom highlight trim */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[inherit]">
                <div
                    className="absolute bottom-0 left-[15%] right-[15%] h-[1px]"
                    style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)'
                    }}
                />
            </div>

            {/* Existing children rendered above backgrounds */}
            {children}
        </motion.div>
    )
}
