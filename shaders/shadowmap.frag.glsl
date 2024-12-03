#version 300 es

precision highp float;

layout(location = 0) out float out_depth;

void main() {
    // gl_FragCoord.z is the depth value
    out_depth = gl_FragCoord.z;
}
