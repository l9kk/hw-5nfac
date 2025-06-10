import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { LoginForm } from './components/LoginForm'
import { GameField } from './components/GameField'
import { PlayerList } from './components/PlayerList'
import { useRealtimePlayers } from './hooks/useRealtimePlayers'
import { usePlayerMovement } from './hooks/usePlayerMovement'
import { GameDatabase, generateRandomColor, GAME_CONFIG } from './services/supabase'
import type { Player } from './services/supabase'
import './App.css'

function App() {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [gameState, setGameState] = useState<'login' | 'playing'>('login')

  const { players, isLoading, error, updateLocalPlayer } = useRealtimePlayers()

  // Handle joining the game
  const handleJoinGame = useCallback(async (playerName: string) => {
    try {
      const playerId = uuidv4()
      const playerColor = generateRandomColor()
      
      const newPlayer: Omit<Player, 'created_at'> = {
        id: playerId,
        name: playerName,
        x: GAME_CONFIG.CENTER_X,
        y: GAME_CONFIG.CENTER_Y,
        color: playerColor
      }

      // Add player to database
      await GameDatabase.upsertPlayer(newPlayer)
      
      // Set current player
      setCurrentPlayer(newPlayer as Player)
      setGameState('playing')
      
    } catch (error) {
      console.error('Failed to join game:', error)
      alert('Failed to join game. Please check your internet connection and try again.')
      throw error
    }
  }, [])

  // Handle leaving the game
  const handleLeaveGame = useCallback(async () => {
    if (currentPlayer) {
      try {
        await GameDatabase.removePlayer(currentPlayer.id)
      } catch (error) {
        console.error('Failed to remove player:', error)
      }
      setCurrentPlayer(null)
      setGameState('login')
    }
  }, [currentPlayer])

  // Update player position locally for immediate feedback
  const updatePlayerPosition = useCallback((x: number, y: number) => {
    if (currentPlayer) {
      const updatedPlayer = { ...currentPlayer, x, y }
      setCurrentPlayer(updatedPlayer)
      updateLocalPlayer(currentPlayer.id, x, y)
    }
  }, [currentPlayer, updateLocalPlayer])

  // Set up player movement
  usePlayerMovement({
    currentPlayer,
    updatePlayerPosition
  })

  // Clean up on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentPlayer) {
        GameDatabase.removePlayer(currentPlayer.id).catch(console.error)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // Don't call handleLeaveGame here as it causes player removal on re-renders
    }
  }, [currentPlayer])

  // Show login form if not playing
  if (gameState === 'login') {
    return <LoginForm onJoinGame={handleJoinGame} />
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading game...</p>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="error-container">
        <h2>❌ Connection Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          🔄 Retry
        </button>
      </div>
    )
  }

  return (
    <div className="game-container">
      <div className="game-header-bar">
        <h1 className="game-main-title">🎮 Realtime Multiplayer Game</h1>
        <button onClick={handleLeaveGame} className="leave-button">
          🚪 Leave Game
        </button>
      </div>

      <div className="game-content">
        <div className="game-sidebar">
          <PlayerList 
            players={players} 
            currentPlayerId={currentPlayer?.id || null} 
          />
          
          <div className="game-controls">
            <h3>🎮 Controls</h3>
            <div className="control-grid">
              <div></div>
              <div className="key">W</div>
              <div></div>
              <div className="key">A</div>
              <div className="key">S</div>
              <div className="key">D</div>
            </div>
            <p className="controls-description">
              Use WASD keys to move your player around the field
            </p>
          </div>
        </div>

        <div className="game-main">
          <GameField 
            players={players}
            currentPlayerId={currentPlayer?.id || null}
          />
        </div>
      </div>
    </div>
  )
}

export default App
