#version 300 es
precision highp float;
uniform float u_time;
uniform int u_frame;
out vec4 fragColor;
uniform vec2 u_resolution; //Pass resolution in pixels

// Rose Zoom
// By Noztol

#define rotate(angle) mat2(cos(angle - vec4(0, 11, 33, 0)))


float getSmoothFreq(float x) {
    return smoothstep(0.1, 0.8, 0.0);
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;

    vec2 resolution = u_resolution.xy;

    // Track 9 distinct frequencies
    float b1 = getSmoothFreq(0.02); float b2 = getSmoothFreq(0.06); float b3 = getSmoothFreq(0.10);
    float m1 = getSmoothFreq(0.30); float m2 = getSmoothFreq(0.40); float m3 = getSmoothFreq(0.50);
    float t1 = getSmoothFreq(0.70); float t2 = getSmoothFreq(0.80); float t3 = getSmoothFreq(0.90);

    // Group averages for physical geometry impacts
    float bass = (b1 + b2 + b3) / 3.0;
    float mid  = (m1 + m2 + m3) / 3.0;
    float treb = (t1 + t2 + t3) / 3.0;

    float maxSteps = 50.0 + (150.0 - abs(mod(float(u_frame), 300.0) - 150.0));

    // Camera Alignment (Centered on the path)
    float timeZ = u_time * 2.5;
    vec2 camPos = vec2(sin(timeZ * 0.3), cos(timeZ * 0.3)) * 0.4;
    vec2 lookAheadPos = vec2(sin((timeZ + 1.0) * 0.3), cos((timeZ + 1.0) * 0.3)) * 0.4;
    vec2 camDir = lookAheadPos - camPos;

    vec2 uv = (fragCoord - 0.5 * resolution) / resolution.y;
    uv += camDir;

    vec4 accumGlow = vec4(0.0);
    vec3 rayPos = vec3(0.0), fractalPos;

    float stepIndex = 0.0;
    float totalDist = 0.0;
    float sceneDist = 1.0;
    float fractalScale;

    for(; stepIndex < maxSteps && sceneDist > 1e-4; stepIndex++) {

        // Mid beats impacting the color accumulation shift
        vec4 phaseShift = vec4(2.0, 1.0, 0.0, 0.0) + mid * vec4(1.0, -1.0, 2.0, 0.0);
        accumGlow += (1.0 + sin(2.0 * length(rayPos.xy * 3.0) + totalDist * 2.1 + phaseShift)) / 190.0;

        totalDist += sceneDist * 0.5;

        rayPos = vec3(uv * totalDist + camPos, totalDist);
        rayPos.z += timeZ;

        vec2 tunnelWobble = vec2(sin(rayPos.z * 0.3), cos(rayPos.z * 0.3)) * 0.4;

        // Bass impacts the shape.
        float tunnelRadius = 1.1 + (bass * 0.4);

        // Interleaved Geometry: Add physical ridges to catch the light
        float structuralRings = sin(rayPos.z * 10.0 - u_time * 10.0) * 0.05;
        sceneDist = tunnelRadius - length(rayPos.xy - tunnelWobble) + structuralRings;

        float fractalSign = 1.0;

        // Fractal detailing loop
        for (fractalScale = 2.0; fractalScale < 300.0; fractalScale += fractalScale) {

            fractalPos = rayPos * fractalScale;
            fractalPos.xz *= rotate(fractalScale);

            // Treble impacts the noise texturing
            float noiseIntensity = 3.0 - (treb * 1.8);
            sceneDist -= fractalSign * abs(dot(sin(fractalPos - u_time * 1.0), fractalPos - fractalPos + 1.0)) / (fractalScale * noiseIntensity);

            fractalSign *= -0.7;
        }
    }

    // Add the distance penalty
    accumGlow += 19.0 / stepIndex;

    // Base iridescence
    float vignette = 1.0 / pow(dot(uv, uv) + 0.14, 0.3);
    vec3 baseIridescence = 0.01 / tanh(accumGlow.rgb * accumGlow.rgb) * 7.0 * vignette;

    // Apply rolling waves of light and dark directly to the brightness
    float shadowBand = 0.5 + 0.5 * sin(rayPos.z * 10.0 - u_time * 10.0);
    baseIridescence *= mix(0.3, 1.4, shadowBand); // Dips to 30% brightness, peaks at 140%

    // 6. Map the 9 tracked frequencies to complimentary neon colors
    vec3 freqColorMix =
        b1 * vec3(1.0, 0.0, 0.2) + // Deep Crimson
        b2 * vec3(1.0, 0.3, 0.0) + // Neon Orange
        b3 * vec3(1.0, 0.8, 0.0) + // Gold
        m1 * vec3(0.5, 1.0, 0.0) + // Lime
        m2 * vec3(0.0, 1.0, 0.5) + // Sea Green
        m3 * vec3(0.0, 0.8, 1.0) + // Cyan
        t1 * vec3(0.0, 0.3, 1.0) + // Deep Blue
        t2 * vec3(0.6, 0.0, 1.0) + // Purple
        t3 * vec3(1.0, 0.0, 0.8);  // Hot Magenta

    // Normalize color mix to keep hues pure, but allow a baseline of saturation
    freqColorMix = normalize(freqColorMix + vec3(0.15)) * 1.5;

    vec3 finalColor = baseIridescence * freqColorMix;

    // Instead of darkening everything, we measure how close the pixel is to white.
    // If it gets too bright, we aggressively push it back toward its pure, saturated hue.
    float brightness = dot(finalColor, vec3(0.333));
    vec3 pureHue = normalize(finalColor) * brightness * 1.5;

    // Smoothly transition to the pure hue as brightness exceeds safe levels
    finalColor = mix(finalColor, pureHue, smoothstep(0.8, 1.5, brightness));

    // Tonemap the final result to smoothly round off the peaks
    finalColor = 1.0 - exp(-finalColor * 1.2);

    // Final hard clamp at 95% to absolutely guarantee no pure white pixels
    finalColor = clamp(finalColor, 0.0, 0.95);

    fragColor = vec4(finalColor, 1.0);
}
