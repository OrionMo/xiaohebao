import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  ArrowDown, BookOpen, Bus, CalendarBlank, CaretLeft, CaretRight, ChartDonut, Check,
  ForkKnife, GameController, GearSix, House, Lightbulb, NotePencil, Plus, ShieldCheck,
  ShoppingBag, Trash, User, Wallet,
} from "@phosphor-icons/react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { BottomSheet, KeyboardInput, KeyboardTextarea, MobileScroll, useKeyboard } from "./mobile";
import "./prototype.css";

type Tab = "home" | "add" | "analysis" | "profile";
type CategoryId = "food" | "transport" | "study" | "shopping" | "fun" | "other";
type Transaction = { id: string; amount: number; category: CategoryId; note: string; date: string };

const CATEGORY_META: Record<CategoryId, { label: string; color: string; soft: string; Icon: typeof ForkKnife }> = {
  food: { label: "餐饮", color: "#69a7ff", soft: "#eaf3ff", Icon: ForkKnife },
  transport: { label: "交通", color: "#42c99b", soft: "#e7f9f2", Icon: Bus },
  study: { label: "学习", color: "#9a86ef", soft: "#f0edff", Icon: BookOpen },
  shopping: { label: "购物", color: "#ff9e83", soft: "#fff0eb", Icon: ShoppingBag },
  fun: { label: "娱乐", color: "#f2bd55", soft: "#fff6df", Icon: GameController },
  other: { label: "其他", color: "#8fa1b7", soft: "#eef2f6", Icon: Plus },
};
const CATEGORIES = Object.keys(CATEGORY_META) as CategoryId[];
const DEFAULT_MONTHLY_BUDGET = 2000;
const DEMO_TRANSACTIONS: Transaction[] = [
  { id: "demo-1", amount: 26, category: "food", note: "食堂午餐", date: "2026-10-02" },
  { id: "demo-2", amount: 150, category: "study", note: "专业课教材", date: "2026-10-02" },
  { id: "demo-3", amount: 18, category: "transport", note: "地铁出行", date: "2026-10-01" },
  { id: "demo-4", amount: 120, category: "shopping", note: "生活用品", date: "2026-10-01" },
  { id: "demo-5", amount: 130, category: "fun", note: "周末聚会", date: "2026-10-01" },
  { id: "demo-6", amount: 294, category: "food", note: "本月餐饮", date: "2026-10-01" },
  { id: "demo-7", amount: 62, category: "transport", note: "公交与共享单车", date: "2026-10-01" },
  { id: "demo-8", amount: 60, category: "other", note: "日常杂项", date: "2026-10-01" },
];
const DEFAULT_BUDGETS: Record<CategoryId, number> = { food: 600, transport: 200, study: 300, shopping: 300, fun: 400, other: 200 };

function readStored<T>(key: string, fallback: T): T {
  try { const value = window.localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}
function currency(value: number) { return `¥${Math.round(value).toLocaleString("zh-CN")}`; }
function monthKey(date: string) { return date.slice(0, 7); }
function shiftMonth(value: string, amount: number) {
  const [year, month] = value.split("-").map(Number);
  const next = new Date(year, month - 1 + amount, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}
function monthTitle(value: string) { const [year, month] = value.split("-").map(Number); return `${year}年${month}月`; }
function shortDate(value: string) { const date = new Date(`${value}T12:00:00`); return `${date.getMonth() + 1}月${date.getDate()}日`; }
function resetDeviceViewport() {
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
    const screen = document.querySelector<HTMLElement>("[data-phone-screen]");
    if (screen) screen.scrollTop = 0;
  }));
}

export default function Prototype() {
  const keyboard = useKeyboard();
  const [tab, setTab] = useState<Tab>(() => {
    const requested = new URLSearchParams(window.location.search).get("screen");
    return requested === "add" || requested === "analysis" || requested === "profile" ? requested : "home";
  });
  const [month, setMonth] = useState("2026-10");
  const [transactions, setTransactions] = useState<Transaction[]>(() => readStored("glass-finance-transactions", DEMO_TRANSACTIONS));
  const [budgets, setBudgets] = useState<Record<CategoryId, number>>(() => readStored("glass-finance-budgets", DEFAULT_BUDGETS));
  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => readStored("glass-finance-monthly-budget", DEFAULT_MONTHLY_BUDGET));
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryId>("food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("2026-10-02");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => { window.localStorage.setItem("glass-finance-transactions", JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { window.localStorage.setItem("glass-finance-budgets", JSON.stringify(budgets)); }, [budgets]);
  useEffect(() => { window.localStorage.setItem("glass-finance-monthly-budget", JSON.stringify(monthlyBudget)); }, [monthlyBudget]);
  useEffect(() => { if ("serviceWorker" in navigator) navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined); }, []);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 2200); return () => window.clearTimeout(timer); }, [toast]);

  const monthlyTransactions = useMemo(() => transactions.filter((item) => monthKey(item.date) === month), [month, transactions]);
  const totals = useMemo(() => {
    const next = Object.fromEntries(CATEGORIES.map((id) => [id, 0])) as Record<CategoryId, number>;
    monthlyTransactions.forEach((item) => { next[item.category] += item.amount; });
    return next;
  }, [monthlyTransactions]);
  const totalBudget = monthlyBudget;
  const allocatedBudget = Object.values(budgets).reduce((sum, value) => sum + value, 0);
  const allocationRemaining = totalBudget - allocatedBudget;
  const spent = Object.values(totals).reduce((sum, value) => sum + value, 0);
  const remaining = totalBudget - spent;
  const progress = totalBudget ? Math.min(100, Math.round((spent / totalBudget) * 100)) : 0;
  const sortedCategories = [...CATEGORIES].sort((a, b) => totals[b] - totals[a]);

  const navigate = (next: Tab) => { keyboard.hide(); setTab(next); resetDeviceViewport(); };
  const submitExpense = () => {
    const numeric = Number(amount);
    if (!numeric || numeric <= 0) { setToast("请输入有效金额"); return; }
    setTransactions((current) => [{ id: `${Date.now()}`, amount: numeric, category, note: note.trim() || CATEGORY_META[category].label, date }, ...current]);
    setAmount(""); setNote(""); setMonth(monthKey(date)); keyboard.hide(); setTab("home"); resetDeviceViewport(); setToast("已记一笔");
  };
  const saveEdit = () => {
    if (!editing || editing.amount <= 0) return;
    setTransactions((current) => current.map((item) => item.id === editing.id ? editing : item));
    setEditing(null); keyboard.hide(); setToast("记录已更新");
  };
  const removeEdit = () => {
    if (!editing) return;
    setTransactions((current) => current.filter((item) => item.id !== editing.id));
    setEditing(null); setToast("记录已删除");
  };
  const renderMonthControl = () => (
    <div className="month-control" aria-label="切换月份">
      <button className="icon-button" type="button" aria-label="上个月" onClick={() => setMonth(shiftMonth(month, -1))}><CaretLeft size={18} weight="bold" /></button>
      <span>{monthTitle(month)}</span>
      <button className="icon-button" type="button" aria-label="下个月" onClick={() => setMonth(shiftMonth(month, 1))}><CaretRight size={18} weight="bold" /></button>
    </div>
  );

  const renderHome = () => (
    <section className="page page-home" data-testid="home-screen">
      <header className="page-header hero-header">
        <div className="hello-avatar"><User size={24} weight="fill" /></div>
        <div className="hello-copy"><h1>你好！</h1><p>管理好这个月的生活费</p></div>
      </header>
      <article className="glass-card budget-card">
        <div className="budget-overview">
          <div><h2>{Number(month.slice(5))}月预算</h2><span>本月生活费</span><strong>{currency(totalBudget)}</strong></div>
          <div className="budget-ring" style={{ "--ring-progress": `${progress * 3.6}deg` } as CSSProperties}><div><strong>{progress}%</strong><span>已使用</span></div></div>
        </div>
        <div className="budget-divider" />
        <div className="budget-split"><div><span>已花费</span><strong>{currency(spent)}</strong></div><div><span>剩余</span><strong className={remaining < 0 ? "negative" : "remaining"}>{currency(remaining)}</strong></div></div>
      </article>
      <div className="section-heading"><h2>分类预算</h2><button type="button" onClick={() => navigate("analysis")}>查看分析</button></div>
      <div className="category-budget-list">
        {CATEGORIES.map((id) => {
          const meta = CATEGORY_META[id]; const Icon = meta.Icon;
          const percent = budgets[id] ? Math.min(100, Math.round(totals[id] / budgets[id] * 100)) : 0;
          return <article className="glass-card category-budget-row" key={id}>
            <div className="category-icon" style={{ color: meta.color, backgroundColor: meta.soft }}><Icon size={20} weight="fill" /></div>
            <div className="category-budget-copy"><div><strong>{meta.label}</strong><span>{currency(totals[id])} / {currency(budgets[id])}</span></div><div className="category-progress"><span style={{ width: `${percent}%`, backgroundColor: meta.color }} /></div></div>
          </article>;
        })}
      </div>
      <div className="section-heading recent-heading"><h2>最近记录</h2><span>{monthlyTransactions.length} 笔</span></div>
      <div className="transaction-list">
        {monthlyTransactions.length ? monthlyTransactions.slice(0, 8).map((item) => {
          const meta = CATEGORY_META[item.category]; const Icon = meta.Icon;
          return <button className="transaction-row glass-card" type="button" key={item.id} onClick={() => setEditing(item)}>
            <span className="transaction-icon" style={{ color: meta.color, backgroundColor: meta.soft }}><Icon size={18} weight="fill" /></span>
            <span className="transaction-copy"><strong>{item.note}</strong><small>{meta.label} · {shortDate(item.date)}</small></span>
            <strong className="transaction-amount">-{currency(item.amount)}</strong>
          </button>;
        }) : <div className="empty-state"><Wallet size={28} /><p>这个月还没有记账</p></div>}
      </div>
    </section>
  );

  const renderAdd = () => (
    <section className="page page-add" data-testid="add-screen">
      <header className="page-header centered-header"><div><p className="eyebrow">快速记录</p><h1>记一笔</h1></div></header>
      <article className="glass-card amount-card">
        <label htmlFor="amount">花了多少</label>
        <div className="amount-input-wrap"><span>¥</span><KeyboardInput id="amount" data-testid="expense-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.00" aria-label="支出金额" /></div>
        <p>先记下来，月底就不会猜钱去哪了。</p>
      </article>
      <div className="form-section"><h2>花在哪一类</h2><div className="category-picker">
        {CATEGORIES.map((id) => {
          const meta = CATEGORY_META[id]; const Icon = meta.Icon; const selected = category === id;
          return <button className="category-choice" data-selected={selected} type="button" key={id} onClick={() => setCategory(id)} style={{ "--category-color": meta.color, "--category-soft": meta.soft } as CSSProperties}>
            <span><Icon size={22} weight="fill" /></span>{meta.label}{selected ? <Check className="choice-check" size={13} weight="bold" /> : null}
          </button>;
        })}
      </div></div>
      <div className="form-section glass-card detail-card">
        <label className="field-label" htmlFor="note"><NotePencil size={18} />备注</label>
        <KeyboardTextarea id="note" data-testid="expense-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="例如：食堂午餐" rows={2} />
        <label className="field-label" htmlFor="expense-date"><CalendarBlank size={18} />日期</label>
        <KeyboardInput id="expense-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </div>
      <button className="primary-button" data-testid="save-expense" type="button" onClick={submitExpense}><Plus size={19} weight="bold" />保存这笔支出</button>
    </section>
  );

  const renderAnalysis = () => {
    const chartData = sortedCategories.filter((id) => totals[id] > 0).map((id) => ({ id, value: totals[id] }));
    const topCategory = sortedCategories[0];
    return <section className="page page-analysis" data-testid="analysis-screen">
      <header className="page-header analysis-header"><div><p className="eyebrow">月度复盘</p><h1>消费分析</h1></div><ChartDonut size={30} color="#3f82f7" weight="duotone" /></header>
      {renderMonthControl()}
      <div className="summary-grid">
        <article className="glass-card summary-card blue"><span>本月支出</span><strong>{currency(spent)}</strong><small><ArrowDown size={13} /> 比预算少 {currency(Math.max(0, remaining))}</small></article>
        <article className="glass-card summary-card green"><span>预算剩余</span><strong>{currency(remaining)}</strong><small>{monthlyTransactions.length} 笔记录</small></article>
      </div>
      <article className="glass-card chart-card"><div className="chart-copy"><span>支出分类</span><strong>{currency(spent)}</strong></div>
        <div className="chart-body">
          <div className="donut-wrap" aria-label="分类支出环形图">
            {chartData.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} dataKey="value" nameKey="id" innerRadius={46} outerRadius={68} paddingAngle={2} stroke="rgba(255,255,255,.8)" strokeWidth={3} isAnimationActive={false}>{chartData.map((item) => <Cell key={item.id} fill={CATEGORY_META[item.id].color} />)}</Pie></PieChart></ResponsiveContainer> : <div className="empty-donut">暂无数据</div>}
            <div className="donut-center"><strong>{currency(spent)}</strong><span>本月总支出</span></div>
          </div>
          <div className="chart-legend">{sortedCategories.map((id) => <div key={id}><i style={{ backgroundColor: CATEGORY_META[id].color }} /><span>{CATEGORY_META[id].label}</span><strong>{currency(totals[id])}</strong></div>)}</div>
        </div>
      </article>
      <article className="insight-card"><Lightbulb size={21} weight="fill" /><div><strong>本月小发现</strong><p>{spent ? `${CATEGORY_META[topCategory].label}占比最高，试试给下一周留一个更清晰的小额度。` : "先记下第一笔支出，这里会给你简单建议。"}</p></div></article>
    </section>;
  };

  const renderProfile = () => (
    <section className="page page-profile" data-testid="profile-screen">
      <header className="page-header profile-header"><div className="avatar"><User size={28} weight="fill" /></div><div><p className="eyebrow">我的账户</p><h1>大学生活费计划</h1></div><GearSix size={24} color="#6e7d91" /></header>
      <article className="glass-card settings-card"><div className="settings-title"><Wallet size={22} weight="duotone" /><div className="settings-title-copy"><strong>每月预算</strong><span>按常用大类分配</span></div><label className="monthly-budget-field"><span>¥</span><KeyboardInput inputMode="numeric" aria-label="每月预算" value={monthlyBudget} onChange={(event) => setMonthlyBudget(Math.max(0, Number(event.target.value) || 0))} /></label></div>
        <div className="budget-settings-list">{CATEGORIES.map((id) => { const meta = CATEGORY_META[id]; const Icon = meta.Icon; return <label className="budget-setting-row" key={id}><span style={{ color: meta.color, backgroundColor: meta.soft }}><Icon size={17} weight="fill" /></span><em>{meta.label}</em><div>¥<KeyboardInput inputMode="numeric" aria-label={`${meta.label}预算`} value={budgets[id]} onChange={(event) => setBudgets((current) => ({ ...current, [id]: Number(event.target.value) || 0 }))} /></div></label>; })}<div className="budget-setting-row budget-remaining-row"><span><Wallet size={17} weight="fill" /></span><em>剩余<small>预算未分配</small></em><b data-negative={allocationRemaining < 0}>{currency(allocationRemaining)}</b></div></div>
      </article>
      <article className="glass-card privacy-card"><ShieldCheck size={28} color="#42b98d" weight="duotone" /><div><strong>数据只保存在这台设备</strong><p>无需登录，也不会上传你的账单。断网时也能继续使用。</p></div></article>
      <button className="secondary-button" type="button" onClick={() => { setTransactions(DEMO_TRANSACTIONS); setBudgets(DEFAULT_BUDGETS); setMonthlyBudget(DEFAULT_MONTHLY_BUDGET); setMonth("2026-10"); setToast("已恢复演示数据"); }}>恢复演示数据</button>
      <p className="version-note">小荷包 · 学生版 1.0</p>
    </section>
  );

  return <div className="finance-app">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <MobileScroll key={tab} className="app-screen"><main className="screen-content">{tab === "home" ? renderHome() : null}{tab === "add" ? renderAdd() : null}{tab === "analysis" ? renderAnalysis() : null}{tab === "profile" ? renderProfile() : null}</main></MobileScroll>
    <nav className="bottom-nav" aria-label="主要导航">
      <button type="button" data-active={tab === "home"} onClick={() => navigate("home")}><House size={21} weight={tab === "home" ? "fill" : "regular"} /><span>首页</span></button>
      <button type="button" data-active={tab === "add"} onClick={() => navigate("add")}><Plus size={22} weight="bold" /><span>记一笔</span></button>
      <button type="button" data-active={tab === "analysis"} onClick={() => navigate("analysis")}><ChartDonut size={22} weight={tab === "analysis" ? "fill" : "regular"} /><span>分析</span></button>
      <button type="button" data-active={tab === "profile"} onClick={() => navigate("profile")}><User size={21} weight={tab === "profile" ? "fill" : "regular"} /><span>我的</span></button>
    </nav>
    {toast ? <div className="toast" role="status"><Check size={15} weight="bold" />{toast}</div> : null}
    <BottomSheet open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null); }} title="编辑这笔记录" description="修改后会立刻更新本月统计" snap={0.74}>
      {editing ? <div className="edit-form">
        <label>金额<KeyboardInput inputMode="decimal" value={editing.amount} onChange={(event) => setEditing({ ...editing, amount: Number(event.target.value) || 0 })} /></label>
        <label>备注<KeyboardInput value={editing.note} onChange={(event) => setEditing({ ...editing, note: event.target.value })} /></label>
        <label>日期<KeyboardInput type="date" value={editing.date} onChange={(event) => setEditing({ ...editing, date: event.target.value })} /></label>
        <div className="edit-categories">{CATEGORIES.map((id) => { const meta = CATEGORY_META[id]; const Icon = meta.Icon; return <button key={id} type="button" data-selected={editing.category === id} onClick={() => setEditing({ ...editing, category: id })}><Icon size={17} weight="fill" />{meta.label}</button>; })}</div>
        <div className="edit-actions"><button className="delete-button" type="button" onClick={removeEdit}><Trash size={17} />删除</button><button className="save-edit-button" type="button" onClick={saveEdit}>保存修改</button></div>
      </div> : null}
    </BottomSheet>
  </div>;
}
