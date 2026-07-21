import { useState } from "react";
import { Link, useLoaderData, data, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
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
  Moon,
  Feather,
  ShieldCheck,
  Clock,
  Building2,
  Quote,
  CheckCircle2,
  Zap,
  Globe,
  ChevronRight,
  BookCheck,
} from "lucide-react";
import { useUIStore } from "~/stores/ui-store";

import type { Route } from "./+types/landing";
import { getAuthUser } from "~/lib/auth";
import { LogoMark } from "~/components/ui/logo";
import { Button } from "~/components/ui/button";

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await getAuthUser(request);
  return data(
    { isAuthenticated: !!user },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}

export function headers() {
  return {
    "Cache-Control": "public, max-age=60, s-maxage=3600, stale-while-revalidate=86400",
  };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Athenaeum — The Quiet Sanctuary for Scholars" },
    {
      name: "description",
      content:
        "A premium library management and circulation system built with quiet luxury styling and real-time multi-branch availability.",
    },
  ];
}

export function links() {
  return [
    { rel: "preload", as: "image", href: "/cover-1.webp" },
    { rel: "preload", as: "image", href: "/cover-2.webp" },
    { rel: "preload", as: "image", href: "/cover-3.webp" },
    { rel: "preload", as: "image", href: "/cover-4.webp" },
  ];
}

const LUX_EASE = [0.22, 1, 0.36, 1] as const;

export default function Landing() {
  const { isAuthenticated } = useLoaderData<typeof loader>();
  const [searchVal, setSearchVal] = useState("");
  const { theme, toggleTheme } = useUIStore();
  const [hoveredBook, setHoveredBook] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleNav = (url: string) => {
    navigate(url);
  };

  const bookCovers = [
    { src: "/cover-1.webp", title: "The Great Gatsby", author: "F. Scott Fitzgerald", status: "Available at Central", rotate: -8, x: -45, y: -45, delay: 0.1 },
    { src: "/cover-2.webp", title: "Silent Space", author: "A.J. Everett", status: "Ready for Pickup", rotate: 6, x: 75, y: -75, delay: 0.2 },
    { src: "/cover-3.webp", title: "Garden of Whispers", author: "Eleanor Vance", status: "Available at Science", rotate: -4, x: -105, y: 35, delay: 0.15 },
    { src: "/cover-4.webp", title: "Night Rain Whispers", author: "Claire Vance", status: "On Reserve", rotate: 8, x: 95, y: 55, delay: 0.3 },
    { src: "/cover-5.webp", title: "Sapiens", author: "Yuval Noah Harari", status: "Available at North Annex", rotate: -10, x: -15, y: 125, delay: 0.25 },
    { src: "/cover-6.webp", title: "The Goldfinch", author: "Donna Tartt", status: "Ready for Pickup", rotate: 5, x: 115, y: 165, delay: 0.35 },
    { src: "/cover-7.webp", title: "Pride & Prejudice", author: "Jane Austen", status: "Available at Central", rotate: -3, x: -125, y: -125, delay: 0.4 },
    { src: "/cover-8.webp", title: "Crime & Punishment", author: "Fyodor Dostoevsky", status: "On Reserve", rotate: 12, x: -25, y: 205, delay: 0.45 },
  ];

  const statistics = [
    { label: "Curated Rare Volumes", value: "15,400+", icon: BookOpen, subtext: "Cataloged with ISBD metadata" },
    { label: "Campus Repositories", value: "3 Branches", icon: Building2, subtext: "Real-time shelf directory" },
    { label: "On-Time Circulation", value: "99.8%", icon: ShieldCheck, subtext: "Automated loan renewals" },
    { label: "Instant Reservation", value: "< 2 Mins", icon: Clock, subtext: "Digital hold & branch dispatch" },
  ];

  const featuredBooks = [
    { title: "The Great Gatsby", author: "F. Scott Fitzgerald", year: "1925", category: "Classic Literature", status: "Available", cover: "/cover-1.webp", branch: "Central Branch" },
    { title: "Silent Space", author: "A.J. Everett", year: "2021", category: "Sci-Fi Thriller", status: "Available", cover: "/cover-2.webp", branch: "North Annex" },
    { title: "Garden of Whispers", author: "Eleanor Vance", year: "2019", category: "Botanical Fiction", status: "On Hold", cover: "/cover-3.webp", branch: "Science Library" },
    { title: "The Goldfinch", author: "Donna Tartt", year: "2013", category: "Pulitzer Winner", status: "Available", cover: "/cover-6.webp", branch: "Central Branch" },
  ];

  const features = [
    {
      title: "Universal Catalog Engine",
      description: "Filter through rare collections, classics, and reference materials with live status indicating exact branch availability.",
      icon: BookOpen,
      badge: "Real-Time Index",
    },
    {
      title: "Automated Circulation",
      description: "Streamlined checkouts, renewals, and holds. Keep track of loans and due dates in a centralized, peaceful log.",
      icon: Library,
      badge: "Zero Friction",
    },
    {
      title: "Multi-Branch Directory",
      description: "Inspect physical copy distribution across Central, North Annex, and Science Library. Spot exact shelf locations instantly.",
      icon: BookMarked,
      badge: "3 Campus Sites",
    },
    {
      title: "Scholar Research Suite",
      description: "Personalized reading lists, bookmark synchronization, and circulation histories tailored for faculty and students.",
      icon: Feather,
      badge: "Personalized",
    },
    {
      title: "High-Fidelity Security",
      description: "Role-gated patron permissions, digital library cards, and encrypted barcode validation for instant verification.",
      icon: ShieldCheck,
      badge: "Enterprise Security",
    },
    {
      title: "Instant Branch Dispatch",
      description: "Reserve books online and receive notifications when your selected branch has prepared your loan for pickup.",
      icon: Zap,
      badge: "Smart Dispatch",
    },
  ];

  const testimonials = [
    {
      quote: "Athenaeum transformed our research workflow. Finding specialized manuscripts across campus branches takes seconds instead of hours.",
      author: "Dr. Eleanor Vance",
      title: "Professor of Comparative Literature",
      institution: "Faculty of Humanities",
    },
    {
      quote: "The quiet luxury aesthetic makes spending long hours in the catalog a genuine delight. It respects the scholar's focus.",
      author: "Marcus Aurelius Thorne",
      title: "Senior Research Fellow",
      institution: "Institute of Classical Studies",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f8f6f0] text-ink-900 transition-colors duration-500 dark:bg-ink-950 dark:text-ivory selection:bg-gold-400/20 selection:text-gold-700 dark:selection:text-gold-300">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 size-[900px] rounded-full bg-gold-400/8 blur-[180px] dark:bg-gold-500/4" />
        <div className="absolute -right-1/4 top-1/2 size-[900px] rounded-full bg-gold-200/6 blur-[180px] dark:bg-gold-400/3" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#c5a05908_1px,transparent_1px),linear-gradient(to_bottom,#c5a05908_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-gold-400/15 bg-[#f8f6f0]/85 backdrop-blur-xl dark:border-gold-400/10 dark:bg-ink-950/85">
        <div className="mx-auto flex h-16 sm:h-18 max-w-7xl items-center justify-between gap-2 px-3 sm:px-8">
          <button
            onClick={() => handleNav("/")}
            className="flex items-center gap-2 transition-opacity hover:opacity-90 min-h-[44px] cursor-pointer text-left shrink-0"
            aria-label="Athenaeum Home"
          >
            <LogoMark />
            <span className="font-display text-xl sm:text-[1.85rem] leading-none text-ink-800 dark:text-ivory mt-0.5 hidden sm:inline-block">
              Athen<span className="text-gold-gradient">aeum</span>
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-8 md:flex" aria-label="Main Navigation">
            <button
              onClick={() => handleNav("/catalog")}
              className="text-sm font-medium tracking-wide text-ink-700 transition-colors hover:text-gold-600 dark:text-ink-200 dark:hover:text-gold-300 min-h-[44px] flex items-center cursor-pointer"
            >
              Catalog Directory
            </button>
            <a
              href="#philosophy"
              className="text-sm font-medium tracking-wide text-ink-700 transition-colors hover:text-gold-600 dark:text-ink-200 dark:hover:text-gold-300 min-h-[44px] flex items-center"
            >
              Our Philosophy
            </a>
            <a
              href="#features"
              className="text-sm font-medium tracking-wide text-ink-700 transition-colors hover:text-gold-600 dark:text-ink-200 dark:hover:text-gold-300 min-h-[44px] flex items-center"
            >
              Capabilities
            </a>
            <a
              href="#branches"
              className="text-sm font-medium tracking-wide text-ink-700 transition-colors hover:text-gold-600 dark:text-ink-200 dark:hover:text-gold-300 min-h-[44px] flex items-center"
            >
              Reading Branches
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex size-10 sm:size-11 items-center justify-center rounded-xl border border-gold-400/20 bg-white/60 text-ink-600 shadow-sm transition-all hover:border-gold-400/40 hover:bg-white dark:border-gold-400/15 dark:bg-ink-900/60 dark:text-ink-300 dark:hover:bg-ink-900 cursor-pointer"
              aria-label="Toggle light and dark theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === "dark" ? <Sun className="size-4.5 sm:size-5 text-gold-400" /> : <Moon className="size-4.5 sm:size-5 text-ink-700" />}
                </motion.span>
              </AnimatePresence>
            </button>

            {isAuthenticated ? (
              <Button onClick={() => handleNav("/dashboard")} variant="primary" size="md" type="button" className="flex min-h-[40px] sm:min-h-[44px] items-center gap-1.5 sm:gap-2 px-3 sm:px-5 font-semibold text-xs sm:text-sm">
                <LayoutDashboard className="size-4 sm:size-4.5" />
                <span className="hidden xs:inline">Dashboard</span>
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => handleNav("/login")}
                  className="hidden text-xs sm:text-sm font-semibold tracking-wide text-ink-700 transition-colors hover:text-gold-600 dark:text-ink-200 dark:hover:text-gold-300 sm:flex sm:min-h-[44px] sm:items-center sm:px-2.5 cursor-pointer"
                >
                  Sign In
                </button>
                <Button onClick={() => handleNav("/signup")} variant="primary" size="md" type="button" className="flex min-h-[40px] sm:min-h-[44px] items-center gap-1.5 px-3 sm:px-5 font-semibold text-xs sm:text-sm">
                  <span>Register</span>
                  <ArrowRight className="size-3.5 sm:size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-8 pt-8 sm:pt-12 pb-16 lg:pt-16 lg:pb-28">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          
          {/* Hero Left Content */}
          <div className="flex flex-col space-y-6 sm:space-y-8 lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: LUX_EASE }}
              className="inline-flex max-w-fit items-center gap-2 rounded-full border border-gold-400/35 bg-gold-400/10 px-3.5 py-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-gold-800 dark:text-gold-300 backdrop-blur-sm"
            >
              <Sparkles className="size-3 sm:size-3.5 fill-gold-400/30 text-gold-600 dark:text-gold-300" />
              <span>EST. MMXXVI · The Digital Sanctuary</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: LUX_EASE, delay: 0.1 }}
            >
              <h1 className="max-w-[65ch] font-serif text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight leading-[1.12] text-ink-950 dark:text-ivory break-words">
                Where classical literature <br className="hidden sm:inline" />
                meets <span className="font-serif italic font-medium text-transparent bg-clip-text bg-gradient-to-r from-gold-600 via-gold-700 to-gold-900 dark:from-gold-300 dark:via-gold-400 dark:to-gold-500 pr-1">quiet luxury</span>.
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: LUX_EASE, delay: 0.2 }}
              className="max-w-xl text-sm sm:text-lg leading-relaxed text-ink-600 dark:text-ink-200"
            >
              Athenaeum elevates the scholarly reading experience with an elegant sanctuary for real-time catalog discovery, circulation tracking, and multi-branch holdings across our physical repositories.
            </motion.p>

            {/* Interactive Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: LUX_EASE, delay: 0.3 }}
              className="w-full max-w-lg"
            >
              <div className="relative group flex items-center rounded-2xl border border-gold-400/35 bg-white p-1.5 sm:p-2 shadow-[0_16px_48px_-12px_rgba(197,160,89,0.25)] backdrop-blur-md focus-within:border-gold-400/80 dark:border-gold-400/25 dark:bg-ink-900/80 transition-all duration-300">
                <Search className="absolute left-3.5 sm:left-4 size-4.5 sm:size-5 text-gold-600/80 dark:text-gold-400" />
                <label htmlFor="hero-search" className="sr-only">Search catalog by book, author, or ISBN</label>
                <input
                  id="hero-search"
                  type="text"
                  placeholder="Search title, author, manuscript..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleNav(`/catalog?search=${encodeURIComponent(searchVal)}`);
                    }
                  }}
                  className="w-full bg-transparent pl-10 sm:pl-12 pr-14 sm:pr-32 py-2.5 sm:py-3 text-xs sm:text-sm outline-none placeholder:text-ink-400 dark:placeholder:text-ink-400 text-ink-950 dark:text-ivory"
                />
                <Button
                  onClick={() => handleNav(`/catalog?search=${encodeURIComponent(searchVal)}`)}
                  variant="primary"
                  className="absolute right-1.5 sm:right-2 h-9 sm:h-11 rounded-xl text-xs font-semibold px-3 sm:px-5 min-h-[38px] sm:min-h-[44px]"
                >
                  <span className="hidden sm:inline">Search Catalog</span>
                  <Search className="size-4 sm:hidden" />
                </Button>
              </div>
              
              <div className="mt-3 flex items-center gap-2 text-xs text-ink-600 dark:text-ink-300 overflow-x-auto no-scrollbar pb-1">
                <span className="font-semibold uppercase tracking-wider text-gold-700 dark:text-gold-300 shrink-0">Trending:</span>
                <button onClick={() => handleNav("/catalog?search=Austen")} className="rounded-md bg-gold-400/10 px-2.5 py-1 font-medium text-ink-800 transition-colors hover:bg-gold-400/20 dark:text-ink-200 shrink-0 cursor-pointer">
                  Jane Austen
                </button>
                <button onClick={() => handleNav("/catalog?search=Rose")} className="rounded-md bg-gold-400/10 px-2.5 py-1 font-medium text-ink-800 transition-colors hover:bg-gold-400/20 dark:text-ink-200 shrink-0 cursor-pointer">
                  Name of the Rose
                </button>
                <button onClick={() => handleNav("/catalog?search=Gatsby")} className="rounded-md bg-gold-400/10 px-2.5 py-1 font-medium text-ink-800 transition-colors hover:bg-gold-400/20 dark:text-ink-200 shrink-0 cursor-pointer">
                  Great Gatsby
                </button>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: LUX_EASE, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 pt-2 w-full sm:w-auto"
            >
              <Button onClick={() => handleNav("/catalog")} variant="outline" size="lg" type="button" className="flex w-full sm:w-auto min-h-[48px] items-center justify-center gap-2 font-semibold border-gold-400/40 hover:border-gold-400/80 px-6">
                <span>Explore Full Catalog</span>
                <Compass className="size-4.5" />
              </Button>
              <Button onClick={() => handleNav("/login")} variant="ghost" size="lg" type="button" className="flex w-full sm:w-auto min-h-[48px] items-center justify-center gap-2 font-semibold text-gold-700 hover:text-gold-600 dark:text-gold-300 hover:bg-gold-400/10 px-5">
                <span>Member Portal</span>
                <ArrowUpRight className="size-4.5" />
              </Button>
            </motion.div>
          </div>

          {/* Mobile View Book Shelf (Touch-friendly horizontal scroll deck) */}
          <div className="relative flex flex-col items-center lg:hidden py-4 w-full overflow-hidden">
            <div className="pointer-events-none absolute -top-10 size-64 rounded-full bg-gold-400/15 blur-[100px]" />
            
            <div className="w-full overflow-x-auto pb-4 pt-2 no-scrollbar scroll-smooth">
              <div className="flex items-center justify-start sm:justify-center min-w-max gap-3.5 px-4">
                {bookCovers.slice(0, 6).map((c, i) => (
                  <motion.div
                    key={c.src}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.08 * i }}
                    whileTap={{ scale: 0.96 }}
                    className="group relative cursor-pointer"
                    onClick={() => handleNav(`/catalog?search=${encodeURIComponent(c.title)}`)}
                  >
                    <div className="aspect-[2/3] w-24 overflow-hidden rounded-lg border border-gold-400/40 bg-white shadow-[0_12px_28px_-10px_rgba(197,160,89,0.4)] dark:bg-ink-900 transition-transform duration-300 group-hover:-translate-y-1">
                      <img
                        src={c.src}
                        alt={c.title}
                        decoding="async"
                        loading={i < 3 ? "eager" : "lazy"}
                        className="size-full object-cover"
                      />
                    </div>
                    <div className="mt-2 text-center w-24">
                      <p className="text-[11px] font-semibold text-ink-900 dark:text-ivory truncate leading-tight">{c.title}</p>
                      <p className="text-[10px] text-ink-500 dark:text-ink-400 truncate">{c.author}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 rounded-full border border-gold-400/30 bg-white/80 px-3.5 py-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-gold-800 dark:bg-ink-900/80 dark:text-gold-300 backdrop-blur-md shadow-sm max-w-[92%] truncate">
              <span className="size-2 animate-pulse rounded-full bg-gold-500 shrink-0" />
              <span className="truncate">Real-Time Catalog Holdings Seeded</span>
            </div>
          </div>

          {/* Desktop 3D Interactive Floating Book Stack */}
          <div className="relative hidden h-[620px] w-full flex-col items-center justify-center lg:col-span-6 lg:flex">
            <div className="relative size-full max-w-[500px] [perspective:1200px] [transform-style:preserve-3d]">
              
              {/* Soft background golden glow */}
              <div className="absolute inset-0 m-auto size-96 rounded-full bg-gold-400/18 blur-[130px] pointer-events-none" />

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
                    scale: 1.2,
                    rotate: cover.rotate + (cover.rotate > 0 ? 5 : -5),
                    z: 60,
                    zIndex: 45,
                    transition: { duration: 0.3 }
                  }}
                  onHoverStart={() => setHoveredBook(i)}
                  onHoverEnd={() => setHoveredBook(null)}
                  onClick={() => handleNav(`/catalog?search=${encodeURIComponent(cover.title)}`)}
                  transition={{
                    duration: 0.8,
                    ease: LUX_EASE,
                    delay: cover.delay,
                  }}
                  className="absolute inset-0 m-auto h-[190px] w-[130px] cursor-pointer overflow-hidden rounded-r-lg rounded-l-md border border-gold-400/40 bg-white p-0.5 shadow-[0_16px_36px_-12px_rgba(0,0,0,0.38),0_6px_14px_-8px_rgba(197,160,89,0.35)] transition-all duration-300 hover:shadow-[0_36px_70px_-15px_rgba(197,160,89,0.55)] dark:bg-ink-900 dark:border-gold-400/25"
                >
                  <img
                    src={cover.src}
                    alt={cover.title}
                    decoding="async"
                    className="size-full object-cover rounded-r-md rounded-l-[3px]"
                  />
                  {/* Spine depth lines */}
                  <div className="absolute inset-y-0 left-1 w-px bg-black/15 dark:bg-white/15 pointer-events-none" />
                  <div className="absolute inset-y-0 left-1.5 w-[2px] bg-white/10 pointer-events-none" />
                  <div className="absolute inset-0 border border-white/15 rounded-r-md rounded-l-sm pointer-events-none" />
                </motion.div>
              ))}

              {/* Dynamic Metadata Status Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-x-0 bottom-2 mx-auto flex max-w-fit items-center gap-3.5 rounded-2xl border border-gold-400/35 bg-white/90 px-5 py-3 shadow-[0_20px_40px_-12px_rgba(197,160,89,0.3)] backdrop-blur-md dark:bg-ink-900/90 dark:border-gold-400/25"
              >
                <div className="size-2.5 animate-pulse rounded-full bg-gold-500" />
                <span className="text-xs font-semibold tracking-wider uppercase text-ink-900 dark:text-ivory font-sans">
                  {hoveredBook !== null 
                    ? `${bookCovers[hoveredBook].title} — ${bookCovers[hoveredBook].status}` 
                    : "8 Classics Seeded Real-Time Today"}
                </span>
              </motion.div>
            </div>
          </div>

        </div>
      </section>

      {/* Real-time Statistics Counter Section */}
      <section className="border-y border-gold-400/15 bg-gold-400/5 py-12 dark:bg-ink-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
            {statistics.map((stat, i) => (
              <div key={i} className="flex flex-col space-y-2 p-1 sm:p-2">
                <div className="flex items-center gap-2 text-gold-700 dark:text-gold-300">
                  <stat.icon className="size-4 sm:size-5 shrink-0" />
                  <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider">{stat.label}</span>
                </div>
                <p className="font-serif text-2xl sm:text-4xl font-light text-ink-950 dark:text-ivory">{stat.value}</p>
                <p className="text-xs text-ink-600 dark:text-ink-400">{stat.subtext}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy & Brand Values Section */}
      <section id="philosophy" className="mx-auto max-w-7xl px-4 sm:px-8 py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold-700 dark:text-gold-300">
              <Feather className="size-4" />
              <span>Our Scholarly Ethos</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-ink-950 dark:text-ivory leading-[1.12]">
              Where Heritage Meets Digital Precision
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-ink-600 dark:text-ink-200 max-w-[60ch]">
              Libraries are not merely repositories of paper; they are physical sanctuaries of human inquiry. Athenaeum was engineered to preserve the quiet elegance of classical reading rooms while empowering researchers with real-time circulation intelligence.
            </p>
            <div className="pt-2 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="size-5 text-gold-600 dark:text-gold-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-ink-950 dark:text-ivory">Quiet Luxury Interface</h3>
                  <p className="text-xs text-ink-600 dark:text-ink-400">Zero cognitive clutter, refined typography, and dark mode for prolonged reading.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="size-5 text-gold-600 dark:text-gold-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-ink-950 dark:text-ivory">Cross-Branch Availability</h3>
                  <p className="text-xs text-ink-600 dark:text-ink-400">Instant visibility of physical copies across Central, Engineering Annex, and Science facilities.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid gap-4 sm:gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-gold-400/25 bg-white p-6 sm:p-7 shadow-sm dark:bg-ink-900/50 space-y-3 sm:space-y-4">
              <BookCheck className="size-7 sm:size-8 text-gold-600 dark:text-gold-400" />
              <h3 className="font-serif text-lg sm:text-xl text-ink-950 dark:text-ivory">Rare Editions & Manuscripts</h3>
              <p className="text-xs leading-relaxed text-ink-600 dark:text-ink-300">
                Specialized cataloging protocols for delicate folios, archival maps, and restricted scholarly manuscripts with digital reservation requests.
              </p>
            </div>
            <div className="rounded-2xl border border-gold-400/25 bg-white p-6 sm:p-7 shadow-sm dark:bg-ink-900/50 space-y-3 sm:space-y-4">
              <Globe className="size-7 sm:size-8 text-gold-600 dark:text-gold-400" />
              <h3 className="font-serif text-lg sm:text-xl text-ink-950 dark:text-ivory">Unified Library Network</h3>
              <p className="text-xs leading-relaxed text-ink-600 dark:text-ink-300">
                Seamless synchronization between online accounts, digital holds, and physical circulation desks across all university branches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collections Showcase */}
      <section className="border-t border-gold-400/15 bg-gold-400/5 py-16 sm:py-24 dark:bg-ink-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 space-y-8 sm:space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-gold-700 dark:text-gold-300">Curated Library Holdings</span>
              <h2 className="mt-2 font-serif text-2xl sm:text-4xl text-ink-950 dark:text-ivory">Featured Classic Collections</h2>
            </div>
            <Button onClick={() => handleNav("/catalog")} variant="outline" size="sm" type="button" className="flex items-center justify-center gap-1.5 font-semibold text-xs border-gold-400/35 hover:border-gold-400/70 min-h-[44px] w-full sm:w-auto">
              <span>View All 15,400+ Titles</span>
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
            {featuredBooks.map((book, idx) => (
              <div
                key={idx}
                onClick={() => handleNav(`/catalog?search=${encodeURIComponent(book.title)}`)}
                className="group relative flex flex-col justify-between rounded-2xl border border-gold-400/25 bg-white p-3.5 sm:p-5 shadow-[0_8px_24px_-8px_rgba(197,160,89,0.15)] transition-all duration-300 hover:border-gold-400/60 hover:shadow-lg dark:bg-ink-900/60 dark:border-gold-400/15 cursor-pointer"
              >
                <div className="space-y-3 sm:space-y-4">
                  <div className="aspect-[2/3] w-full overflow-hidden rounded-xl bg-ink-100 dark:bg-ink-800 relative">
                    <img
                      src={book.cover}
                      alt={book.title}
                      decoding="async"
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 rounded-full bg-ink-950/80 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold text-gold-300 backdrop-blur-md border border-gold-400/20 truncate max-w-[90%]">
                      {book.category}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-serif text-sm sm:text-lg font-medium text-ink-950 dark:text-ivory group-hover:text-gold-600 dark:group-hover:text-gold-300 transition-colors line-clamp-1">
                      {book.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-ink-600 dark:text-ink-400 truncate">{book.author} · {book.year}</p>
                  </div>
                </div>

                <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-gold-400/10 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] sm:text-xs gap-1">
                  <span className="text-ink-500 dark:text-ink-400 truncate">{book.branch}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-gold-700 dark:text-gold-300">
                    <span className="size-1.5 rounded-full bg-gold-500 shrink-0" />
                    {book.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities / Features Grid */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-8 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center space-y-3 sm:space-y-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-gold-700 dark:text-gold-300">Operational Excellence</span>
          <h2 className="font-serif text-2xl sm:text-4xl text-ink-950 dark:text-ivory">
            Designed for Scholars, Curated for Efficiency
          </h2>
          <p className="text-xs sm:text-sm text-ink-600 dark:text-ink-200">
            A quiet harmony of visual refinement and robust operational circulation logic.
          </p>
          <div className="mx-auto h-px w-24 bg-gold-400/40 pt-1" />
        </div>

        <div className="mt-12 sm:mt-16 grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-gold-400/30 bg-white p-6 sm:p-8 shadow-[0_12px_36px_-8px_rgba(197,160,89,0.12)] backdrop-blur-md transition-all duration-300 hover:border-gold-400/60 dark:bg-ink-900/30 dark:border-gold-400/15"
            >
              <div className="flex items-center justify-between">
                <div className="inline-flex size-10 sm:size-12 items-center justify-center rounded-xl bg-gold-400/12 text-gold-700 dark:text-gold-300">
                  <feat.icon className="size-5 sm:size-6" />
                </div>
                <span className="rounded-full bg-gold-400/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-[10px] font-semibold tracking-wider text-gold-700 dark:text-gold-300 uppercase">
                  {feat.badge}
                </span>
              </div>
              <h3 className="mt-5 sm:mt-6 font-serif text-lg sm:text-xl text-ink-950 dark:text-ivory">{feat.title}</h3>
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm leading-relaxed text-ink-600 dark:text-ink-200">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Reading Branches Showcase */}
      <section id="branches" className="border-t border-gold-400/15 bg-gold-400/5 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="flex flex-col justify-center space-y-3 sm:space-y-4 lg:col-span-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-gold-700 dark:text-gold-300">Physical Holdings</span>
              <h2 className="font-serif text-2xl sm:text-4xl text-ink-950 dark:text-ivory">Our Reading Branches</h2>
              <p className="text-xs sm:text-sm leading-relaxed text-ink-600 dark:text-ink-200">
                Athenaeum operates three major academic repositories across campus. Discover shelf locations, branch-specific copies, and select your pickup destination.
              </p>
            </div>
            
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-3 lg:col-span-2">
              <div className="rounded-2xl border border-gold-400/30 bg-white p-5 sm:p-6 shadow-sm hover:border-gold-400/60 transition-all duration-300 dark:bg-ink-900/40 dark:border-gold-400/15">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gold-700 dark:text-gold-300">Branch I</span>
                <h3 className="mt-1.5 font-serif text-lg sm:text-xl text-ink-950 dark:text-ivory">Central Branch</h3>
                <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">Building A, Main Quad</p>
                <div className="mt-4 flex items-center justify-between text-xs text-gold-700 dark:text-gold-300 font-semibold border-t border-gold-400/10 pt-3">
                  <span>9,240 Titles</span>
                  <span>Stack A1-D4</span>
                </div>
              </div>

              <div className="rounded-2xl border border-gold-400/30 bg-white p-5 sm:p-6 shadow-sm hover:border-gold-400/60 transition-all duration-300 dark:bg-ink-900/40 dark:border-gold-400/15">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gold-700 dark:text-gold-300">Branch II</span>
                <h3 className="mt-1.5 font-serif text-lg sm:text-xl text-ink-950 dark:text-ivory">North Annex</h3>
                <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">Building C, Engineering</p>
                <div className="mt-4 flex items-center justify-between text-xs text-gold-700 dark:text-gold-300 font-semibold border-t border-gold-400/10 pt-3">
                  <span>2,150 Titles</span>
                  <span>Stack E1-F2</span>
                </div>
              </div>

              <div className="rounded-2xl border border-gold-400/30 bg-white p-5 sm:p-6 shadow-sm hover:border-gold-400/60 transition-all duration-300 dark:bg-ink-900/40 dark:border-gold-400/15">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gold-700 dark:text-gold-300">Branch III</span>
                <h3 className="mt-1.5 font-serif text-lg sm:text-xl text-ink-950 dark:text-ivory">Science Library</h3>
                <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">Building F, Research Park</p>
                <div className="mt-4 flex items-center justify-between text-xs text-gold-700 dark:text-gold-300 font-semibold border-t border-gold-400/10 pt-3">
                  <span>4,510 Titles</span>
                  <span>Stack S1-S8</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials / Scholar Endorsements */}
      <section className="mx-auto max-w-7xl px-4 sm:px-8 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center space-y-3 sm:space-y-4 mb-12 sm:mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-gold-700 dark:text-gold-300">Scholar Perspectives</span>
          <h2 className="font-serif text-2xl sm:text-4xl text-ink-950 dark:text-ivory">
            Endorsed by Researchers & Faculty
          </h2>
        </div>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="relative flex flex-col justify-between rounded-2xl border border-gold-400/30 bg-white p-6 sm:p-8 shadow-sm dark:bg-ink-900/40 dark:border-gold-400/15"
            >
              <Quote className="size-6 sm:size-8 text-gold-400/40 mb-3 sm:mb-4" />
              <p className="font-serif text-base sm:text-lg leading-relaxed text-ink-900 dark:text-ivory italic">
                "{t.quote}"
              </p>
              <div className="mt-6 pt-4 border-t border-gold-400/10 flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-ink-950 dark:text-ivory">{t.author}</h3>
                  <p className="text-[11px] sm:text-xs text-ink-500 dark:text-ink-400">{t.title}</p>
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-gold-700 dark:text-gold-300">{t.institution}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Conversion Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-8 pb-16 sm:pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-gold-400/40 bg-gradient-to-br from-ink-900 via-ink-950 to-ink-900 p-8 sm:p-16 text-center text-ivory shadow-[0_24px_60px_-15px_rgba(0,0,0,0.6)]">
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 size-96 rounded-full bg-gold-400/15 blur-[120px]" />
          
          <div className="relative z-10 mx-auto max-w-2xl space-y-4 sm:space-y-6">
            <span className="inline-block rounded-full border border-gold-400/30 bg-gold-400/10 px-3.5 py-1 text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-gold-300">
              Join the Academic Sanctuary
            </span>
            <h2 className="font-serif text-2xl sm:text-5xl font-light text-ivory leading-tight">
              Begin Your Journey Through Our Collections Today
            </h2>
            <p className="text-xs sm:text-base text-ink-200">
              Access 15,400+ titles, track circulation, and reserve books online across all campus reading branches.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Button onClick={() => handleNav("/catalog")} variant="primary" size="lg" type="button" className="flex w-full sm:w-auto min-h-[48px] items-center justify-center gap-2 font-semibold px-8">
                <span>Explore Catalog Now</span>
                <ArrowRight className="size-4.5" />
              </Button>
              <Button onClick={() => handleNav("/signup")} variant="outline" size="lg" type="button" className="flex w-full sm:w-auto min-h-[48px] items-center justify-center gap-2 font-semibold border-gold-400/40 text-ivory hover:bg-gold-400/10 px-6">
                <span>Register Account</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Authority Footer */}
      <footer className="border-t border-gold-400/15 bg-white/40 dark:bg-ink-950 py-12 sm:py-16 text-xs text-ink-600 dark:text-ink-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 space-y-8 sm:space-y-12">
          <div className="grid gap-8 grid-cols-2 lg:grid-cols-4">
            <div className="col-span-2 sm:col-span-1 space-y-3 sm:space-y-4">
              <button onClick={() => handleNav("/")} className="flex items-center gap-2 cursor-pointer">
                <LogoMark />
                <span className="font-display text-xl leading-none text-ink-800 dark:text-ivory mt-0.5">
                  Athen<span className="text-gold-gradient">aeum</span>
                </span>
              </button>
              <p className="text-xs leading-relaxed text-ink-500 dark:text-ink-400 max-w-xs">
                A premium academic repository and circulation engine crafted with quiet luxury styling for scholars, faculty, and institutions.
              </p>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              <h3 className="font-serif text-xs sm:text-sm font-semibold text-ink-950 dark:text-ivory uppercase tracking-wider">Quick Navigation</h3>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => handleNav("/catalog")} className="hover:text-gold-600 dark:hover:text-gold-300 transition-colors cursor-pointer">Catalog Directory</button></li>
                <li><a href="#philosophy" className="hover:text-gold-600 dark:hover:text-gold-300 transition-colors">Our Philosophy</a></li>
                <li><a href="#features" className="hover:text-gold-600 dark:hover:text-gold-300 transition-colors">System Capabilities</a></li>
                <li><a href="#branches" className="hover:text-gold-600 dark:hover:text-gold-300 transition-colors">Reading Branches</a></li>
              </ul>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              <h3 className="font-serif text-xs sm:text-sm font-semibold text-ink-950 dark:text-ivory uppercase tracking-wider">Reading Branches</h3>
              <ul className="space-y-2 text-xs">
                <li>Central Branch · Bldg A</li>
                <li>North Annex · Bldg C</li>
                <li>Science Library · Bldg F</li>
                <li>Archival Vault · Restricted</li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-2.5 sm:space-y-3">
              <h3 className="font-serif text-xs sm:text-sm font-semibold text-ink-950 dark:text-ivory uppercase tracking-wider">System Status</h3>
              <div className="rounded-xl border border-gold-400/20 bg-white/60 p-3.5 dark:bg-ink-900/60 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-gold-700 dark:text-gold-300 text-xs">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>Circulation Engine Online</span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-ink-500 dark:text-ink-400">All 3 reading branches operational and syncing in real-time.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gold-400/10 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[11px] sm:text-xs">
            <p className="font-serif tracking-wide">
              ATHENAEUM · EST. MMXXVI · ALL RIGHTS RESERVED
            </p>
            <div className="flex items-center gap-4 sm:gap-6">
              <span className="text-ink-500 dark:text-ink-400">Quiet Luxury System</span>
              <span>•</span>
              <span className="text-ink-500 dark:text-ink-400">Full-Stack Supabase</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
