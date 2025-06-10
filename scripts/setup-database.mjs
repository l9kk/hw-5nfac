#!/usr/bin/env node

/**
 * Database Setup Script for Realtime Multiplayer Game
 * 
 * This script helps you set up the Supabase database table and policies.
 * Make sure you have set up your .env file with valid Supabase credentials first.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables manually
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env')
    const envContent = readFileSync(envPath, 'utf8')
    const envVars = {}
    
    envContent.split('\n').forEach(line => {
      line = line.trim()
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=')
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim()
        }
      }
    })
    
    return envVars
  } catch (error) {
    console.error('❌ Could not read .env file:', error.message)
    return {}
  }
}

const env = loadEnv()
const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables in .env file')
  console.log('Please make sure you have set:')
  console.log('- VITE_SUPABASE_URL')
  console.log('- VITE_SUPABASE_ANON_KEY')
  console.log('\nCurrent .env values:')
  console.log('- VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.log('- VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setupDatabase() {
  console.log('🚀 Setting up Realtime Multiplayer Game database...\n')
  try {
    // Test connection
    console.log('🔗 Testing Supabase connection...')
    const { data, error: connectionError } = await supabase.auth.getSession()
    
    if (connectionError && connectionError.message.includes('Invalid API key')) {
      throw new Error(`Connection failed: Invalid API key`)
    }
    console.log('✅ Connected to Supabase successfully!\n')

    // Check if players table exists
    console.log('📋 Checking if players table exists...')
    const { error: tableCheckError } = await supabase.from('players').select('*').limit(1)
    
    if (tableCheckError) {
      console.log('❌ Players table does not exist.')
      console.log('\n📝 Please run the following SQL in your Supabase SQL Editor:')
      console.log('\n' + '='.repeat(60))
      console.log(`
-- Create the players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  x REAL NOT NULL DEFAULT 400,
  y REAL NOT NULL DEFAULT 300,
  color VARCHAR(7) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations
CREATE POLICY "Allow all operations on players" ON players
  FOR ALL USING (true)
  WITH CHECK (true);

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE players;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_created_at ON players(created_at);
CREATE INDEX IF NOT EXISTS idx_players_id ON players(id);
`)
      console.log('='.repeat(60))
      console.log('\n📍 Steps to set up:')
      console.log('1. Go to your Supabase dashboard')
      console.log('2. Navigate to SQL Editor')
      console.log('3. Copy and paste the SQL above')
      console.log('4. Run the query')
      console.log('5. Run this script again to verify setup\n')
      
      return false
    } else {
      console.log('✅ Players table exists!\n')
      
      // Test insert/delete to verify permissions
      console.log('🔑 Testing table permissions...')
      const testPlayer = {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Test Player',
        x: 400,
        y: 300,
        color: '#FF0000'
      }
      
      const { error: insertError } = await supabase
        .from('players')
        .insert(testPlayer)
      
      if (insertError) {
        console.log('❌ Insert permission failed:', insertError.message)
        console.log('Please make sure RLS policies are set up correctly.')
        return false
      }
      
      const { error: deleteError } = await supabase
        .from('players')
        .delete()
        .eq('id', testPlayer.id)
      
      if (deleteError) {
        console.log('❌ Delete permission failed:', deleteError.message)
        return false
      }
      
      console.log('✅ Table permissions working correctly!\n')
      
      // Check real-time setup
      console.log('📡 Checking real-time configuration...')
      console.log('ℹ️  Real-time setup verification requires manual testing.')
      console.log('   Start your game and open multiple browser tabs to test.\n')
      
      return true
    }
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    return false
  }
}

async function main() {
  const success = await setupDatabase()
  
  if (success) {
    console.log('🎉 Database setup completed successfully!')
    console.log('\n🎮 You can now start playing:')
    console.log('1. Run: npm run dev')
    console.log('2. Open: http://localhost:5173')
    console.log('3. Enter your name and start playing!')
    console.log('\n💡 Open multiple browser tabs/windows to test multiplayer functionality.')
  } else {
    console.log('\n❌ Setup incomplete. Please follow the instructions above.')
    process.exit(1)
  }
}

main().catch(console.error)
