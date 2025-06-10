import React, { useState } from 'react'
import './LoginForm.css'

interface LoginFormProps {
  onJoinGame: (playerName: string) => void
}

export const LoginForm: React.FC<LoginFormProps> = ({ onJoinGame }) => {
  const [playerName, setPlayerName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!playerName.trim()) {
      alert('Please enter your name')
      return
    }

    if (playerName.trim().length < 2) {
      alert('Name must be at least 2 characters long')
      return
    }

    if (playerName.trim().length > 20) {
      alert('Name must be less than 20 characters')
      return
    }

    setIsLoading(true)
    try {
      await onJoinGame(playerName.trim())
    } catch (error) {
      console.error('Failed to join game:', error)
      alert('Failed to join game. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-form">
        <h1 className="login-title">🎮 Realtime Multiplayer Game</h1>
        <p className="login-description">
          Enter your name to join the game!<br />
          Use <strong>W/A/S/D</strong> keys to move around.
        </p>
        
        <form onSubmit={handleSubmit} className="login-form-content">
          <div className="input-group">
            <label htmlFor="playerName" className="input-label">
              Your Name:
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your nickname..."
              maxLength={20}
              minLength={2}
              required
              disabled={isLoading}
              className="name-input"
              autoFocus
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading || !playerName.trim()}
            className="join-button"
          >
            {isLoading ? '🔄 Joining...' : '🚀 Join Game'}
          </button>
        </form>

        <div className="game-info">
          <h3>How to Play:</h3>
          <ul>
            <li><strong>W</strong> - Move Up</li>
            <li><strong>A</strong> - Move Left</li>
            <li><strong>S</strong> - Move Down</li>
            <li><strong>D</strong> - Move Right</li>
          </ul>
          <p>All movements are synchronized in real-time with other players!</p>
        </div>
      </div>
    </div>
  )
}
