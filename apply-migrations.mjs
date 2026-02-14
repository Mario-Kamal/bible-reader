import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const projectUrl = process.env.SUPABASE_URL || 'https://zgexnqpeywpsbrkrfrsu.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set')
  console.error('Please set it before running this script')
  process.exit(1)
}

const supabase = createClient(projectUrl, serviceRoleKey)

async function applyMigrations() {
  const migrations = [
    'supabase/migrations/20260212000000_enable_cron_extensions.sql',
    'supabase/migrations/20260212000001_schedule_daily_functions.sql'
  ]

  for (const migrationPath of migrations) {
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`)
      continue
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8')
    console.log(`\n📋 Applying: ${migrationPath}`)
    console.log('─'.repeat(50))

    try {
      const { error } = await supabase.rpc('exec_sql', { sql })
      
      if (error) {
        console.error('❌ Error:', error.message)
      } else {
        console.log('✅ Migration applied successfully')
      }
    } catch (err) {
      console.error('❌ Error executing migration:', err.message)
    }
  }
}

applyMigrations()
