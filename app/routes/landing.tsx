import { useState } from "react";
import { Link, useLoaderData, data, redirect } from "react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Library,
  Compass,
  Search,
  Sparkles,
  ArrowUpRight,
  BookMarked,
  LayoutDashboard,
  Sun,
  Moon
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useUIStore } from "~/stores/ui-store";

import type { Route } from "./+types/landing";
import { getAuthUser } from "~/lib/auth";
import { Logo } from "~/components/ui/logo";
import { Button } from "~/components/ui/button";

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await getAuthUser(request);
  return data({ isAuthenticated: !!user });
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Athenaeum — The Quiet Sanctuary for Scholars" },
    { name: "description", content: "A premium library management and circulation system built with quiet luxury styling." }
  ];
}

export function links() {
  return [
    { rel: "preload", as: "image", href: "/cover-1.webp" },
    { rel: "preload", as: "image", href: "/cover-2.webp" },
    { rel: "preload", as: "image", href: "/cover-3.webp" },
  ];
}

const LUX_EASE = [0.22, 1, 0.36, 1] as const;

export default function Landing() {
  const { isAuthenticated } = useLoaderData<typeof loader>();
  const [searchVal, setSearchVal] = useState("");
  const { theme, toggleTheme } = useUIStore();
  const [hoveredBook, setHoveredBook] = useState<number | null>(null);

  const bookCovers = [
    { src: "/cover-1.webp", title: "Pride & Prejudice", author: "Jane Austen", rotate: -8, x: -45, y: -45, delay: 0.1 },
    { src: "/cover-2.webp", title: "The Name of the Rose", author: "Umberto Eco", rotate: 6, x: 75, y: -75, delay: 0.2 },
    { src: "/cover-3.webp", title: "Norwegian Wood", author: "Haruki Murakami", rotate: -4, x: -105, y: 35, delay: 0.15 },
    { src: "/cover-4.webp", title: "The Silent Patient", author: "Alex Michaelides", rotate: 8, x: 95, y: 55, delay: 0.3 },
    { src: "/cover-5.webp", title: "Sapiens", author: "Yuval Noah Harari", rotate: -10, x: -15, y: 125, delay: 0.25 },
    { src: "/cover-6.webp", title: "The Goldfinch", author: "Donna Tartt", rotate: 5, x: 115, y: 165, delay: 0.35 },
    { src: "/cover-7.webp", title: "The Great Gatsby", author: "F. Scott Fitzgerald", rotate: -3, x: -125, y: -125, delay: 0.4 },
    { src: "/cover-8.webp", title: "Crime & Punishment", author: "Fyodor Dostoevsky", rotate: 12, x: -25, y: 205, delay: 0.45 },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f3efe4] text-ink-900 transition-colors duration-500 dark:bg-ink-950 dark:text-ivory">
      {/* Aurora Ambient Backgrounds */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 w-[80%] h-[80%] rounded-full bg-gold-400/8 blur-[160px] dark:bg-gold-500/5" />
        <div className="absolute -right-1/4 -bottom-1/4 w-[80%] h-[80%] rounded-full bg-gold-200/6 blur-[160px] dark:bg-gold-400/3" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#c5a05908_1px,transparent_1px),linear-gradient(to_bottom,#c5a05908_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Floating Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-gold-400/10 bg-[#f3efe4]/80 backdrop-blur-md dark:bg-ink-900/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:h-20 sm:px-8">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="cursor-pointer focus:outline-none"
            aria-label="Scroll to top"
          >
            <Logo className="[&>span]:hidden sm:[&>span]:inline-flex" />
          </button>
          
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              to="/catalog"
              className="text-sm font-medium tracking-wide text-ink-700 hover:text-gold-600 dark:text-ink-200 dark:hover:text-gold-300 transition-colors"
            >
              Browse Catalog
            </Link>
            <a
              href="#features"
              className="text-sm font-medium tracking-wide text-ink-700 hover:text-gold-600 dark:text-ink-200 dark:hover:text-gold-300 transition-colors"
            >
              System Features
            </a>
            <a
              href="#branches"
              className="text-sm font-medium tracking-wide text-ink-700 hover:text-gold-600 dark:text-ink-200 dark:hover:text-gold-300 transition-colors"
            >
              Branches
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Toggle Switcher */}
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-ink-500 transition-colors hover:bg-ink-500/10 dark:text-ink-300"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="block"
                >
                  {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
                </motion.span>
              </AnimatePresence>
            </button>

            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="primary" size="sm" type="button" aria-label="Go to Dashboard" className="flex items-center gap-1.5 font-semibold">
                  <LayoutDashboard className="size-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden text-sm font-semibold tracking-wide text-ink-700 hover:text-gold-600 dark:text-ink-200 dark:hover:text-gold-300 transition-colors sm:block"
                >
                  Sign In
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="sm" type="button" className="flex items-center gap-1 font-semibold">
                    <span className="hidden sm:inline">Register</span>
                    <ArrowRight className="size-4 sm:hidden" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 pt-12 sm:px-8 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          
          {/* Hero Left Content */}
          <div className="flex flex-col space-y-8 lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: LUX_EASE }}
              className="inline-flex max-w-fit items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gold-700 dark:text-gold-300"
            >
              <Sparkles className="size-3.5 fill-gold-400/20" />
              EST. MMXXVI · The Academic Sanctuary
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: LUX_EASE, delay: 0.15 }}
              className="font-serif text-5xl sm:text-[4rem] lg:text-[4.5rem] font-light tracking-tight leading-[1.05] text-ink-950 dark:text-ivory"
            >
              Where classical literature <br />
              meets <span className="font-serif italic font-medium text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-800 dark:from-gold-300 dark:to-gold-500 pr-2">quiet luxury</span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: LUX_EASE, delay: 0.2 }}
              className="max-w-lg text-base leading-relaxed text-ink-600 dark:text-ink-200"
            >
              Athenaeum elevates the scholarly reading experience with an elegant, digital sanctuary for catalog browsing, borrowing, and real-time availability across our multiple physical library branches.
            </motion.p>

            {/* Premium Search Mockup bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: LUX_EASE, delay: 0.3 }}
              className="max-w-md w-full"
            >
              <div className="relative group flex items-center rounded-2xl border border-gold-400/30 bg-white p-1.5 shadow-[0_12px_40px_-12px_rgba(197,160,89,0.22)] backdrop-blur-md focus-within:border-gold-400/70 dark:border-gold-400/20 dark:bg-ink-950/40 transition-all duration-300">
                <Search className="absolute left-4 size-5 text-gold-600/70" />
                <input
                  type="text"
                  placeholder="Search books, authors, ISBNs..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="w-full bg-transparent pl-11 pr-24 py-2.5 text-sm outline-none placeholder:text-ink-400 dark:placeholder:text-ink-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      window.location.href = `/catalog?search=${encodeURIComponent(searchVal)}`;
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    window.location.href = `/catalog?search=${encodeURIComponent(searchVal)}`;
                  }}
                  variant="primary"
                  className="absolute right-1.5 h-9 rounded-xl text-xs font-semibold px-4"
                >
                  Search
                </Button>
              </div>
              <div className="mt-3 flex items-center gap-2.5 text-xs text-ink-600 dark:text-ink-400 font-medium">
                <span className="font-semibold uppercase tracking-wider text-gold-600">Trending:</span>
                <Link to="/catalog?search=Pride" className="hover:text-gold-500 hover:underline">Pride and Prejudice</Link>
                <span>•</span>
                <Link to="/catalog?search=Rose" className="hover:text-gold-500 hover:underline">Name of the Rose</Link>
              </div>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: LUX_EASE, delay: 0.4 }}
              className="flex flex-wrap gap-4 pt-2"
            >
              <Link to="/catalog">
                <Button variant="outline" size="md" type="button" className="flex items-center gap-1.5 font-semibold border-gold-400/40 hover:border-gold-400/80">
                  Browse Catalog
                  <Compass className="size-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="ghost" size="md" type="button" className="flex items-center gap-1.5 font-semibold text-gold-600 hover:text-gold-500 hover:bg-gold-400/5">
                  Librarian Portal
                  <ArrowUpRight className="size-4" />
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Mobile / tablet visual — elegant floating book shelf (3D collage is desktop-only) */}
          <div className="relative flex flex-col items-center lg:hidden">
            <div className="pointer-events-none absolute -top-6 size-48 rounded-full bg-gold-400/15 blur-[90px]" />
            <div className="relative flex items-end justify-center gap-2.5 pb-4 sm:gap-3">
              <div className="absolute inset-x-2 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-400/50 to-transparent" />
              {bookCovers.slice(0, 5).map((c, i) => (
                <motion.div
                  key={c.src}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * i + 0.2 }}
                  className="relative"
                >
                  <motion.div
                    animate={{ y: [0, -7, 0] }}
                    transition={{
                      duration: 3.5 + i * 0.4,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    }}
                    className="aspect-[2/3] w-14 overflow-hidden rounded-md border border-gold-400/30 bg-white shadow-[0_12px_26px_-12px_rgba(197,160,89,0.5)] dark:bg-ink-900 sm:w-16"
                  >
                    <img
                      src={c.src}
                      alt={c.title}
                      decoding="async"
                      fetchPriority={i === 0 ? "high" : "auto"}
                      className="size-full object-cover"
                    />
                  </motion.div>
                </motion.div>
              ))}
            </div>
            <div className="mt-1 flex items-center gap-2 rounded-full border border-gold-400/30 bg-white/70 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-700 backdrop-blur dark:bg-ink-900/60 dark:text-gold-300">
              <span className="size-2 animate-pulse rounded-full bg-gold-500" />
              8 Classics Seeded Real-Time
            </div>
          </div>

          {/* Hero Right Content - Floating 3D Book Cover Collage */}
          <div className="relative hidden h-[600px] w-full flex-col items-center justify-center lg:col-span-6 lg:flex">
            <div className="relative size-full max-w-[480px] [perspective:1200px] [transform-style:preserve-3d]">
              
              {/* Soft background golden glow behind cards */}
              <div className="absolute inset-0 m-auto size-80 rounded-full bg-gold-400/15 blur-[120px] pointer-events-none" />

              {bookCovers.map((cover, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotate: cover.rotate,
                    x: cover.x,
                    y: cover.y,
                  }}
                  whileHover={{ 
                    scale: 1.18,
                    rotate: cover.rotate + (cover.rotate > 0 ? 4 : -4),
                    z: 50,
                    zIndex: 40,
                    transition: { duration: 0.3 }
                  }}
                  onHoverStart={() => setHoveredBook(i)}
                  onHoverEnd={() => setHoveredBook(null)}
                  transition={{
                    duration: 0.8,
                    ease: LUX_EASE,
                    delay: cover.delay,
                    // Subtle float effect
                    y: {
                      repeat: Infinity,
                      repeatType: "reverse",
                      duration: 5 + i,
                      ease: "easeInOut",
                      delay: i * 0.25
                    }
                  }}
                  className="absolute inset-0 m-auto h-[180px] w-[122px] cursor-pointer overflow-hidden rounded-r-lg rounded-l-md border border-gold-400/40 bg-white p-0.5 shadow-[0_16px_32px_-12px_rgba(0,0,0,0.35),0_6px_12px_-8px_rgba(197,160,89,0.3)] transition-shadow duration-300 hover:shadow-[0_32px_60px_-15px_rgba(197,160,89,0.5),0_10px_20px_rgba(0,0,0,0.15)] dark:bg-ink-900 dark:border-gold-400/20"
                >
                  <img
                    src={cover.src}
                    alt={cover.title}
                    decoding="async"
                    className="size-full object-cover rounded-r-md rounded-l-[3px]"
                  />
                  {/* Subtle edge gold highlight & Spine fold line */}
                  <div className="absolute inset-y-0 left-1 w-px bg-black/10 dark:bg-white/10 pointer-events-none" />
                  <div className="absolute inset-y-0 left-1.5 w-[2px] bg-white/5 dark:bg-white/5 pointer-events-none" />
                  <div className="absolute inset-0 border border-white/10 rounded-r-md rounded-l-sm pointer-events-none" />
                </motion.div>
              ))}

              {/* Dynamic Metadata / Status Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-x-0 bottom-4 mx-auto flex max-w-fit items-center gap-3 rounded-2xl border border-gold-400/32 bg-white px-5 py-3 shadow-[0_16px_36px_-10px_rgba(197,160,89,0.28)] backdrop-blur-md dark:bg-ink-900/90 dark:border-gold-400/20"
              >
                <div className="size-2 animate-pulse rounded-full bg-gold-500" />
                <span className="text-xs font-semibold tracking-wider uppercase text-ink-800 dark:text-ivory font-sans">
                  {hoveredBook !== null 
                    ? `${bookCovers[hoveredBook].title} — ${bookCovers[hoveredBook].author}` 
                    : "8 Classics Seeded Real-Time Today"}
                </span>
              </motion.div>
            </div>
          </div>

        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24 sm:px-8">
        <div className="mx-auto max-w-2xl text-center space-y-4">
          <h2 className="font-serif text-3xl text-ink-950 dark:text-ivory sm:text-4xl">
            Designed for Scholars, Curated for Efficiency
          </h2>
          <p className="text-sm text-ink-600 dark:text-ink-200">
            A quiet harmony of visual refinement and robust operational logic.
          </p>
          <div className="mx-auto h-px w-20 bg-gold-400/40 pt-1" />
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          
          <div className="rounded-2xl border border-gold-400/30 bg-white p-8 shadow-[0_12px_36px_-8px_rgba(197,160,89,0.12),0_2px_8px_-2px_rgba(0,0,0,0.03)] backdrop-blur-md hover:border-gold-400/60 transition-all duration-300 dark:bg-ink-900/20 dark:border-gold-400/10">
            <div className="inline-flex size-12 items-center justify-center rounded-xl bg-gold-400/10 text-gold-600 dark:text-gold-300">
              <BookOpen className="size-6" />
            </div>
            <h3 className="mt-5 font-serif text-xl text-ink-950 dark:text-ivory">Universal Catalog</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-600 dark:text-ink-200">
              Filter through rare collections, classics, and reference materials with real-time status indicating if a title is ready to borrow.
            </p>
          </div>

          <div className="rounded-2xl border border-gold-400/30 bg-white p-8 shadow-[0_12px_36px_-8px_rgba(197,160,89,0.12),0_2px_8px_-2px_rgba(0,0,0,0.03)] backdrop-blur-md hover:border-gold-400/60 transition-all duration-300 dark:bg-ink-900/20 dark:border-gold-400/10">
            <div className="inline-flex size-12 items-center justify-center rounded-xl bg-gold-400/10 text-gold-600 dark:text-gold-300">
              <Library className="size-6" />
            </div>
            <h3 className="mt-5 font-serif text-xl text-ink-950 dark:text-ivory">Circulation Engine</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-600 dark:text-ink-200">
              Streamlined checkout, check-in, renewals, and reservations. Keep track of loans and due dates in a centralized, beautiful log.
            </p>
          </div>

          <div className="rounded-2xl border border-gold-400/30 bg-white p-8 shadow-[0_12px_36px_-8px_rgba(197,160,89,0.12),0_2px_8px_-2px_rgba(0,0,0,0.03)] backdrop-blur-md hover:border-gold-400/60 transition-all duration-300 dark:bg-ink-900/20 dark:border-gold-400/10">
            <div className="inline-flex size-12 items-center justify-center rounded-xl bg-gold-400/10 text-gold-600 dark:text-gold-300">
              <BookMarked className="size-6" />
            </div>
            <h3 className="mt-5 font-serif text-xl text-ink-950 dark:text-ivory">Multi-Branch Holdings</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-600 dark:text-ink-200">
              Inspect physical copy distribution across Central, North Annex, and Science Library branches. Spot the exact shelf location instantly.
            </p>
          </div>

        </div>
      </section>

      {/* Branches Showcase */}
      <section id="branches" className="border-t border-gold-400/10 bg-gold-400/5 py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="flex flex-col justify-center space-y-4 lg:col-span-1">
              <h2 className="font-serif text-3xl text-ink-950 dark:text-ivory">Our Reading Branches</h2>
              <p className="text-sm text-ink-600 dark:text-ink-200">
                Athenaeum operates three major academic repositories. Discover shelf locations, branch specific copies, and select the pickup destination.
              </p>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-3 lg:col-span-2">
              <div className="rounded-2xl border border-gold-400/25 bg-white p-6 shadow-[0_10px_30px_-6px_rgba(197,160,89,0.15)] hover:border-gold-400/50 transition-all duration-300 dark:bg-ink-900/30 dark:border-gold-400/10">
                <span className="text-xs font-semibold uppercase tracking-wider text-gold-600">Branch I</span>
                <h4 className="mt-2 font-serif text-lg text-ink-950 dark:text-ivory">Central Branch</h4>
                <p className="mt-1 text-xs text-ink-500">Building A, Main Campus</p>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-gold-600 font-semibold">
                  <span>9.2k available titles</span>
                </div>
              </div>

              <div className="rounded-2xl border border-gold-400/25 bg-white p-6 shadow-[0_10px_30px_-6px_rgba(197,160,89,0.15)] hover:border-gold-400/50 transition-all duration-300 dark:bg-ink-900/30 dark:border-gold-400/10">
                <span className="text-xs font-semibold uppercase tracking-wider text-gold-600">Branch II</span>
                <h4 className="mt-2 font-serif text-lg text-ink-950 dark:text-ivory">North Annex</h4>
                <p className="mt-1 text-xs text-ink-500">Building C, Engineering Quad</p>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-gold-600 font-semibold">
                  <span>2.1k available titles</span>
                </div>
              </div>

              <div className="rounded-2xl border border-gold-400/25 bg-white p-6 shadow-[0_10px_30px_-6px_rgba(197,160,89,0.15)] hover:border-gold-400/50 transition-all duration-300 dark:bg-ink-900/30 dark:border-gold-400/10">
                <span className="text-xs font-semibold uppercase tracking-wider text-gold-600">Branch III</span>
                <h4 className="mt-2 font-serif text-lg text-ink-950 dark:text-ivory">Science Library</h4>
                <p className="mt-1 text-xs text-ink-500">Building F, Research Park</p>
                <div className="mt-4 flex items-center gap-1.5 text-xs text-gold-600 font-semibold">
                  <span>4.5k available titles</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gold-400/10 py-12 text-center text-xs text-ink-500 dark:text-ink-400">
        <div className="mx-auto max-w-7xl px-6 space-y-4 sm:px-8">
          <Logo showWordmark={false} />
          <p className="font-serif tracking-wide">
            ATHENAEUM · EST. MMXXVI
          </p>
          <p className="max-w-md mx-auto">
            A premium academic repository system. All intellectual property, books, and rare editions are curated for member scholars.
          </p>
          <div className="flex justify-center gap-6 pt-4">
            <span className="text-ink-400">Quiet Luxury System</span>
            <span>•</span>
            <span className="text-ink-400">Full-Stack Supabase</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
