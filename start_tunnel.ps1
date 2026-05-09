Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  🚀 AETERNA: Запуск туннеля для тестирования на телефоне" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Чтобы авторизация через Supabase работала с телефона, вам необходимо:" -ForegroundColor Yellow
Write-Host "1. Открыть панель Supabase (Authentication -> URL Configuration)" -ForegroundColor White
Write-Host "2. В раздел 'Redirect URLs' добавить: https://*.pinggy.link/*" -ForegroundColor White
Write-Host ""
Write-Host "Убедитесь, что у вас запущены:" -ForegroundColor Yellow
Write-Host "✅ Backend (порт 8000)" -ForegroundColor White
Write-Host "✅ Frontend (порт 3000)" -ForegroundColor White
Write-Host ""
Write-Host "Нажмите любую клавишу для генерации QR-кода..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "Подключение туннеля..." -ForegroundColor Green
ssh -p 443 -R0:localhost:3000 qr@a.pinggy.io
