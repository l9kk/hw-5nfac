import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our game
export interface Player {
    id: string
    name: string
    x: number
    y: number
    color: string
    created_at: string
}

// Game configuration constants
export const GAME_CONFIG = {
    FIELD_WIDTH: 800,
    FIELD_HEIGHT: 600,
    PLAYER_SIZE: 4, // Visual size in pixels
    MOVEMENT_SPEED: 5, // Pixels per movement (increased for more responsive movement)
    CENTER_X: 400,
    CENTER_Y: 300,
}

// Generate random color for player
export const generateRandomColor = (): string => {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
        '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
}

// Database operations
export class GameDatabase {
    // Add or update player in database
    static async upsertPlayer(player: Omit<Player, 'created_at'>) {
        const { error } = await supabase
            .from('players')
            .upsert(player, { onConflict: 'id' })

        if (error) {
            console.error('Error upserting player:', error)
            throw error
        }
    }

    // Remove player from database
    static async removePlayer(playerId: string) {
        const { error } = await supabase
            .from('players')
            .delete()
            .eq('id', playerId)

        if (error) {
            console.error('Error removing player:', error)
            throw error
        }
    }

    // Get all players
    static async getAllPlayers(): Promise<Player[]> {
        const { data, error } = await supabase
            .from('players')
            .select('*')

        if (error) {
            console.error('Error fetching players:', error)
            throw error
        }

        return data || []
    }    // Subscribe to real-time changes
    static subscribeToPlayers(
        channelName: string,
        onInsert: (player: Player) => void,
        onUpdate: (player: Player) => void,
        onDelete: (player: Player) => void
    ) {
        return supabase
            .channel(channelName)
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'players' },
                (payload) => onInsert(payload.new as Player)
            )
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'players' },
                (payload) => onUpdate(payload.new as Player)
            )
            .on('postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'players' },
                (payload) => onDelete(payload.old as Player)
            )
            .subscribe()
    }
}
