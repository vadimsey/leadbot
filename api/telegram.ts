type Chat = { id: number; first_name?: string; username?: string }
type TelegramMessage = { message_id: number; text?: string; chat: Chat }
type CallbackQuery = { id: string; data?: string; message?: { chat: Chat } }
type TelegramUpdate = { message?: TelegramMessage; callback_query?: CallbackQuery }

const telegram = async (token: string, method: string, payload: Record<string, unknown>) => {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(`Telegram ${method} failed`)
}

const menuKeyboard = (appUrl: string) => ({
  inline_keyboard: [
    [{ text: 'Открыть кабинет', web_app: { url: appUrl } }],
    [{ text: 'Узнать стоимость', callback_data: 'prices' }, { text: 'Записаться', callback_data: 'booking' }],
    [{ text: 'Что вы делаете?', callback_data: 'services' }],
  ],
})

const commandReply = (text: string) => {
  const command = text.toLowerCase().trim().split(' ')[0].replace(/@\w+$/, '')
  if (command === '/help') return 'Я подскажу по услугам, стоимости и записи. Просто напишите вопрос — отвечу сразу.'
  if (command === '/status') return 'Я на связи. Если хотите записаться или уточнить стоимость — напишите, что вас интересует.'
  if (command === '/price' || command === '/prices') return 'Стоимость консультации — от 2 500 ₽. Напишите, какая услуга вас интересует, и я сориентирую точнее.'
  if (command === '/menu') return 'Выберите, с чего начать:'
  return null
}

const smartReply = (text: string) => {
  const value = text.toLowerCase()
  if (/цен|стоим|прайс|сколько/.test(value)) return 'Стоимость консультации — от 2 500 ₽. Напишите, какая услуга вас интересует, и я сориентирую точнее.'
  if (/запис|встрет|время|завтра|свобод/.test(value)) return 'Помогу с записью. Напишите удобный день и время — я передам заявку владельцу.'
  if (/услуг|делаете|можете|помо/.test(value)) return 'Расскажу! Напишите, с какой задачей вы пришли, — я подскажу подходящий формат.'
  return 'Здравствуйте! Я Leadbot — помощник команды. Подскажу по услугам, стоимости и записи. Что вас интересует?'
}

const callbackReply: Record<string, string> = {
  prices: 'Стоимость консультации — от 2 500 ₽. Напишите, какая услуга вас интересует, и я сориентирую точнее.',
  booking: 'Отлично! Напишите, пожалуйста, удобный день и время — я передам заявку владельцу.',
  services: 'Мы помогаем с консультациями и сопровождением. Опишите вашу задачу — подскажем подходящий формат.',
}

export default async function handler(req: any, res: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (req.method !== 'POST') return res.status(200).json({ ok: true, configured: Boolean(token), botUsername: process.env.TELEGRAM_BOT_USERNAME || null })
  if (!token) return res.status(500).json({ ok: false, error: 'TELEGRAM_BOT_TOKEN is not configured' })
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (secret && req.headers['x-telegram-bot-api-secret-token'] !== secret) return res.status(401).json({ ok: false })

  const update = req.body as TelegramUpdate
  if (update.callback_query?.data && update.callback_query.message) {
    const callback = update.callback_query
    const text = callbackReply[callback.data] || 'Выберите, что вас интересует, — я помогу.'
    await telegram(token, 'answerCallbackQuery', { callback_query_id: callback.id })
    await telegram(token, 'sendMessage', { chat_id: callback.message.chat.id, text, reply_markup: menuKeyboard(process.env.WEB_APP_URL || `https://${req.headers['x-forwarded-host'] || req.headers.host}`) })
    return res.status(200).json({ ok: true })
  }

  const message = update.message
  if (!message?.text) return res.status(200).json({ ok: true })
  const appUrl = process.env.WEB_APP_URL || `https://${req.headers['x-forwarded-host'] || req.headers.host}`
  const isStart = message.text.startsWith('/start')
  const answer = isStart
    ? '<b>Привет! Я Leadbot ✦</b>\n\nОтвечу на вопросы, помогу с записью и передам владельцу важную заявку.\n\nНапишите, что вас интересует — я на связи.'
    : commandReply(message.text) || smartReply(message.text)
  const wantsMenu = isStart || message.text.startsWith('/menu')
  await telegram(token, 'sendMessage', { chat_id: message.chat.id, text: answer, parse_mode: isStart ? 'HTML' : undefined, reply_markup: wantsMenu ? menuKeyboard(appUrl) : undefined })

  const warm = /цен|стоим|прайс|сколько|запис|купить|заказ|завтра|свобод/.test(message.text.toLowerCase())
  if (warm && process.env.OWNER_TELEGRAM_ID) {
    const client = `${message.chat.first_name || 'Клиент'}${message.chat.username ? ` (@${message.chat.username})` : ''}`
    await telegram(token, 'sendMessage', { chat_id: process.env.OWNER_TELEGRAM_ID, text: `✦ <b>Тёплая заявка</b>\n\n${client}\n${message.text}`, parse_mode: 'HTML' })
  }
  return res.status(200).json({ ok: true })
}
