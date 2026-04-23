$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$outDir = "assets/parallax"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$W = 1024
$H = 540

function Clamp([int]$v, [int]$a, [int]$b) {
  if ($v -lt $a) { return $a }
  if ($v -gt $b) { return $b }
  return $v
}

function NewLayer() {
  return [System.Drawing.Bitmap]::new($W, $H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
}

function PutPixel([System.Drawing.Bitmap]$bmp, [int]$x, [int]$y, [int]$a, [int]$r, [int]$g, [int]$b) {
  if ($x -lt 0 -or $y -lt 0 -or $x -ge $bmp.Width -or $y -ge $bmp.Height) { return }
  $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb((Clamp $a 0 255), (Clamp $r 0 255), (Clamp $g 0 255), (Clamp $b 0 255)))
}

function FillRect([System.Drawing.Bitmap]$bmp, [int]$x0, [int]$y0, [int]$w, [int]$h, [int]$a, [int]$r, [int]$g, [int]$b) {
  $x1 = [Math]::Min($bmp.Width - 1, $x0 + $w - 1)
  $y1 = [Math]::Min($bmp.Height - 1, $y0 + $h - 1)
  for ($y = [Math]::Max(0, $y0); $y -le $y1; $y++) {
    for ($x = [Math]::Max(0, $x0); $x -le $x1; $x++) {
      PutPixel $bmp $x $y $a $r $g $b
    }
  }
}

function FillCircle([System.Drawing.Bitmap]$bmp, [int]$cx, [int]$cy, [int]$rad, [int]$a, [int]$r, [int]$g, [int]$b) {
  $r2 = $rad * $rad
  for ($y = $cy - $rad; $y -le $cy + $rad; $y++) {
    for ($x = $cx - $rad; $x -le $cx + $rad; $x++) {
      $dx = $x - $cx
      $dy = $y - $cy
      if (($dx * $dx + $dy * $dy) -le $r2) {
        PutPixel $bmp $x $y $a $r $g $b
      }
    }
  }
}

function DrawSky([System.Drawing.Bitmap]$bmp, [int]$r1, [int]$g1, [int]$b1, [int]$r2, [int]$g2, [int]$b2) {
  for ($y = 0; $y -lt $bmp.Height; $y++) {
    $t = $y / [double]($bmp.Height - 1)
    $r = [int]($r1 + ($r2 - $r1) * $t)
    $g = [int]($g1 + ($g2 - $g1) * $t)
    $b = [int]($b1 + ($b2 - $b1) * $t)
    for ($x = 0; $x -lt $bmp.Width; $x++) {
      PutPixel $bmp $x $y 255 $r $g $b
    }
  }
}

function DrawMountainBand([System.Drawing.Bitmap]$bmp, [int]$baseY, [int]$amp, [int]$step, [int]$a, [int]$r, [int]$g, [int]$b) {
  $pts = New-Object System.Collections.Generic.List[System.Int32]
  for ($x = 0; $x -le $bmp.Width + $step; $x += $step) {
    $n = [Math]::Sin($x * 0.011) * 0.5 + [Math]::Cos($x * 0.0065) * 0.5
    $y = [int]($baseY - $amp * (0.5 + 0.5 * $n))
    $pts.Add($y)
  }
  $i = 0
  for ($x = 0; $x -lt $bmp.Width; $x++) {
    $seg = [int]($x / $step)
    $seg = [Math]::Min($seg, $pts.Count - 2)
    $x0 = $seg * $step
    $x1 = ($seg + 1) * $step
    $y0 = $pts[$seg]
    $y1 = $pts[$seg + 1]
    $t = 0.0
    if ($x1 -ne $x0) { $t = ($x - $x0) / [double]($x1 - $x0) }
    $yTop = [int]($y0 + ($y1 - $y0) * $t)
    for ($y = $yTop; $y -lt $bmp.Height; $y++) {
      PutPixel $bmp $x $y $a $r $g $b
    }
  }
}

function DrawTreeLayer([System.Drawing.Bitmap]$bmp, [int]$yStart, [int]$count, [int]$trunkA, [int]$trunkR, [int]$trunkG, [int]$trunkB, [int]$leafA, [int]$leafR, [int]$leafG, [int]$leafB, [int]$sizeMin, [int]$sizeMax) {
  $rng = [System.Random]::new(1337 + $yStart + $count)
  for ($i = 0; $i -lt $count; $i++) {
    $x = [int](($i + 0.5) * ($bmp.Width / [double]$count)) + $rng.Next(-24, 25)
    $h = $rng.Next(120, 230)
    $w = $rng.Next(8, 18)
    FillRect $bmp ($x - [int]($w/2)) ($yStart - $h) $w $h $trunkA $trunkR $trunkG $trunkB

    $blobCount = $rng.Next(3, 6)
    for ($k = 0; $k -lt $blobCount; $k++) {
      $rad = $rng.Next($sizeMin, $sizeMax + 1)
      $bx = $x + $rng.Next(-28, 29)
      $by = ($yStart - $h) + $rng.Next(-6, 36)
      $lr = Clamp ($leafR + $rng.Next(-12, 13)) 0 255
      $lg = Clamp ($leafG + $rng.Next(-18, 19)) 0 255
      $lb = Clamp ($leafB + $rng.Next(-12, 13)) 0 255
      FillCircle $bmp $bx $by $rad $leafA $lr $lg $lb
    }
  }
}

function BlendSeamX([System.Drawing.Bitmap]$bmp, [int]$band = 28) {
  $w = $bmp.Width; $h = $bmp.Height
  for ($x = 0; $x -lt $band; $x++) {
    $rx = $w - $band + $x
    for ($y = 0; $y -lt $h; $y++) {
      $l = $bmp.GetPixel($x, $y)
      $r = $bmp.GetPixel($rx, $y)
      $mix = [System.Drawing.Color]::FromArgb(
        [int](($l.A + $r.A) / 2),
        [int](($l.R + $r.R) / 2),
        [int](($l.G + $r.G) / 2),
        [int](($l.B + $r.B) / 2)
      )
      $bmp.SetPixel($x, $y, $mix)
      $bmp.SetPixel($rx, $y, $mix)
    }
  }
}

$far = NewLayer
$mid = NewLayer
$near = NewLayer

# FAR: bright sky + hazy mountain silhouettes
DrawSky $far 122 200 255 50 126 210
DrawMountainBand $far 340 120 80 120 86 138 193
DrawMountainBand $far 390 80 64 150 72 119 171
for ($y = 360; $y -lt $H; $y++) {
  for ($x = 0; $x -lt $W; $x++) {
    PutPixel $far $x $y 0 0 0 0
  }
}

# MID: distant tree wall
DrawTreeLayer $mid 420 22 120 66 84 58 150 78 150 84 28 44
for ($y = 460; $y -lt $H; $y++) {
  for ($x = 0; $x -lt $W; $x++) { PutPixel $mid $x $y 0 0 0 0 }
}

# NEAR: closer foliage/trunks kept low for combat readability
DrawTreeLayer $near 505 15 170 72 52 38 210 96 170 92 34 54
for ($y = 0; $y -lt 360; $y++) {
  for ($x = 0; $x -lt $W; $x++) { PutPixel $near $x $y 0 0 0 0 }
}

BlendSeamX $far 32
BlendSeamX $mid 32
BlendSeamX $near 32

$far.Save((Join-Path $outDir "far.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$mid.Save((Join-Path $outDir "mid.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$near.Save((Join-Path $outDir "near.png"), [System.Drawing.Imaging.ImageFormat]::Png)

$far.Dispose(); $mid.Dispose(); $near.Dispose()
Write-Host "Wrote vibrant forest parallax set to assets/parallax"
