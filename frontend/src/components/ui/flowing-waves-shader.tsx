import { useEffect, useRef } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export interface FlowingWavesShaderProps {
  className?: string;
  /** Keeps the center readable for overlaid hero content */
  disableCenterDimming?: boolean;
  /** Deeper wave tint when a tournament is live */
  hasActiveReminders?: boolean;
  /** Warmer wave tint when tournaments are upcoming */
  hasUpcomingReminders?: boolean;
  /** Freeze animation for prefers-reduced-motion — still shows the wave texture */
  paused?: boolean;
  /** Animation speed multiplier (default 0.22 — slow ambient drift) */
  speed?: number;
}

const vertexShader = `
  varying vec2 vTextureCoord;
  void main() {
    vTextureCoord = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision mediump float;
  uniform vec2 iResolution;
  uniform float iTime;
  uniform float uSpeed;
  uniform vec2 iMouse;
  uniform bool hasActiveReminders;
  uniform bool hasUpcomingReminders;
  uniform bool disableCenterDimming;
  varying vec2 vTextureCoord;

  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);

    vec2 center = iResolution.xy * 0.5;
    float dist = distance(fragCoord, center);
    float radius = min(iResolution.x, iResolution.y) * 0.5;
    float centerDim = disableCenterDimming ? 1.0 : smoothstep(radius * 0.3, radius * 0.5, dist);

    float t = iTime * uSpeed;

    for (float i = 1.0; i < 10.0; i++) {
      uv.x += 0.6 / i * cos(i * 2.5 * uv.y + t);
      uv.y += 0.6 / i * cos(i * 1.5 * uv.x + t);
    }

    float wave = abs(sin(t - uv.y - uv.x));

    // Brand orange palette — #D66E1F shadow, #F48735 base, #FFC48A highlight
    vec3 shadow = vec3(0.839, 0.431, 0.122);
    vec3 base = vec3(0.956, 0.529, 0.208);
    vec3 highlight = vec3(1.0, 0.773, 0.541);

    float ripple = smoothstep(0.25, 0.92, 1.0 / (wave * 4.0 + 0.35));
    vec3 color = mix(base, mix(shadow, highlight, ripple), ripple * 0.85);
    fragColor = vec4(color, 1.0);

    if (!disableCenterDimming) {
      fragColor.rgb = mix(fragColor.rgb * 0.3, fragColor.rgb, centerDim);
    }
  }

  void main() {
    vec4 color;
    mainImage(color, vTextureCoord * iResolution);
    gl_FragColor = color;
  }
`;

export function FlowingWavesShader({
  className,
  disableCenterDimming = true,
  hasActiveReminders = false,
  hasUpcomingReminders = false,
  paused = false,
  speed = 0.22,
}: FlowingWavesShaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.hasActiveReminders.value = hasActiveReminders;
    }
  }, [hasActiveReminders]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.hasUpcomingReminders.value = hasUpcomingReminders;
    }
  }, [hasUpcomingReminders]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.disableCenterDimming.value = disableCenterDimming;
    }
  }, [disableCenterDimming]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      const canvas = renderer.domElement;
      canvas.className = "absolute inset-0 block h-full w-full";
      container.appendChild(canvas);
    } catch (err) {
      console.error("WebGL not supported", err);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const timer = new THREE.Timer();
    timer.connect(document);

    const uniforms = {
      iTime: { value: 0 },
      uSpeed: { value: speed },
      iResolution: { value: new THREE.Vector2() },
      iMouse: { value: new THREE.Vector2() },
      hasActiveReminders: { value: hasActiveReminders },
      hasUpcomingReminders: { value: hasUpcomingReminders },
      disableCenterDimming: { value: disableCenterDimming },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
    });
    materialRef.current = material;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderFrame = (timestamp?: number) => {
      if (!paused) timer.update(timestamp);
      uniforms.iTime.value = paused ? 0 : timer.getElapsed();
      renderer.render(scene, camera);
    };

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      uniforms.iResolution.value.set(w, h);
      if (paused) renderFrame();
    };

    const onMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      uniforms.iMouse.value.set(
        event.clientX - rect.left,
        rect.height - (event.clientY - rect.top),
      );
    };

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);
    window.addEventListener("mousemove", onMouseMove);
    onResize();

    if (paused) {
      renderFrame();
    } else {
      renderer.setAnimationLoop((timestamp) => {
        renderFrame(timestamp);
      });
    }

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      renderer.setAnimationLoop(null);
      renderer.domElement.remove();
      material.dispose();
      geometry.dispose();
      renderer.dispose();
      timer.dispose();
      materialRef.current = null;
    };
  }, [disableCenterDimming, hasActiveReminders, hasUpcomingReminders, paused, speed]);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none overflow-hidden", className)}
      aria-hidden
    />
  );
}

export default FlowingWavesShader;
