import { useState, useEffect, useCallback } from 'react'
import { GameDatabase } from '../services/supabase'
import type { Player } from '../services/supabase'

export const useRealtimePlayers = () => {
    const [players, setPlayers] = useState<Player[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Handle player insertion
    const handlePlayerInsert = useCallback((newPlayer: Player) => {
        setPlayers(prev => {
            // Check if player already exists to avoid duplicates
            const exists = prev.some(p => p.id === newPlayer.id)
            if (exists) return prev
            return [...prev, newPlayer]
        })
    }, [])

    // Handle player update
    const handlePlayerUpdate = useCallback((updatedPlayer: Player) => {
        setPlayers(prev =>
            prev.map(player =>
                player.id === updatedPlayer.id ? updatedPlayer : player
            )
        )
    }, [])

    // Handle player deletion
    const handlePlayerDelete = useCallback((deletedPlayer: Player) => {
        setPlayers(prev =>
            prev.filter(player => player.id !== deletedPlayer.id)
        )
    }, [])    // Initialize players and set up real-time subscription
    useEffect(() => {
        let subscription: any = null

        const initializePlayers = async () => {
            try {
                setIsLoading(true)
                setError(null)

                // Fetch existing players
                const existingPlayers = await GameDatabase.getAllPlayers()
                setPlayers(existingPlayers)

                // Set up real-time subscription with unique channel name
                const channelName = `players-${Date.now()}-${Math.random()}`
                subscription = GameDatabase.subscribeToPlayers(
                    channelName,
                    handlePlayerInsert,
                    handlePlayerUpdate,
                    handlePlayerDelete
                )

                setIsLoading(false)
            } catch (err) {
                console.error('Failed to initialize players:', err)
                setError(err instanceof Error ? err.message : 'Failed to load players')
                setIsLoading(false)
            }
        }

        initializePlayers()

        // Cleanup subscription on unmount
        return () => {
            if (subscription) {
                subscription.unsubscribe()
            }
        }
    }, []) // Remove dependencies to prevent subscription recreation

    // Update local player state (for immediate UI response)
    const updateLocalPlayer = useCallback((playerId: string, x: number, y: number) => {
        setPlayers(prev =>
            prev.map(player =>
                player.id === playerId ? { ...player, x, y } : player
            )
        )
    }, [])

    return {
        players,
        isLoading,
        error,
        updateLocalPlayer
    }
}
