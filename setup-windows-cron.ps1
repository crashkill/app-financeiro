# HITSS Automation - Windows Task Scheduler Setup
# Script para configurar a automação HITSS no Task Scheduler do Windows

param(
    [string]$TaskName = "HITSS-Automation-Daily",
    [string]$Schedule = "Daily",
    [string]$StartTime = "08:00",
    [switch]$Force,
    [switch]$Remove,
    [switch]$Status
)

# Configurações
$ScriptPath = $PSScriptRoot
$WrapperScript = Join-Path $ScriptPath "hitss-cron-wrapper.js"
$NodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
$LogPath = Join-Path $ScriptPath "logs"

Write-Host "🤖 HITSS Automation - Task Scheduler Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Verificar se Node.js está instalado
if (-not $NodePath) {
    Write-Host "❌ Node.js não encontrado. Instale o Node.js primeiro." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js encontrado: $NodePath" -ForegroundColor Green

# Verificar se o script wrapper existe
if (-not (Test-Path $WrapperScript)) {
    Write-Host "❌ Script wrapper não encontrado: $WrapperScript" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Script wrapper encontrado: $WrapperScript" -ForegroundColor Green

# Função para verificar status da tarefa
function Get-TaskStatus {
    try {
        $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
        if ($task) {
            $taskInfo = Get-ScheduledTaskInfo -TaskName $TaskName
            Write-Host "📋 Status da Tarefa: $TaskName" -ForegroundColor Yellow
            Write-Host "   Estado: $($task.State)" -ForegroundColor White
            Write-Host "   Última Execução: $($taskInfo.LastRunTime)" -ForegroundColor White
            Write-Host "   Próxima Execução: $($taskInfo.NextRunTime)" -ForegroundColor White
            Write-Host "   Último Resultado: $($taskInfo.LastTaskResult)" -ForegroundColor White
            return $true
        } else {
            Write-Host "❌ Tarefa '$TaskName' não encontrada." -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ Erro ao verificar status: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Função para remover tarefa existente
function Remove-ExistingTask {
    try {
        $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
        if ($task) {
            Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
            Write-Host "🗑️ Tarefa existente removida: $TaskName" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️ Erro ao remover tarefa existente: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Se apenas status foi solicitado
if ($Status) {
    Get-TaskStatus
    exit 0
}

# Se remoção foi solicitada
if ($Remove) {
    Write-Host "🗑️ Removendo tarefa agendada..." -ForegroundColor Yellow
    Remove-ExistingTask
    Write-Host "✅ Tarefa removida com sucesso!" -ForegroundColor Green
    exit 0
}

# Verificar se tarefa já existe
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask -and -not $Force) {
    Write-Host "⚠️ Tarefa '$TaskName' já existe." -ForegroundColor Yellow
    Write-Host "   Use -Force para sobrescrever ou -Remove para remover." -ForegroundColor Yellow
    Get-TaskStatus
    exit 0
}

# Remover tarefa existente se Force foi especificado
if ($existingTask -and $Force) {
    Remove-ExistingTask
}

Write-Host "⚙️ Configurando nova tarefa agendada..." -ForegroundColor Yellow

try {
    # Criar diretório de logs se não existir
    if (-not (Test-Path $LogPath)) {
        New-Item -ItemType Directory -Path $LogPath -Force | Out-Null
        Write-Host "📁 Diretório de logs criado: $LogPath" -ForegroundColor Green
    }

    # Definir ação da tarefa
    $Action = New-ScheduledTaskAction -Execute $NodePath -Argument "`"$WrapperScript`"" -WorkingDirectory $ScriptPath

    # Definir trigger (agendamento)
    switch ($Schedule.ToLower()) {
        "daily" {
            $Trigger = New-ScheduledTaskTrigger -Daily -At $StartTime
            Write-Host "📅 Agendamento: Diário às $StartTime" -ForegroundColor Green
        }
        "hourly" {
            $Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 365)
            Write-Host "📅 Agendamento: A cada hora" -ForegroundColor Green
        }
        "weekly" {
            $Trigger = New-ScheduledTaskTrigger -Weekly -At $StartTime -DaysOfWeek Monday
            Write-Host "📅 Agendamento: Semanalmente às segundas-feiras às $StartTime" -ForegroundColor Green
        }
        default {
            $Trigger = New-ScheduledTaskTrigger -Daily -At $StartTime
            Write-Host "📅 Agendamento padrão: Diário às $StartTime" -ForegroundColor Green
        }
    }

    # Definir configurações da tarefa
    $Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

    # Definir principal (usuário)
    $Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

    # Registrar tarefa
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Description "Automação diária dos dados financeiros HITSS"

    Write-Host "✅ Tarefa agendada criada com sucesso!" -ForegroundColor Green
    Write-Host "" -ForegroundColor White

    # Mostrar status da tarefa criada
    Get-TaskStatus

    Write-Host "" -ForegroundColor White
    Write-Host "📋 Comandos úteis:" -ForegroundColor Cyan
    Write-Host "   Verificar status: .\setup-windows-cron.ps1 -Status" -ForegroundColor White
    Write-Host "   Executar manualmente: Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
    Write-Host "   Remover tarefa: .\setup-windows-cron.ps1 -Remove" -ForegroundColor White
    Write-Host "   Ver logs: Get-Content .\logs\hitss-cron-*.log" -ForegroundColor White

} catch {
    Write-Host "❌ Erro ao criar tarefa agendada: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "" -ForegroundColor White
Write-Host "🎉 Configuração concluída!" -ForegroundColor Green