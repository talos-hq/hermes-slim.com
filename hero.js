async function renderBackdrop() {
  const canvas = document.querySelector('.hero-icon canvas');
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false });
  if (!gl) return;
  const response = await fetch('/assets/rose.frag');
  if (!response.ok) throw new Error('Could not load Rose Zoom');
  const program = gl.createProgram();
  function attach(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    gl.attachShader(program, shader);
  }
  attach(gl.VERTEX_SHADER, `#version 300 es
    void main() {
      vec2 corners[3] = vec2[3](vec2(-1,-1), vec2(3,-1), vec2(-1,3));
      gl_Position = vec4(corners[gl_VertexID], 0, 1);
    }`);
  attach(gl.FRAGMENT_SHADER, await response.text());
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const resolution = gl.getUniformLocation(program, 'u_resolution');
  const time = gl.getUniformLocation(program, 'u_time');
  const frame = gl.getUniformLocation(program, 'u_frame');
  const start = performance.now();
  function draw(now) {
    const size = Math.min(420, canvas.clientWidth);
    if (canvas.width !== size || canvas.height !== size) {
      canvas.width = canvas.height = size;
      gl.viewport(0, 0, size, size);
    }
    const seconds = (now - start) * 0.0005;
    gl.uniform2f(resolution, size, size);
    gl.uniform1f(time, seconds);
    gl.uniform1i(frame, Math.floor(seconds * 60));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}
renderBackdrop().catch(console.error);
