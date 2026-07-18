import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type FloatingLinesProps = {
  linesGradient?: string[];
  enabledWaves?: boolean;
  lineCount?: number;
  lineDistance?: number;
  animationSpeed?: number;
  interactive?: boolean;
  parallax?: boolean;
  mixBlendMode?: React.CSSProperties["mixBlendMode"];
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

const vertexShader = /* glsl */ `
  varying vec2 uv;
  void main() {
    uv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float u_time;
  uniform float u_ratio;
  uniform vec2 u_pointer;
  uniform vec3 u_lines[LINECOUNT];
  uniform float u_line_count;
  uniform float u_line_gap;
  uniform float lineGradientCount;
  uniform vec3 lineGradients[LINEGRADIENTCOUNT];
  uniform float lineGradientSize;
  uniform float gradientColorAmount;
  uniform float enabledWaves;
  uniform float interactive;
  uniform vec2 u_pointer_speed;

  varying vec2 uv;

  float N(float t) {
    return fract(sin(t * 10234.324) * 123423.23512);
  }

  // Hash without Sine
  // Inspiration: https://www.shadertoy.com/view/XlGcRh
  vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.xy) * p3.zy);
  }
  float wave(vec2 p, float t) {
    vec2 k = vec2(1.5, 0.5);
    p += dot(p, k) * 0.2;
    return sin(p.x * 3.0 + t) * 0.5 + 0.5;
  }

  vec3 getGradient(int index) {
    float linePhase = fract((u_time * 0.02 + float(index)));
    vec3 colorA = lineGradients[index * 3];
    vec3 colorB = lineGradients[index * 3 + 1];
    vec3 colorC = lineGradients[index * 3 + 2];
    float total = abs(linePhase) + abs(linePhase - 1.0) + abs(linePhase - 2.0);
    return (colorA * abs(linePhase) + colorB * abs(linePhase - 1.0) + colorC * abs(linePhase - 2.0)) / total;
  }

  void main() {
    vec3 PINK = vec3(233.0, 71.0, 245.0) / 255.0;
    vec3 BLUE = vec3(47.0, 75.0, 162.0) / 255.0;
    vec2 uv1 = uv - 0.5;
    uv1.x *= 1.0 / (u_ratio * 1.0);

    float bgValue = 0.1;
    vec3 lineCol = vec3(0.0);
    vec2 uvDistorter = vec2(0.0);
    if (interactive == 1.0) {
      uvDistorter = (u_pointer - uv) * 0.2;
    }
    if (lineGradientCount > 0.0) {
      for (int i = 0; i < LINECOUNT; i++) {
        float lineY = 1.0 - N(float(i)) * u_line_count;
        float amp = 0.02 + 0.02 * N(float(i) + 1.0);
        float freq = 2.0 + 4.0 * N(float(i) + 2.0);
        float phase = u_time * 0.1 + N(float(i)) * 6.28;
        float gap = N(float(i)) * 0.5 + 0.2;
        float y = lineY + sin((uv1.x + uvDistorter.x) * freq + phase) * amp;
        float d = abs(uv1.y - y + uvDistorter.y);
        float line = smoothstep(0.01 + gap * 0.1, 0.0, d);
        float value = clamp(line, 0.0, 1.0);
        bgValue += value;
        vec3 grad = getGradient(i);
        lineCol += grad * value * 0.5 * gradientColorAmount;
      }
    }

    // Background: deep ink tone (theme) when a gradient is set, otherwise the
    // original pink/blue wash. The line colors are composited on top so the
    // gradient actually shows (the upstream component discarded them).
    vec3 background_color = vec3(0.03, 0.028, 0.03);
    if (lineGradientCount <= 0.0) {
      background_color = BLUE * 0.1 + PINK * 0.1;
    }

    vec3 col = background_color + lineCol;

    vec2 localUv = (uv - 0.5) * vec2(u_ratio, 1.0);
    if (enabledWaves == 1.0) {
      col += 0.08 * wave(localUv, u_time);
      col += 0.04 * wave(localUv * 1.5 + vec2(3.0, 0.0), u_time * 1.2);
    }

    gl_FragColor = vec4(col, 1.0);
    return;
  }
`;

export function FloatingLines({
  linesGradient = ["#f3e3bf", "#cba868", "#8a6d3b"],
  enabledWaves = true,
  lineCount = 30,
  lineDistance = 0.2,
  animationSpeed = 0.4,
  interactive = true,
  parallax = false,
  mixBlendMode,
  className,
  style,
  children,
}: FloatingLinesProps) {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [parallaxPos, setParallax] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    if (mixBlendMode && containerRef.current) {
      containerRef.current.style.mixBlendMode = mixBlendMode;
    }
  }, [mixBlendMode]);

  const colors = useMemo(() => {
    const arr: number[] = [];
    if (linesGradient && linesGradient.length > 0) {
      for (let i = 0; i < lineCount; i++) {
        for (const color of linesGradient) {
          const c = new THREE.Color(color);
          arr.push(c.r, c.g, c.b);
        }
      }
    }
    return arr;
  }, [linesGradient, lineCount]);

  const lineGradientSize = linesGradient ? linesGradient.length : 0;

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const mousePosition = { x: 0.5, y: 0.5 };
    const mouseSpeed = { x: 0, y: 0 };

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const canvas = renderer.domElement;
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "0";
    canvas.style.pointerEvents = "none";
    container.appendChild(canvas);

    let animationSpeedFactor = animationSpeed;
    const setAnimationSpeed = (speed: number) => {
      animationSpeedFactor = speed;
    };

    let gradientColorAmount = 1;
    const setGradientColorAmount = (amount: number) => {
      gradientColorAmount = Math.max(0, Math.min(1, amount));
    };

    let lineGap = lineDistance;
    const setLineGap = (gap: number) => {
      lineGap = gap;
    };

    const uniforms = {
      u_time: { value: 0 },
      u_ratio: { value: 1 },
      u_pointer: { value: new THREE.Vector2(0.5, 0.5) },
      u_pointer_speed: { value: new THREE.Vector2(0, 0) },
      u_lines: { value: Array.from({ length: lineCount }, () => new THREE.Vector3()) },
      u_line_count: { value: lineCount },
      u_line_gap: { value: lineGap },
      lineGradientCount: { value: lineGradientSize },
      lineGradients: { value: colors },
      lineGradientSize: { value: lineGradientSize },
      gradientColorAmount: { value: gradientColorAmount },
      enabledWaves: { value: enabledWaves ? 1 : 0 },
      interactive: { value: interactive ? 1 : 0 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: fragmentShader
        .replace(/LINECOUNT/g, String(lineCount))
        .replace(/LINEGRADIENTCOUNT/g, String(lineCount * lineGradientSize)),
      uniforms,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width || 1;
      const height = rect.height || 1;
      renderer.setSize(width, height, false);
      uniforms.u_ratio.value = width / height;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let raf = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      uniforms.u_time.value = t * animationSpeedFactor;
      uniforms.u_pointer_speed.value.set(
        (mousePosition.x - uniforms.u_pointer.value.x) * 0.1,
        (mousePosition.y - uniforms.u_pointer.value.y) * 0.1,
      );
      uniforms.u_pointer.value.set(mousePosition.x, mousePosition.y);
      uniforms.u_line_gap.value = lineGap;
      uniforms.gradientColorAmount.value = gradientColorAmount;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      mousePosition.x = x;
      mousePosition.y = y;
      if (parallax) {
        setParallax([x - 0.5, y - 0.5]);
      }
    };
    if (interactive) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    const handleMouseLeave = () => {
      mousePosition.x = 0.5;
      mousePosition.y = 0.5;
    };
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }
    };
  }, [colors, lineCount, lineGradientSize, lineDistance, animationSpeed, enabledWaves, interactive, parallax]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        ...style,
        transform: parallaxPos[0]
          ? `translate3d(${parallaxPos[0] * -10}px, ${parallaxPos[1] * -10}px, 0)`
          : undefined,
      }}
    >
      <div ref={ref} className="absolute inset-0" aria-hidden />
      {children}
    </div>
  );
}
