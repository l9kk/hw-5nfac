import React, { useRef, useEffect } from 'react'
import { GAME_CONFIG } from '../services/supabase'
import type { Player } from '../services/supabase'
import './GameField.css'

interface GameFieldProps {
  players: Player[]
  currentPlayerId: string | null
}

export const GameField: React.FC<GameFieldProps> = ({ players, currentPlayerId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Render all players on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, GAME_CONFIG.FIELD_WIDTH, GAME_CONFIG.FIELD_HEIGHT)

    // Set canvas background
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, GAME_CONFIG.FIELD_WIDTH, GAME_CONFIG.FIELD_HEIGHT)

    // Draw grid pattern (optional, for better visual reference)
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    const gridSize = 50
    
    for (let x = 0; x <= GAME_CONFIG.FIELD_WIDTH; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, GAME_CONFIG.FIELD_HEIGHT)
      ctx.stroke()
    }
    
    for (let y = 0; y <= GAME_CONFIG.FIELD_HEIGHT; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(GAME_CONFIG.FIELD_WIDTH, y)
      ctx.stroke()
    }

    // Draw players
    players.forEach((player) => {
      // Draw player square
      ctx.fillStyle = player.color
      ctx.fillRect(
        player.x, 
        player.y, 
        GAME_CONFIG.PLAYER_SIZE, 
        GAME_CONFIG.PLAYER_SIZE
      )

      // Add border for current player
      if (player.id === currentPlayerId) {
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.strokeRect(
          player.x - 1, 
          player.y - 1, 
          GAME_CONFIG.PLAYER_SIZE + 2, 
          GAME_CONFIG.PLAYER_SIZE + 2
        )
      }

      // Draw player name
      ctx.fillStyle = '#fff'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(
        player.name,
        player.x + GAME_CONFIG.PLAYER_SIZE / 2,
        player.y - 5
      )
    })
  }, [players, currentPlayerId])

  return (
    <div className="game-field-container">
      <div className="game-header">
        <h2 className="game-title">🎮 Game Field</h2>
        <div className="game-instructions">
          Use <strong>W/A/S/D</strong> keys to move your player
        </div>
      </div>
      
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          width={GAME_CONFIG.FIELD_WIDTH}
          height={GAME_CONFIG.FIELD_HEIGHT}
          className="game-canvas"
        />
        
        {players.length === 0 && (
          <div className="no-players-overlay">
            <p>Waiting for players to join...</p>
          </div>
        )}
      </div>
      
      <div className="game-stats">
        <div className="stat-item">
          <strong>Field Size:</strong> {GAME_CONFIG.FIELD_WIDTH} × {GAME_CONFIG.FIELD_HEIGHT}px
        </div>
        <div className="stat-item">
          <strong>Players Online:</strong> {players.length}
        </div>
      </div>
    </div>
  )
}
