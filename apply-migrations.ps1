# Apply Supabase migrations via REST API
# This script reads migration files and executes them against your Supabase database

param(
    [Parameter(Mandatory=$true)]
    [string]$ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY,
    [string]$ProjectUrl = if ($env:SUPABASE_URL) { $env:SUPABASE_URL } else { "https://zgexnqpeywpsbrkrfrsu.supabase.co" }
)

$migrations = @(
    "supabase/migrations/20260212000000_enable_cron_extensions.sql",
    "supabase/migrations/20260212000001_schedule_daily_functions.sql"
)

$headers = @{
    "Authorization" = "Bearer $ServiceRoleKey"
    "Content-Type" = "application/json"
    "apikey" = $ServiceRoleKey
}

foreach ($migration in $migrations) {
    if (Test-Path $migration) {
        $sqlContent = Get-Content -Path $migration -Raw
        
        Write-Host "Applying migration: $migration"
        
        # Split by semicolon to execute multiple statements
        $statements = $sqlContent -split ";" | Where-Object { $_.Trim() -ne "" }
        
        foreach ($statement in $statements) {
            $body = @{
                query = $statement.Trim()
            } | ConvertTo-Json
            
            try {
                $response = Invoke-RestMethod `
                    -Uri "$ProjectUrl/rest/v1/rpc/exec_sql" `
                    -Method POST `
                    -Headers $headers `
                    -Body $body `
                    -ErrorAction Stop
                
                Write-Host "✓ Executed successfully"
            } catch {
                Write-Host "✗ Error: $($_.Exception.Message)"
            }
        }
    } else {
        Write-Host "Migration file not found: $migration"
    }
}

Write-Host "Migration process completed!"
