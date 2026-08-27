import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

type Tab = 'home' | 'bot' | 'leads' | 'knowledge' | 'more'
type Lead = { id: number; name: string; question: string; time: string; status: 'Новая' | 'В работе' | 'Закрыта' }

const initialLeads: Lead[] = [
  { id: 1, name: 'Анна Соколова', question: 'Сколько стоит консультация?', time: '12:42', status: 'Новая' },
  { id: 2, name: 'Михаил', question: 'Можно записаться на завтра?', time: '11:18', status: 'В работе' },
  { id: 3, name: 'Ольга М.', question: 'Какие услуги вы оказываете?', time: 'Вчера', status: 'Закрыта' },
]

function Icon({ name }: { name: string }) {
  const symbols: Record<string, string> = { home: '⌂', bot: '✦', leads: '◫', book: '▤', more: '•••', arrow: '↗', check: '✓', plus: '+', close: '×' }
  return <span className={`icon icon-${name}`} aria-hidden="true">{symbols[name]}</span>
}

function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [active, setActive] = useState(true)
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [notice, setNotice] = useState('')
  const [reply, setReply] = useState('')
  const [articles, setArticles] = useState(['Услуги и цены', 'График работы', 'Как проходит консультация'])
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    const tg = (window as Window & { Telegram?: { WebApp?: { ready(): void; expand(): void } } }).Telegram?.WebApp
    tg?.ready(); tg?.expand()
  }, [])

  const openCount = useMemo(() => leads.filter((lead) => lead.status === 'Новая').length, [leads])
  const toast = (text: string) => { setNotice(text); window.setTimeout(() => setNotice(''), 2600) }
  const addLead = () => {
    const name = reply.trim() || 'Тестовый клиент'
    setLeads([{ id: Date.now(), name, question: 'Хочу узнать подробнее о ваших услугах', time: 'сейчас', status: 'Новая' }, ...leads])
    setReply(''); toast('Тестовая заявка добавлена')
  }
  const nextLead = (id: number) => setLeads(leads.map(l => l.id === id ? { ...l, status: l.status === 'Новая' ? 'В работе' : 'Закрыта' } : l))

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark">L</span><span>leadbot</span></div>
      <button className="avatar" onClick={() => setTab('more')} aria-label="Открыть профиль">АС</button>
    </header>

    <section className="view">
      {tab === 'home' && <Home active={active} setActive={setActive} openCount={openCount} leads={leads} onGo={setTab} />}
      {tab === 'bot' && <Bot active={active} setActive={setActive} reply={reply} setReply={setReply} onTest={addLead} />}
      {tab === 'leads' && <Leads leads={leads} onNext={nextLead} />}
      {tab === 'knowledge' && <Knowledge articles={articles} addArticle={(a) => { setArticles([...articles, a]); setShowAdd(false); toast('Материал добавлен') }} showAdd={showAdd} setShowAdd={setShowAdd} />}
      {tab === 'more' && <More onToast={toast} />}
    </section>

    <nav className="tabbar" aria-label="Навигация">
      {([['home','Главная'], ['bot','Бот'], ['leads','Заявки'], ['knowledge','База'], ['more','Ещё']] as [Tab, string][]).map(([id, label]) =>
        <button key={id} className={tab === id ? 'tab active-tab' : 'tab'} onClick={() => setTab(id)}><Icon name={id === 'knowledge' ? 'book' : id} /><span>{label}</span>{id === 'leads' && openCount > 0 && <b>{openCount}</b>}</button>
      )}
    </nav>
    {notice && <div className="toast"><Icon name="check" />{notice}</div>}
  </main>
}

function Home({ active, setActive, openCount, leads, onGo }: { active: boolean; setActive: (v: boolean) => void; openCount: number; leads: Lead[]; onGo: (t: Tab) => void }) {
  return <>
    <div className="eyebrow">Четверг, 27 августа</div>
    <div className="headline-row"><div><h1>Добрый день, Анна</h1><p>Бот держит диалоги под контролем.</p></div><button className={active ? 'switch is-on' : 'switch'} onClick={() => setActive(!active)} aria-label="Включить бота"><i /></button></div>
    <section className="status-strip"><span className={active ? 'status-dot' : 'status-dot off'} /><div><strong>{active ? 'Бот на связи' : 'Бот выключен'}</strong><small>{active ? 'Отвечает клиентам в Telegram' : 'Автоответы приостановлены'}</small></div><button onClick={() => onGo('bot')}>Настроить <Icon name="arrow" /></button></section>
    <section className="metric-grid">
      <button className="metric lead-metric" onClick={() => onGo('leads')}><span>Новые заявки</span><strong>{openCount}</strong><small>за последние 7 дней <Icon name="arrow" /></small></button>
      <div className="metric"><span>Диалогов сегодня</span><strong>18</strong><small className="positive">+38% к прошлой неделе</small></div>
    </section>
    <section className="section-heading"><div><span className="eyebrow">ПОСЛЕДНИЕ</span><h2>Заявки</h2></div><button onClick={() => onGo('leads')}>Все <Icon name="arrow" /></button></section>
    <div className="list">{leads.slice(0, 3).map(lead => <LeadRow key={lead.id} lead={lead} />)}</div>
    <section className="tip"><span className="tip-star">✦</span><div><strong>Бот ответил на 86% вопросов</strong><p>Добавьте ответы на частые вопросы — это сделает его точнее.</p></div><button onClick={() => onGo('knowledge')}><Icon name="arrow" /></button></section>
  </>
}

function Bot({ active, setActive, reply, setReply, onTest }: { active: boolean; setActive: (v: boolean) => void; reply: string; setReply: (v: string) => void; onTest: () => void }) {
  return <><div className="eyebrow">ВАШ TELEGRAM-БОТ</div><h1>@anna_studio_bot</h1><p className="intro">Принимает сообщения, отвечает по базе знаний и передаёт интересные диалоги вам.</p>
    <section className="bot-card"><div className="bot-face">✦</div><div><strong>Анна — помощник студии</strong><p>Привет! Подскажу по услугам и записи.</p></div><button className={active ? 'switch is-on' : 'switch'} onClick={() => setActive(!active)}><i /></button></section>
    <section className="section-heading compact"><div><span className="eyebrow">ПОВЕДЕНИЕ</span><h2>Как работает</h2></div></section>
    <div className="setting-list"><Setting n="01" title="Первое сообщение" text="Отправляется сразу после обращения" /><Setting n="02" title="Ответы по базе знаний" text="3 материала подключено" /><Setting n="03" title="Передача заявки" text="Когда клиент хочет записаться или купить" /></div>
    <section className="test-panel"><span className="eyebrow">БЫСТРЫЙ ТЕСТ</span><h2>Проверьте сценарий</h2><p>Введите имя клиента — новая тестовая заявка появится в списке.</p><div><input value={reply} onChange={e => setReply(e.target.value)} placeholder="Имя клиента" /><button onClick={onTest}>Отправить</button></div></section>
  </>
}

function Setting({ n, title, text }: { n: string; title: string; text: string }) { return <button className="setting"><span>{n}</span><div><strong>{title}</strong><small>{text}</small></div><Icon name="arrow" /></button> }
function LeadRow({ lead, onNext }: { lead: Lead; onNext?: (id: number) => void }) { return <article className="lead-row"><div className="initials">{lead.name.split(' ').map(p => p[0]).join('').slice(0,2)}</div><div className="lead-copy"><div><strong>{lead.name}</strong><time>{lead.time}</time></div><p>{lead.question}</p><span className={`badge badge-${lead.status.replace(' ', '')}`}>{lead.status}</span></div>{onNext && <button className="row-action" onClick={() => onNext(lead.id)}>{lead.status === 'Новая' ? 'Взять' : 'Закрыть'}</button>}</article> }
function Leads({ leads, onNext }: { leads: Lead[]; onNext: (id: number) => void }) { return <><span className="eyebrow">ВХОДЯЩИЕ</span><h1>Заявки</h1><p className="intro">Все диалоги, где клиент готов к следующему шагу.</p><div className="filter-row"><button className="selected">Все <b>{leads.length}</b></button><button>Новые</button><button>В работе</button></div><div className="list lead-list">{leads.map(l => <LeadRow key={l.id} lead={l} onNext={onNext} />)}</div></> }
function Knowledge({ articles, addArticle, showAdd, setShowAdd }: { articles: string[]; addArticle: (a: string) => void; showAdd: boolean; setShowAdd: (v: boolean) => void }) { const [text, setText] = useState(''); return <><span className="eyebrow">ЧЕМУ УЧИТЬ БОТА</span><h1>База знаний</h1><p className="intro">Бот использует эти материалы, когда отвечает клиентам.</p><div className="knowledge-summary"><span>✦</span><div><strong>3 материала готовы</strong><p>Бот отвечает уверенно в 86% диалогов.</p></div></div><div className="article-list">{articles.map((a, i) => <button key={a} className="article"><span>0{i + 1}</span><strong>{a}</strong><Icon name="arrow" /></button>)}</div>{showAdd ? <div className="add-form"><input autoFocus value={text} onChange={e => setText(e.target.value)} placeholder="Например: Доставка и оплата" /><button onClick={() => text.trim() && addArticle(text.trim())}>Добавить</button></div> : <button className="add-button" onClick={() => setShowAdd(true)}><Icon name="plus" /> Добавить материал</button>}</> }
function More({ onToast }: { onToast: (s: string) => void }) { return <><span className="eyebrow">АККАУНТ</span><h1>Студия Анны</h1><section className="plan"><div><span className="eyebrow">ТЕКУЩИЙ ТАРИФ</span><h2>Starter</h2><p>490 ₽ / месяц · до 100 диалогов</p></div><button onClick={() => onToast('Тарифы будут доступны в следующей версии')}>Сменить</button></section><div className="setting-list"><Setting n="01" title="Уведомления" text="Telegram, моментально" /><Setting n="02" title="Пригласить коллегу" text="Доступ для команды" /><Setting n="03" title="Помощь" text="Написать в поддержку" /></div></> }

createRoot(document.getElementById('root')!).render(<App />)
