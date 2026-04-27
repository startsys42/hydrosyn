# Regenera Proyecto1.mpp siguiendo la estructura de MS Project del Anexo I (Figuras 4 a 9):
# Fase > Iteracion > disciplina (Modelado, Requisitos, Analisis, Diseno, Implementacion, Pruebas) > tareas.
# Elaboracion iter 1: analisis = todos los casos de uso (8 paquetes); diseno funcional = solo Auth, Usuarios, Sistemas.
# Elaboracion iter 2: diseno detallado = solo esos tres paquetes; implementacion y pruebas de esos tres modulos.
# Construccion iter 1: diseno funcional del resto (ESP32, Tanques, Bombas, Luces, Registros). Iter 2: detallado + impl + pruebas.
# Calendario Santi: 16:00-20:00 (4h/dia), lunes-viernes y sabado opcional.
# Cierra Microsoft Project antes de ejecutar si hubo un intento bloqueado.
$ErrorActionPreference = "Stop"
$mpp = Join-Path $PSScriptRoot "Proyecto1.mpp"
$calName = "Santi_7d"

function Ensure-SantiCalendarAndResource($app, $pj) {
    $stdName = $pj.BaseCalendars.Item(1).Name
    try { $pj.BaseCalendars.Item($calName).Delete() } catch { }
    $null = $app.BaseCalendarCreate($calName, $stdName)
    $bc = $pj.BaseCalendars.Item($calName)
    $workSaturday = $true
    try { $bc.WeekDays.Item(1).Working = $false } catch { }
    try { $bc.WeekDays.Item(7).Working = $false } catch { }
    for ($d = 2; $d -le 6; $d++) {
        $wd = $bc.WeekDays.Item($d)
        $wd.Working = $true
        $wd.Shift1.Start = "16:00"
        $wd.Shift1.Finish = "20:00"
    }
    if ($workSaturday) {
        $wd = $bc.WeekDays.Item(7)
        $wd.Working = $true
        $wd.Shift1.Start = "16:00"
        $wd.Shift1.Finish = "20:00"
    }

    $santi = $null
    foreach ($r in $pj.Resources) { if ($r.Name -eq "Santi") { $santi = $r; break } }
    if (-not $santi) { $santi = $pj.Resources.Add("Santi") }
    $santi.BaseCalendar = $calName
    $santi.MaxUnits = 1

    $toDelete = @()
    foreach ($r in $pj.Resources) {
        if ($r.Name -and $r.Name -ne "Santi") { $toDelete += $r }
    }
    foreach ($r in $toDelete) { try { $r.Delete() } catch { } }
}

function Add-WbsTask($pj, [string]$name, [int]$level) {
    $t = $pj.Tasks.Add($name)
    while ($t.OutlineLevel -lt $level) { $t.OutlineIndent() | Out-Null }
    while ($t.OutlineLevel -gt $level) { $t.OutlineOutdent() | Out-Null }
    return $t
}

function Remove-AllTasks($pj) {
    $n = $pj.Tasks.Count
    for ($i = $n; $i -ge 1; $i--) {
        try { $pj.Tasks.Item($i).Delete() } catch { }
    }
}

# Nombre|nivel(1..4)|dias|hito(1/0). Duraciones orientativas (ajustar en Project).
$plan = @(
    # --- Figura 4: Inicio ---
    "Inicio|1|0|0"
    "Iteracion 1|2|0|0"
    "Modelado de negocio|3|0|0"
    "Reunion con los tutores|4|1|0"
    "Requisitos|3|0|0"
    "Definicion de los objetivos|4|2|0"
    "Definicion de los actores|4|2|0"
    "Definicion de los requisitos de informacion|4|2|0"
    "Definicion de los requisitos funcionales|4|3|0"
    "Definicion de los requisitos no funcionales|4|2|0"
    "Analisis|3|0|0"
    "Estudio de mercado|4|2|0"
    "Investigacion de tecnologias disponibles|4|2|0"
    "Hito Iteracion 1|3|0|1"
    "Hito Fin Inicio|2|0|1"
    # --- Figura 5: Elaboracion iteracion 1 ---
    "Elaboracion|1|0|0"
    "Iteracion 1|2|0|0"
    "Modelado de negocio|3|0|0"
    "Reunion con los tutores|4|1|0"
    "Estimacion del esfuerzo|4|2|0"
    "Planificacion temporal|4|2|0"
    "Requisitos|3|0|0"
    "Documentacion de los actores|4|2|0"
    "Documentacion de los requisitos de informacion|4|2|0"
    "Documentacion de los casos de uso|4|3|0"
    "Documentacion de los requisitos no funcionales|4|2|0"
    "Analisis|3|0|0"
    "Modelo de dominio|4|3|0"
    "Casos de uso del paquete de Gestion de Autenticacion de usuarios|4|3|0"
    "Casos de uso del paquete de Gestion de Usuarios y propietarios|4|3|0"
    "Casos de uso del paquete de Gestion de Sistemas|4|3|0"
    "Casos de uso del paquete de Gestion de ESP32|4|3|0"
    "Casos de uso del paquete de Gestion de Tanques|4|3|0"
    "Casos de uso del paquete de Gestion de Bombas|4|3|0"
    "Casos de uso del paquete de Gestion de Luces|4|3|0"
    "Casos de uso del paquete de Gestion de Registros de tanques|4|3|0"
    "Diseno|3|0|0"
    "Estudio de patrones de diseno|4|2|0"
    "Diseno funcional del paquete de Gestion de Autenticacion de usuarios|4|2|0"
    "Diseno funcional del paquete de Gestion de Usuarios y propietarios|4|2|0"
    "Diseno funcional del paquete de Gestion de Sistemas|4|2|0"
    "Hito Iteracion 1|3|0|1"
    # --- Elaboracion iteracion 2: diseno detallado + construccion solo Auth, Usuarios, Sistemas ---
    "Iteracion 2|2|0|0"
    "Modelado de negocio|3|0|0"
    "Reunion con los tutores|4|1|0"
    "Diseno|3|0|0"
    "Diseno detallado del paquete de Gestion de Autenticacion de usuarios|4|3|0"
    "Diseno detallado del paquete de Gestion de Usuarios y propietarios|4|3|0"
    "Diseno detallado del paquete de Gestion de Sistemas|4|3|0"
    "Implementacion|3|0|0"
    "Primer prototipo|4|3|0"
    "Construccion del modulo de Gestion de Autenticacion de usuarios|4|6|0"
    "Construccion del modulo de Gestion de Usuarios y propietarios|4|8|0"
    "Construccion del modulo de Gestion de Sistemas|4|7|0"
    "Pruebas|3|0|0"
    "Pruebas unitarias del modulo de Gestion de Autenticacion de usuarios|4|2|0"
    "Pruebas unitarias del modulo de Gestion de Usuarios y propietarios|4|2|0"
    "Pruebas unitarias del modulo de Gestion de Sistemas|4|2|0"
    "Pruebas de integracion de los modulos de elaboracion|4|3|0"
    "Hito Iteracion 2|3|0|1"
    "Hito Fin Elaboracion|2|0|1"
    # --- Construccion iteracion 1: diseno funcional del resto de paquetes (sin repetir analisis) ---
    "Construccion|1|0|0"
    "Iteracion 1|2|0|0"
    "Modelado de negocio|3|0|0"
    "Reunion con los tutores|4|1|0"
    "Diseno|3|0|0"
    "Diseno funcional del paquete de Gestion de ESP32|4|2|0"
    "Diseno funcional del paquete de Gestion de Tanques|4|2|0"
    "Diseno funcional del paquete de Gestion de Bombas|4|2|0"
    "Diseno funcional del paquete de Gestion de Luces|4|2|0"
    "Diseno funcional del paquete de Gestion de Registros de tanques|4|2|0"
    "Hito Iteracion 1|3|0|1"
    # --- Construccion iteracion 2: diseno detallado + implementacion + pruebas del resto ---
    "Iteracion 2|2|0|0"
    "Modelado de negocio|3|0|0"
    "Reunion con los tutores|4|1|0"
    "Diseno|3|0|0"
    "Diseno detallado del paquete de Gestion de ESP32|4|3|0"
    "Diseno detallado del paquete de Gestion de Tanques|4|3|0"
    "Diseno detallado del paquete de Gestion de Bombas|4|3|0"
    "Diseno detallado del paquete de Gestion de Luces|4|3|0"
    "Diseno detallado del paquete de Gestion de Registros de tanques|4|3|0"
    "Implementacion|3|0|0"
    "Diagrama de componentes|4|3|0"
    "Construccion del modulo de Gestion de ESP32|4|7|0"
    "Construccion del modulo de Gestion de Tanques|4|7|0"
    "Construccion del modulo de Gestion de Bombas|4|9|0"
    "Construccion del modulo de Gestion de Luces|4|8|0"
    "Construccion del modulo de Gestion de Registros de tanques|4|6|0"
    "Pruebas|3|0|0"
    "Pruebas unitarias del modulo de Gestion de ESP32|4|2|0"
    "Pruebas unitarias del modulo de Gestion de Tanques|4|2|0"
    "Pruebas unitarias del modulo de Gestion de Bombas|4|2|0"
    "Pruebas unitarias del modulo de Gestion de Luces|4|2|0"
    "Pruebas unitarias del modulo de Gestion de Registros de tanques|4|2|0"
    "Pruebas de integracion de los modulos de construccion|4|3|0"
    "Pruebas de regresion del sistema completo|4|3|0"
    "Hito Iteracion 2|3|0|1"
    "Hito Fin Construccion|2|0|1"
    # --- Figura 9: Transicion ---
    "Transicion|1|0|0"
    "Iteracion 1|2|0|0"
    "Modelado de negocio|3|0|0"
    "Finalizar la documentacion|4|4|0"
    "Reunion final con los tutores|4|1|0"
    "Implementacion|3|0|0"
    "Despliegue del sistema|4|3|0"
    "Corregir fallos|4|4|0"
    "Pruebas|3|0|0"
    "Pruebas finales del sistema completo|4|4|0"
    "Hito Iteracion 1|3|0|1"
    "Hito Fin Transicion|2|0|1"
)

$app = New-Object -ComObject MSProject.Application
$app.Visible = $false
$app.DisplayAlerts = $false
try {
    Copy-Item -LiteralPath $mpp -Destination ($mpp + ".bak_previo") -Force -ErrorAction SilentlyContinue
    $app.FileOpen($mpp)
    $pj = $app.ActiveProject
    $desiredStart = [datetime]::Parse("2025-02-01 16:00")

    Remove-AllTasks $pj
    Ensure-SantiCalendarAndResource $app $pj

    # Jornada solicitada: 4 h/dia (16:00-20:00), lunes-viernes y sabado opcional.
    try {
        $pj.HoursPerDay = 4
        $pj.MinutesPerDay = 240
        $pj.HoursPerWeek = 24
        $pj.MinutesPerWeek = 1440
    } catch { }

    $mpd = 240
    $durationFactor = 1.45
    try { if ($pj.MinutesPerDay -gt 0) { $mpd = [int]$pj.MinutesPerDay } } catch { }

    $created = New-Object System.Collections.Generic.List[object]
    foreach ($line in $plan) {
        $parts = $line.Split('|')
        $nm = $parts[0].Trim()
        $lv = [int]$parts[1]
        $days = [int]$parts[2]
        $ms = [int]$parts[3]
        $t = Add-WbsTask $pj $nm $lv
        if ($ms -eq 1) {
            $t.Milestone = $true
            $t.Duration = 0
        } elseif ($days -gt 0) {
            $t.Duration = [double]([math]::Round($days * $mpd * $durationFactor, 0))
        }
        if (-not $t.Summary -and $days -gt 0) {
            try { $t.ResourceNames = "Santi" } catch { }
        }
        $created.Add($t) | Out-Null
    }

    $leaf = New-Object System.Collections.Generic.List[object]
    foreach ($t in $created) {
        if (-not $t.Summary) { $leaf.Add($t) | Out-Null }
    }
    for ($i = 1; $i -lt $leaf.Count; $i++) {
        $pred = $leaf[$i - 1]
        $succ = $leaf[$i]
        try { $succ.Predecessors = ([string]$pred.ID) } catch {
            Write-Warning "Predecesor $($pred.ID)->$($succ.ID): $($_.Exception.Message)"
        }
    }

    try { $created[0].Start = $desiredStart } catch { }

    $app.FileSave()
    $app.FileClose(0)
    Write-Host "OK: plan regenerado (estructura Anexo I Fig.4-9, Hydrosyn por paquetes)."
} finally {
    try { $app.Quit() | Out-Null } catch { }
    [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($app)
}
