# Ajusta Proyecto1.mpp: un solo recurso "Santi", calendario laboral los 7 dias.
# Para regenerar el WBS completo alineado al Anexo II (Hydrosyn), usar _mpp_hydrosyn_plan.ps1.
$ErrorActionPreference = "Stop"
$mpp = Join-Path $PSScriptRoot "Proyecto1.mpp"
$calName = "Santi_7d"

$app = New-Object -ComObject MSProject.Application
$app.Visible = $false
try {
    $app.FileOpen($mpp)
    $pj = $app.ActiveProject
    $stdName = $pj.BaseCalendars.Item(1).Name

    # Quitar calendario previo si existe (re-ejecucion)
    try {
        $pj.BaseCalendars.Item($calName).Delete()
    } catch { }

    # Crear calendario base copiando el estandar (API de aplicacion)
    $null = $app.BaseCalendarCreate($calName, $stdName)
    $bc = $pj.BaseCalendars.Item($calName)
    for ($d = 1; $d -le 7; $d++) {
        $bc.WeekDays.Item($d).Working = $true
    }

    # Calendario de proyecto: en esta version COM no asigna por string de forma fiable;
    # el calendario de recurso Santi (7d) gobierna la planificacion de sus tareas.

    # Recurso Santi
    $santi = $null
    foreach ($r in $pj.Resources) {
        if ($r.Name -eq "Santi") { $santi = $r; break }
    }
    if (-not $santi) {
        $santi = $pj.Resources.Add("Santi")
    }
    $santi.BaseCalendar = $calName
    $santi.MaxUnits = 1

    # Solo Santi en tareas hoja (no resumen)
    foreach ($t in $pj.Tasks) {
        if (-not $t.Name) { continue }
        if ($t.Summary) { continue }
        $names = [string]$t.ResourceNames
        if ([string]::IsNullOrWhiteSpace($names)) { continue }
        try {
            $t.ResourceNames = "Santi"
        } catch {
            Write-Warning "Tarea $($t.ID) $($t.Name): $($_.Exception.Message)"
        }
    }

    # Borrar otros recursos (sin asignaciones ya)
    $toDelete = @()
    foreach ($r in $pj.Resources) {
        if (-not $r.Name) { continue }
        if ($r.Name -ne "Santi") { $toDelete += $r }
    }
    foreach ($r in $toDelete) {
        try { $r.Delete() } catch { Write-Warning "No se pudo borrar recurso $($r.Name)" }
    }

    $app.FileSave()
    $app.FileClose(0)
    Write-Host "OK: guardado $mpp (Santi unico, calendario $calName)."
} finally {
    try { $app.Quit() | Out-Null } catch { }
    [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($app)
}
