import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Bell, Bot, BookOpen, ChevronRight, CircleHelp, Command, Crown, Gauge, LayoutDashboard, MessageSquareText, MoreHorizontal, Plus, Search, Send, Sparkles, Users, WandSparkles } from 'lucide-react'
import './styles.css'

type Tab = 'dashboard' | 'inbox' | 'bot' | 'knowledge' | 'more'
type LeadState = 'Новая' | 'В работе' | 'Закрыта'
type Lead = { id: number; name: string; handle: string; message: string; time: string; state: LeadState; avatar: string }

declare global { interface Window { Telegram?: { WebApp?: { ready: () => void; expand: () => void; HapticFeedback?: { impactOccurred: (type: 'light' | 'medium') => void } } } } }

const seedLeads: Lead[] = [
  { id: 1, name: 'Анна Соколова', handle: '@annasokolova', message: 'Подскажите, можно ли записаться на завтра?', time: '12:42', state: 'Новая', avatar: 'АС' },
  { id: 2, name: 'Михаил Петров', handle: '@mishapetrov', message: 'Сколько стоит консультация?', time: '11:18', state: 'В работе', avatar: 'МП' },
  { id: 3, name: 'Ольга М.', handle: '@olga_m', message: 'Какие услуги вы оказываете?', time: 'Вчера', state: 'Закрыта', avatar: 'ОМ' },
]

const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Обзор', icon: LayoutDashboard }, { id: 'inbox', label: 'Заявки', icon: MessageSquareText }, { id: 'bot', label: 'Бот', icon: Bot }, { id: 'knowledge', label: 'База', icon: BookOpen }, { id: 'more', label: 'Ещё', icon: MoreHorizontal },
]

function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [botEnabled, setBotEnabled] = useState(true)
  const [leads, setLeads] = useState(seedLeads)
  const [toast, setToast] = useState('')
  const [testMessage, setTestMessage] = useState('Сколько стоит консультация?')
  const [testReply, setTestReply] = useState('')
  const [articles, setArticles] = useState(['Услуги и стоимость', 'Запись и перенос', 'Как проходит консультация'])
  const newLeads = useMemo(() => leads.filter(l => l.state === 'Новая').length, [leads])
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400) }
  const haptic = () => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light')
  const moveLead = (id: number) => { haptic(); setLeads(items => items.map(item => item.id === id ? { ...item, state: item.state === 'Новая' ? 'В работе' : 'Закрыта' } : item)); notify('Статус заявки обновлён') }

  useEffect(() => { window.Telegram?.WebApp?.ready(); window.Telegram?.WebApp?.expand() }, [])

  return <main className="app">
    <header className="topbar"><button className="wordmark" onClick={() => setTab('dashboard')}><span>l</span>leadbot</button><div className="header-actions"><button className="round-button" onClick={() => notify('Новых уведомлений нет')} aria-label="Уведомления"><Bell size={16}/></button><button className="profile">АС</button></div></header>
    <section className="page">
      {tab === 'dashboard' && <Dashboard enabled={botEnabled} setEnabled={setBotEnabled} leads={leads} newLeads={newLeads} onTab={setTab} />}
      {tab === 'inbox' && <Inbox leads={leads} onMove={moveLead} />}
      {tab === 'bot' && <BotStudio enabled={botEnabled} setEnabled={setBotEnabled} testMessage={testMessage} setTestMessage={setTestMessage} reply={testReply} setReply={setTestReply} notify={notify} />}
      {tab === 'knowledge' && <Knowledge articles={articles} setArticles={setArticles} notify={notify} />}
      {tab === 'more' && <More notify={notify} />}
    </section>
    <nav className="dock">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? 'nav-item is-active' : 'nav-item'} onClick={() => { haptic(); setTab(id) }}><span className="nav-icon"><Icon size={17}/>{id === 'inbox' && newLeads > 0 && <b>{newLeads}</b>}</span><small>{label}</small></button>)}</nav>
    {toast && <div className="toast"><Sparkles size={13}/>{toast}</div>}
  </main>
}

function Dashboard({ enabled, setEnabled, leads, newLeads, onTab }: { enabled: boolean; setEnabled: (value: boolean) => void; leads: Lead[]; newLeads: number; onTab: (tab: Tab) => void }) {
  return <><section className="hero"><div className="hero-grid"/><div className="hero-orb"/><div className="hero-top"><span className="live"><i className={enabled ? '' : 'off'}/>{enabled ? 'LIVE · БОТ НА СВЯЗИ' : 'ПАУЗА'}</span><button className="dots"><MoreHorizontal size={17}/></button></div><div className="hero-copy"><p className="kicker">LEAD COMMAND CENTER</p><h1>Диалоги,<br/><em>которые</em> продают.</h1><p>Бот отвечает, квалифицирует и передаёт только тёплые заявки.</p></div><button className={enabled ? 'power is-on' : 'power'} onClick={() => setEnabled(!enabled)}><span>{enabled ? 'Автоответы включены' : 'Включить автоответы'}</span><i>{enabled ? 'II' : '▶'}</i></button></section>
    <section className="metrics"><button onClick={() => onTab('inbox')} className="metric metric-leads"><span>НОВЫЕ ЗАЯВКИ</span><strong>0{newLeads}</strong><small>ждут твоего ответа <ChevronRight size={13}/></small><div className="metric-lines"/></button><div className="metric"><span>ДИАЛОГОВ СЕГОДНЯ</span><strong>18</strong><small className="trend">↗ 38% к прошлой неделе</small><div className="pulse-bars"><i/><i/><i/><i/><i/></div></div></section>
    <section className="section-title"><div><p className="kicker">ПРИОРИТЕТ</p><h2>Свежие заявки</h2></div><button onClick={() => onTab('inbox')}>Все <ChevronRight size={14}/></button></section>
    <div className="lead-list">{leads.slice(0, 3).map(lead => <LeadCard key={lead.id} lead={lead}/>)}</div>
    <button className="insight" onClick={() => onTab('knowledge')}><span><WandSparkles size={18}/></span><div><small>ПОДСКАЗКА LEADBOT</small><strong>Добавь ответы про цены — бот будет закрывать больше вопросов.</strong></div><ChevronRight size={16}/></button>
  </>
}

function LeadCard({ lead, action }: { lead: Lead; action?: () => void }) { return <article className="lead-card"><span className="avatar-block">{lead.avatar}</span><div className="lead-content"><div><strong>{lead.name}</strong><time>{lead.time}</time></div><p>{lead.message}</p><span className={`state state-${lead.state.replace(' ', '-')}`}>{lead.state}</span></div>{action && <button className="claim" onClick={action}>{lead.state === 'Новая' ? 'Взять' : 'Готово'}</button>}</article> }

function Inbox({ leads, onMove }: { leads: Lead[]; onMove: (id: number) => void }) { const [filter, setFilter] = useState('Все'); const shown = filter === 'Все' ? leads : leads.filter(l => l.state === filter); return <><section className="page-heading"><p className="kicker">INBOX / 03</p><h1>Тёплые<br/>диалоги.</h1><p>Клиенты, которым бот уже помог разобраться.</p></section><div className="filters">{['Все', 'Новая', 'В работе', 'Закрыта'].map(item => <button className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div><div className="lead-list full">{shown.map(lead => <LeadCard key={lead.id} lead={lead} action={() => onMove(lead.id)}/>)}</div></> }

function BotStudio({ enabled, setEnabled, testMessage, setTestMessage, reply, setReply, notify }: { enabled: boolean; setEnabled: (value: boolean) => void; testMessage: string; setTestMessage: (v: string) => void; reply: string; setReply: (v: string) => void; notify: (s: string) => void }) { const test = () => { setReply('Здравствуйте! Стоимость консультации — от 2 500 ₽. Могу подсказать свободные окна на этой неделе.'); notify('Сценарий проверен') }; return <><section className="page-heading"><p className="kicker">BOT STUDIO</p><h1>Тон<br/>разговора.</h1><p>Настрой, как Leadbot общается с твоими клиентами.</p></section><section className="bot-identity"><div className="bot-glyph"><Bot size={24}/></div><div><strong>@anna_studio_bot</strong><small>{enabled ? 'Работает в Telegram' : 'Автоответы выключены'}</small></div><button className={enabled ? 'mini-switch active' : 'mini-switch'} onClick={() => setEnabled(!enabled)}><i/></button></section><section className="control-grid"><button><span>01</span><div><strong>Первое сообщение</strong><small>Тёплое и короткое приветствие</small></div><ChevronRight size={16}/></button><button><span>02</span><div><strong>Когда звать тебя</strong><small>Запись, цена, желание купить</small></div><ChevronRight size={16}/></button></section><section className="test-console"><div><p className="kicker">LIVE PREVIEW</p><h2>Проверь ответ</h2></div><div className="chat-bubble client">{testMessage}</div>{reply && <div className="chat-bubble agent">{reply}</div>}<div className="test-input"><input value={testMessage} onChange={e => setTestMessage(e.target.value)} /><button onClick={test} aria-label="Проверить"><Send size={16}/></button></div></section></> }

function Knowledge({ articles, setArticles, notify }: { articles: string[]; setArticles: (items: string[]) => void; notify: (s: string) => void }) { const [creating, setCreating] = useState(false); const [title, setTitle] = useState(''); const add = () => { if (!title.trim()) return; setArticles([...articles, title.trim()]); setTitle(''); setCreating(false); notify('Материал добавлен в базу') }; return <><section className="page-heading"><p className="kicker">KNOWLEDGE CORE</p><h1>Научи<br/>бота.</h1><p>Ответы из этих материалов Leadbot использует в чатах.</p></section><section className="knowledge-score"><Sparkles size={20}/><div><strong>86% вопросов закрыты</strong><p>База знаний работает уверенно.</p></div><span>+12%</span></section><div className="article-list">{articles.map((article, index) => <button key={article}><span>0{index + 1}</span><strong>{article}</strong><ChevronRight size={16}/></button>)}</div>{creating ? <div className="article-form"><input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Например: Доставка и оплата"/><button onClick={add}>Добавить</button></div> : <button className="add-knowledge" onClick={() => setCreating(true)}><Plus size={16}/>Добавить материал</button>}</> }

function More({ notify }: { notify: (s: string) => void }) { return <><section className="page-heading"><p className="kicker">WORKSPACE</p><h1>Студия<br/>Анны.</h1><p>Управление доступом, тарифом и интеграциями.</p></section><section className="plan-card"><div><span>ТЕКУЩИЙ ТАРИФ</span><strong>Starter</strong><p>490 ₽ / месяц · 100 диалогов</p></div><Crown size={24}/><button onClick={() => notify('Тарифы появятся в следующем релизе')}>Изменить</button></section><div className="menu-list"><button><Users size={16}/><span>Команда</span><ChevronRight size={16}/></button><button><Bell size={16}/><span>Уведомления</span><ChevronRight size={16}/></button><button><CircleHelp size={16}/><span>Поддержка</span><ChevronRight size={16}/></button></div></> }

createRoot(document.getElementById('root')!).render(<App />)
