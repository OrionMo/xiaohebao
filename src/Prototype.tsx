import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  AirplaneTilt, ArrowDown, BookOpen, Bus, CalendarBlank, CaretLeft, CaretRight, ChartDonut, Check,
  DeviceMobile, FirstAid, ForkKnife, GameController, GearSix, House, Heart, Lightbulb,
  NotePencil, PawPrint, Plus, ShieldCheck, ShoppingBag, Sparkle, Trash, User, Wallet,
} from "@phosphor-icons/react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { BottomSheet, KeyboardInput, KeyboardTextarea, MobileScroll, useKeyboard } from "./mobile";
import "./prototype.css";

type Tab = "home" | "add" | "analysis" | "profile";
type CategoryId = string;
type CategoryIconKey = "food" | "transport" | "study" | "shopping" | "fun" | "other" | "health" | "pet" | "travel" | "digital" | "favorite" | "sparkle";
type Transaction = { id: string; amount: number; category: CategoryId; note: string; date: string };
type CategoryDefinition = { id: CategoryId; label: string; color: string; soft: string; icon: CategoryIconKey; builtIn: boolean };
type CategoryDraft = { id?: CategoryId; label: string; budget: string; icon: CategoryIconKey; color: string; soft: string };

const CATEGORY_ICONS: Record<CategoryIconKey, typeof ForkKnife> = {
  food: ForkKnife,
  transport: Bus,
  study: BookOpen,
  shopping: ShoppingBag,
  fun: GameController,
  other: Plus,
  health: FirstAid,
  pet: PawPrint,
  travel: AirplaneTilt,
  digital: DeviceMobile,
  favorite: Heart,
  sparkle: Sparkle,
};
const CUSTOM_ICON_OPTIONS: Array<{ key: CategoryIconKey; label: string }> = [
  { key: "health", label: "医疗" },
  { key: "pet", label: "宠物" },
  { key: "travel", label: "旅行" },
  { key: "digital", label: "数码" },
  { key: "favorite", label: "爱好" },
  { key: "sparkle", label: "通用" },
];
const CATEGORY_COLORS = [
  { color: "#69a7ff", soft: "#eaf3ff" },
  { color: "#42c99b", soft: "#e7f9f2" },
  { color: "#9a86ef", soft: "#f0edff" },
  { color: "#ff9e83", soft: "#fff0eb" },
  { color: "#f2bd55", soft: "#fff6df" },
  { color: "#ef7fb2", soft: "#fff0f7" },
];
const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  { id: "food", label: "餐饮", color: "#69a7ff", soft: "#eaf3ff", icon: "food", builtIn: true },
  { id: "transport", label: "交通", color: "#42c99b", soft: "#e7f9f2", icon: "transport", builtIn: true },
  { id: "study", label: "学习", color: "#9a86ef", soft: "#f0edff", icon: "study", builtIn: true },
  { id: "shopping", label: "购物", color: "#ff9e83", soft: "#fff0eb", icon: "shopping", builtIn: true },
  { id: "fun", label: "娱乐", color: "#f2bd55", soft: "#fff6df", icon: "fun", builtIn: true },
  { id: "other", label: "其他", color: "#8fa1b7", soft: "#eef2f6", icon: "other", builtIn: true },
];
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
function readStoredCategories(): CategoryDefinition[] {
  const stored = readStored<unknown>("glass-finance-categories", []);
  if (!Array.isArray(stored)) return DEFAULT_CATEGORIES;
  const builtInIds = new Set(DEFAULT_CATEGORIES.map((item) => item.id));
  const custom = stored.filter((item): item is CategoryDefinition => {
    if (!item || typeof item !== "object") return false;
    const value = item as Partial<CategoryDefinition>;
    return typeof value.id === "string" && value.id.startsWith("custom-") && !builtInIds.has(value.id)
      && typeof value.label === "string" && value.label.trim().length > 0
      && typeof value.color === "string" && typeof value.soft === "string"
      && typeof value.icon === "string" && value.icon in CATEGORY_ICONS;
  }).map((item) => ({ ...item, builtIn: false }));
  return [...DEFAULT_CATEGORIES, ...custom];
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
  const [categories, setCategories] = useState<CategoryDefinition[]>(readStoredCategories);
  const [transactions, setTransactions] = useState<Transaction[]>(() => readStored("glass-finance-transactions", DEMO_TRANSACTIONS));
  const [budgets, setBudgets] = useState<Record<CategoryId, number>>(() => readStored("glass-finance-budgets", DEFAULT_BUDGETS));
  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => readStored("glass-finance-monthly-budget", DEFAULT_MONTHLY_BUDGET));
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryId>("food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("2026-10-02");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft | null>(null);
  const [deleteCategoryArmed, setDeleteCategoryArmed] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => { window.localStorage.setItem("glass-finance-categories", JSON.stringify(categories)); }, [categories]);
  useEffect(() => { window.localStorage.setItem("glass-finance-transactions", JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { window.localStorage.setItem("glass-finance-budgets", JSON.stringify(budgets)); }, [budgets]);
  useEffect(() => { window.localStorage.setItem("glass-finance-monthly-budget", JSON.stringify(monthlyBudget)); }, [monthlyBudget]);
  useEffect(() => { if ("serviceWorker" in navigator) navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined); }, []);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 2200); return () => window.clearTimeout(timer); }, [toast]);

  const categoryIds = useMemo(() => categories.map((item) => item.id), [categories]);
  const categoryMeta = useMemo(() => Object.fromEntries(categories.map((item) => [item.id, { ...item, Icon: CATEGORY_ICONS[item.icon] }])), [categories]);
  const monthlyTransactions = useMemo(() => transactions.filter((item) => monthKey(item.date) === month), [month, transactions]);
  const categoryTransactions = useMemo(() => selectedCategory
    ? monthlyTransactions.filter((item) => item.category === selectedCategory).sort((a, b) => b.date.localeCompare(a.date))
    : [], [monthlyTransactions, selectedCategory]);
  const totals = useMemo(() => {
    const next = Object.fromEntries(categoryIds.map((id) => [id, 0])) as Record<CategoryId, number>;
    monthlyTransactions.forEach((item) => { if (item.category in next) next[item.category] += item.amount; });
    return next;
  }, [categoryIds, monthlyTransactions]);
  const totalBudget = monthlyBudget;
  const allocatedBudget = categoryIds.reduce((sum, id) => sum + (budgets[id] || 0), 0);
  const allocationRemaining = totalBudget - allocatedBudget;
  const spent = Object.values(totals).reduce((sum, value) => sum + value, 0);
  const remaining = totalBudget - spent;
  const progress = totalBudget ? Math.min(100, Math.round((spent / totalBudget) * 100)) : 0;
  const sortedCategories = [...categoryIds].sort((a, b) => totals[b] - totals[a]);

  const navigate = (next: Tab) => { keyboard.hide(); setTab(next); resetDeviceViewport(); };
  const openCategoryDetails = (id: CategoryId) => { keyboard.hide(); setSelectedCategory(id); };
  const openCategoryEditor = (id?: CategoryId) => {
    keyboard.hide(); setDeleteCategoryArmed(false);
    const existing = id ? categories.find((item) => item.id === id) : undefined;
    if (existing) {
      setCategoryDraft({ id: existing.id, label: existing.label, budget: String(budgets[existing.id] || 0), icon: existing.icon, color: existing.color, soft: existing.soft });
      return;
    }
    const color = CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length];
    setCategoryDraft({ label: "", budget: "0", icon: "sparkle", color: color.color, soft: color.soft });
  };
  const editFromCategoryDetails = (item: Transaction) => { setSelectedCategory(null); setEditing(item); };
  const submitExpense = () => {
    const numeric = Number(amount);
    if (!numeric || numeric <= 0) { setToast("请输入有效金额"); return; }
    setTransactions((current) => [{ id: `${Date.now()}`, amount: numeric, category, note: note.trim() || categoryMeta[category].label, date }, ...current]);
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
  const saveCategory = () => {
    if (!categoryDraft) return;
    const label = categoryDraft.label.trim();
    if (!label) { setToast("请输入分类名称"); return; }
    const duplicate = categories.some((item) => item.label.toLocaleLowerCase("zh-CN") === label.toLocaleLowerCase("zh-CN") && item.id !== categoryDraft.id);
    if (duplicate) { setToast("这个分类已经存在"); return; }
    const budget = Math.max(0, Number(categoryDraft.budget) || 0);
    if (categoryDraft.id) {
      setCategories((current) => current.map((item) => item.id === categoryDraft.id ? { ...item, label, icon: categoryDraft.icon, color: categoryDraft.color, soft: categoryDraft.soft } : item));
      setBudgets((current) => ({ ...current, [categoryDraft.id as string]: budget }));
      setToast("分类已更新");
    } else {
      const id = `custom-${Date.now().toString(36)}`;
      setCategories((current) => [...current, { id, label, icon: categoryDraft.icon, color: categoryDraft.color, soft: categoryDraft.soft, builtIn: false }]);
      setBudgets((current) => ({ ...current, [id]: budget }));
      setCategory(id);
      setToast("分类已添加");
    }
    keyboard.hide(); setCategoryDraft(null); setDeleteCategoryArmed(false);
  };
  const removeCategory = () => {
    if (!categoryDraft?.id) return;
    const existing = categories.find((item) => item.id === categoryDraft.id);
    if (!existing || existing.builtIn) return;
    if (transactions.some((item) => item.category === existing.id)) { setToast("该分类还有账单，请先修改账单分类"); return; }
    if (!deleteCategoryArmed) { setDeleteCategoryArmed(true); return; }
    setCategories((current) => current.filter((item) => item.id !== existing.id));
    setBudgets((current) => { const next = { ...current }; delete next[existing.id]; return next; });
    if (category === existing.id) setCategory("food");
    if (selectedCategory === existing.id) setSelectedCategory(null);
    keyboard.hide(); setCategoryDraft(null); setDeleteCategoryArmed(false); setToast("分类已删除");
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
        {categoryIds.map((id) => {
          const meta = categoryMeta[id]; const Icon = meta.Icon;
          const percent = budgets[id] ? Math.min(100, Math.round(totals[id] / budgets[id] * 100)) : 0;
          return <button className="glass-card category-budget-row" data-testid={`category-budget-${id}`} type="button" key={id} aria-label={`查看${meta.label}消费明细`} onClick={() => openCategoryDetails(id)}>
            <div className="category-icon" style={{ color: meta.color, backgroundColor: meta.soft }}><Icon size={20} weight="fill" /></div>
            <div className="category-budget-copy"><div><strong>{meta.label}</strong><span>{currency(totals[id])} / {currency(budgets[id])}</span></div><div className="category-progress"><span style={{ width: `${percent}%`, backgroundColor: meta.color }} /></div></div>
          </button>;
        })}
      </div>
      <div className="section-heading recent-heading"><h2>最近记录</h2><span>{monthlyTransactions.length} 笔</span></div>
      <div className="transaction-list">
        {monthlyTransactions.length ? monthlyTransactions.slice(0, 8).map((item) => {
          const meta = categoryMeta[item.category]; const Icon = meta.Icon;
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
        {categoryIds.map((id) => {
          const meta = categoryMeta[id]; const Icon = meta.Icon; const selected = category === id;
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
            {chartData.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} dataKey="value" nameKey="id" innerRadius={46} outerRadius={68} paddingAngle={2} stroke="rgba(255,255,255,.8)" strokeWidth={3} isAnimationActive={false}>{chartData.map((item) => <Cell key={item.id} fill={categoryMeta[item.id].color} />)}</Pie></PieChart></ResponsiveContainer> : <div className="empty-donut">暂无数据</div>}
            <div className="donut-center"><strong>{currency(spent)}</strong><span>本月总支出</span></div>
          </div>
          <div className="chart-legend">{sortedCategories.map((id) => <div key={id}><i style={{ backgroundColor: categoryMeta[id].color }} /><span>{categoryMeta[id].label}</span><strong>{currency(totals[id])}</strong></div>)}</div>
        </div>
      </article>
      <article className="insight-card"><Lightbulb size={21} weight="fill" /><div><strong>本月小发现</strong><p>{spent ? `${categoryMeta[topCategory].label}占比最高，试试给下一周留一个更清晰的小额度。` : "先记下第一笔支出，这里会给你简单建议。"}</p></div></article>
    </section>;
  };

  const renderProfile = () => (
    <section className="page page-profile" data-testid="profile-screen">
      <header className="page-header profile-header"><div className="avatar"><User size={28} weight="fill" /></div><div><p className="eyebrow">我的账户</p><h1>大学生活费计划</h1></div><GearSix size={24} color="#6e7d91" /></header>
      <article className="glass-card settings-card"><div className="settings-title"><Wallet size={22} weight="duotone" /><div className="settings-title-copy"><strong>每月预算</strong><span>按常用大类分配</span></div><label className="monthly-budget-field"><span>¥</span><KeyboardInput inputMode="numeric" aria-label="每月预算" value={monthlyBudget} onChange={(event) => setMonthlyBudget(Math.max(0, Number(event.target.value) || 0))} /></label></div>
        <div className="budget-settings-list">
          {categoryIds.map((id) => {
            const meta = categoryMeta[id]; const Icon = meta.Icon;
            return <div className="budget-setting-row" key={id}>
              <button className="budget-setting-trigger" data-testid={`profile-category-${id}`} type="button" aria-label={`查看${meta.label}消费明细`} onClick={() => openCategoryDetails(id)}><span style={{ color: meta.color, backgroundColor: meta.soft }}><Icon size={17} weight="fill" /></span><em>{meta.label}</em><CaretRight className="budget-detail-caret" size={14} weight="bold" /></button>
              {!meta.builtIn ? <button className="category-manage-button" type="button" aria-label={`编辑${meta.label}分类`} onClick={() => openCategoryEditor(id)}><NotePencil size={15} weight="bold" /></button> : null}
              <label className="budget-setting-value">¥<KeyboardInput inputMode="numeric" aria-label={`${meta.label}预算`} value={budgets[id] || 0} onChange={(event) => setBudgets((current) => ({ ...current, [id]: Number(event.target.value) || 0 }))} /></label>
            </div>;
          })}
          <button className="add-category-row" data-testid="add-category" type="button" onClick={() => openCategoryEditor()}><span><Plus size={17} weight="bold" /></span><em>添加分类<small>名称、预算、图标和颜色</small></em><CaretRight size={14} weight="bold" /></button>
          <div className="budget-setting-row budget-remaining-row"><span><Wallet size={17} weight="fill" /></span><em>剩余<small>预算未分配</small></em><b data-negative={allocationRemaining < 0}>{currency(allocationRemaining)}</b></div>
        </div>
      </article>
      <article className="glass-card privacy-card"><ShieldCheck size={28} color="#42b98d" weight="duotone" /><div><strong>数据只保存在这台设备</strong><p>无需登录，也不会上传你的账单。断网时也能继续使用。</p></div></article>
      <button className="secondary-button" type="button" onClick={() => { setCategories(DEFAULT_CATEGORIES); setTransactions(DEMO_TRANSACTIONS); setBudgets(DEFAULT_BUDGETS); setMonthlyBudget(DEFAULT_MONTHLY_BUDGET); setCategory("food"); setMonth("2026-10"); setToast("已恢复演示数据"); }}>恢复演示数据</button>
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
    <BottomSheet open={Boolean(selectedCategory)} onOpenChange={(open) => { if (!open) setSelectedCategory(null); }} title={selectedCategory ? `${categoryMeta[selectedCategory].label}明细` : "分类明细"} description={selectedCategory ? `${monthTitle(month)} · ${categoryTransactions.length} 笔记录` : undefined} snap={0.72}>
      {selectedCategory ? (() => {
        const meta = categoryMeta[selectedCategory]; const Icon = meta.Icon;
        const categoryRemaining = (budgets[selectedCategory] || 0) - totals[selectedCategory];
        return <div className="category-detail-sheet" data-testid="category-detail-sheet">
          <div className="category-detail-summary">
            <span className="category-detail-icon" style={{ color: meta.color, backgroundColor: meta.soft }}><Icon size={22} weight="fill" /></span>
            <div><span>本月已花</span><strong>{currency(totals[selectedCategory])}</strong></div>
            <div className="category-detail-budget"><span>分类预算剩余</span><strong data-negative={categoryRemaining < 0}>{currency(categoryRemaining)}</strong></div>
          </div>
          <div className="category-detail-list">
            {categoryTransactions.length ? categoryTransactions.map((item) => <button className="category-detail-item" type="button" key={item.id} onClick={() => editFromCategoryDetails(item)}>
              <span className="category-detail-date">{shortDate(item.date)}</span>
              <span className="category-detail-copy"><strong>{item.note}</strong><small>点击可编辑</small></span>
              <strong className="category-detail-amount">-{currency(item.amount)}</strong>
              <CaretRight size={14} weight="bold" />
            </button>) : <div className="category-detail-empty"><Icon size={30} weight="duotone" /><strong>本月还没有{meta.label}支出</strong><span>快速记一笔后，会自动显示在这里</span></div>}
          </div>
        </div>;
      })() : null}
    </BottomSheet>
    <BottomSheet open={Boolean(categoryDraft)} onOpenChange={(open) => { if (!open) { setCategoryDraft(null); setDeleteCategoryArmed(false); } }} title={categoryDraft?.id ? "编辑自定义分类" : "添加分类"} description="新分类会同步出现在记账、首页和分析中" snap={0.78}>
      {categoryDraft ? <div className="category-editor" data-testid="category-editor">
        <label className="category-editor-field"><span>分类名称</span><KeyboardInput data-testid="category-name" value={categoryDraft.label} maxLength={8} placeholder="例如：医疗" onChange={(event) => setCategoryDraft({ ...categoryDraft, label: event.target.value })} /></label>
        <label className="category-editor-field"><span>分类预算</span><span className="category-budget-input"><i>¥</i><KeyboardInput data-testid="category-budget" inputMode="numeric" value={categoryDraft.budget} onChange={(event) => setCategoryDraft({ ...categoryDraft, budget: event.target.value.replace(/[^0-9]/g, "") })} /></span></label>
        <div className="category-editor-group"><span>选择图标</span><div className="category-icon-options">{CUSTOM_ICON_OPTIONS.map((option) => { const Icon = CATEGORY_ICONS[option.key]; return <button type="button" key={option.key} data-selected={categoryDraft.icon === option.key} onClick={() => setCategoryDraft({ ...categoryDraft, icon: option.key })}><Icon size={20} weight="fill" /><small>{option.label}</small></button>; })}</div></div>
        <div className="category-editor-group"><span>选择颜色</span><div className="category-color-options">{CATEGORY_COLORS.map((option) => <button type="button" key={option.color} data-selected={categoryDraft.color === option.color} aria-label={`选择颜色 ${option.color}`} style={{ backgroundColor: option.color }} onClick={() => setCategoryDraft({ ...categoryDraft, color: option.color, soft: option.soft })}>{categoryDraft.color === option.color ? <Check size={13} weight="bold" /> : null}</button>)}</div></div>
        <div className="category-preview"><span style={{ color: categoryDraft.color, backgroundColor: categoryDraft.soft }}>{(() => { const Icon = CATEGORY_ICONS[categoryDraft.icon]; return <Icon size={19} weight="fill" />; })()}</span><div><small>分类预览</small><strong>{categoryDraft.label.trim() || "新分类"}</strong></div><b>{currency(Number(categoryDraft.budget) || 0)}</b></div>
        <div className={categoryDraft.id ? "category-editor-actions has-delete" : "category-editor-actions"}>
          {categoryDraft.id ? <button className="delete-category-button" type="button" onClick={removeCategory}><Trash size={16} />{deleteCategoryArmed ? "确认删除" : "删除分类"}</button> : null}
          <button className="save-category-button" data-testid="save-category" type="button" onClick={saveCategory}>{categoryDraft.id ? "保存修改" : "添加分类"}</button>
        </div>
      </div> : null}
    </BottomSheet>
    <BottomSheet open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null); }} title="编辑这笔记录" description="修改后会立刻更新本月统计" snap={0.74}>
      {editing ? <div className="edit-form">
        <label>金额<KeyboardInput inputMode="decimal" value={editing.amount} onChange={(event) => setEditing({ ...editing, amount: Number(event.target.value) || 0 })} /></label>
        <label>备注<KeyboardInput value={editing.note} onChange={(event) => setEditing({ ...editing, note: event.target.value })} /></label>
        <label>日期<KeyboardInput type="date" value={editing.date} onChange={(event) => setEditing({ ...editing, date: event.target.value })} /></label>
        <div className="edit-categories">{categoryIds.map((id) => { const meta = categoryMeta[id]; const Icon = meta.Icon; return <button key={id} type="button" data-selected={editing.category === id} onClick={() => setEditing({ ...editing, category: id })}><Icon size={17} weight="fill" />{meta.label}</button>; })}</div>
        <div className="edit-actions"><button className="delete-button" type="button" onClick={removeEdit}><Trash size={17} />删除</button><button className="save-edit-button" type="button" onClick={saveEdit}>保存修改</button></div>
      </div> : null}
    </BottomSheet>
  </div>;
}
