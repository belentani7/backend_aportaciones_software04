/**
 * Plasma Milky Light Shader - UV/Blacklight Theme
 * 
 * Creates a liquid plasma effect with milky light rays,
 * optimized for ultra violet/blacklight aesthetic.
 * Features multi-layer noise, chromatic aberration, and organic flow.
 */

// ============================================
// UNIFORMS
// ============================================
export const plasmaUniforms = {
  uTime: { value: 0 },
  uResolution: { value: [1, 1] },
  uMouse: { value: [0, 0] },
  uMouseVel: { value: [0, 0] },
  
  // Color palette - UV/Blacklight theme
  uColorDeep: { value: [0.02, 0.0, 0.08] },      // Deep UV void
  uColorMid: { value: [0.35, 0.1, 0.65] },       // Mid UV purple
  uColorBright: { value: [0.55, 0.25, 0.95] },   // Bright UV
  uColorPlasma: { value: [0.85, 0.27, 0.94] },   // Plasma pink
  uColorMilky: { value: [0.96, 0.96, 0.97] },    // Milky white
  uColorHot: { value: [1.0, 0.47, 0.98] },       // Hot plasma
  
  // Effect controls
  uOpacity: { value: 0.6 },
  uSpeed: { value: 0.15 },
  uScale: { value: 2.5 },
  uDistortion: { value: 1.8 },
  uChromaticAberration: { value: 0.015 },
  uVignette: { value: 0.7 },
  uMilkyIntensity: { value: 0.4 },
  uPlasmaIntensity: { value: 0.6 },
  uFlowDirection: { value: 1.0 },
  uQuality: { value: 1.0 },
};

// ============================================
// VERTEX SHADER
// ============================================
export const plasmaVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// ============================================
// FRAGMENT SHADER - PLASMA MILKY LIGHT
// ============================================
export const plasmaFragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform vec2 uMouseVel;

uniform vec3 uColorDeep;
uniform vec3 uColorMid;
uniform vec3 uColorBright;
uniform vec3 uColorPlasma;
uniform vec3 uColorMilky;
uniform vec3 uColorHot;

uniform float uOpacity;
uniform float uSpeed;
uniform float uScale;
uniform float uDistortion;
uniform float uChromaticAberration;
uniform float uVignette;
uniform float uMilkyIntensity;
uniform float uPlasmaIntensity;
uniform float uFlowDirection;
uniform float uQuality;

varying vec2 vUv;
varying vec3 vPosition;

// ============================================
// NOISE FUNCTIONS
// ============================================

// 2D Hash
vec2 hash22(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

// 3D Hash
vec3 hash33(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), 
           dot(p, vec3(269.5, 183.3, 246.1)), 
           dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453);
}

// Smooth noise
float snoise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  
  vec2 a = hash22(i);
  vec2 b = hash22(i + vec2(1.0, 0.0));
  vec2 c = hash22(i + vec2(0.0, 1.0));
  vec2 d = hash22(i + vec2(1.0, 1.0));
  
  return mix(mix(a.x, b.x, f.x), mix(c.x, d.x, f.x), f.y);
}

// Fractal Brownian Motion
float fbm(vec2 p, int octaves, float lacunarity, float gain) {
  float amplitude = 1.0;
  float frequency = 1.0;
  float sum = 0.0;
  float maxAmplitude = 0.0;
  
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    sum += amplitude * snoise2(p * frequency);
    maxAmplitude += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  
  return sum / maxAmplitude;
}

// Domain Warping
vec2 domainWarp(vec2 p, float time, float strength) {
  vec2 q = vec2(
    fbm(p + vec2(time * 0.1, time * 0.05), 4, 2.0, 0.5),
    fbm(p + vec2(time * 0.07, -time * 0.12), 4, 2.0, 0.5)
  );
  return p + q * strength;
}

// Voronoi for cellular structure
float voronoi(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float minDist = 1.0;
  
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = hash22(i + neighbor);
      vec2 diff = neighbor + point - f;
      float dist = dot(diff, diff);
      minDist = min(minDist, dist);
    }
  }
  
  return sqrt(minDist);
}

// ============================================
// COLOR FUNCTIONS
// ============================================

// HSV to RGB
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// Smoothstep with custom edges
float smoothstepCustom(float edge0, float edge1, float x) {
  float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

// ============================================
// MAIN
// ============================================
void main() {
  vec2 uv = vUv;
  vec2 center = vec2(0.5);
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  uv = (uv - center) * aspect + center;
  
  float time = uTime * uSpeed;
  vec2 mouseNorm = uMouse / uResolution;
  vec2 mouseAspect = (mouseNorm - center) * aspect + center;
  float mouseDist = distance(uv, mouseAspect);
  float mouseInfluence = smoothstep(0.8, 0.0, mouseDist) * length(uMouseVel) * 0.01;
  
  // Base UV coordinates with domain warping for organic flow
  vec2 baseUv = uv * uScale;
  vec2 warpedUv = domainWarp(baseUv, time, uDistortion * 0.3);
  
  // Mouse influence on warp
  warpedUv += (mouseAspect - uv) * mouseInfluence * 2.0;
  
  // ============================================
  // LAYER 1: DEEP PLASMA FIELD
  // ============================================
  float plasma1 = fbm(warpedUv + vec2(time * 0.3, time * uFlowDirection * 0.2), 5, 2.1, 0.5);
  float plasma2 = fbm(warpedUv * 1.8 - vec2(time * 0.2, time * 0.15), 4, 2.0, 0.5) * 0.5;
  float plasma3 = fbm(warpedUv * 3.2 + vec2(time * 0.1, -time * 0.25), 3, 2.2, 0.45) * 0.25;
  
  float plasmaField = plasma1 + plasma2 + plasma3;
  plasmaField = plasmaField * 0.5 + 0.5;
  
  // ============================================
  // LAYER 2: MILKY LIGHT RAYS
  // ============================================
  // Radial gradient from center-top
  vec2 rayCenter = vec2(0.5, -0.2);
  float rayDist = distance(uv, rayCenter);
  float rayAngle = atan(uv.y - rayCenter.y, uv.x - rayCenter.x);
  
  // Multiple milky rays with organic variation
  float milky1 = 0.0;
  float milky2 = 0.0;
  float milky3 = 0.0;
  
  for (int i = 0; i < 5; i++) {
    float angleOffset = float(i) * 3.14159 * 0.4 + time * 0.05 * uFlowDirection;
    float ray = cos(rayAngle * 3.0 + angleOffset + sin(time * 0.3 + float(i)) * 0.5);
    ray = pow(max(ray, 0.0), 8.0);
    float falloff = smoothstep(1.5, 0.0, rayDist * 1.2);
    milky1 += ray * falloff * (0.3 + 0.2 * sin(time * 0.2 + float(i) * 2.0));
  }
  
  // Secondary milky layer - horizontal streaks
  for (int i = 0; i < 3; i++) {
    float yPos = 0.2 + float(i) * 0.3 + sin(time * 0.15 + float(i)) * 0.1;
    float streak = exp(-pow((uv.y - yPos) * 15.0, 2.0));
    streak *= 0.5 + 0.5 * sin(uv.x * 20.0 + time * 0.5 + float(i) * 2.0);
    milky2 += streak * 0.15;
  }
  
  // Tertiary - fine milky dust
  float milkyDust = fbm(uv * 8.0 + time * 0.05, 3, 2.0, 0.5) * 0.1;
  milky3 = milkyDust * smoothstep(0.0, 1.0, uv.y);
  
  float milkyField = (milky1 + milky2 + milky3) * uMilkyIntensity;
  
  // ============================================
  // LAYER 3: CHROMATIC ABERRATION PLASMA
  // ============================================
  float ca = uChromaticAberration;
  vec2 caOffset = vec2(ca, 0.0);
  
  // Sample plasma at slightly offset UVs for chromatic aberration
  float plasmaR = fbm((warpedUv + caOffset) * 1.2 + vec2(time * 0.4, time * 0.2), 4, 2.0, 0.5);
  float plasmaG = fbm(warpedUv * 1.2 + vec2(time * 0.4, time * 0.2), 4, 2.0, 0.5);
  float plasmaB = fbm((warpedUv - caOffset) * 1.2 + vec2(time * 0.4, time * 0.2), 4, 2.0, 0.5);
  
  // ============================================
  // LAYER 4: VORONOI CELLULAR STRUCTURE
  // ============================================
  float cells = voronoi(warpedUv * 3.0 + time * 0.02);
  cells = 1.0 - smoothstep(0.0, 0.4, cells);
  cells *= plasmaField * 0.3 * uPlasmaIntensity;
  
  // ============================================
  // LAYER 5: PLASMA FILAMENTS
  // ============================================
  float filaments = 0.0;
  vec2 filUv = warpedUv * 2.0;
  for (int i = 0; i < 4; i++) {
    float angle = float(i) * 1.5708 + time * 0.1;
    vec2 dir = vec2(cos(angle), sin(angle));
    float proj = dot(filUv, dir);
    float perp = length(filUv - dir * proj);
    float fil = exp(-perp * 30.0) * (0.5 + 0.5 * sin(proj * 10.0 + time * 2.0 + float(i) * 3.0));
    filaments += fil * smoothstep(1.0, 0.0, proj + 0.5);
  }
  filaments *= uPlasmaIntensity * 0.2;
  
  // ============================================
  // COLOR COMPOSITION
  // ============================================
  
  // Base plasma color with chromatic aberration
  vec3 plasmaColor = vec3(
    mix(uColorDeep.r, uColorHot.r, plasmaR),
    mix(uColorDeep.g, uColorMid.g, plasmaG),
    mix(uColorDeep.b, uColorBright.b, plasmaB)
  );
  
  // Apply plasma intensity
  plasmaColor = mix(uColorDeep, plasmaColor, plasmaField * uPlasmaIntensity);
  
  // Add cellular structure
  plasmaColor += uColorPlasma * cells;
  
  // Add filaments
  plasmaColor += uColorHot * filaments;
  
  // Milky light overlay (additive)
  vec3 milkyColor = uColorMilky * milkyField;
  vec3 finalColor = plasmaColor + milkyColor;
  
  // Color grading - push towards UV spectrum
  finalColor.r = pow(finalColor.r, 0.9);
  finalColor.g = pow(finalColor.g, 1.1);
  finalColor.b = pow(finalColor.b, 0.85);
  
  // Hue shift towards UV
  float hueShift = sin(time * 0.1) * 0.05;
  vec3 hsv = vec3(0.75 + hueShift, 0.8, 1.0); // UV hue base
  // Simple hue adjustment
  finalColor = mix(finalColor, vec3(finalColor.b, finalColor.r, finalColor.g), 0.1);
  
  // ============================================
  // VIGNETTE & EDGE FADE
  // ============================================
  float vignette = 1.0 - smoothstep(0.5, 1.0, distance(uv, center) * uVignette);
  finalColor *= vignette;
  
  // Bottom fade for content readability
  float bottomFade = smoothstep(0.85, 1.0, uv.y);
  finalColor *= (1.0 - bottomFade * 0.6);
  
  // Top glow enhancement
  float topGlow = smoothstep(0.3, 0.0, uv.y) * 0.2;
  finalColor += uColorMilky * topGlow * uMilkyIntensity;
  
  // ============================================
  // FINAL OUTPUT
  // ============================================
  float alpha = uOpacity * vignette;
  gl_FragColor = vec4(finalColor, alpha);
}
`;

// ============================================
// REACT THREE FIBER HELPER
// ============================================
export const PlasmaMaterial = {
  uniforms: plasmaUniforms,
  vertexShader: plasmaVertexShader,
  fragmentShader: plasmaFragmentShader,
};

export default PlasmaMaterial;