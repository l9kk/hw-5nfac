import React from 'react'
import type { Player } from '../services/supabase'
import './PlayerList.css'

interface PlayerListProps {
  players: Player[]
  currentPlayerId: string | null
}

export const PlayerList: React.FC<PlayerListProps> = ({ players, currentPlayerId }) => {
  if (players.length === 0) {
    return (
      <div className="player-list">
        <h3 className="player-list-title">👥 Players Online (0)</h3>
        <p className="no-players">No players online</p>
      </div>
    )
  }

  return (
    <div className="player-list">
      <h3 className="player-list-title">👥 Players Online ({players.length})</h3>
      <div className="player-list-content">
        {players.map((player) => (
          <div 
            key={player.id} 
            className={`player-item ${player.id === currentPlayerId ? 'current-player' : ''}`}
          >
            <div 
              className="player-color" 
              style={{ backgroundColor: player.color }}
            ></div>
            <span className="player-name">
              {player.name}
              {player.id === currentPlayerId && ' (You)'}
            </span>
            <div className="player-position">
              ({Math.round(player.x)}, {Math.round(player.y)})
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
