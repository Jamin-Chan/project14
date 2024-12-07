#version 300 es
precision highp float;

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;

uniform mat4 u_m;
uniform mat4 u_v;
uniform mat4 u_p;
uniform mat4 u_light_space_matrix;

out vec3 v_world_pos;
out vec3 v_normal;
out vec4 v_light_space_pos;
out vec3 o_vertex_normal_world;
out vec3 o_vertex_position_world;

void main() {
    // Transform the vertex position into world space
    vec4 world_pos = u_m * vec4(a_position, 1.0);
    v_world_pos = world_pos.xyz;

    // Compute normal in world space
    mat3 norm_matrix = transpose(inverse(mat3(u_m)));
    v_normal = normalize(norm_matrix * a_normal);
    o_vertex_normal_world = v_normal;

    // Transform vertex position to light's coordinate space
    v_light_space_pos = u_light_space_matrix * world_pos;

    // Compute final position in clip space (for rendering)
    gl_Position = u_p * u_v * world_pos;

    // Pass the world position to the output
    o_vertex_position_world = world_pos.xyz;
}