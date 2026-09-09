import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import {
  Search, ArrowRight, Sparkles, Download, Zap, ShieldCheck, Cpu, MessageSquare,
  User, Settings as SettingsIcon, LogOut, Bell, Star, Bookmark, Home, Send, Copy,
  RefreshCw, Plus, Trash2, X, Check, CheckCircle2, AlertTriangle, Info, Music,
  Video, FileText, Link2, Loader2, ChevronDown, ChevronRight, Menu, Moon, Sun,
  LayoutDashboard, Globe, Lock, Paperclip, BarChart3, Activity, ArrowUpRight,
  Image as ImageIcon, Clock, Filter, Wand2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

/* ------------------------------------------------------------------------
   CONSTANTS & MOCK DATA
------------------------------------------------------------------------- */

const CORE_SYSTEM_PROMPT = `You are Core, the AI assistant built into Relay, a media-download companion app.
You help with general questions, writing, coding, summarization, translation, and text/document analysis.
You can also explain how Relay works: paste a URL into the Downloader tab, Relay detects the platform and
content type, and offers real downloads for direct file links and open-license sources — but it does not
offer downloads for platforms whose terms of service prohibit it (e.g. YouTube, Instagram, TikTok, X,
Facebook, SoundCloud, Spotify, Vimeo), since that would violate those platforms' rules and copyright law.
You have web search available for looking up current information, including background on a URL or topic
a person shares — but you cannot open, render, or download a page yourself, only reason about search results
and whatever text or files the person gives you directly. If someone asks you to fetch, download, or convert
a specific file, tell them plainly that isn't something you can do from chat, and point them to the Downloader
tab. Keep answers concise, precise and warm. Use markdown — fenced code blocks for code, short headers and
lists for structure — only when it actually helps.`;

const PLATFORM_PATTERNS = [
  { key: "youtube", label: "YouTube", match: /youtube\.com|youtu\.be/i, kind: "video", restricted: true },
  { key: "vimeo", label: "Vimeo", match: /vimeo\.com/i, kind: "video", restricted: true },
  { key: "tiktok", label: "TikTok", match: /tiktok\.com/i, kind: "video", restricted: true },
  { key: "instagram", label: "Instagram", match: /instagram\.com/i, kind: "video", restricted: true },
  { key: "twitter", label: "X / Twitter", match: /twitter\.com|x\.com/i, kind: "video", restricted: true },
  { key: "facebook", label: "Facebook", match: /facebook\.com|fb\.watch/i, kind: "video", restricted: true },
  { key: "soundcloud", label: "SoundCloud", match: /soundcloud\.com/i, kind: "audio", restricted: true },
  { key: "spotify", label: "Spotify", match: /spotify\.com/i, kind: "audio", restricted: true },
  { key: "archive", label: "Internet Archive", match: /archive\.org/i, kind: "open", restricted: false },
  { key: "wikimedia", label: "Wikimedia Commons", match: /wikimedia\.org|commons\.wikimedia/i, kind: "open", restricted: false },
  { key: "direct-video", label: "Direct file", match: /\.(mp4|webm|mov|mkv)(\?|$)/i, kind: "video", restricted: false, direct: true },
  { key: "direct-audio", label: "Direct file", match: /\.(mp3|wav|flac|ogg|m4a)(\?|$)/i, kind: "audio", restricted: false, direct: true },
  { key: "direct-image", label: "Direct file", match: /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i, kind: "image", restricted: false, direct: true },
];

const SUPPORTED_GRID = [
  { name: "YouTube", note: "detection only" }, { name: "Vimeo", note: "detection only" },
  { name: "TikTok", note: "detection only" }, { name: "Instagram", note: "detection only" },
  { name: "X / Twitter", note: "detection only" }, { name: "Facebook", note: "detection only" },
  { name: "SoundCloud", note: "detection only" }, { name: "Spotify", note: "detection only" },
  { name: "Internet Archive", note: "open license" }, { name: "Wikimedia Commons", note: "open license" },
  { name: "Direct file links", note: "full download" }, { name: "Podcast RSS", note: "full download" },
];

const FEATURES = [
  { icon: Zap, title: "Instant detection", body: "Drop a link and Relay works out the platform and content type before you finish reading the result." },
  { icon: Filter, title: "Format & quality picker", body: "Choose resolution or bitrate up front, and see the real file size before you commit to anything." },
  { icon: ShieldCheck, title: "Rules-aware by design", body: "Relay only completes a download where the source actually allows it — no silent workarounds." },
  { icon: Activity, title: "Live status", body: "Every job shows real progress, not a spinner — you always know exactly what's happening." },
  { icon: Bookmark, title: "History & saved items", body: "Everything you download or star stays organized and searchable in your dashboard." },
  { icon: Cpu, title: "Modular under the hood", body: "New platforms and formats plug into the same detection pipeline without a redesign." },
];

const AI_CAPABILITIES = [
  { icon: MessageSquare, title: "General Q&A", body: "Ask anything, get a direct answer." },
  { icon: FileText, title: "Summarization", body: "Paste a document or transcript, get the essentials." },
  { icon: Globe, title: "Translation", body: "Move text between languages, formal or casual." },
  { icon: Wand2, title: "Writing help", body: "Drafts, edits, tone shifts, tightening." },
  { icon: Cpu, title: "Coding help", body: "Debugging, review, explaining unfamiliar code." },
  { icon: Search, title: "Web-aware search", body: "Core can look things up when you need current info." },
];

const HOW_IT_WORKS = [
  { step: "Paste", body: "Drop any media URL into the box — Relay doesn't need you to pick a category first." },
  { step: "Detect", body: "The platform, content type and available formats are identified automatically." },
  { step: "Deliver", body: "Pick a quality, watch real progress, and the file — or an honest explanation — lands in your history." },
];

const FAQS = [
  { q: "Does Relay work with every platform?", a: "Relay recognizes links from most major platforms, but it only completes a download where the source's own terms allow it. For platforms that restrict downloading — YouTube, Instagram, TikTok and similar — Relay tells you clearly instead of pretending to work around it." },
  { q: "What actually downloads for real?", a: "Direct file links (a URL that points straight at an .mp4, .mp3, .jpg and so on) download for real, right in your browser. Everything else in this preview shows you the intended experience using sample data." },
  { q: "Is my account secure?", a: "Your profile lives in your own private storage tied to your account — nobody else can read it. This preview uses a simplified profile flow rather than a full password system; a production build would sit behind a real authentication service." },
  { q: "Can Core browse the internet for me?", a: "Core can search the web for current information, but it can't open, render or scrape a specific page on your behalf. For pulling data out of a URL, that goes through the Downloader." },
  { q: "What happens to files after I download them?", a: "Relay doesn't keep a copy of anything you download — it only stores the metadata (title, format, size, date) in your history so you can find it again." },
];

const TESTIMONIALS = [
  { name: "Priya N.", role: "Podcast editor", body: "The format picker alone saves me from re-checking file sizes by hand before every episode." },
  { name: "Marcus D.", role: "Archive researcher", body: "Being told plainly when something isn't downloadable is more useful than a tool that just spins forever." },
  { name: "Sofia R.", role: "Indie developer", body: "I mostly live in the AI workspace now — it's genuinely faster than switching tabs to look things up." },
];

const AVATAR_COLORS = ["#7c5cff", "#22d3ee", "#fb7185", "#fbbf24", "#34d399", "#a78bfa"];
const SUGGESTED_PROMPTS = [
  "What formats does Relay support?",
  "Summarize this in three sentences",
  "Help me write a video caption",
  "Explain this error message",
  "Translate this to Spanish",
];

/* ------------------------------------------------------------------------
   HELPERS
------------------------------------------------------------------------- */

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function formatBytes(bytes) {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0, n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

function detectUrl(raw) {
  let url;
  try { url = new URL(raw.trim()); } catch { return { status: "invalid" }; }
  if (!/^https?:$/.test(url.protocol)) return { status: "invalid" };
  for (const p of PLATFORM_PATTERNS) {
    if (p.match.test(url.href)) {
      return { status: "matched", platform: p, url: url.href, filename: url.pathname.split("/").pop() || "file" };
    }
  }
  return { status: "unknown", url: url.href };
}

// Tiny markdown -> JSX renderer (bold, italic, inline code, fenced code, headers, lists, links)
function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const blocks = [];
  let i = 0;
  let listBuf = [];
  const flushList = () => {
    if (listBuf.length) {
      blocks.push(<ul key={`ul-${blocks.length}`} className="md-list">{listBuf.map((li, idx) => <li key={idx}>{inline(li)}</li>)}</ul>);
      listBuf = [];
    }
  };
  function inline(str) {
    const parts = [];
    let rest = str;
    let key = 0;
    const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/;
    while (rest.length) {
      const m = rest.match(pattern);
      if (!m) { parts.push(rest); break; }
      if (m.index > 0) parts.push(rest.slice(0, m.index));
      const token = m[0];
      if (token.startsWith("**")) parts.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
      else if (token.startsWith("`")) parts.push(<code key={key++} className="md-inline-code">{token.slice(1, -1)}</code>);
      else parts.push(<em key={key++}>{token.slice(1, -1)}</em>);
      rest = rest.slice(m.index + token.length);
    }
    return parts;
  }
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith("```")) {
      flushList();
      const lang = line.trim().slice(3);
      const code = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) { code.push(lines[i]); i++; }
      i++;
      blocks.push(
        <pre key={`code-${blocks.length}`} className="md-code-block">
          {lang ? <div className="md-code-lang">{lang}</div> : null}
          <code>{code.join("\n")}</code>
        </pre>
      );
      continue;
    }
    if (/^#{1,3}\s/.test(line)) {
      flushList();
      const level = line.match(/^#+/)[0].length;
      const content = line.replace(/^#{1,3}\s/, "");
      const Tag = level === 1 ? "h3" : level === 2 ? "h4" : "h5";
      blocks.push(<Tag key={`h-${blocks.length}`} className="md-heading">{inline(content)}</Tag>);
      i++;
      continue;
    }
    if (/^[-*]\s/.test(line)) {
      listBuf.push(line.replace(/^[-*]\s/, ""));
      i++;
      continue;
    }
    if (line.trim() === "") { flushList(); i++; continue; }
    flushList();
    blocks.push(<p key={`p-${blocks.length}`} className="md-p">{inline(line)}</p>);
    i++;
  }
  flushList();
  return blocks;
}

/* ------------------------------------------------------------------------
   TOAST CONTEXT
------------------------------------------------------------------------- */

const ToastContext = createContext(null);
function useToast() { return useContext(ToastContext); }

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((toast) => {
    const id = uid();
    setToasts((t) => [...t, { id, tone: "info", ...toast }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            {t.tone === "success" ? <CheckCircle2 size={16} /> : t.tone === "error" ? <AlertTriangle size={16} /> : <Info size={16} />}
            <div>
              <div className="toast-title">{t.title}</div>
              {t.body ? <div className="toast-body">{t.body}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ------------------------------------------------------------------------
   SHARED UI PRIMITIVES
------------------------------------------------------------------------- */

function Btn({ children, variant = "primary", size = "md", icon: Icon, onClick, disabled, className = "", type = "button", title }) {
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`btn btn-${variant} btn-${size} ${disabled ? "btn-disabled" : ""} ${className}`}
    >
      {Icon ? <Icon size={size === "sm" ? 14 : 16} /> : null}
      <span>{children}</span>
    </button>
  );
}

function Badge({ children, tone = "default" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Card({ children, className = "", glow = false }) {
  return <div className={`card ${glow ? "card-glow" : ""} ${className}`}>{children}</div>;
}

function Skeleton({ w = "100%", h = "14px", r = "8px" }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r }} />;
}

function ProgressBar({ value }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon size={22} /></div>
      <div className="empty-title">{title}</div>
      <div className="empty-body">{body}</div>
      {action}
    </div>
  );
}

function Modal({ open, onClose, children, width = 440 }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-panel" style={{ maxWidth: width }} role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Close dialog"><X size={16} /></button>
        {children}
      </div>
    </div>
  );
}

function Avatar({ name, color, size = 36 }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.42, background: `linear-gradient(135deg, ${color}, ${color}99)` }}>
      {initial}
    </div>
  );
}

/* ------------------------------------------------------------------------
   NAVIGATION
------------------------------------------------------------------------- */

const NAV_ITEMS = [
  { id: "landing", label: "Home", icon: Home },
  { id: "downloader", label: "Downloader", icon: Download },
  { id: "ai", label: "Core", icon: Sparkles },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
];

function TopNav({ view, setView, profile, onAuthOpen, onLogout, theme, setTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <button className="brand" onClick={() => setView("landing")} aria-label="Relay home">
          <span className="brand-mark"><Zap size={16} /></span>
          <span className="brand-name">Relay</span>
        </button>
        <nav className="top-nav-links" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${view === item.id ? "nav-link-active" : ""}`}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="top-nav-actions">
          <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme" title="Toggle theme">
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {profile ? (
            <div className="profile-menu">
              <button className="profile-chip" onClick={() => setMenuOpen((v) => !v)}>
                <Avatar name={profile.name} color={profile.color} size={28} />
                <span className="profile-chip-name">{profile.name}</span>
                <ChevronDown size={14} />
              </button>
              {menuOpen ? (
                <div className="profile-dropdown" onMouseLeave={() => setMenuOpen(false)}>
                  <button onClick={() => { setView("dashboard"); setMenuOpen(false); }}><LayoutDashboard size={14} /> Dashboard</button>
                  <button onClick={() => { setView("settings"); setMenuOpen(false); }}><SettingsIcon size={14} /> Settings</button>
                  <button onClick={() => { onLogout(); setMenuOpen(false); }}><LogOut size={14} /> Log out</button>
                </div>
              ) : null}
            </div>
          ) : (
            <Btn size="sm" onClick={onAuthOpen}>Get started</Btn>
          )}
        </div>
      </div>
    </header>
  );
}

function BottomNav({ view, setView, profile, onAuthOpen }) {
  const items = profile ? NAV_ITEMS.concat([{ id: "settings", label: "Profile", icon: User }]) : NAV_ITEMS;
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {items.map((item) => {
        const Icon = item.icon;
        const active = view === item.id;
        return (
          <button
            key={item.id}
            className={`bottom-nav-item ${active ? "bottom-nav-item-active" : ""}`}
            onClick={() => (item.id === "settings" && !profile ? onAuthOpen() : setView(item.id))}
          >
            <Icon size={19} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ------------------------------------------------------------------------
   LANDING PAGE
------------------------------------------------------------------------- */

function Landing({ setView, onAuthOpen, profile }) {
  const [heroUrl, setHeroUrl] = useState("");
  return (
    <div className="landing">
      <section className="hero">
        <div className="aurora" aria-hidden="true" />
        <div className="hero-inner">
          <Badge tone="violet">AI-assisted detection</Badge>
          <h1 className="hero-title">Paste a link.<br />Get the file.</h1>
          <p className="hero-sub">
            Relay reads the URL, works out what's on the other end, and hands you the right format —
            video, audio or image. Stuck on something else entirely? Core, the AI workspace next door,
            will just talk you through it.
          </p>
          <div className="hero-input-row">
            <div className="hero-input">
              <Link2 size={16} className="hero-input-icon" />
              <input
                value={heroUrl}
                onChange={(e) => setHeroUrl(e.target.value)}
                placeholder="Paste any media URL…"
                onKeyDown={(e) => { if (e.key === "Enter") setView("downloader"); }}
                aria-label="Media URL"
              />
              <div className="scanline" aria-hidden="true" />
            </div>
            <Btn icon={ArrowRight} onClick={() => setView("downloader")}>Detect</Btn>
          </div>
          <div className="hero-actions">
            <button className="hero-ai-cta" onClick={() => setView("ai")}>
              <Sparkles size={15} /> Or open the AI workspace
            </button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Where Relay looks</h2>
          <p>Detection covers every link below. Full downloads run wherever the source actually allows it.</p>
        </div>
        <div className="platform-grid">
          {SUPPORTED_GRID.map((p) => (
            <div key={p.name} className="platform-tile">
              <span className="platform-name">{p.name}</span>
              <span className="platform-note">{p.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Built to be trusted with the details</h2>
          <p>Every piece of the download flow is designed to be predictable, not clever.</p>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <Card key={f.title} className="feature-card">
              <div className="feature-icon"><f.icon size={18} /></div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="section section-ai">
        <div className="ai-showcase">
          <div className="ai-showcase-copy">
            <Badge tone="cyan">Core</Badge>
            <h2>An AI workspace that's actually the main event</h2>
            <p>
              Core isn't a help-bubble bolted onto a corner of the screen. It's a full workspace with
              conversation history, streaming answers, file understanding and a live connection to
              current information on the web.
            </p>
            <Btn icon={Sparkles} onClick={() => setView("ai")}>Open Core</Btn>
          </div>
          <div className="ai-capability-grid">
            {AI_CAPABILITIES.map((c) => (
              <div key={c.title} className="ai-capability-tile">
                <c.icon size={16} />
                <div>
                  <div className="ai-capability-title">{c.title}</div>
                  <div className="ai-capability-body">{c.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>How it works</h2>
        </div>
        <div className="steps-row">
          {HOW_IT_WORKS.map((s, idx) => (
            <div key={s.step} className="step-tile">
              <div className="step-number">{idx + 1}</div>
              <div className="step-title">{s.step}</div>
              <div className="step-body">{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="security-panel">
          <div className="security-copy">
            <Badge tone="mint">Security</Badge>
            <h2>Nothing hides in the frontend</h2>
            <p>
              Downloads are validated and processed server-side, credentials never touch the browser,
              and Relay only completes a job where the source's own rules permit it. Your history and
              saved items are private to your account.
            </p>
          </div>
          <ul className="security-list">
            <li><Lock size={14} /> Server-side validation on every request</li>
            <li><ShieldCheck size={14} /> No API keys or secrets in client code</li>
            <li><Activity size={14} /> Rate limiting and abuse prevention</li>
            <li><FileText size={14} /> File-size limits enforced before processing</li>
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>A dashboard that stays out of your way</h2>
          <p>Everything you've downloaded, saved, and asked Core lives in one place.</p>
        </div>
        <DashboardPreviewCard onOpen={() => (profile ? setView("dashboard") : onAuthOpen())} />
      </section>

      <section className="section">
        <div className="section-head"><h2>What people use it for</h2></div>
        <div className="testimonial-grid">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="testimonial-card">
              <p>"{t.body}"</p>
              <div className="testimonial-name">{t.name}</div>
              <div className="testimonial-role">{t.role}</div>
            </Card>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2>Questions</h2></div>
        <div className="faq-list">
          {FAQS.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </section>

      <footer className="footer">
        <div className="footer-top">
          <div className="brand">
            <span className="brand-mark"><Zap size={16} /></span>
            <span className="brand-name">Relay</span>
          </div>
          <p>A media-download companion with an AI workspace built in.</p>
        </div>
        <div className="footer-cols">
          <div>
            <h4>Product</h4>
            <button onClick={() => setView("downloader")}>Downloader</button>
            <button onClick={() => setView("ai")}>Core AI</button>
            <button onClick={() => (profile ? setView("dashboard") : onAuthOpen())}>Dashboard</button>
          </div>
          <div>
            <h4>Company</h4>
            <span>Security</span>
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
        <div className="footer-bottom">© {new Date().getFullYear()} Relay. Preview build.</div>
      </footer>
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <button className="faq-q" onClick={() => setOpen((v) => !v)}>
        <span>{q}</span>
        <ChevronDown size={16} className={open ? "faq-chevron-open" : ""} />
      </button>
      {open ? <div className="faq-a">{a}</div> : null}
    </div>
  );
}

function DashboardPreviewCard({ onOpen }) {
  return (
    <Card className="dash-preview" glow>
      <div className="dash-preview-grid">
        <div className="dash-preview-stat"><span>128</span><label>Downloads</label></div>
        <div className="dash-preview-stat"><span>34</span><label>Core chats</label></div>
        <div className="dash-preview-stat"><span>19</span><label>Saved items</label></div>
      </div>
      <div className="dash-preview-bars" aria-hidden="true">
        {[40, 65, 30, 80, 55, 90, 45].map((h, i) => <span key={i} style={{ height: `${h}%` }} />)}
      </div>
      <Btn variant="secondary" icon={ArrowUpRight} onClick={onOpen}>Open your dashboard</Btn>
    </Card>
  );
}

/* ------------------------------------------------------------------------
   DOWNLOADER
------------------------------------------------------------------------- */

const SAMPLE_ITEM = {
  title: "Northern Lights Timelapse — sample",
  kind: "video",
  duration: "2:14",
  formats: [
    { id: "1080p", label: "1080p MP4", size: 86 * 1024 * 1024 },
    { id: "720p", label: "720p MP4", size: 44 * 1024 * 1024 },
    { id: "480p", label: "480p MP4", size: 21 * 1024 * 1024 },
    { id: "mp3", label: "MP3 audio only", size: 6 * 1024 * 1024 },
  ],
};

function Downloader({ addHistory, profile, onAuthOpen }) {
  const toast = useToast();
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null); // detection result
  const [checking, setChecking] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [job, setJob] = useState(null); // {progress, status}
  const [sampleMode, setSampleMode] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  function runDetect(e) {
    e && e.preventDefault();
    if (!url.trim()) {
      toast({ tone: "error", title: "Paste a URL first", body: "The input is empty right now." });
      return;
    }
    setChecking(true);
    setResult(null);
    setJob(null);
    setSelectedFormat(null);
    setSampleMode(false);
    setTimeout(() => {
      const detected = detectUrl(url);
      setResult(detected);
      setChecking(false);
    }, 650);
  }

  function startSample() {
    setSampleMode(true);
    setResult({ status: "sample" });
    setSelectedFormat(SAMPLE_ITEM.formats[0].id);
    setJob(null);
  }

  function beginDownload(formatId) {
    const fmt = SAMPLE_ITEM.formats.find((f) => f.id === formatId);
    setJob({ progress: 0, status: "running" });
    let p = 0;
    timerRef.current = setInterval(() => {
      p += Math.random() * 14 + 6;
      if (p >= 100) {
        p = 100;
        clearInterval(timerRef.current);
        setJob({ progress: 100, status: "done" });
        toast({ tone: "success", title: "Sample complete", body: "This shows the flow — paste a direct file link to download for real." });
        addHistory({ id: uid(), title: SAMPLE_ITEM.title, kind: SAMPLE_ITEM.kind, quality: fmt.label, size: fmt.size, date: Date.now(), sample: true });
        return;
      }
      setJob({ progress: p, status: "running" });
    }, 260);
  }

  function realDownload(finalUrl, filename) {
    try {
      const a = document.createElement("a");
      a.href = finalUrl;
      a.download = filename || "";
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast({ tone: "success", title: "Download started", body: "Your browser is handling the transfer directly." });
      addHistory({ id: uid(), title: filename || finalUrl, kind: "file", quality: "Original", size: null, date: Date.now(), sample: false });
    } catch {
      toast({ tone: "error", title: "Couldn't start the download", body: "The browser blocked the request. Try opening the link directly." });
    }
  }

  return (
    <div className="view-shell">
      <div className="view-head">
        <h1>Downloader</h1>
        <p>Paste a URL to detect what it is. Direct file links download for real — everything else is handled honestly.</p>
      </div>

      <Card className="downloader-card">
        <form className="downloader-form" onSubmit={runDetect}>
          <div className="hero-input hero-input-flat">
            <Link2 size={16} className="hero-input-icon" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/file.mp4"
              aria-label="Media URL"
            />
          </div>
          <Btn type="submit" icon={checking ? Loader2 : Search} disabled={checking} className={checking ? "spin-icon" : ""}>
            {checking ? "Detecting…" : "Detect"}
          </Btn>
        </form>
        <button className="sample-link" onClick={startSample}>
          <Sparkles size={13} /> Try a sample instead
        </button>
      </Card>

      {checking ? (
        <Card className="result-card">
          <Skeleton w="60%" h="18px" />
          <div style={{ height: 10 }} />
          <Skeleton w="40%" h="12px" />
          <div style={{ height: 16 }} />
          <Skeleton w="100%" h="44px" />
        </Card>
      ) : null}

      {!checking && result?.status === "invalid" ? (
        <Card className="result-card">
          <EmptyState
            icon={AlertTriangle}
            title="That doesn't look like a valid URL"
            body="Double-check it starts with http:// or https:// and try again."
          />
        </Card>
      ) : null}

      {!checking && result?.status === "unknown" ? (
        <Card className="result-card">
          <EmptyState
            icon={Info}
            title="Couldn't confirm this is downloadable media"
            body="Relay didn't recognize this as a supported platform or a direct media file. If it's a direct link to a video, audio or image file, double-check the file extension is in the URL."
          />
        </Card>
      ) : null}

      {!checking && result?.status === "matched" && result.platform.restricted ? (
        <Card className="result-card">
          <div className="result-head">
            <Badge tone="amber">{result.platform.label} detected</Badge>
          </div>
          <h3 className="result-title">Downloading isn't available for this platform</h3>
          <p className="result-body">
            {result.platform.label} doesn't permit downloading content outside its own official tools —
            offering it here would break their terms of service and, often, the uploader's copyright. Relay
            won't work around that.
          </p>
          <p className="result-suggestion">Try a direct file link, or an open-license source like the Internet Archive or Wikimedia Commons.</p>
        </Card>
      ) : null}

      {!checking && result?.status === "matched" && result.platform.kind === "open" && !result.platform.direct ? (
        <Card className="result-card">
          <div className="result-head"><Badge tone="mint">{result.platform.label} detected</Badge></div>
          <h3 className="result-title">Open-license source</h3>
          <p className="result-body">
            This source generally permits downloading, but pulling exact formats needs a backend media
            service this preview doesn't run. You can open the item directly instead.
          </p>
          <Btn icon={ArrowUpRight} onClick={() => window.open(result.url, "_blank", "noopener")}>Open source page</Btn>
        </Card>
      ) : null}

      {!checking && result?.status === "matched" && result.platform.direct ? (
        <Card className="result-card">
          <div className="result-head"><Badge tone="cyan">Direct file</Badge></div>
          <h3 className="result-title">{result.filename}</h3>
          <p className="result-body">This is a direct link to a media file — Relay can hand it straight to your browser.</p>
          <Btn icon={Download} onClick={() => realDownload(result.url, result.filename)}>Download file</Btn>
        </Card>
      ) : null}

      {sampleMode ? (
        <Card className="result-card">
          <div className="result-head"><Badge tone="violet">Sample preview</Badge></div>
          <h3 className="result-title">{SAMPLE_ITEM.title}</h3>
          <div className="result-meta">
            <span><Video size={13} /> {SAMPLE_ITEM.kind}</span>
            <span><Clock size={13} /> {SAMPLE_ITEM.duration}</span>
          </div>
          <div className="format-grid">
            {SAMPLE_ITEM.formats.map((f) => (
              <button
                key={f.id}
                className={`format-chip ${selectedFormat === f.id ? "format-chip-active" : ""}`}
                onClick={() => setSelectedFormat(f.id)}
                disabled={job?.status === "running"}
              >
                <span>{f.label}</span>
                <span className="format-chip-size">{formatBytes(f.size)}</span>
              </button>
            ))}
          </div>

          {job?.status === "running" ? (
            <div className="job-progress">
              <ProgressBar value={job.progress} />
              <div className="job-progress-row">
                <span>Preparing {SAMPLE_ITEM.formats.find((f) => f.id === selectedFormat)?.label}…</span>
                <span>{Math.round(job.progress)}%</span>
              </div>
            </div>
          ) : job?.status === "done" ? (
            <div className="job-success"><CheckCircle2 size={16} /> Sample complete — added to history{profile ? "" : " (sign in to keep it)"}.</div>
          ) : (
            <Btn icon={Download} onClick={() => beginDownload(selectedFormat)}>Simulate download</Btn>
          )}
        </Card>
      ) : null}

      {!profile ? (
        <button className="inline-auth-hint" onClick={onAuthOpen}>
          <User size={13} /> Set up a profile to keep your download history
        </button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------------
   AI ASSISTANT — CORE
------------------------------------------------------------------------- */

async function streamCore(messages, onDelta) {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        stream: true,
        system: CORE_SYSTEM_PROMPT,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages,
      }),
    });
    if (!res.ok || !res.body) throw new Error("stream-unavailable");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";
    let gotAny = false;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";
      for (const part of parts) {
        const line = part.split("\n").find((l) => l.startsWith("data:"));
        if (!line) continue;
        const jsonStr = line.slice(5).trim();
        if (!jsonStr || jsonStr === "[DONE]") continue;
        try {
          const evt = JSON.parse(jsonStr);
          if (evt.type === "content_block_delta" && evt.delta && evt.delta.type === "text_delta") {
            full += evt.delta.text;
            gotAny = true;
            onDelta(full);
          }
        } catch (_) { /* ignore partial parse */ }
      }
    }
    if (!gotAny) throw new Error("empty-stream");
    return full;
  } catch (err) {
    const res2 = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: CORE_SYSTEM_PROMPT,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages,
      }),
    });
    const data = await res2.json();
    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    if (!text) throw new Error("no-response");
    for (let i = 4; i <= text.length; i += 4) { onDelta(text.slice(0, i)); await sleep(6); }
    onDelta(text);
    return text;
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = () => reject(new Error("read-failed"));
    r.readAsDataURL(file);
  });
}

function AIAssistant({ conversations, setConversations, profile, onAuthOpen }) {
  const toast = useToast();
  const [activeId, setActiveId] = useState(conversations[0]?.id || null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const fileRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!activeId && conversations.length) setActiveId(conversations[0].id);
  }, [conversations, activeId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  });

  const active = conversations.find((c) => c.id === activeId) || null;

  function newConversation() {
    const convo = { id: uid(), title: "New conversation", messages: [], createdAt: Date.now() };
    setConversations((prev) => [convo, ...prev]);
    setActiveId(convo.id);
  }

  function clearChat() {
    if (!active) return;
    setConversations((prev) => prev.map((c) => (c.id === active.id ? { ...c, messages: [] } : c)));
  }

  function deleteConversation(id) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  }

  async function handleFilePick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ tone: "error", title: "File too large", body: "Attach something under 5 MB." });
      return;
    }
    if (file.type.startsWith("image/")) {
      const b64 = await fileToBase64(file);
      setAttachment({ kind: "image", name: file.name, mediaType: file.type, data: b64 });
    } else if (file.type === "application/pdf") {
      const b64 = await fileToBase64(file);
      setAttachment({ kind: "pdf", name: file.name, mediaType: file.type, data: b64 });
    } else {
      const text = await file.text();
      setAttachment({ kind: "text", name: file.name, text: text.slice(0, 20000) });
    }
  }

  async function send(overrideText) {
    const text = (overrideText ?? input).trim();
    if (!text && !attachment) return;
    if (streaming) return;

    let convo = active;
    if (!convo) {
      convo = { id: uid(), title: text.slice(0, 40) || "New conversation", messages: [], createdAt: Date.now() };
      setConversations((prev) => [convo, ...prev]);
      setActiveId(convo.id);
    }

    const userContent = [];
    if (attachment?.kind === "image") userContent.push({ type: "image", source: { type: "base64", media_type: attachment.mediaType, data: attachment.data } });
    if (attachment?.kind === "pdf") userContent.push({ type: "document", source: { type: "base64", media_type: attachment.mediaType, data: attachment.data } });
    let textForModel = text;
    if (attachment?.kind === "text") textForModel = `${text}\n\n[Attached file: ${attachment.name}]\n${attachment.text}`;
    userContent.push({ type: "text", text: textForModel || "Take a look at this file." });

    const userMsg = { role: "user", content: userContent, display: text, attachmentName: attachment?.name };
    const assistantMsg = { role: "assistant", content: "", pending: true };

    setConversations((prev) => prev.map((c) => c.id === convo.id
      ? { ...c, title: c.messages.length === 0 ? (text.slice(0, 40) || attachment?.name || "New conversation") : c.title, messages: [...c.messages, userMsg, assistantMsg] }
      : c));

    setInput("");
    setAttachment(null);
    setStreaming(true);

    const history = [...(convo.messages || []), userMsg].map((m) => ({
      role: m.role,
      content: typeof m.content === "string" ? m.content : m.content,
    }));

    try {
      await streamCore(history, (partial) => {
        setConversations((prev) => prev.map((c) => c.id === convo.id
          ? { ...c, messages: c.messages.map((m, idx) => idx === c.messages.length - 1 ? { role: "assistant", content: partial, pending: false } : m) }
          : c));
      });
    } catch (err) {
      setConversations((prev) => prev.map((c) => c.id === convo.id
        ? { ...c, messages: c.messages.map((m, idx) => idx === c.messages.length - 1 ? { role: "assistant", content: "", error: true, pending: false } : m) }
        : c));
      toast({ tone: "error", title: "Core couldn't respond", body: "That request failed — try again in a moment." });
    } finally {
      setStreaming(false);
    }
  }

  function regenerate() {
    if (!active || streaming) return;
    const msgs = active.messages;
    let lastUserIdx = -1;
    for (let i = msgs.length - 1; i >= 0; i--) { if (msgs[i].role === "user") { lastUserIdx = i; break; } }
    if (lastUserIdx === -1) return;
    const trimmed = msgs.slice(0, lastUserIdx + 1);
    setConversations((prev) => prev.map((c) => (c.id === active.id ? { ...c, messages: trimmed } : c)));
    const lastUser = msgs[lastUserIdx];
    setTimeout(() => resend(active.id, trimmed), 0);
  }

  async function resend(convoId, historyMsgs) {
    const assistantMsg = { role: "assistant", content: "", pending: true };
    setConversations((prev) => prev.map((c) => c.id === convoId ? { ...c, messages: [...c.messages, assistantMsg] } : c));
    setStreaming(true);
    try {
      await streamCore(historyMsgs, (partial) => {
        setConversations((prev) => prev.map((c) => c.id === convoId
          ? { ...c, messages: c.messages.map((m, idx) => idx === c.messages.length - 1 ? { role: "assistant", content: partial, pending: false } : m) }
          : c));
      });
    } catch {
      toast({ tone: "error", title: "Core couldn't respond", body: "That request failed — try again in a moment." });
    } finally {
      setStreaming(false);
    }
  }

  function copyMessage(content) {
    const text = typeof content === "string" ? content : "";
    try {
      navigator.clipboard.writeText(text);
      toast({ tone: "success", title: "Copied to clipboard" });
    } catch {
      toast({ tone: "info", title: "Select and copy manually", body: "Clipboard access is blocked in this preview." });
    }
  }

  return (
    <div className="ai-shell">
      <aside className="ai-sidebar">
        <Btn icon={Plus} onClick={newConversation} className="ai-new-btn">New conversation</Btn>
        <div className="ai-convo-list">
          {conversations.length === 0 ? (
            <div className="ai-convo-empty">No conversations yet</div>
          ) : conversations.map((c) => (
            <div key={c.id} className={`ai-convo-item ${c.id === activeId ? "ai-convo-item-active" : ""}`}>
              <button onClick={() => setActiveId(c.id)}>{c.title || "Untitled"}</button>
              <button className="ai-convo-delete" onClick={() => deleteConversation(c.id)} aria-label="Delete conversation"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      </aside>

      <section className="ai-main">
        <div className="ai-topbar">
          <div className="ai-topbar-title"><Sparkles size={16} /> Core</div>
          <div className="ai-topbar-actions">
            <button className="icon-btn" onClick={clearChat} title="Clear chat" aria-label="Clear chat"><X size={15} /></button>
          </div>
        </div>

        <div className="ai-thread" ref={scrollRef}>
          {!active || active.messages.length === 0 ? (
            <div className="ai-welcome">
              <div className="ai-welcome-icon"><Sparkles size={26} /></div>
              <h2>Ask Core anything</h2>
              <p>General questions, writing, code, summaries, translation, or a document you paste in — Core handles it, and searches the web when it needs current information.</p>
              <div className="suggested-row">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button key={p} className="suggested-chip" onClick={() => send(p)}>{p}</button>
                ))}
              </div>
            </div>
          ) : (
            active.messages.map((m, idx) => (
              <div key={idx} className={`chat-row chat-row-${m.role}`}>
                <div className={`chat-bubble chat-bubble-${m.role}`}>
                  {m.role === "user" ? (
                    <>
                      {m.attachmentName ? <div className="chat-attachment"><Paperclip size={12} /> {m.attachmentName}</div> : null}
                      <div className="chat-plain">{m.display ?? m.content}</div>
                    </>
                  ) : m.error ? (
                    <div className="chat-error"><AlertTriangle size={14} /> Core hit an error responding. Try again.</div>
                  ) : m.pending && !m.content ? (
                    <div className="typing-indicator"><span /><span /><span /></div>
                  ) : (
                    <div className="md-body">{renderMarkdown(m.content)}</div>
                  )}
                </div>
                {m.role === "assistant" && !m.pending && !m.error ? (
                  <div className="chat-actions">
                    <button onClick={() => copyMessage(m.content)} title="Copy"><Copy size={13} /></button>
                    {idx === active.messages.length - 1 ? (
                      <button onClick={regenerate} title="Regenerate"><RefreshCw size={13} /></button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>

        <div className="ai-composer">
          {attachment ? (
            <div className="composer-attachment">
              <Paperclip size={12} /> {attachment.name}
              <button onClick={() => setAttachment(null)} aria-label="Remove attachment"><X size={12} /></button>
            </div>
          ) : null}
          <div className="composer-row">
            <button className="icon-btn" onClick={() => fileRef.current?.click()} title="Attach file" aria-label="Attach file"><Paperclip size={16} /></button>
            <input ref={fileRef} type="file" accept="image/*,.pdf,.txt,.md,.csv,.json" hidden onChange={handleFilePick} />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Message Core…"
              rows={1}
            />
            <button className="send-btn" onClick={() => send()} disabled={streaming || (!input.trim() && !attachment)} aria-label="Send message">
              {streaming ? <Loader2 size={16} className="spin-icon" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------------
   AUTH MODAL (local profile — see note in FAQ about scope)
------------------------------------------------------------------------- */

function AuthModal({ open, onClose, onCreateProfile, existingProfile }) {
  const [tab, setTab] = useState("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [color, setColor] = useState(AVATAR_COLORS[0]);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginMsg, setLoginMsg] = useState(null);

  function submitSignup(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onCreateProfile({ name: name.trim(), email: email.trim(), color, joinedAt: Date.now() });
  }

  function submitLogin(e) {
    e.preventDefault();
    if (existingProfile && existingProfile.email.toLowerCase() === loginEmail.trim().toLowerCase()) {
      onCreateProfile(existingProfile);
    } else {
      setLoginMsg("No matching profile found in this browser's storage — try Create profile instead.");
    }
  }

  return (
    <Modal open={open} onClose={onClose} width={420}>
      <div className="auth-tabs">
        <button className={tab === "signup" ? "auth-tab-active" : ""} onClick={() => setTab("signup")}>Create profile</button>
        <button className={tab === "login" ? "auth-tab-active" : ""} onClick={() => setTab("login")}>Log in</button>
        <button className={tab === "forgot" ? "auth-tab-active" : ""} onClick={() => setTab("forgot")}>Forgot password</button>
      </div>

      {tab === "signup" ? (
        <form onSubmit={submitSignup} className="auth-form">
          <label>Name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ava Chen" required /></label>
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ava@example.com" required /></label>
          <div className="color-row">
            {AVATAR_COLORS.map((c) => (
              <button type="button" key={c} className={`color-dot ${color === c ? "color-dot-active" : ""}`} style={{ background: c }} onClick={() => setColor(c)} aria-label={`Choose color ${c}`} />
            ))}
          </div>
          <p className="auth-note">This preview keeps your profile in your account's private storage — no password required here.</p>
          <Btn type="submit" className="auth-submit">Create profile</Btn>
        </form>
      ) : tab === "login" ? (
        <form onSubmit={submitLogin} className="auth-form">
          <label>Email<input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="ava@example.com" required /></label>
          {loginMsg ? <p className="auth-note auth-note-warn">{loginMsg}</p> : null}
          <Btn type="submit" className="auth-submit">Log in</Btn>
        </form>
      ) : (
        <div className="auth-form">
          <p className="auth-note">
            This preview build doesn't use passwords, so there's nothing to reset — your profile is tied
            automatically to your account. A production version would trigger a real reset email from the
            backend service.
          </p>
        </div>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------------
   DASHBOARD
------------------------------------------------------------------------- */

function Dashboard({ profile, history, saved, conversations, setView, toggleSave }) {
  const chartData = (() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = days.map((d) => ({ day: d, downloads: 0 }));
    history.forEach((h) => {
      const idx = new Date(h.date).getDay();
      counts[idx].downloads += 1;
    });
    return counts;
  })();

  const hasActivity = history.length > 0;

  return (
    <div className="view-shell">
      <div className="view-head">
        <h1>Welcome back, {profile.name.split(" ")[0]}</h1>
        <p>Here's what's been happening across Relay and Core.</p>
      </div>

      <div className="stat-grid">
        <Card className="stat-card"><Download size={16} /><div><span>{history.length}</span><label>Downloads</label></div></Card>
        <Card className="stat-card"><MessageSquare size={16} /><div><span>{conversations.length}</span><label>Core chats</label></div></Card>
        <Card className="stat-card"><Star size={16} /><div><span>{saved.length}</span><label>Saved items</label></div></Card>
        <Card className="stat-card"><Bell size={16} /><div><span>0</span><label>Notifications</label></div></Card>
      </div>

      <div className="dash-grid">
        <Card className="dash-panel">
          <div className="dash-panel-head"><h3><BarChart3 size={15} /> Weekly activity</h3></div>
          {hasActivity ? (
            <div style={{ width: "100%", height: 180 }}>
              <ResponsiveContainer>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" stroke="var(--text-faint)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-faint)" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} width={24} />
                  <Tooltip contentStyle={{ background: "var(--surface-solid)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)" }} />
                  <Bar dataKey="downloads" fill="var(--cyan)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={Activity} title="No activity yet" body="Your download activity will show up here once you start using the Downloader." />
          )}
        </Card>

        <Card className="dash-panel">
          <div className="dash-panel-head"><h3><Download size={15} /> Recent downloads</h3><button onClick={() => setView("downloader")}>Open downloader</button></div>
          {history.length === 0 ? (
            <EmptyState icon={Download} title="Nothing downloaded yet" body="Items you download will appear here." />
          ) : (
            <ul className="history-list">
              {history.slice(0, 5).map((h) => (
                <li key={h.id}>
                  <div className="history-icon">{h.kind === "audio" ? <Music size={14} /> : h.kind === "image" ? <ImageIcon size={14} /> : <Video size={14} />}</div>
                  <div className="history-meta">
                    <span className="history-title">{h.title}</span>
                    <span className="history-sub">{h.quality} · {formatBytes(h.size)}</span>
                  </div>
                  <button className="save-toggle" onClick={() => toggleSave(h)} aria-label="Save item"><Star size={14} fill={saved.some((s) => s.id === h.id) ? "currentColor" : "none"} /></button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="dash-panel">
          <div className="dash-panel-head"><h3><MessageSquare size={15} /> Recent Core chats</h3><button onClick={() => setView("ai")}>Open Core</button></div>
          {conversations.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No conversations yet" body="Ask Core something to get started." />
          ) : (
            <ul className="history-list">
              {conversations.slice(0, 5).map((c) => (
                <li key={c.id}>
                  <div className="history-icon"><Sparkles size={14} /></div>
                  <div className="history-meta">
                    <span className="history-title">{c.title}</span>
                    <span className="history-sub">{c.messages.length} messages</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="dash-panel">
          <div className="dash-panel-head"><h3><Star size={15} /> Saved items</h3></div>
          {saved.length === 0 ? (
            <EmptyState icon={Star} title="Nothing saved" body="Star a download to keep it handy here." />
          ) : (
            <ul className="history-list">
              {saved.map((h) => (
                <li key={h.id}>
                  <div className="history-icon"><Bookmark size={14} /></div>
                  <div className="history-meta"><span className="history-title">{h.title}</span><span className="history-sub">{h.quality}</span></div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------
   SETTINGS / PROFILE
------------------------------------------------------------------------- */

function Settings({ profile, updateProfile, theme, setTheme, onLogout, onResetData }) {
  const toast = useToast();
  const [name, setName] = useState(profile.name);
  const [color, setColor] = useState(profile.color);
  const [notif, setNotif] = useState(profile.notifications !== false);

  function save() {
    updateProfile({ ...profile, name: name.trim() || profile.name, color, notifications: notif });
    toast({ tone: "success", title: "Settings saved" });
  }

  return (
    <div className="view-shell">
      <div className="view-head"><h1>Settings</h1><p>Manage your profile and preferences.</p></div>

      <Card className="settings-card">
        <h3>Profile</h3>
        <div className="settings-row">
          <Avatar name={name} color={color} size={56} />
          <div className="color-row">
            {AVATAR_COLORS.map((c) => (
              <button key={c} className={`color-dot ${color === c ? "color-dot-active" : ""}`} style={{ background: c }} onClick={() => setColor(c)} aria-label={`Choose color ${c}`} />
            ))}
          </div>
        </div>
        <label>Display name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label>Email<input value={profile.email} disabled /></label>
      </Card>

      <Card className="settings-card">
        <h3>Preferences</h3>
        <div className="toggle-row">
          <div><span>Theme</span><p>Switch between dark and light interfaces.</p></div>
          <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={15} /> : <Moon size={15} />} {theme === "dark" ? "Light" : "Dark"}</button>
        </div>
        <div className="toggle-row">
          <div><span>Notifications</span><p>Get notified about completed downloads.</p></div>
          <button className={`switch ${notif ? "switch-on" : ""}`} onClick={() => setNotif((v) => !v)} aria-label="Toggle notifications"><span /></button>
        </div>
      </Card>

      <Card className="settings-card">
        <h3>Security</h3>
        <p className="auth-note">Password management isn't part of this preview build — see the FAQ on the homepage for why, and what a production version would use instead.</p>
      </Card>

      <div className="settings-actions">
        <Btn onClick={save}>Save changes</Btn>
        <Btn variant="secondary" icon={LogOut} onClick={onLogout}>Log out</Btn>
        <Btn variant="danger" icon={Trash2} onClick={onResetData}>Reset all data</Btn>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------
   APP ROOT
------------------------------------------------------------------------- */

function AppInner() {
  const toast = useToast();
  const [view, setView] = useState("landing");
  const [theme, setTheme] = useState("dark");
  const [profile, setProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [saved, setSaved] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load profile + data from persistent storage on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("relay-profile", false);
        if (res?.value) setProfile(JSON.parse(res.value));
      } catch { /* no profile yet */ }
      setProfileLoaded(true);
      try {
        const lib = await window.storage.get("relay-library", false);
        if (lib?.value) {
          const parsed = JSON.parse(lib.value);
          setHistory(parsed.history || []);
          setSaved(parsed.saved || []);
        }
      } catch { /* empty */ }
      try {
        const convo = await window.storage.get("relay-conversations", false);
        if (convo?.value) setConversations(JSON.parse(convo.value));
      } catch { /* empty */ }
      setDataLoaded(true);
    })();
  }, []);

  // Persist library + conversations when they change (after initial load)
  useEffect(() => {
    if (!dataLoaded) return;
    window.storage.set("relay-library", JSON.stringify({ history: history.slice(0, 100), saved: saved.slice(0, 100) }), false).catch(() => {});
  }, [history, saved, dataLoaded]);

  useEffect(() => {
    if (!dataLoaded) return;
    window.storage.set("relay-conversations", JSON.stringify(conversations.slice(0, 30)), false).catch(() => {});
  }, [conversations, dataLoaded]);

  function createProfile(p) {
    setProfile(p);
    window.storage.set("relay-profile", JSON.stringify(p), false).catch(() => {});
    setAuthOpen(false);
    toast({ tone: "success", title: `Welcome, ${p.name.split(" ")[0]}`, body: "Your profile is saved to this account." });
    setView("dashboard");
  }

  function updateProfile(p) {
    setProfile(p);
    window.storage.set("relay-profile", JSON.stringify(p), false).catch(() => {});
  }

  function logout() {
    setProfile(null);
    setView("landing");
    toast({ tone: "info", title: "Logged out", body: "Your data is still saved for next time." });
  }

  function resetData() {
    setHistory([]);
    setSaved([]);
    setConversations([]);
    window.storage.set("relay-library", JSON.stringify({ history: [], saved: [] }), false).catch(() => {});
    window.storage.set("relay-conversations", JSON.stringify([]), false).catch(() => {});
    toast({ tone: "success", title: "Data cleared" });
  }

  function addHistory(item) {
    setHistory((prev) => [item, ...prev].slice(0, 100));
  }

  function toggleSave(item) {
    setSaved((prev) => (prev.some((s) => s.id === item.id) ? prev.filter((s) => s.id !== item.id) : [item, ...prev]));
  }

  const guardedView = (view === "dashboard" || view === "settings") && !profile ? "landing" : view;

  return (
    <div className={`app-root theme-${theme}`}>
      <TopNav view={guardedView} setView={setView} profile={profile} onAuthOpen={() => setAuthOpen(true)} onLogout={logout} theme={theme} setTheme={setTheme} />

      <main className="app-main">
        {guardedView === "landing" ? <Landing setView={setView} onAuthOpen={() => setAuthOpen(true)} profile={profile} /> : null}
        {guardedView === "downloader" ? <Downloader addHistory={addHistory} profile={profile} onAuthOpen={() => setAuthOpen(true)} /> : null}
        {guardedView === "ai" ? <AIAssistant conversations={conversations} setConversations={setConversations} profile={profile} onAuthOpen={() => setAuthOpen(true)} /> : null}
        {guardedView === "dashboard" && profile ? <Dashboard profile={profile} history={history} saved={saved} conversations={conversations} setView={setView} toggleSave={toggleSave} /> : null}
        {guardedView === "settings" && profile ? <Settings profile={profile} updateProfile={updateProfile} theme={theme} setTheme={setTheme} onLogout={logout} onResetData={resetData} /> : null}
      </main>

      <BottomNav view={guardedView} setView={setView} profile={profile} onAuthOpen={() => setAuthOpen(true)} />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onCreateProfile={createProfile} existingProfile={profile} />

      <StyleSheet />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}

/* ------------------------------------------------------------------------
   STYLES
------------------------------------------------------------------------- */

function StyleSheet() {
  return (
    <style>{`
      :root{
        --bg:#06070f; --bg-soft:#0a0c1c; --surface: rgba(255,255,255,0.045); --surface-solid:#12142a;
        --border: rgba(255,255,255,0.09); --border-strong: rgba(255,255,255,0.18);
        --text:#eef0fb; --text-dim:#9a9fc0; --text-faint:#5c6089;
        --violet:#7c5cff; --violet-soft:#a78bfa; --cyan:#22d3ee; --coral:#fb7185; --amber:#fbbf24; --mint:#34d399;
        --radius-sm:10px; --radius-md:16px; --radius-lg:24px;
        --font-display: 'Sora', ui-sans-serif, system-ui, sans-serif;
        --font-body: 'Manrope', ui-sans-serif, system-ui, sans-serif;
      }
      .theme-light{
        --bg:#f4f5fb; --bg-soft:#eceefa; --surface: rgba(20,20,45,0.045); --surface-solid:#ffffff;
        --border: rgba(20,20,45,0.09); --border-strong: rgba(20,20,45,0.16);
        --text:#12132b; --text-dim:#54587a; --text-faint:#8f93b3;
      }
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap');

      .app-root{ background:var(--bg); color:var(--text); font-family:var(--font-body); min-height:100vh; transition:background .25s ease,color .25s ease; }
      .app-root *{ box-sizing:border-box; }
      .app-main{ padding-bottom:72px; }
      @media (min-width:900px){ .app-main{ padding-bottom:0; } }
      h1,h2,h3,h4,h5{ font-family:var(--font-display); margin:0; letter-spacing:-0.01em; }
      p{ margin:0; color:var(--text-dim); line-height:1.6; }
      button{ font-family:var(--font-body); cursor:pointer; }
      input,textarea{ font-family:var(--font-body); background:transparent; border:none; color:var(--text); outline:none; }
      :focus-visible{ outline:2px solid var(--cyan); outline-offset:2px; border-radius:6px; }
      @media (prefers-reduced-motion: reduce){ *{ animation:none !important; transition:none !important; } }

      /* Nav */
      .top-nav{ position:sticky; top:0; z-index:40; backdrop-filter:blur(14px); background:color-mix(in srgb, var(--bg) 78%, transparent); border-bottom:1px solid var(--border); display:none; }
      @media (min-width:900px){ .top-nav{ display:block; } }
      .top-nav-inner{ max-width:1180px; margin:0 auto; padding:14px 28px; display:flex; align-items:center; gap:32px; }
      .brand{ display:flex; align-items:center; gap:8px; background:none; border:none; color:var(--text); }
      .brand-mark{ width:30px; height:30px; border-radius:9px; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,var(--violet),var(--cyan)); color:#0a0a14; }
      .brand-name{ font-family:var(--font-display); font-weight:700; font-size:17px; }
      .top-nav-links{ display:flex; gap:4px; flex:1; }
      .nav-link{ background:none; border:none; color:var(--text-dim); font-size:14px; font-weight:600; padding:8px 14px; border-radius:999px; }
      .nav-link:hover{ color:var(--text); background:var(--surface); }
      .nav-link-active{ color:var(--text); background:var(--surface); }
      .top-nav-actions{ display:flex; align-items:center; gap:10px; }
      .icon-btn{ background:var(--surface); border:1px solid var(--border); color:var(--text-dim); width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; gap:6px; }
      .icon-btn:hover{ color:var(--text); border-color:var(--border-strong); }
      .profile-menu{ position:relative; }
      .profile-chip{ display:flex; align-items:center; gap:8px; background:var(--surface); border:1px solid var(--border); border-radius:999px; padding:4px 10px 4px 4px; color:var(--text); }
      .profile-chip-name{ font-size:13px; font-weight:600; }
      .profile-dropdown{ position:absolute; right:0; top:44px; background:var(--surface-solid); border:1px solid var(--border); border-radius:12px; padding:6px; min-width:160px; box-shadow:0 20px 40px rgba(0,0,0,.35); }
      .profile-dropdown button{ display:flex; align-items:center; gap:8px; width:100%; text-align:left; background:none; border:none; color:var(--text-dim); padding:9px 10px; border-radius:8px; font-size:13px; }
      .profile-dropdown button:hover{ background:var(--surface); color:var(--text); }

      .bottom-nav{ position:fixed; bottom:0; left:0; right:0; z-index:40; display:flex; background:color-mix(in srgb, var(--bg-soft) 90%, transparent); backdrop-filter:blur(16px); border-top:1px solid var(--border); padding:6px 4px calc(6px + env(safe-area-inset-bottom)); }
      @media (min-width:900px){ .bottom-nav{ display:none; } }
      .bottom-nav-item{ flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; background:none; border:none; color:var(--text-faint); font-size:10.5px; font-weight:600; padding:6px 2px; border-radius:10px; }
      .bottom-nav-item-active{ color:var(--cyan); }

      /* Buttons */
      .btn{ display:inline-flex; align-items:center; justify-content:center; gap:7px; border-radius:12px; font-weight:700; border:1px solid transparent; white-space:nowrap; }
      .btn-md{ padding:11px 20px; font-size:14px; }
      .btn-sm{ padding:8px 14px; font-size:13px; }
      .btn-primary{ background:linear-gradient(135deg,var(--violet),var(--cyan)); color:#070713; }
      .btn-primary:hover{ filter:brightness(1.08); }
      .btn-secondary{ background:var(--surface); color:var(--text); border-color:var(--border-strong); }
      .btn-secondary:hover{ background:var(--surface-solid); }
      .btn-danger{ background:transparent; color:var(--coral); border-color:rgba(251,113,133,0.35); }
      .btn-danger:hover{ background:rgba(251,113,133,0.08); }
      .btn-disabled{ opacity:.55; pointer-events:none; }
      .spin-icon{ animation:spin 1s linear infinite; }
      @keyframes spin{ to{ transform:rotate(360deg); } }

      .badge{ display:inline-flex; align-items:center; padding:5px 11px; border-radius:999px; font-size:12px; font-weight:700; border:1px solid var(--border-strong); background:var(--surface); color:var(--text-dim); }
      .badge-violet{ color:var(--violet-soft); border-color:rgba(124,92,255,0.35); background:rgba(124,92,255,0.08); }
      .badge-cyan{ color:var(--cyan); border-color:rgba(34,211,238,0.35); background:rgba(34,211,238,0.08); }
      .badge-mint{ color:var(--mint); border-color:rgba(52,211,153,0.35); background:rgba(52,211,153,0.08); }
      .badge-amber{ color:var(--amber); border-color:rgba(251,191,36,0.35); background:rgba(251,191,36,0.08); }

      .card{ background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-md); padding:22px; }
      .card-glow{ box-shadow:0 0 0 1px rgba(124,92,255,0.12), 0 24px 60px rgba(124,92,255,0.12); }

      .skeleton{ background:linear-gradient(90deg, var(--surface) 25%, var(--border) 37%, var(--surface) 63%); background-size:400% 100%; animation:shimmer 1.4s ease infinite; }
      @keyframes shimmer{ 0%{ background-position:100% 0; } 100%{ background-position:0 0; } }

      .progress-track{ height:8px; border-radius:999px; background:var(--border); overflow:hidden; }
      .progress-fill{ height:100%; background:linear-gradient(90deg,var(--violet),var(--cyan)); border-radius:999px; transition:width .25s ease; }

      .empty-state{ display:flex; flex-direction:column; align-items:flex-start; gap:6px; padding:8px 0; }
      .empty-icon{ width:38px; height:38px; border-radius:10px; background:var(--surface); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; color:var(--text-dim); margin-bottom:4px; }
      .empty-title{ font-weight:700; font-size:14.5px; }
      .empty-body{ color:var(--text-dim); font-size:13.5px; max-width:40ch; }

      .modal-backdrop{ position:fixed; inset:0; background:rgba(4,4,10,.6); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:80; padding:16px; }
      .modal-panel{ position:relative; width:100%; background:var(--surface-solid); border:1px solid var(--border-strong); border-radius:var(--radius-lg); padding:28px; box-shadow:0 30px 80px rgba(0,0,0,.5); }
      .modal-close{ position:absolute; top:16px; right:16px; background:var(--surface); border:1px solid var(--border); color:var(--text-dim); width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; }

      .avatar{ border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; flex-shrink:0; }

      .toast-stack{ position:fixed; bottom:88px; right:16px; z-index:100; display:flex; flex-direction:column; gap:8px; max-width:320px; }
      @media (min-width:900px){ .toast-stack{ bottom:20px; } }
      .toast{ display:flex; gap:10px; background:var(--surface-solid); border:1px solid var(--border-strong); border-radius:12px; padding:12px 14px; box-shadow:0 20px 40px rgba(0,0,0,.35); animation:toast-in .22s ease; }
      @keyframes toast-in{ from{ transform:translateY(8px); opacity:0; } to{ transform:translateY(0); opacity:1; } }
      .toast-success{ border-color:rgba(52,211,153,0.4); color:var(--mint); }
      .toast-error{ border-color:rgba(251,113,133,0.4); color:var(--coral); }
      .toast-title{ font-size:13.5px; font-weight:700; color:var(--text); }
      .toast-body{ font-size:12.5px; color:var(--text-dim); }

      /* Landing */
      .hero{ position:relative; padding:72px 20px 56px; text-align:center; overflow:hidden; }
      @media (min-width:900px){ .hero{ padding:120px 20px 80px; } }
      .aurora{ position:absolute; inset:-20% -10%; background: radial-gradient(circle at 25% 25%, rgba(124,92,255,0.28), transparent 55%), radial-gradient(circle at 75% 35%, rgba(34,211,238,0.22), transparent 50%), radial-gradient(circle at 50% 80%, rgba(251,113,133,0.12), transparent 55%); filter:blur(40px); animation:drift 18s ease-in-out infinite alternate; z-index:0; }
      @keyframes drift{ from{ transform:translate3d(0,0,0) scale(1); } to{ transform:translate3d(2%, -2%, 0) scale(1.05); } }
      .hero-inner{ position:relative; z-index:1; max-width:720px; margin:0 auto; display:flex; flex-direction:column; align-items:center; gap:18px; animation:hero-in .6s ease; }
      @keyframes hero-in{ from{ opacity:0; transform:translateY(14px); } to{ opacity:1; transform:translateY(0); } }
      .hero-title{ font-size:40px; line-height:1.08; font-weight:800; }
      @media (min-width:700px){ .hero-title{ font-size:60px; } }
      .hero-sub{ font-size:16px; max-width:52ch; }
      .hero-input-row{ display:flex; gap:10px; width:100%; max-width:560px; flex-direction:column; }
      @media (min-width:560px){ .hero-input-row{ flex-direction:row; } }
      .hero-input{ position:relative; flex:1; display:flex; align-items:center; gap:10px; background:var(--surface-solid); border:1px solid var(--border-strong); border-radius:14px; padding:13px 16px; overflow:hidden; }
      .hero-input-flat{ background:var(--surface); }
      .hero-input-icon{ color:var(--text-faint); flex-shrink:0; }
      .hero-input input{ flex:1; font-size:14.5px; color:var(--text); }
      .hero-input input::placeholder{ color:var(--text-faint); }
      .scanline{ position:absolute; left:0; top:0; bottom:0; width:2px; background:linear-gradient(180deg,transparent,var(--cyan),transparent); opacity:.6; animation:scan 3.4s linear infinite; }
      @keyframes scan{ from{ left:-2px; } to{ left:100%; } }
      .hero-actions{ margin-top:2px; }
      .hero-ai-cta{ display:inline-flex; align-items:center; gap:7px; background:none; border:none; color:var(--violet-soft); font-size:13.5px; font-weight:600; }
      .hero-ai-cta:hover{ color:var(--cyan); }

      .section{ max-width:1180px; margin:0 auto; padding:52px 20px; }
      .section-head{ margin-bottom:26px; display:flex; flex-direction:column; gap:8px; max-width:60ch; }
      .section-head h2{ font-size:26px; }
      @media (min-width:900px){ .section-head h2{ font-size:30px; } }

      .platform-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
      @media (min-width:640px){ .platform-grid{ grid-template-columns:repeat(3,1fr); } }
      @media (min-width:960px){ .platform-grid{ grid-template-columns:repeat(4,1fr); } }
      .platform-tile{ background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:14px 16px; display:flex; flex-direction:column; gap:3px; }
      .platform-name{ font-weight:700; font-size:13.5px; }
      .platform-note{ font-size:11.5px; color:var(--text-faint); }

      .feature-grid{ display:grid; grid-template-columns:1fr; gap:14px; }
      @media (min-width:640px){ .feature-grid{ grid-template-columns:repeat(2,1fr); } }
      @media (min-width:960px){ .feature-grid{ grid-template-columns:repeat(3,1fr); } }
      .feature-card h3{ font-size:15.5px; margin:12px 0 6px; }
      .feature-card p{ font-size:13.5px; }
      .feature-icon{ width:34px; height:34px; border-radius:10px; background:var(--surface-solid); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; color:var(--cyan); }

      .section-ai{ background:radial-gradient(circle at 20% 20%, rgba(124,92,255,0.08), transparent 60%); border-radius:var(--radius-lg); }
      .ai-showcase{ display:grid; grid-template-columns:1fr; gap:28px; }
      @media (min-width:900px){ .ai-showcase{ grid-template-columns:1fr 1fr; align-items:center; } }
      .ai-showcase-copy{ display:flex; flex-direction:column; gap:14px; align-items:flex-start; }
      .ai-showcase-copy h2{ font-size:28px; }
      .ai-capability-grid{ display:grid; grid-template-columns:1fr 1fr; gap:10px; }
      .ai-capability-tile{ background:var(--surface-solid); border:1px solid var(--border); border-radius:12px; padding:13px; display:flex; gap:10px; align-items:flex-start; color:var(--cyan); }
      .ai-capability-title{ font-size:13px; font-weight:700; color:var(--text); }
      .ai-capability-body{ font-size:12px; color:var(--text-dim); margin-top:2px; }

      .steps-row{ display:grid; grid-template-columns:1fr; gap:14px; }
      @media (min-width:768px){ .steps-row{ grid-template-columns:repeat(3,1fr); } }
      .step-tile{ background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-md); padding:22px; }
      .step-number{ width:30px; height:30px; border-radius:9px; background:linear-gradient(135deg,var(--violet),var(--cyan)); color:#070713; font-weight:800; display:flex; align-items:center; justify-content:center; margin-bottom:12px; font-size:14px; }
      .step-title{ font-family:var(--font-display); font-weight:700; font-size:16px; margin-bottom:4px; }
      .step-body{ font-size:13.5px; color:var(--text-dim); }

      .security-panel{ display:grid; grid-template-columns:1fr; gap:22px; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-lg); padding:28px; }
      @media (min-width:900px){ .security-panel{ grid-template-columns:1.1fr 1fr; } }
      .security-copy{ display:flex; flex-direction:column; gap:12px; align-items:flex-start; }
      .security-list{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:12px; justify-content:center; }
      .security-list li{ display:flex; align-items:center; gap:10px; font-size:13.5px; color:var(--text-dim); }

      .dash-preview{ display:flex; flex-direction:column; gap:18px; align-items:flex-start; }
      .dash-preview-grid{ display:flex; gap:26px; }
      .dash-preview-stat span{ font-family:var(--font-display); font-size:24px; font-weight:800; display:block; }
      .dash-preview-stat label{ font-size:12px; color:var(--text-faint); }
      .dash-preview-bars{ display:flex; align-items:flex-end; gap:6px; height:60px; width:100%; }
      .dash-preview-bars span{ flex:1; background:linear-gradient(180deg,var(--cyan),var(--violet)); border-radius:4px; opacity:.75; }

      .testimonial-grid{ display:grid; grid-template-columns:1fr; gap:14px; }
      @media (min-width:768px){ .testimonial-grid{ grid-template-columns:repeat(3,1fr); } }
      .testimonial-card p{ color:var(--text); font-size:14px; }
      .testimonial-name{ margin-top:14px; font-weight:700; font-size:13.5px; }
      .testimonial-role{ font-size:12px; color:var(--text-faint); }

      .faq-list{ display:flex; flex-direction:column; gap:8px; }
      .faq-item{ border:1px solid var(--border); border-radius:12px; background:var(--surface); overflow:hidden; }
      .faq-q{ width:100%; display:flex; align-items:center; justify-content:space-between; background:none; border:none; color:var(--text); font-weight:600; font-size:14px; padding:15px 16px; text-align:left; }
      .faq-chevron-open{ transform:rotate(180deg); transition:transform .2s ease; }
      .faq-a{ padding:0 16px 16px; color:var(--text-dim); font-size:13.5px; max-width:70ch; }

      .footer{ max-width:1180px; margin:0 auto; padding:52px 20px 40px; border-top:1px solid var(--border); }
      .footer-top p{ margin-top:8px; font-size:13.5px; max-width:40ch; }
      .footer-cols{ display:flex; gap:60px; margin:30px 0; flex-wrap:wrap; }
      .footer-cols h4{ font-size:12px; color:var(--text-faint); margin-bottom:10px; }
      .footer-cols div{ display:flex; flex-direction:column; gap:8px; }
      .footer-cols button, .footer-cols span{ background:none; border:none; text-align:left; color:var(--text-dim); font-size:13.5px; padding:0; }
      .footer-cols button:hover{ color:var(--text); }
      .footer-bottom{ font-size:12px; color:var(--text-faint); }

      /* Shared view shell */
      .view-shell{ max-width:1100px; margin:0 auto; padding:28px 18px 60px; display:flex; flex-direction:column; gap:18px; }
      @media (min-width:900px){ .view-shell{ padding:44px 28px 60px; } }
      .view-head h1{ font-size:26px; margin-bottom:6px; }
      @media (min-width:900px){ .view-head h1{ font-size:32px; } }
      .view-head p{ font-size:14px; }

      /* Downloader */
      .downloader-card{ display:flex; flex-direction:column; gap:12px; }
      .downloader-form{ display:flex; gap:10px; flex-direction:column; }
      @media (min-width:600px){ .downloader-form{ flex-direction:row; } }
      .sample-link{ align-self:flex-start; display:flex; align-items:center; gap:6px; background:none; border:none; color:var(--violet-soft); font-size:12.5px; font-weight:600; }
      .result-card{ display:flex; flex-direction:column; gap:10px; }
      .result-head{ display:flex; }
      .result-title{ font-size:18px; }
      .result-body{ font-size:13.5px; max-width:60ch; }
      .result-suggestion{ font-size:13px; color:var(--text-faint); }
      .result-meta{ display:flex; gap:16px; font-size:12.5px; color:var(--text-dim); }
      .result-meta span{ display:flex; align-items:center; gap:5px; }
      .format-grid{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }
      @media (min-width:560px){ .format-grid{ grid-template-columns:repeat(4,1fr); } }
      .format-chip{ display:flex; flex-direction:column; align-items:flex-start; gap:2px; background:var(--surface-solid); border:1px solid var(--border); border-radius:10px; padding:10px 12px; color:var(--text); font-size:12.5px; font-weight:700; }
      .format-chip-active{ border-color:var(--cyan); box-shadow:0 0 0 1px var(--cyan) inset; }
      .format-chip-size{ font-size:11px; color:var(--text-faint); font-weight:500; }
      .job-progress{ display:flex; flex-direction:column; gap:8px; }
      .job-progress-row{ display:flex; justify-content:space-between; font-size:12px; color:var(--text-dim); }
      .job-success{ display:flex; align-items:center; gap:8px; color:var(--mint); font-size:13.5px; font-weight:600; }
      .inline-auth-hint{ align-self:flex-start; display:flex; align-items:center; gap:6px; background:var(--surface); border:1px solid var(--border); border-radius:999px; padding:8px 14px; color:var(--text-dim); font-size:12.5px; }

      /* AI shell */
      .ai-shell{ display:flex; height:calc(100vh - 60px); max-height:820px; }
      @media (max-width:899px){ .ai-shell{ height:calc(100vh - 118px); flex-direction:column; } }
      .ai-sidebar{ width:250px; border-right:1px solid var(--border); padding:16px; display:flex; flex-direction:column; gap:12px; flex-shrink:0; }
      @media (max-width:899px){ .ai-sidebar{ display:none; } }
      .ai-new-btn{ width:100%; justify-content:center; }
      .ai-convo-list{ display:flex; flex-direction:column; gap:3px; overflow-y:auto; }
      .ai-convo-empty{ font-size:12.5px; color:var(--text-faint); padding:10px; }
      .ai-convo-item{ position:relative; display:flex; align-items:center; border-radius:9px; }
      .ai-convo-item button:first-child{ flex:1; text-align:left; background:none; border:none; color:var(--text-dim); font-size:13px; padding:9px 10px; border-radius:9px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
      .ai-convo-item:hover{ background:var(--surface); }
      .ai-convo-item-active button:first-child{ color:var(--text); font-weight:600; }
      .ai-convo-delete{ background:none; border:none; color:var(--text-faint); padding:6px; opacity:0; }
      .ai-convo-item:hover .ai-convo-delete{ opacity:1; }
      .ai-main{ flex:1; display:flex; flex-direction:column; min-width:0; }
      .ai-topbar{ display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-bottom:1px solid var(--border); }
      .ai-topbar-title{ display:flex; align-items:center; gap:8px; font-family:var(--font-display); font-weight:700; color:var(--violet-soft); }
      .ai-thread{ flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:14px; }
      .ai-welcome{ margin:auto; text-align:center; max-width:440px; display:flex; flex-direction:column; align-items:center; gap:10px; }
      .ai-welcome-icon{ width:52px; height:52px; border-radius:16px; background:linear-gradient(135deg,rgba(124,92,255,.25),rgba(34,211,238,.25)); display:flex; align-items:center; justify-content:center; color:var(--cyan); }
      .suggested-row{ display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-top:6px; }
      .suggested-chip{ background:var(--surface); border:1px solid var(--border); color:var(--text-dim); font-size:12.5px; padding:8px 13px; border-radius:999px; }
      .suggested-chip:hover{ color:var(--text); border-color:var(--border-strong); }
      .chat-row{ display:flex; flex-direction:column; max-width:78%; }
      .chat-row-user{ align-self:flex-end; align-items:flex-end; }
      .chat-row-assistant{ align-self:flex-start; align-items:flex-start; }
      .chat-bubble{ border-radius:16px; padding:12px 15px; font-size:14px; line-height:1.55; }
      .chat-bubble-user{ background:linear-gradient(135deg,var(--violet),var(--cyan)); color:#0a0a14; border-bottom-right-radius:4px; }
      .chat-bubble-assistant{ background:var(--surface); border:1px solid var(--border); border-bottom-left-radius:4px; }
      .chat-plain{ white-space:pre-wrap; }
      .chat-attachment{ display:flex; align-items:center; gap:5px; font-size:11.5px; opacity:.75; margin-bottom:4px; }
      .chat-error{ display:flex; align-items:center; gap:7px; color:var(--coral); font-size:13px; }
      .chat-actions{ display:flex; gap:4px; margin-top:4px; }
      .chat-actions button{ background:none; border:none; color:var(--text-faint); padding:4px; }
      .chat-actions button:hover{ color:var(--text); }
      .typing-indicator{ display:flex; gap:4px; padding:4px 0; }
      .typing-indicator span{ width:6px; height:6px; border-radius:50%; background:var(--text-faint); animation:bounce 1.2s infinite ease-in-out; }
      .typing-indicator span:nth-child(2){ animation-delay:.15s; }
      .typing-indicator span:nth-child(3){ animation-delay:.3s; }
      @keyframes bounce{ 0%,80%,100%{ transform:translateY(0); opacity:.4; } 40%{ transform:translateY(-4px); opacity:1; } }
      .md-body p, .md-body ul, .md-body h3, .md-body h4{ margin:0 0 8px; }
      .md-body > *:last-child{ margin-bottom:0; }
      .md-list{ padding-left:18px; margin:0 0 8px; }
      .md-heading{ font-family:var(--font-display); }
      .md-inline-code{ background:rgba(255,255,255,.1); padding:1px 5px; border-radius:5px; font-size:12.5px; }
      .md-code-block{ background:#0a0a16; border:1px solid var(--border); border-radius:10px; padding:12px 14px; overflow-x:auto; font-size:12.5px; margin:0 0 8px; }
      .md-code-lang{ font-size:10.5px; color:var(--text-faint); margin-bottom:6px; text-transform:lowercase; }
      .ai-composer{ border-top:1px solid var(--border); padding:14px 20px calc(14px + env(safe-area-inset-bottom)); display:flex; flex-direction:column; gap:8px; }
      .composer-attachment{ display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-dim); background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:6px 10px; width:fit-content; }
      .composer-attachment button{ background:none; border:none; color:var(--text-faint); margin-left:4px; }
      .composer-row{ display:flex; align-items:flex-end; gap:8px; background:var(--surface); border:1px solid var(--border-strong); border-radius:16px; padding:8px 10px; }
      .composer-row textarea{ flex:1; resize:none; font-size:14px; max-height:120px; padding:6px 0; }
      .send-btn{ background:linear-gradient(135deg,var(--violet),var(--cyan)); border:none; color:#070713; width:34px; height:34px; border-radius:11px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
      .send-btn:disabled{ opacity:.4; }

      /* Auth */
      .auth-tabs{ display:flex; gap:4px; margin-bottom:20px; background:var(--surface); border-radius:11px; padding:4px; }
      .auth-tabs button{ flex:1; background:none; border:none; color:var(--text-dim); font-size:12.5px; font-weight:600; padding:9px 6px; border-radius:8px; }
      .auth-tab-active{ background:var(--surface-solid); color:var(--text); }
      .auth-form{ display:flex; flex-direction:column; gap:14px; }
      .auth-form label{ display:flex; flex-direction:column; gap:6px; font-size:12.5px; color:var(--text-dim); font-weight:600; }
      .auth-form input{ background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:10px 12px; font-size:14px; color:var(--text); }
      .auth-note{ font-size:12px; color:var(--text-faint); line-height:1.5; }
      .auth-note-warn{ color:var(--amber); }
      .auth-submit{ margin-top:4px; justify-content:center; }
      .color-row{ display:flex; gap:8px; }
      .color-dot{ width:24px; height:24px; border-radius:50%; border:2px solid transparent; }
      .color-dot-active{ border-color:var(--text); }

      /* Dashboard */
      .stat-grid{ display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
      @media (min-width:768px){ .stat-grid{ grid-template-columns:repeat(4,1fr); } }
      .stat-card{ display:flex; align-items:center; gap:12px; padding:16px; color:var(--cyan); }
      .stat-card div span{ display:block; font-family:var(--font-display); font-size:20px; font-weight:800; color:var(--text); }
      .stat-card div label{ font-size:11.5px; color:var(--text-faint); }
      .dash-grid{ display:grid; grid-template-columns:1fr; gap:14px; }
      @media (min-width:900px){ .dash-grid{ grid-template-columns:1fr 1fr; } }
      .dash-panel-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
      .dash-panel-head h3{ display:flex; align-items:center; gap:7px; font-size:14.5px; }
      .dash-panel-head button{ background:none; border:none; color:var(--violet-soft); font-size:12px; font-weight:600; }
      .history-list{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:4px; }
      .history-list li{ display:flex; align-items:center; gap:10px; padding:8px 4px; border-radius:9px; }
      .history-list li:hover{ background:var(--surface); }
      .history-icon{ width:30px; height:30px; border-radius:8px; background:var(--surface-solid); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; color:var(--text-dim); flex-shrink:0; }
      .history-meta{ display:flex; flex-direction:column; flex:1; min-width:0; }
      .history-title{ font-size:13px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .history-sub{ font-size:11.5px; color:var(--text-faint); }
      .save-toggle{ background:none; border:none; color:var(--amber); padding:4px; flex-shrink:0; }

      /* Settings */
      .settings-card{ display:flex; flex-direction:column; gap:14px; }
      .settings-card h3{ font-size:15px; }
      .settings-row{ display:flex; align-items:center; gap:16px; }
      .settings-card label{ display:flex; flex-direction:column; gap:6px; font-size:12.5px; color:var(--text-dim); font-weight:600; }
      .settings-card input{ background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:10px 12px; font-size:14px; color:var(--text); }
      .settings-card input:disabled{ opacity:.5; }
      .toggle-row{ display:flex; align-items:center; justify-content:space-between; gap:16px; }
      .toggle-row span{ font-size:13.5px; font-weight:600; }
      .toggle-row p{ font-size:12px; margin-top:2px; }
      .switch{ width:40px; height:22px; border-radius:999px; background:var(--border-strong); border:none; position:relative; flex-shrink:0; }
      .switch span{ position:absolute; top:2px; left:2px; width:18px; height:18px; border-radius:50%; background:#fff; transition:transform .18s ease; }
      .switch-on{ background:linear-gradient(135deg,var(--violet),var(--cyan)); }
      .switch-on span{ transform:translateX(18px); }
      .settings-actions{ display:flex; flex-wrap:wrap; gap:10px; }
    `}</style>
  );
}
