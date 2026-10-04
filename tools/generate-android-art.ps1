param([Parameter(Mandatory = $true)][string]$Source)

Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
$resRoot = Join-Path $projectRoot "android/app/src/main/res"
$sourceImage = [System.Drawing.Image]::FromFile((Resolve-Path $Source))

function New-Canvas([int]$width, [int]$height) {
  return [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
}

function Configure-Graphics($graphics) {
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
}

function Save-Icon([string]$path, [int]$size, [double]$margin = 0) {
  $bitmap = New-Canvas $size $size
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  Configure-Graphics $graphics
  $graphics.Clear([System.Drawing.Color]::FromArgb(255, 4, 15, 35))
  $inset = [int]($size * $margin)
  $graphics.DrawImage($sourceImage, $inset, $inset, $size - 2 * $inset, $size - 2 * $inset)
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

function Save-Splash([string]$path, [int]$width, [int]$height) {
  $bitmap = New-Canvas $width $height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  Configure-Graphics $graphics
  $rect = [System.Drawing.Rectangle]::new(0, 0, $width, $height)
  $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    $rect,
    [System.Drawing.Color]::FromArgb(255, 3, 10, 24),
    [System.Drawing.Color]::FromArgb(255, 5, 31, 58),
    90
  )
  $graphics.FillRectangle($brush, $rect)
  $iconSize = [int]([Math]::Min($width, $height) * 0.34)
  $iconX = [int](($width - $iconSize) / 2)
  $iconY = [int](($height - $iconSize) / 2 - $iconSize * 0.18)
  $graphics.DrawImage($sourceImage, $iconX, $iconY, $iconSize, $iconSize)
  $fontSize = [Math]::Max(16, [int]($iconSize * 0.13))
  $font = [System.Drawing.Font]::new("Segoe UI", $fontSize, [System.Drawing.FontStyle]::Bold)
  $subFont = [System.Drawing.Font]::new("Segoe UI", [Math]::Max(9, [int]($fontSize * 0.43)), [System.Drawing.FontStyle]::Regular)
  $center = [System.Drawing.StringFormat]::new()
  $center.Alignment = [System.Drawing.StringAlignment]::Center
  $titleBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 224, 245, 255))
  $subBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 56, 189, 248))
  $graphics.DrawString("KuKirin Tuner", $font, $titleBrush, [float]($width / 2), [float]($iconY + $iconSize + $fontSize * 0.35), $center)
  $graphics.DrawString("OFFLINE GARAGE", $subFont, $subBrush, [float]($width / 2), [float]($iconY + $iconSize + $fontSize * 1.65), $center)
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $brush.Dispose(); $font.Dispose(); $subFont.Dispose(); $center.Dispose(); $titleBrush.Dispose(); $subBrush.Dispose()
  $graphics.Dispose(); $bitmap.Dispose()
}

$densities = @{
  "mdpi" = 48; "hdpi" = 72; "xhdpi" = 96; "xxhdpi" = 144; "xxxhdpi" = 192
}
foreach ($density in $densities.Keys) {
  $dir = Join-Path $resRoot "mipmap-$density"
  Save-Icon (Join-Path $dir "ic_launcher.png") $densities[$density]
  Save-Icon (Join-Path $dir "ic_launcher_round.png") $densities[$density]
  Save-Icon (Join-Path $dir "ic_launcher_foreground.png") ([int]($densities[$density] * 2.25)) 0.08
}

$splashes = @{
  "drawable/splash.png" = @(480, 320)
  "drawable-land-mdpi/splash.png" = @(480, 320)
  "drawable-land-hdpi/splash.png" = @(800, 480)
  "drawable-land-xhdpi/splash.png" = @(1280, 720)
  "drawable-land-xxhdpi/splash.png" = @(1600, 960)
  "drawable-land-xxxhdpi/splash.png" = @(1920, 1280)
  "drawable-port-mdpi/splash.png" = @(320, 480)
  "drawable-port-hdpi/splash.png" = @(480, 800)
  "drawable-port-xhdpi/splash.png" = @(720, 1280)
  "drawable-port-xxhdpi/splash.png" = @(960, 1600)
  "drawable-port-xxxhdpi/splash.png" = @(1280, 1920)
}
foreach ($entry in $splashes.GetEnumerator()) {
  Save-Splash (Join-Path $resRoot $entry.Key) $entry.Value[0] $entry.Value[1]
}

$sourceImage.Dispose()
