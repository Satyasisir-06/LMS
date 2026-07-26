import React, { useState } from "react";
import { Puck, Render, type Data } from "@puckeditor/core";
import "@puckeditor/core/dist/index.css";
import { puckConfig } from "~/lib/puck.config";
import { Link } from "react-router";
import { ArrowLeft, Eye, Layout, CheckCircle2 } from "lucide-react";

const initialData: Data = {
  content: [
    {
      type: "Hero",
      props: {
        id: "hero-1",
        badgeText: "Visual Page Builder Active",
        title: "The Quiet Sanctuary for Scholars & Readers",
        description: "Explore thousands of curated titles, real-time circulation tracking, and effortless reservation management.",
        ctaText: "Browse Catalog",
        ctaLink: "/catalog",
      },
    },
    {
      type: "StatsBanner",
      props: {
        id: "stats-1",
        stat1Number: "45,000+",
        stat1Label: "Cataloged Books",
        stat2Number: "12,800+",
        stat2Label: "Active Members",
        stat3Number: "99.4%",
        stat3Label: "On-Time Returns",
      },
    },
    {
      type: "FeatureGrid",
      props: {
        id: "features-1",
        title: "Built for Modern Libraries",
        subtitle: "Everything you need to discover, reserve, and manage collections.",
        feature1Title: "Real-Time Availability",
        feature1Desc: "Instantly check physical and digital availability across all campus branches.",
        feature2Title: "Smart Holds & Renewals",
        feature2Desc: "Reserve popular titles in one click with automated renewal reminders.",
        feature3Title: "Curated Archives",
        feature3Desc: "Access rare manuscripts, digital journals, and historical publications.",
      },
    },
    {
      type: "CallToAction",
      props: {
        id: "cta-1",
        title: "Ready to Start Reading?",
        description: "Join our digital sanctuary today and get instant access to thousands of books and journals.",
        buttonText: "Create Free Account",
        buttonLink: "/signup",
      },
    },
  ],
  root: { props: { title: "Custom Page" } },
};

export default function PuckEditorClient() {
  const [data, setData] = useState<Data>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("puck_saved_page");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved layout", e);
        }
      }
    }
    return initialData;
  });

  const [isSaved, setIsSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = (newData: Data) => {
    setData(newData);
    if (typeof window !== "undefined") {
      localStorage.setItem("puck_saved_page", JSON.stringify(newData));
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Header bar */}
      <header className="h-14 border-b border-stone-800 bg-stone-900/90 px-4 flex items-center justify-between z-50 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition flex items-center gap-1.5 text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <div className="h-4 w-px bg-stone-800" />
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-amber-500 text-base">Athenaeum</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              Visual Editor (Puck)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSaved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Published to LocalStorage
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 transition border border-stone-700"
          >
            {showPreview ? (
              <>
                <Layout className="w-3.5 h-3.5" />
                Back to Canvas
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                Live Preview
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main workspace */}
      <main className="flex-1 overflow-hidden relative">
        {showPreview ? (
          <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400">Published Layout Preview</span>
            </div>
            <div className="bg-stone-900/60 p-6 rounded-2xl border border-stone-800 shadow-2xl">
              <Render config={puckConfig} data={data} />
            </div>
          </div>
        ) : (
          <div className="h-full puck-theme-dark">
            <Puck
              config={puckConfig}
              data={data}
              onPublish={handleSave}
              headerPath="Visual Editor"
            />
          </div>
        )}
      </main>
    </div>
  );
}
