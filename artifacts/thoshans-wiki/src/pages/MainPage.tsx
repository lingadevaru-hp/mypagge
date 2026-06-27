import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import WikiHeader from '../components/WikiHeader';
import WikiSidebar from '../components/WikiSidebar';
import WikiFooter from '../components/WikiFooter';
import SeoHead from '../components/SeoHead';
import { loadArticlesIndex } from '../lib/articleLoader';
import type { ArticleIndexEntry } from '../types/article';

const categoryColors: Record<string, string> = {
  'Profile':        '#3366CC',
  'Blockchain':     '#E67E22',
  'AI / ML':        '#8E44AD',
  'Infrastructure': '#27AE60',
  'Security':       '#C0392B',
  'Systems':        '#2980B9',
  'Web':            '#16A085',
  'Learning':       '#F39C12',
};

export default function MainPage() {
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 768
  );
  const [articles, setArticles] = useState<ArticleIndexEntry[]>([]);

  useEffect(() => {
    loadArticlesIndex().then((idx) => setArticles(idx.articles));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SeoHead
        title="Main Page — Thoshan's Wiki"
        description="Thoshan's Wiki main page — personal knowledge base by Lingadevaru H P covering FOSS Coin on Solana, Thoshan Flash LLM, homelab infrastructure, Linux setup, and more."
        canonicalPath="/wiki/main-page"
      />
      <WikiHeader onMenuClick={() => setSidebarOpen((o) => !o)} />
      <div className="flex flex-1 max-w-[1400px] mx-auto w-full">
        <WikiSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 px-4 py-4 min-w-0">

          <div className="text-center mb-4 text-sm">
            <strong>Thoshan's personal knowledge base</strong>{' '}
            — a Wikipedia-style wiki by{' '}
            <Link href="/wiki/about" className="text-accent hover:underline">Lingadevaru H P</Link>{' '}
            about projects, systems, and learning.{' '}
            <Link href="/wiki/about" className="text-accent hover:underline">
              {articles.length || 10} articles
            </Link>{' '}
            in this wiki.
          </div>

          <div className="border border-border bg-gradient-to-r from-[#1A1A2E] to-[#16213E] p-4 mb-4">
            <h2 className="font-bold text-sm border-b border-border/50 pb-1 mb-3 flex items-center gap-2">
              <span>⭐ Featured Projects</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border border-border/60 bg-black/20 overflow-hidden hover:border-accent/50 transition-colors">
                <div className="relative">
                  <img
                    src="https://media.giphy.com/media/bQL3YuiKKAXBwewvZ1/giphy.gif"
                    alt="FOSS Coin live trading on Orca DEX"
                    className="w-full h-32 object-cover"
                    loading="eager"
                  />
                </div>
                <div className="p-2.5">
                  <span className="text-[10px] font-bold" style={{ color: '#E67E22' }}>BLOCKCHAIN · SOLANA</span>
                  <Link href="/wiki/foss-coin" className="block text-accent font-bold hover:underline text-sm mb-1">
                    FOSS Coin ($FOSS)
                  </Link>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A real Solana SPL token I created to fund Free &amp; Open Source Software. Fixed 1B supply, mint authority permanently revoked. Live on Orca Whirlpool DEX.
                  </p>
                  <p className="text-[10px] text-accent/70 mt-1.5">7 ★ on GitHub · Live &amp; tradeable</p>
                </div>
              </div>

              <div className="border border-border/60 bg-black/20 overflow-hidden hover:border-accent/50 transition-colors">
                <div className="relative">
                  <img
                    src="https://picsum.photos/seed/flash-hero/400/200"
                    alt="Thoshan Flash — QLoRA fine-tune"
                    className="w-full h-32 object-cover"
                    loading="eager"
                  />
                </div>
                <div className="p-2.5">
                  <span className="text-[10px] font-bold" style={{ color: '#8E44AD' }}>AI / ML · HUGGING FACE</span>
                  <Link href="/wiki/thoshan-flash" className="block text-accent font-bold hover:underline text-sm mb-1">
                    Thoshan Flash LLM
                  </Link>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    QLoRA fine-tune of Google's Gemma-2-9B published on{' '}
                    <a href="https://huggingface.co/lingadevaruhp/thoshan_Flash" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                      Hugging Face
                    </a>{' '}
                    with a live Gradio inference interface.
                  </p>
                  <p className="text-[10px] text-accent/70 mt-1.5">28+ downloads in month one · Live Gradio</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/60 text-right mt-2">
              All work by{' '}
              <a href="https://lingadevaru.in" target="_blank" rel="noopener noreferrer" className="text-accent/70 hover:underline">
                lingadevaru.in
              </a>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 mb-4">
            <div className="border border-border p-3">
              <h2 className="font-bold border-b border-border pb-1 mb-2 text-sm">Featured article</h2>
              <div className="flex gap-3">
                <img
                  src="https://picsum.photos/seed/about-featured/120/90"
                  alt="About Thoshan"
                  className="w-28 h-20 object-cover border border-border shrink-0"
                />
                <div>
                  <p className="text-sm">
                    <Link href="/wiki/about" className="font-bold text-accent hover:underline">Lingadevaru H P</Link>{' '}
                    (also known as <em>Thoshan</em>) is based in Tumakuru, Karnataka. Builder of deployed blockchain, AI, and web projects — with a career focus on networking, cloud, and cybersecurity. All skills demonstrated through real deployed work: a{' '}
                    <Link href="/wiki/foss-coin" className="text-accent hover:underline">Solana SPL token</Link>,
                    a <Link href="/wiki/thoshan-flash" className="text-accent hover:underline">fine-tuned LLM</Link>,
                    and a <Link href="/wiki/homelab" className="text-accent hover:underline">self-hosted cloud homelab</Link>.
                  </p>
                  <p className="text-right mt-1">
                    <Link href="/wiki/about" className="text-accent text-xs hover:underline">Full article...</Link>
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Other articles:{' '}
                <Link href="/wiki/foss-coin" className="text-accent hover:underline">FOSS Coin</Link>
                {' · '}
                <Link href="/wiki/thoshan-flash" className="text-accent hover:underline">Thoshan Flash</Link>
                {' · '}
                <Link href="/wiki/privacy-stack" className="text-accent hover:underline">Privacy Stack</Link>
              </p>
            </div>

            <div className="border border-border border-l-0 p-3 bg-[#1A3A1A] dark:bg-[#1A3A1A]">
              <h2 className="font-bold border-b border-[#555] pb-1 mb-2 text-sm">Project highlights</h2>
              <ul className="text-sm space-y-1.5 list-disc list-inside">
                <li><Link href="/wiki/foss-coin" className="text-accent font-bold hover:underline">FOSS Coin ($FOSS)</Link> — live Solana SPL token on Orca Whirlpool DEX. Fixed 1B supply, mint revoked. 7 ⭐ on GitHub.</li>
                <li><Link href="/wiki/thoshan-flash" className="text-accent font-bold hover:underline">Thoshan Flash</Link> — QLoRA fine-tune of Gemma-2-9B on Hugging Face. 28+ downloads, live Gradio inference.</li>
                <li><Link href="/wiki/insurance-dapp" className="text-accent font-bold hover:underline">Insurance DApp</Link> — Ethereum smart contract insurance system using Solidity, Truffle, Web3.js, and MetaMask.</li>
                <li><Link href="/wiki/local-pulse" className="text-accent font-bold hover:underline">LocalPulse</Link> — Next.js 15 event discovery PWA with Clerk auth, Firebase, PDF ticketing, and offline support.</li>
                <li><Link href="/wiki/fraud-detection" className="text-accent font-bold hover:underline">Fraud Detection System</Link> — 4-algorithm ML ensemble (LR + KNN + SVM + CNN) in ASP.NET.</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 mb-4">
            <div className="border border-border border-t-0 p-3 bg-[#1A2A3A] dark:bg-[#1A2A3A]">
              <h2 className="font-bold border-b border-[#555] pb-1 mb-2 text-sm">Did you know...</h2>
              <ul className="text-sm space-y-1.5 list-disc list-inside">
                <li>...that <Link href="/wiki/foss-coin" className="text-accent font-bold hover:underline">FOSS Coin</Link> was deployed in a single atomic transaction containing 7 instructions — all-or-nothing?</li>
                <li>...that <Link href="/wiki/thoshan-flash" className="text-accent font-bold hover:underline">QLoRA fine-tuning</Link> reduces GPU memory from ~36 GB to ~12 GB by training only ~1–3% of model parameters?</li>
                <li>...that the <Link href="/wiki/homelab" className="text-accent hover:underline">Libre Cloud homelab</Link> uses zero-trust architecture — no service is directly reachable without Cloudflare?</li>
                <li>...that the <Link href="/wiki/privacy-stack" className="text-accent hover:underline">privacy stack</Link> runs DNS filtering at three independent layers simultaneously?</li>
                <li>...that <Link href="/wiki/linux-setup" className="text-accent hover:underline">Omarchy</Link> was created by DHH (of Ruby on Rails fame) and has ~22,000 GitHub stars?</li>
              </ul>
            </div>

            <div className="border border-border border-l-0 border-t-0 p-3">
              <h2 className="font-bold border-b border-border pb-1 mb-2 text-sm">Technical areas</h2>
              <p className="text-xs text-muted-foreground mb-2">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              <ul className="text-sm space-y-1.5 list-disc list-inside">
                <li><strong>Blockchain</strong> — <Link href="/wiki/foss-coin" className="text-accent hover:underline">Solana SPL tokens</Link>, <Link href="/wiki/insurance-dapp" className="text-accent hover:underline">Ethereum smart contracts</Link></li>
                <li><strong>AI / ML</strong> — <Link href="/wiki/thoshan-flash" className="text-accent hover:underline">LLM fine-tuning</Link>, <Link href="/wiki/fraud-detection" className="text-accent hover:underline">ML ensemble systems</Link></li>
                <li><strong>Infrastructure</strong> — <Link href="/wiki/homelab" className="text-accent hover:underline">Oracle Cloud free tier</Link>, Docker, Coolify, Cloudflare</li>
                <li><strong>Security</strong> — <Link href="/wiki/privacy-stack" className="text-accent hover:underline">layered DNS filtering</Link>, WireGuard VPN, UFW</li>
                <li><strong>Systems</strong> — <Link href="/wiki/linux-setup" className="text-accent hover:underline">Arch Linux / Omarchy</Link>, Hyprland, Neovim</li>
              </ul>
            </div>
          </div>

          <div className="border border-border border-t-0 p-3 mb-4">
            <h2 className="font-bold border-b border-border pb-1 mb-3 text-sm">All articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {articles.map((article) => (
                <div key={article.id} className="flex gap-2 border border-border p-2 hover:bg-card" data-testid={`article-card-${article.id}`}>
                  {article.thumbnail && (
                    <img
                      src={article.thumbnail}
                      alt={article.title}
                      className="w-16 h-12 object-cover border border-border shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <Link href={`/wiki/${article.slug}`} className="text-accent hover:underline text-sm font-medium block truncate">
                      {article.title}
                    </Link>
                    <span className="text-[10px] font-semibold" style={{ color: categoryColors[article.category] || '#A8A8A8' }}>
                      {article.category}
                    </span>
                    <p className="text-xs text-muted-foreground line-clamp-2">{article.excerpt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
      <WikiFooter />
    </div>
  );
}
