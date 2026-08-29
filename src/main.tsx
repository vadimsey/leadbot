import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Bell, Bot, BookOpen, ChevronRight, CircleHelp, Command, Crown, Gauge, LayoutDashboard, MessageSquareText, MoreHorizontal, Plus, Search, Send, Sparkles, Users, WandSparkles } from 'lucide-react'
import './styles.css'

type Tab = 'dashboard' | 'inbox' | 'bot' | 'knowledge' | 'more'
type LeadState = 'Новая' | 'В работе' | 'Закрыта'
type Lead = { id: number; name: string; handle: string; message: string; time: string; state: LeadState; avatar: string }

declare global { interface Window { Telegram?: { WebApp?: { ready: () => void; expand: () => void; HapticFeedback?: { impactOccurred: (type: 'light' | 'medium') => void } } } } }

const initialLeads: Lead[] = []

const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Обзор', icon: LayoutDashboard }, { id: 'inbox', label: 'Заявки', icon: MessageSquareText }, { id: 'bot', label: 'Бот', icon: Bot }, { id: 'knowledge', label: 'База', icon: BookOpen }, { id: 'more', label: 'Ещё', icon: MoreHorizontal },
]

function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [leads, setLeads] = useState(initialLeads)
  const [connection, setConnection] = useState<{ configured: boolean; botUsername: string | null }>({ configured: false, botUsername: null })
  const [toast, setToast] = useState('')
  const [testMessage, setTestMessage] = useState('')
  const [testReply, setTestReply] = useState('')
  const [articles, setArticles] = useState<string[]>(() => JSON.parse(localStorage.getItem('leadbot-knowledge') || '[]'))
  const newLeads = useMemo(() => leads.filter(l => l.state === 'Новая').length, [leads])
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400) }
  const haptic = () => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light')
  const moveLead = (id: number) => { haptic(); setLeads(items => items.map(item => item.id === id ? { ...item, state: item.state === 'Новая' ? 'В работе' : 'Закрыта' } : item)); notify('Статус заявки обновлён') }

  useEffect(() => { window.Telegram?.WebApp?.ready(); window.Telegram?.WebApp?.expand(); fetch('/api/telegram').then(r => r.json()).then(setConnection).catch(() => setConnection({ configured: false, botUsername: null })) }, [])
  useEffect(() => { localStorage.setItem('leadbot-knowledge', JSON.stringify(articles)) }, [articles])

  return <main className="app">
    <header className="topbar"><button className="wordmark" onClick={() => setTab('dashboard')}><span>l</span>leadbot</button><div className="header-actions"><button className="round-button" onClick={() => notify('Новых уведомлений нет')} aria-label="Уведомления"><Bell size={16}/></button><button className="profile">АС</button></div></header>
    <section className="page">
      {tab === 'dashboard' && <Dashboard connected={connection.configured} leads={leads} newLeads={newLeads} onTab={setTab} />}
      {tab === 'inbox' && <Inbox leads={leads} onMove={moveLead} />}
      {tab === 'bot' && <BotStudio connected={connection.configured} username={connection.botUsername} testMessage={testMessage} setTestMessage={setTestMessage} reply={testReply} setReply={setTestReply} notify={notify} />}
      {tab === 'knowledge' && <Knowledge articles={articles} setArticles={setArticles} notify={notify} />}
      {tab === 'more' && <More notify={notify} />}
    </section>
    <nav className="dock">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? 'nav-item is-active' : 'nav-item'} onClick={() => { haptic(); setTab(id) }}><span className="nav-icon"><Icon size={17}/>{id === 'inbox' && newLeads > 0 && <b>{newLeads}</b>}</span><small>{label}</small></button>)}</nav>
    {toast && <div className="toast"><Sparkles size={13}/>{toast}</div>}
  </main>
}

function Dashboard({ connected, leads, newLeads, onTab }: { connected: boolean; leads: Lead[]; newLeads: number; onTab: (tab: Tab) => void }) {
  return <><section className="hero"><div className="hero-grid"/><div className="hero-orb"/><div className="hero-top"><span className="live"><i className={connected ? '' : 'off'}/>{connected ? 'LIVE · БОТ НА СВЯЗИ' : 'БОТ НЕ ПОДКЛЮЧЕН'}</span><button className="dots"><MoreHorizontal size={17}/></button></div><div className="hero-copy"><p className="kicker">LEAD COMMAND CENTER</p><h1>{connected ? <>Диалоги,<br/><em>которые</em> продают.</> : <>Твой бот<br/><em>почти</em> готов.</>}</h1><p>{connected ? 'Бот отвечает, квалифицирует и передаёт только тёплые заявки.' : 'Добавь токен бота в Vercel — и Leadbot начнёт отвечать клиентам.'}</p></div><button className={connected ? 'power is-on' : 'power'} onClick={() => onTab('bot')}><span>{connected ? 'Бот отвечает в Telegram' : 'Подключить Telegram-бота'}</span><i>{connected ? 'II' : '▶'}</i></button></section>
    <section className="metrics"><button onClick={() => onTab('inbox')} className="metric metric-leads"><span>НОВЫЕ ЗАЯВКИ</span><strong>0{newLeads}</strong><small>{newLeads ? 'ждут твоего ответа' : 'появятся после запуска'} <ChevronRight size={13}/></small><div className="metric-lines"/></button><div className="metric"><span>ДИАЛОГОВ СЕГОДНЯ</span><strong>0</strong><small className="trend">ожидаем первое сообщение</small><div className="pulse-bars"><i/><i/><i/><i/><i/></div></div></section>
    <section className="section-title"><div><p className="kicker">ПРИОРИТЕТ</p><h2>Свежие заявки</h2></div><button onClick={() => onTab('inbox')}>Все <ChevronRight size={14}/></button></section>
    {leads.length ? <div className="lead-list">{leads.slice(0, 3).map(lead => <LeadCard key={lead.id} lead={lead}/>)}</div> : <button className="empty-state" onClick={() => onTab('bot')}><span><Bot size={18}/></span><div><strong>Здесь появятся первые заявки</strong><p>Подключи бота, затем отправь ему /start для проверки.</p></div><ChevronRight size={16}/></button>}
    <button className="insight" onClick={() => onTab('knowledge')}><span><WandSparkles size={18}/></span><div><small>СЛЕДУЮЩИЙ ШАГ</small><strong>{connected ? 'Добавь ответы про цены — бот будет закрывать больше вопросов.' : 'Подготовь базу знаний до запуска бота.'}</strong></div><ChevronRight size={16}/></button>
  </>
}

function LeadCard({ lead, action }: { lead: Lead; action?: () => void }) { return <article className="lead-card"><span className="avatar-block">{lead.avatar}</span><div className="lead-content"><div><strong>{lead.name}</strong><time>{lead.time}</time></div><p>{lead.message}</p><span className={`state state-${lead.state.replace(' ', '-')}`}>{lead.state}</span></div>{action && <button className="claim" onClick={action}>{lead.state === 'Новая' ? 'Взять' : 'Готово'}</button>}</article> }

function Inbox({ leads, onMove }: { leads: Lead[]; onMove: (id: number) => void }) { const [filter, setFilter] = useState('Все'); const shown = filter === 'Все' ? leads : leads.filter(l => l.state === filter); return <><section className="page-heading"><p className="kicker">INBOX / {String(leads.length).padStart(2, '0')}</p><h1>Тёплые<br/>диалоги.</h1><p>Клиенты, которым бот уже помог разобраться.</p></section><div className="filters">{['Все', 'Новая', 'В работе', 'Закрыта'].map(item => <button className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div>{shown.length ? <div className="lead-list full">{shown.map(lead => <LeadCard key={lead.id} lead={lead} action={() => onMove(lead.id)}/>)}</div> : <div className="inbox-empty"><MessageSquareText size={24}/><strong>Новых диалогов пока нет</strong><p>Когда клиент заинтересуется ценой или записью, заявка появится здесь.</p></div>}</> }

function BotStudio({ connected, username, testMessage, setTestMessage, reply, setReply, notify }: { connected: boolean; username: string | null; testMessage: string; setTestMessage: (v: string) => void; reply: string; setReply: (v: string) => void; notify: (s: string) => void }) { const test = () => { if (!testMessage.trim()) return notify('Напиши вопрос клиента для проверки'); setReply('Здравствуйте! Стоимость консультации — от 2 500 ₽. Напишите, какая услуга вас интересует, и я сориентирую точнее.'); notify('Сценарий проверен') }; return <><section className="page-heading"><p className="kicker">BOT STUDIO</p><h1>Тон<br/>разговора.</h1><p>Настрой, как Leadbot общается с твоими клиентами.</p></section><section className="bot-identity"><div className="bot-glyph"><Bot size={24}/></div><div><strong>{username ? `@${username.replace('@', '')}` : 'Telegram-бот не подключен'}</strong><small>{connected ? 'Webhook активен на Vercel' : 'Добавь TELEGRAM_BOT_TOKEN в Vercel'}</small></div><span className={connected ? 'connection-dot connected' : 'connection-dot'}/></section>{!connected && <button className="setup-card" onClick={() => window.open('https://t.me/BotFather', '_blank')}><Command size={18}/><div><strong>Создать бота в BotFather</strong><p>После этого добавь токен в Environment Variables Vercel.</p></div><ChevronRight size={16}/></button>}<section className="control-grid"><button><span>01</span><div><strong>Первое сообщение</strong><small>Бот отвечает на /start</small></div><ChevronRight size={16}/></button><button><span>02</span><div><strong>Тёплая заявка</strong><small>Цена, запись или желание купить</small></div><ChevronRight size={16}/></button></section><section className="test-console"><div><p className="kicker">ЛОКАЛЬНАЯ ПРОВЕРКА</p><h2>Проверь ответ</h2></div>{testMessage && <div className="chat-bubble client">{testMessage}</div>}{reply && <div className="chat-bubble agent">{reply}</div>}<div className="test-input"><input value={testMessage} onChange={e => setTestMessage(e.target.value)} placeholder="Например: сколько стоит консультация?"/><button onClick={test} aria-label="Проверить"><Send size={16}/></button></div></section></> }

function Knowledge({ articles, setArticles, notify }: { articles: string[]; setArticles: (items: string[]) => void; notify: (s: string) => void }) { const [creating, setCreating] = useState(false); const [title, setTitle] = useState(''); const add = () => { if (!title.trim()) return; setArticles([...articles, title.trim()]); setTitle(''); setCreating(false); notify('Материал добавлен в базу') }; return <><section className="page-heading"><p className="kicker">KNOWLEDGE CORE</p><h1>Научи<br/>бота.</h1><p>Ответы из этих материалов Leadbot использует в чатах.</p></section><section className="knowledge-score"><Sparkles size={20}/><div><strong>86% вопросов закрыты</strong><p>База знаний работает уверенно.</p></div><span>+12%</span></section><div className="article-list">{articles.map((article, index) => <button key={article}><span>0{index + 1}</span><strong>{article}</strong><ChevronRight size={16}/></button>)}</div>{creating ? <div className="article-form"><input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Например: Доставка и оплата"/><button onClick={add}>Добавить</button></div> : <button className="add-knowledge" onClick={() => setCreating(true)}><Plus size={16}/>Добавить материал</button>}</> }

function More({ notify }: { notify: (s: string) => void }) { return <><section className="page-heading"><p className="kicker">WORKSPACE</p><h1>Твой<br/>Leadbot.</h1><p>Управление доступом, тарифом и интеграциями.</p></section><section className="plan-card"><div><span>ТЕКУЩИЙ ТАРИФ</span><strong>Free</strong><p>Подключи бота и проверь первые диалоги.</p></div><Crown size={24}/><button onClick={() => notify('Тарифы появятся после запуска')}>Тарифы</button></section><div className="menu-list"><button><Users size={16}/><span>Команда</span><ChevronRight size={16}/></button><button><Bell size={16}/><span>Уведомления</span><ChevronRight size={16}/></button><button><CircleHelp size={16}/><span>Поддержка</span><ChevronRight size={16}/></button></div></> }

createRoot(document.getElementById('root')!).render(<App />)
