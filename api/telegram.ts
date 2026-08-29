type TelegramMessage = { message_id: number; text?: string; chat: { id: number; first_name?: string; username?: string } }
type TelegramUpdate = { message?: TelegramMessage; callback_query?: { id: string; data?: string; message?: { chat: { id: number } } } }

const telegram = async (token: string, method: string, payload: Record<string, unknown>) => {
  await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
}

const commandReply = (text: string) => {
  const normalized = text.toLowerCase().split(' ')[0].replace(/@\w+$/, '')
  if (normalized === '/help') return 'Я могу подсказать по услугам, стоимости и записи. Просто напишите свой вопрос — отвечу сразу.'
  if (normalized === '/status') return 'Я на связи и отвечаю на сообщения. Если вам нужна запись или консультация, напишите, что вас интересует.'
  if (normalized === '/prices' || normalized === '/price') return 'Стоимость консультации — от 2 500 ₽. Напишите, какая услуга вас интересует, и я сориентирую точнее.'
  return null
}

const smartReply = (text: string) => {
  const value = text.toLowerCase()
  if (/цен|стоим|прайс|сколько/.test(value)) return 'Стоимость консультации — от 2 500 ₽. Напишите, какая услуга вас интересует, и я сориентирую точнее.'
  if (/запис|встрет|время|завтра/.test(value)) return 'Конечно, помогу с записью. Напишите, пожалуйста, удобный день и время — передам заявку Анне.'
  if (/услуг|делаете|можете/.test(value)) return 'Расскажу! Мы проводим консультации и сопровождаем клиентов. Напишите, с какой задачей вы пришли, чтобы подсказать подходящий формат.'
  return 'Здравствуйте! Я помощник студии Анны. Подскажу по услугам, стоимости и записи — что вас интересует?'
}

export default async function handler(req: any, res: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (req.method !== 'POST') return res.status(200).json({ ok: true, configured: Boolean(token), botUsername: process.env.TELEGRAM_BOT_USERNAME || null })
  if (!token) return res.status(500).json({ ok: false, error: 'TELEGRAM_BOT_TOKEN is not configured' })
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (secret && req.headers['x-telegram-bot-api-secret-token'] !== secret) return res.status(401).json({ ok: false })
  const update = req.body as TelegramUpdate
  const callback = update.callback_query
  if (callback?.data && callback.message) {
    const answer = callback.data === 'prices'
      ? 'Стоимость консультации — от 2 500 ₽. Напишите, какая услуга вас интересует, и я сориентирую точнее.'
      : 'Отлично! Напишите, пожалуйста, удобный день и время — я передам заявку Анне.'
    await telegram(token, 'answerCallbackQuery', { callback_query_id: callback.id })
    await telegram(token, 'sendMessage', { chat_id: callback.message.chat.id, text: answer })
    return res.status(200).json({ ok: true })
  }
  const message = update.message
  if (!message?.text) return res.status(200).json({ ok: true })
  const appUrl = process.env.WEB_APP_URL || `https://${req.headers['x-forwarded-host'] || req.headers.host}`
  const start = message.text.startsWith('/start')
  const answer = start
    ? '<b>Привет! Я Leadbot ✦</b>\n\nОтвечу на вопросы, помогу с записью и передам владельцу важную заявку.\n\nНапишите, что вас интересует — я на связи.'
    : commandReply(message.text) || smartReply(message.text)
  const keyboard = start ? { inline_keyboard: [[{ text: 'Открыть кабинет', web_app: { url: appUrl } }], [{ text: 'Узнать стоимость', callback_data: 'prices' }, { text: 'Записаться', callback_data: 'booking' }]] } : undefined
  await telegram(token, 'sendMessage', { chat_id: message.chat.id, text: answer, parse_mode: 'HTML', reply_markup: keyboard })
  const warm = /цен|стоим|прайс|сколько|запис|купить|заказ|завтра/.test(message.text.toLowerCase())
  if (warm && process.env.OWNER_TELEGRAM_ID) await telegram(token, 'sendMessage', { chat_id: process.env.OWNER_TELEGRAM_ID, text: `✦ <b>Новая тёплая заявка</b>\n\n${message.chat.first_name || 'Клиент'} ${message.chat.username ? `(@${message.chat.username})` : ''}\n${message.text}`, parse_mode: 'HTML' })
  return res.status(200).json({ ok: true })
}
