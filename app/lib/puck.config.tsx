import React from "react";
import { BookOpen, Sparkles, ArrowRight, ShieldCheck, Clock, Library, CheckCircle2 } from "lucide-react";

export type ComponentProps = {
  Hero: {
    title: string;
    description: string;
    ctaText: string;
    ctaLink: string;
    badgeText: string;
  };
  Heading: {
    title: string;
    subtitle: string;
    align: "left" | "center" | "right";
  };
  FeatureGrid: {
    title: string;
    subtitle: string;
    feature1Title: string;
    feature1Desc: string;
    feature2Title: string;
    feature2Desc: string;
    feature3Title: string;
    feature3Desc: string;
  };
  CallToAction: {
    title: string;
    description: string;
    buttonText: string;
    buttonLink: string;
  };
  StatsBanner: {
    stat1Number: string;
    stat1Label: string;
    stat2Number: string;
    stat2Label: string;
    stat3Number: string;
    stat3Label: string;
  };
  BookShowcaseCard: {
    title: string;
    author: string;
    category: string;
    description: string;
    badge: string;
  };
};

export const puckConfig: any = {
  components: {
    Hero: {
      fields: {
        badgeText: { type: "text" },
        title: { type: "text" },
        description: { type: "textarea" },
        ctaText: { type: "text" },
        ctaLink: { type: "text" },
      },
      defaultProps: {
        badgeText: "Modern Library Management",
        title: "The Quiet Sanctuary for Scholars & Readers",
        description: "Explore thousands of curated titles, real-time circulation tracking, and effortless reservation management.",
        ctaText: "Browse Catalog",
        ctaLink: "/catalog",
      },
      render: ({ badgeText, title, description, ctaText, ctaLink }) => (
        <section className="relative overflow-hidden py-16 px-6 bg-stone-900 text-stone-100 rounded-2xl my-4 border border-stone-800 shadow-xl">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {badgeText && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                {badgeText}
              </span>
            )}
            <h1 className="text-3xl md:text-5xl font-serif font-medium tracking-tight text-amber-50">
              {title}
            </h1>
            <p className="text-stone-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              {description}
            </p>
            {ctaText && (
              <div className="pt-2">
                <a
                  href={ctaLink || "#"}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-medium rounded-xl transition shadow-lg shadow-amber-500/20"
                >
                  {ctaText}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        </section>
      ),
    },

    Heading: {
      fields: {
        title: { type: "text" },
        subtitle: { type: "textarea" },
        align: {
          type: "select",
          options: [
            { label: "Left", value: "left" },
            { label: "Center", value: "center" },
            { label: "Right", value: "right" },
          ],
        },
      },
      defaultProps: {
        title: "Featured Collections",
        subtitle: "Handpicked selections across literature, history, science, and arts.",
        align: "center",
      },
      render: ({ title, subtitle, align }) => {
        const alignClass = align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";
        return (
          <div className={`py-8 px-4 ${alignClass} my-2`}>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-stone-600 dark:text-stone-400 text-sm md:text-base max-w-xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        );
      },
    },

    FeatureGrid: {
      fields: {
        title: { type: "text" },
        subtitle: { type: "text" },
        feature1Title: { type: "text" },
        feature1Desc: { type: "textarea" },
        feature2Title: { type: "text" },
        feature2Desc: { type: "textarea" },
        feature3Title: { type: "text" },
        feature3Desc: { type: "textarea" },
      },
      defaultProps: {
        title: "Built for Modern Libraries",
        subtitle: "Everything you need to discover, reserve, and manage collections.",
        feature1Title: "Real-Time Availability",
        feature1Desc: "Instantly check physical and digital availability across all campus branches.",
        feature2Title: "Smart Holds & Renewals",
        feature2Desc: "Reserve popular titles in one click with automated renewal reminders.",
        feature3Title: "Curated Archives",
        feature3Desc: "Access rare manuscripts, digital journals, and historical publications.",
      },
      render: ({
        title,
        subtitle,
        feature1Title,
        feature1Desc,
        feature2Title,
        feature2Desc,
        feature3Title,
        feature3Desc,
      }) => (
        <section className="py-12 px-4 my-4">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">{title}</h2>
            <p className="text-stone-600 dark:text-stone-400 text-sm mt-1">{subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="p-6 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">{feature1Title}</h3>
              <p className="text-sm text-stone-600 dark:text-stone-400">{feature1Desc}</p>
            </div>
            <div className="p-6 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">{feature2Title}</h3>
              <p className="text-sm text-stone-600 dark:text-stone-400">{feature2Desc}</p>
            </div>
            <div className="p-6 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <Library className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">{feature3Title}</h3>
              <p className="text-sm text-stone-600 dark:text-stone-400">{feature3Desc}</p>
            </div>
          </div>
        </section>
      ),
    },

    StatsBanner: {
      fields: {
        stat1Number: { type: "text" },
        stat1Label: { type: "text" },
        stat2Number: { type: "text" },
        stat2Label: { type: "text" },
        stat3Number: { type: "text" },
        stat3Label: { type: "text" },
      },
      defaultProps: {
        stat1Number: "45,000+",
        stat1Label: "Cataloged Books",
        stat2Number: "12,800+",
        stat2Label: "Active Members",
        stat3Number: "99.4%",
        stat3Label: "On-Time Returns",
      },
      render: ({ stat1Number, stat1Label, stat2Number, stat2Label, stat3Number, stat3Label }) => (
        <section className="py-8 px-6 my-4 bg-amber-50 dark:bg-stone-900/80 rounded-2xl border border-amber-200/50 dark:border-stone-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center max-w-4xl mx-auto">
            <div>
              <p className="text-3xl font-bold font-serif text-amber-700 dark:text-amber-400">{stat1Number}</p>
              <p className="text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400 mt-1">{stat1Label}</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-serif text-amber-700 dark:text-amber-400">{stat2Number}</p>
              <p className="text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400 mt-1">{stat2Label}</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-serif text-amber-700 dark:text-amber-400">{stat3Number}</p>
              <p className="text-xs uppercase tracking-wider text-stone-600 dark:text-stone-400 mt-1">{stat3Label}</p>
            </div>
          </div>
        </section>
      ),
    },

    BookShowcaseCard: {
      fields: {
        title: { type: "text" },
        author: { type: "text" },
        category: { type: "text" },
        badge: { type: "text" },
        description: { type: "textarea" },
      },
      defaultProps: {
        title: "The Odyssey of Knowledge",
        author: "Prof. Alexander Wright",
        category: "History & Philosophy",
        badge: "Editor's Pick",
        description: "An illuminating exploration into ancient libraries, lost archives, and the evolution of human thought.",
      },
      render: ({ title, author, category, badge, description }) => (
        <div className="p-6 max-w-md mx-auto my-4 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
              {category}
            </span>
            {badge && (
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                {badge}
              </span>
            )}
          </div>
          <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">{title}</h3>
          <p className="text-sm font-medium text-stone-600 dark:text-stone-400 mt-1">by {author}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-3 leading-relaxed">{description}</p>
        </div>
      ),
    },

    CallToAction: {
      fields: {
        title: { type: "text" },
        description: { type: "textarea" },
        buttonText: { type: "text" },
        buttonLink: { type: "text" },
      },
      defaultProps: {
        title: "Ready to Start Reading?",
        description: "Join our digital sanctuary today and get instant access to thousands of books and journals.",
        buttonText: "Create Free Account",
        buttonLink: "/signup",
      },
      render: ({ title, description, buttonText, buttonLink }) => (
        <section className="py-12 px-6 my-6 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 text-stone-100 rounded-2xl text-center border border-stone-800 shadow-lg">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-amber-100 mb-3">{title}</h2>
          <p className="text-stone-300 text-sm md:text-base max-w-lg mx-auto mb-6">{description}</p>
          <a
            href={buttonLink || "#"}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-xl transition shadow-md"
          >
            {buttonText}
            <ArrowRight className="w-4 h-4" />
          </a>
        </section>
      ),
    },
  },
};
