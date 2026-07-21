import React, { useRef, useEffect, useState } from "react";

interface GooeyNavItem {
  label: string;
  href: string;
  /** When provided, the item renders this icon instead of its text label. */
  icon?: React.ReactNode;
}

export interface GooeyNavProps {
  items: GooeyNavItem[];
  /** Called instead of (and before preventing) the default anchor navigation. */
  onNavigate?: (href: string, index: number) => void;
  /** External control of the active item (e.g. the current route). */
  activeHref?: string;
  animationTime?: number;
  particleCount?: number;
  particleDistances?: [number, number];
  particleR?: number;
  timeVariance?: number;
  colors?: number[];
  initialActiveIndex?: number;
}

const GooeyNav: React.FC<GooeyNavProps> = ({
  items,
  onNavigate,
  activeHref,
  animationTime = 600,
  particleCount = 15,
  particleDistances = [90, 10],
  particleR = 100,
  timeVariance = 300,
  colors = [1, 2, 3, 1, 2, 3, 1, 4],
  initialActiveIndex = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const filterRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const isInitialMount = useRef(true);

  // Synchronously compute current active index based on activeHref
  const computedIndex = activeHref != null
    ? items.findIndex((i) => i.href === activeHref)
    : initialActiveIndex;
  const initialIdx = computedIndex >= 0 ? computedIndex : initialActiveIndex;

  const [activeIndex, setActiveIndex] = useState<number>(initialIdx);
  const [prevActiveHref, setPrevActiveHref] = useState<string | undefined>(activeHref);

  // Synchronize state with prop during render to avoid 1-frame layout delay
  if (activeHref !== prevActiveHref) {
    setPrevActiveHref(activeHref);
    const newIdx = activeHref != null ? items.findIndex((i) => i.href === activeHref) : -1;
    if (newIdx >= 0 && newIdx !== activeIndex) {
      setActiveIndex(newIdx);
      isInitialMount.current = true; // Skip sliding animation on route transition
    }
  }

  const noise = (n = 1) => n / 2 - Math.random() * n;
  const getXY = (
    distance: number,
    pointIndex: number,
    totalPoints: number,
  ): [number, number] => {
    const angle =
      ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
    return [distance * Math.cos(angle), distance * Math.sin(angle)];
  };
  const createParticle = (
    i: number,
    t: number,
    d: [number, number],
    r: number,
  ) => {
    let rotate = noise(r / 10);
    return {
      start: getXY(d[0], particleCount - i, particleCount),
      end: getXY(d[1] + noise(7), particleCount - i, particleCount),
      time: t,
      scale: 1 + noise(0.2),
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10,
    };
  };
  const makeParticles = (element: HTMLElement) => {
    const d: [number, number] = particleDistances;
    const r = particleR;
    const bubbleTime = animationTime * 2 + timeVariance;
    element.style.setProperty("--time", `${bubbleTime}ms`);
    for (let i = 0; i < particleCount; i++) {
      const t = animationTime * 2 + noise(timeVariance * 2);
      const p = createParticle(i, t, d, r);
      element.classList.remove("active");
      setTimeout(() => {
        const particle = document.createElement("span");
        const point = document.createElement("span");
        particle.classList.add("particle");
        particle.style.setProperty("--start-x", `${p.start[0]}px`);
        particle.style.setProperty("--start-y", `${p.start[1]}px`);
        particle.style.setProperty("--end-x", `${p.end[0]}px`);
        particle.style.setProperty("--end-y", `${p.end[1]}px`);
        particle.style.setProperty("--time", `${p.time}ms`);
        particle.style.setProperty("--scale", `${p.scale}`);
        particle.style.setProperty(
          "--color",
          `var(--color-${p.color}, white)`,
        );
        particle.style.setProperty("--rotate", `${p.rotate}deg`);
        point.classList.add("point");
        particle.appendChild(point);
        element.appendChild(particle);
        requestAnimationFrame(() => {
          element.classList.add("active");
        });
        setTimeout(() => {
          try {
            element.removeChild(particle);
          } catch {}
        }, t);
      }, 30);
    }
  };

  const updateEffectPosition = (element: HTMLElement, immediate = false) => {
    if (!containerRef.current || !filterRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const pos = element.getBoundingClientRect();
    const styles = {
      left: `${pos.x - containerRect.x}px`,
      top: `${pos.y - containerRect.y}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`,
    };

    if (immediate) {
      filterRef.current.style.transition = "none";
      if (textRef.current) textRef.current.style.transition = "none";
    }

    Object.assign(filterRef.current.style, styles);
    if (textRef.current) {
      Object.assign(textRef.current.style, styles);
      textRef.current.innerText = element.innerText;
    }

    if (immediate) {
      // Force reflow to snap instantly without slide transition
      void filterRef.current.offsetHeight;
      requestAnimationFrame(() => {
        if (filterRef.current) filterRef.current.style.transition = "";
        if (textRef.current) textRef.current.style.transition = "";
      });
    }
  };

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    index: number,
  ) => {
    e.preventDefault();
    if (activeIndex === index) {
      onNavigate?.(items[index].href, index);
      return;
    }
    isInitialMount.current = false;
    setActiveIndex(index);

    const targetLi = navRef.current?.querySelectorAll("li")[index] as HTMLElement | undefined;
    if (targetLi) {
      updateEffectPosition(targetLi, false);
    }

    if (filterRef.current) {
      const particles = filterRef.current.querySelectorAll(".particle");
      particles.forEach((p) => filterRef.current!.removeChild(p));
    }
    if (textRef.current) {
      textRef.current.classList.remove("active");
      void textRef.current.offsetWidth;
      textRef.current.classList.add("active");
    }
    if (filterRef.current) {
      makeParticles(filterRef.current);
    }

    onNavigate?.(items[index].href, index);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLAnchorElement>,
    index: number,
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const liEl = e.currentTarget.parentElement;
      if (liEl) {
        handleClick(
          {
            currentTarget: liEl,
          } as React.MouseEvent<HTMLAnchorElement>,
          index,
        );
      }
    }
  };

  useEffect(() => {
    if (!navRef.current || !containerRef.current) return;
    const activeLi = navRef.current.querySelectorAll("li")[
      activeIndex
    ] as HTMLElement;
    if (activeLi) {
      updateEffectPosition(activeLi, isInitialMount.current);
      if (isInitialMount.current) {
        isInitialMount.current = false;
      }
      textRef.current?.classList.add("active");
    }
    const resizeObserver = new ResizeObserver(() => {
      const currentActiveLi = navRef.current?.querySelectorAll("li")[
        activeIndex
      ] as HTMLElement;
      if (currentActiveLi) {
        updateEffectPosition(currentActiveLi, true);
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [activeIndex]);

  return (
    <>
      <style>
        {`
          .gooey-nav {
            --color-1: #d4af37;
            --color-2: #f5e7bd;
            --color-3: #c9a227;
            --color-4: #fef3c7;
            --linear-ease: linear(0, 0.068, 0.19 2.7%, 0.804 8.1%, 1.037, 1.199 13.2%, 1.245, 1.27 15.8%, 1.274, 1.272 17.4%, 1.249 19.1%, 0.996 28%, 0.949, 0.928 33.3%, 0.926, 0.933 36.8%, 1.001 45.6%, 1.013, 1.019 50.8%, 1.018 54.4%, 1 63.1%, 0.995 68%, 1.001 85%, 1);
          }
          .gooey-nav .effect {
            position: absolute;
            opacity: 1;
            pointer-events: none;
            display: grid;
            place-items: center;
            z-index: 1;
            transition: left 0.3s ease, top 0.3s ease, width 0.3s ease, height 0.3s ease;
          }
          .gooey-nav .effect.text {
            color: white;
            transition: color 0.3s ease;
          }
          .gooey-nav .effect.text.active {
            color: #d4af37;
          }
          .gooey-nav .effect.filter {
            filter: url(#gooey-filter);
          }
          .gooey-nav .effect.filter::after {
            content: "";
            position: absolute;
            inset: 0;
            background: rgba(255, 255, 255, 0.14);
            transform: scale(0);
            opacity: 0;
            z-index: -1;
            border-radius: 9999px;
          }
          .gooey-nav .effect.active::after {
            animation: gooey-pill 0.3s ease both;
          }
          @keyframes gooey-pill {
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
          .gooey-nav .particle,
          .gooey-nav .point {
            display: block;
            opacity: 0;
            width: 20px;
            height: 20px;
            border-radius: 9999px;
            transform-origin: center;
          }
          .gooey-nav .particle {
            --time: 5s;
            position: absolute;
            top: calc(50% - 8px);
            left: calc(50% - 8px);
            animation: gooey-particle calc(var(--time)) ease 1 -350ms;
          }
          .gooey-nav .point {
            background: var(--color);
            opacity: 1;
            animation: gooey-point calc(var(--time)) ease 1 -350ms;
          }
          @keyframes gooey-particle {
            0% {
              transform: rotate(0deg) translate(calc(var(--start-x)), calc(var(--start-y)));
              opacity: 1;
              animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
            }
            70% {
              transform: rotate(calc(var(--rotate) * 0.5)) translate(calc(var(--end-x) * 1.2), calc(var(--end-y) * 1.2));
              opacity: 1;
              animation-timing-function: ease;
            }
            85% {
              transform: rotate(calc(var(--rotate) * 0.66)) translate(calc(var(--end-x)), calc(var(--end-y)));
              opacity: 1;
            }
            100% {
              transform: rotate(calc(var(--rotate) * 1.2)) translate(calc(var(--end-x) * 0.5), calc(var(--end-y) * 0.5));
              opacity: 1;
            }
          }
          @keyframes gooey-point {
            0% {
              transform: scale(0);
              opacity: 0;
              animation-timing-function: cubic-bezier(0.55, 0, 1, 0.45);
            }
            25% {
              transform: scale(calc(var(--scale) * 0.25));
            }
            38% {
              opacity: 1;
            }
            65% {
              transform: scale(var(--scale));
              opacity: 1;
              animation-timing-function: ease;
            }
            85% {
              transform: scale(var(--scale));
              opacity: 1;
            }
            100% {
              transform: scale(0);
              opacity: 0;
            }
          }
          .gooey-nav li {
            opacity: 0.55;
            transition: opacity 0.3s ease, color 0.3s ease;
          }
          .gooey-nav li.active {
            opacity: 1;
            color: #d4af37;
            text-shadow: none;
          }
          .gooey-nav li.active a,
          .gooey-nav li.active svg {
            color: #d4af37 !important;
            stroke: #d4af37 !important;
          }
          .gooey-nav li.active::after {
            opacity: 1;
            transform: scale(1);
          }
          .gooey-nav li::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 9999px;
            background: rgba(255, 255, 255, 0.1);
            opacity: 0;
            transform: scale(0);
            transition: all 0.3s ease;
            z-index: -1;
          }
        `}
      </style>
      <div
        className="relative gooey-nav"
        ref={containerRef}
        style={{ isolation: "isolate" }}
      >
        <nav
          className="flex relative"
          style={{ transform: "translate3d(0,0,0.01px)" }}
        >
          <ul
            ref={navRef}
            className="flex w-full justify-evenly list-none p-0 px-2 m-0 relative z-[3]"
            style={{
              color: "white",
              textShadow: "0 1px 1px hsl(205deg 30% 10% / 0.2)",
            }}
          >
            {items.map((item, index) => (
              <li
                key={index}
                className={`rounded-full relative cursor-pointer transition-[background-color_color_box-shadow] duration-300 ease shadow-[0_0_0.5px_1.5px_transparent] text-white ${
                  activeIndex === index ? "active" : ""
                }`}
              >
                <a
                  href={item.href}
                  onClick={(e) => handleClick(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  aria-label={item.label}
                  className="flex items-center justify-center outline-none py-[0.55em] px-[0.7em] text-[13px] font-medium sm:text-sm"
                >
                  {item.icon ?? item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <span className="effect filter" ref={filterRef} />
        <span className="effect text" ref={textRef} />
      </div>

      <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id="gooey-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
          </filter>
        </defs>
      </svg>
    </>
  );
};

export default GooeyNav;
