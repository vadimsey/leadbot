# Leadbot

Telegram Mini App and Vercel webhook for handling first customer messages.

## Connect the Telegram bot

1. In `@BotFather`, create a bot with `/newbot` and copy its token.
2. In Vercel open **Project → Settings → Environment Variables** and add every variable from `.env.example`.
3. Redeploy the project after adding the variables.
4. Register the webhook once in PowerShell (replace the values locally; never commit the token):

```powershell
$token = "YOUR_BOT_TOKEN"
$url = "https://your-project.vercel.app/api/telegram"
$secret = "YOUR_TELEGRAM_WEBHOOK_SECRET"

Invoke-RestMethod -Method Post -Uri "https://api.telegram.org/bot$token/setWebhook" -ContentType "application/json" -Body (@{url=$url;secret_token=$secret;allowed_updates=@("message","callback_query")} | ConvertTo-Json)
```

The bot responds to `/start`, `/help`, `/status`, `/price`, `/prices`, the start buttons, and common questions about cost or booking. Warm questions are forwarded to `OWNER_TELEGRAM_ID`.

## Commands and avatar

The bot supports `/start`, `/menu`, `/help`, `/status`, `/price`, and `/prices`. To make these commands visible in Telegram, send this request once after setting the token:

```powershell
Invoke-RestMethod -Method Post -Uri "https://api.telegram.org/bot$token/setMyCommands" -ContentType "application/json" -Body (@{commands=@(@{command='start';description='Начать разговор'},@{command='menu';description='Открыть меню'},@{command='price';description='Узнать стоимость'},@{command='help';description='Что умеет бот'},@{command='status';description='Проверить статус'})} | ConvertTo-Json -Depth 4)
```

Bot avatar: [`public/leadbot-avatar.svg`](public/leadbot-avatar.svg). Convert it to a 512×512 PNG before uploading it in `@BotFather` → `/mybots` → **Edit Bot** → **Edit Botpic**.
