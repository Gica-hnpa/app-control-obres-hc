# APP Control d'Obres · V87.260 · Programa la còpia del núvol cada dia a les 13:00 (Programador de tasques).
# Si a aquella hora l'ordinador és apagat, la fa en engegar-lo. Només s'executa amb la sessió de l'usuari
# (la contrasenya xifrada només la pot llegir aquest usuari de Windows).
#   powershell -ExecutionPolicy Bypass -File tools\copies\programar-copia.ps1
# Per treure-la: Unregister-ScheduledTask -TaskName "APP Control d'Obres - copia del nuvol"
$ErrorActionPreference = "Stop"
$name = "APP Control d'Obres - copia del nuvol"
$node = (Get-Command node).Source
$script = Join-Path $PSScriptRoot "copia-nuvol.mjs"
$action = New-ScheduledTaskAction -Execute $node -Argument "`"$script`"" -WorkingDirectory (Split-Path (Split-Path $PSScriptRoot))
$trigger = New-ScheduledTaskTrigger -Daily -At 13:00
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 30)
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Còpia diària del núvol (Supabase) a DADES\COPIES_NUVOL i Documents\COPIES_NUVOL" -Force | Out-Null
Write-Host "Programada: $name (cada dia a les 13:00)."
