import { FRAGMENT, VERTEX } from "./home-light-shaders";

const MAX_RENDER_DIMENSION = 1280;
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function palette() {
  const tokens = getComputedStyle(document.documentElement);
  const rgb = (name: string, fallback: number[]) => {
    const values = tokens.getPropertyValue(name).split(",").map(Number);
    return values.length === 3 && values.every(Number.isFinite) ? values.map(v => clamp(v / 255)) : fallback;
  };
  const blue = rgb("--resin-blue-rgb", [0.18, 0.44, 0.91]);
  const cyan = rgb("--resin-cyan-rgb", [0.29, 0.8, 0.95]);
  // Keep every reference tint in the logo's resin family, including its warm slots.
  return new Float32Array(Array.from({ length: 16 }, (_, index) => {
    if (index === 13) return [0.72, 0.91, 1];
    const mix = index % 3 === 0 ? 0.15 : 0.75;
    return blue.map((value, channel) => value * (1 - mix) + cyan[channel] * mix);
  }).flat());
}

/** A reversible, scroll-driven adaptation of the supplied LaserFlow surface shader. */
export function mountHomeLight(host: HTMLElement, passage: HTMLElement, surface: HTMLElement) {
  const group = host.parentElement;
  const anchor = surface.parentElement;
  if (!group || !anchor) return;
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", { alpha: true, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
  if (!gl) { host.dataset.lightState = "unavailable"; return; }
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    if (program) gl.deleteProgram(program);
    host.dataset.lightState = "unavailable";
    return;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    host.dataset.lightState = "unavailable";
    return;
  }
  const vao = gl.createVertexArray();
  const buffer = gl.createBuffer();
  if (!vao || !buffer) {
    gl.deleteVertexArray(vao);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    host.dataset.lightState = "unavailable";
    return;
  }
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.useProgram(program);
  const uniform = (name: string) => gl.getUniformLocation(program, name);
  const u = Object.fromEntries([
    "uResolution", "uDpr", "uScale", "uTime", "uBeamX", "uSurface", "uRadius",
    "uIntro", "uPour", "uRun", "uAmount", "uShape", "uExtra", "uTheme", "uTint",
  ].map(name => [name, uniform(name)]));
  gl.uniform3fv(u.uTint, palette());
  gl.uniform4f(u.uShape, 0.65, 0.65, 1.65, 0.3);
  gl.uniform4f(u.uExtra, 0, 0, 0, 0);
  gl.uniform1f(u.uTheme, 0);
  host.append(canvas);
  host.dataset.lightState = "ready";

  let alive = true;
  let visible = false;
  let frame = 0;
  let width = 1;
  let height = 1;
  let top = 0;
  let dirty = true;

  const render = () => {
    frame = 0;
    if (!alive || !visible || document.hidden) return;
    // Only read layout on scroll/resize, never in an ambient animation loop.
    const groupRect = group.getBoundingClientRect();
    const passageRect = passage.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const surfaceRect = surface.getBoundingClientRect();
    if (dirty) {
      top = passageRect.top - groupRect.top - 180;
      width = groupRect.width;
      height = Math.max(1, anchorRect.top - passageRect.top + 180 + 320);
      host.style.top = `${top}px`;
      host.style.height = `${height}px`;
      const ratio = Math.min(devicePixelRatio || 1, 1, MAX_RENDER_DIMENSION / Math.max(width, height));
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      dirty = false;
    }
    const viewport = innerHeight;
    const distance = anchorRect.top - passageRect.top + viewport * 0.25;
    const progress = clamp((viewport * 0.8 - passageRect.top) / Math.max(1, distance));
    const fade = smooth((anchorRect.top - viewport * 0.12) / (viewport * 0.28));
    const opacity = smooth(progress / 0.16) * fade;
    host.style.opacity = `${opacity * 0.72}`;
    if (opacity < 0.001) return;
    const originY = groupRect.top + top;
    const left = surfaceRect.left - groupRect.left;
    const right = surfaceRect.right - groupRect.left;
    const y = surfaceRect.top - originY;
    const bottom = surfaceRect.bottom - originY;
    // The incoming beam stays away from the central brand title.
    const beamX = left + (right - left) * 0.86;
    const scale = Math.max(0.2, Math.min(width / 585, height / 507));
    const impact = smooth((progress - 0.58) / 0.27);
    const front = -100 + (y + 280) * smooth(progress / 0.7);
    const run = (right - left) / scale * smooth((progress - 0.62) / 0.35);
    const radius = Math.min(28, surfaceRect.width / 2);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniform2f(u.uResolution, width, height);
    gl.uniform1f(u.uDpr, canvas.width / width);
    gl.uniform1f(u.uScale, scale);
    gl.uniform1f(u.uTime, progress * 2.5);
    gl.uniform1f(u.uBeamX, beamX);
    gl.uniform4f(u.uSurface, left, y, right, bottom);
    gl.uniform1f(u.uRadius, radius);
    gl.uniform3f(u.uIntro, front, impact, 0);
    gl.uniform4f(u.uPour, impact * 450, impact * 450, impact, impact);
    gl.uniform2f(u.uRun, run, 0);
    gl.uniform4f(u.uAmount, 0.62, 0, 0, 0.24);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const schedule = () => {
    if (alive && visible && !document.hidden && !frame) frame = requestAnimationFrame(render);
  };
  const resize = () => { dirty = true; schedule(); };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(group);
  resizeObserver.observe(passage);
  resizeObserver.observe(anchor);
  resizeObserver.observe(surface);
  const intersecting = new Set<Element>();
  const intersection = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) intersecting.add(entry.target);
      else intersecting.delete(entry.target);
    }
    visible = intersecting.size > 0;
    if (visible) { dirty = true; schedule(); }
    else { cancelAnimationFrame(frame); frame = 0; }
  }, { rootMargin: "320px" });
  intersection.observe(passage);
  // Observe the stable flow anchor, not the sticky card (which can stay onscreen).
  intersection.observe(anchor);
  const visibility = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    schedule();
  };
  const lost = (event: Event) => {
    event.preventDefault();
    cleanup();
    host.dataset.lightState = "unavailable";
  };
  function cleanup() {
    if (!alive) return;
    alive = false;
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    intersection.disconnect();
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", visibility);
    canvas.removeEventListener("webglcontextlost", lost);
    gl?.deleteBuffer(buffer);
    gl?.deleteVertexArray(vao);
    gl?.deleteProgram(program);
    canvas.remove();
    host.style.removeProperty("opacity");
    host.style.removeProperty("top");
    host.style.removeProperty("height");
    host.dataset.lightState = "inactive";
  }
  canvas.addEventListener("webglcontextlost", lost);
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", visibility);
  return cleanup;
}
