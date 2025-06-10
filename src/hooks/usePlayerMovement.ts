import { useEffect, useCallback, useRef } from 'react'
import { GameDatabase, GAME_CONFIG } from '../services/supabase'
import type { Player } from '../services/supabase'

interface UsePlayerMovementProps {
    currentPlayer: Player | null
    updatePlayerPosition: (x: number, y: number) => void
}

export const usePlayerMovement = ({ currentPlayer, updatePlayerPosition }: UsePlayerMovementProps) => {
    const keysPressed = useRef<Set<string>>(new Set())
    const animationFrameRef = useRef<number | null>(null)
    const lastUpdateTime = useRef<number>(0)
    const lastDbUpdateTime = useRef<number>(0)
    const pendingPosition = useRef<{ x: number, y: number } | null>(null)
    const currentPlayerRef = useRef<Player | null>(null)
    const updatePositionRef = useRef<((x: number, y: number) => void) | null>(null)

    // Keep refs updated
    useEffect(() => {
        currentPlayerRef.current = currentPlayer
        updatePositionRef.current = updatePlayerPosition
    }, [currentPlayer, updatePlayerPosition])

    // Calculate new position with boundary checking
    const calculateNewPosition = useCallback((currentX: number, currentY: number, deltaX: number, deltaY: number) => {
        const newX = Math.max(0, Math.min(GAME_CONFIG.FIELD_WIDTH - GAME_CONFIG.PLAYER_SIZE, currentX + deltaX))
        const newY = Math.max(0, Math.min(GAME_CONFIG.FIELD_HEIGHT - GAME_CONFIG.PLAYER_SIZE, currentY + deltaY))
        return { newX, newY }
    }, [])    // Smooth movement loop - no dependencies to prevent restarts
    const updateMovement = useCallback(() => {
        const player = currentPlayerRef.current
        const updatePos = updatePositionRef.current

        if (!player || !updatePos) {
            animationFrameRef.current = requestAnimationFrame(updateMovement)
            return
        }

        const now = Date.now()
        const deltaTime = now - lastUpdateTime.current

        // Limit to 60 FPS for smooth movement
        if (deltaTime < 16) {
            animationFrameRef.current = requestAnimationFrame(updateMovement)
            return
        }

        lastUpdateTime.current = now

        // Only calculate movement if keys are pressed
        if (keysPressed.current.size > 0) {
            let deltaX = 0
            let deltaY = 0

            // Calculate movement based on pressed keys
            if (keysPressed.current.has('w')) deltaY -= GAME_CONFIG.MOVEMENT_SPEED
            if (keysPressed.current.has('s')) deltaY += GAME_CONFIG.MOVEMENT_SPEED
            if (keysPressed.current.has('a')) deltaX -= GAME_CONFIG.MOVEMENT_SPEED
            if (keysPressed.current.has('d')) deltaX += GAME_CONFIG.MOVEMENT_SPEED

            if (deltaX !== 0 || deltaY !== 0) {
                const { newX, newY } = calculateNewPosition(player.x, player.y, deltaX, deltaY)

                if (newX !== player.x || newY !== player.y) {
                    // Update local state immediately for smooth UI
                    updatePos(newX, newY)

                    // Store pending position for database update
                    pendingPosition.current = { x: newX, y: newY }
                }
            }
        }

        // Continue animation loop
        animationFrameRef.current = requestAnimationFrame(updateMovement)
    }, [calculateNewPosition]) // Only depend on calculateNewPosition    // Debounced database update with more frequent updates
    useEffect(() => {
        const updateDatabase = async () => {
            const player = currentPlayerRef.current
            if (!player || !pendingPosition.current) return

            const now = Date.now()
            // Update database every 50ms for more responsive multiplayer
            if (now - lastDbUpdateTime.current < 50) return

            lastDbUpdateTime.current = now
            const position = pendingPosition.current
            pendingPosition.current = null

            try {
                await GameDatabase.upsertPlayer({
                    ...player,
                    x: position.x,
                    y: position.y
                })
            } catch (error) {
                console.error('Failed to update player position:', error)
            }
        }

        const interval = setInterval(updateDatabase, 50) // Faster updates
        return () => clearInterval(interval)
    }, []) // No dependencies to prevent restarts    // Set up keyboard event listeners and animation loop
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase()
            if (['w', 'a', 's', 'd'].includes(key)) {
                event.preventDefault()
                keysPressed.current.add(key)
            }
        }

        const handleKeyUp = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase()
            if (['w', 'a', 's', 'd'].includes(key)) {
                event.preventDefault()
                keysPressed.current.delete(key)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)

        // Start animation loop once
        const startAnimationLoop = () => {
            if (!animationFrameRef.current) {
                animationFrameRef.current = requestAnimationFrame(updateMovement)
            }
        }
        startAnimationLoop()

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)

            // Cleanup animation frame
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = null
            }

            // Clear keys
            keysPressed.current.clear()
        }
    }, [updateMovement]) // Only depend on updateMovement

    return {
        calculateNewPosition
    }
}
