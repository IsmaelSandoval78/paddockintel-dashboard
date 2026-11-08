/** Point-sprite shaders shared by the race and qualifying trails. */

export const vertexShader = /* glsl */ `
  attribute float aAge;
  uniform float uRadius;
  uniform float uProjScale;
  uniform float uMaxPx;
  varying float vAge;
  void main() {
    vAge = aAge;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // Head is big and bright, tail shrinks away. Sized in world units so a
    // close-up chase cam does not fill the screen with one blob.
    float taper = pow(1.0 - vAge, 1.2);
    float radius = uRadius * (0.45 + 0.55 * taper);
    gl_PointSize = clamp(radius * uProjScale / -mv.z, 1.0, uMaxPx);
    gl_Position = projectionMatrix * mv;
  }
`

export const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAge;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    // Soft round sprite with a hot core.
    float disc = smoothstep(0.5, 0.06, d);
    float core = smoothstep(0.26, 0.0, d);
    float fade = pow(1.0 - vAge, 1.25);
    vec3 color = mix(uColor, vec3(1.0), core * 0.75 * (1.0 - vAge * 0.6));
    // Push the head above 1.0 so the bloom pass picks it out.
    color *= 1.0 + 2.2 * core * pow(1.0 - vAge, 3.0);
    gl_FragColor = vec4(color, disc * fade * uOpacity);
  }
`

export const headVertexShader = /* glsl */ `
  uniform float uRadius;
  uniform float uProjScale;
  uniform float uMaxPx;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(uRadius * uProjScale / -mv.z, 2.0, uMaxPx);
    gl_Position = projectionMatrix * mv;
  }
`

export const headFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    // White-hot core in a halo of the driver's colour, well above 1.0 so
    // it reads as light once the glow buffer is added.
    float halo = smoothstep(0.5, 0.0, d);
    float core = smoothstep(0.13, 0.0, d);
    vec3 color = mix(uColor * 2.4, vec3(2.6), core * 0.7);
    gl_FragColor = vec4(color, min(halo * halo * 1.1 + core, 1.0) * uOpacity);
  }
`
