#version 300 es
precision highp float;

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;

uniform mat4 u_m;        // Model matrix
uniform mat4 u_v;        // View matrix
uniform mat4 u_p;        // Projection matrix
uniform mat4 u_light_space_matrix;

out vec3 v_world_pos;
out vec3 v_normal;
out vec4 v_light_space_pos;

void main() {
    vec4 world_pos = u_m * vec4(a_position, 1.0);
    v_world_pos = world_pos.xyz;
    v_normal = mat3(u_m) * a_normal;
    
    // Transform to light space
    v_light_space_pos = u_light_space_matrix * world_pos;
    
    gl_Position = u_p * u_v * world_pos;
}