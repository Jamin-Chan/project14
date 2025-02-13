#version 300 es
precision highp float;

uniform sampler2D u_shadow_map;
uniform vec3 u_light_direction;

#define MAX_LIGHTS 16

// Fragment shaders don't have a default precision so we need
// to pick one. mediump is a good default. It means "medium precision".
precision mediump float;

uniform bool u_show_normals;


// struct definitions
struct AmbientLight {
    vec3 color;
    float intensity;
};

struct DirectionalLight {
    vec3 direction;
    vec3 color;
    float intensity;
};

struct PointLight {
    vec3 position;
    vec3 color;
    float intensity;
};

struct Material {
    vec3 kA;
    vec3 kD;
    vec3 kS;
    float shininess;
};

// lights and materials
uniform AmbientLight u_lights_ambient[MAX_LIGHTS];
uniform DirectionalLight u_lights_directional[MAX_LIGHTS];
uniform PointLight u_lights_point[MAX_LIGHTS];

uniform Material u_material;

// camera position
uniform vec3 u_eye;

// received from vertex stage
in vec3 o_vertex_normal_world;
in vec3 o_vertex_position_world;
in vec3 v_world_pos;
in vec3 v_normal;
in vec4 v_light_space_pos;

// with webgl 2, we now have to define an out that will be the color of the fragment
out vec4 o_fragColor;

// Shades an ambient light and returns this light's contribution
vec3 shadeAmbientLight(Material material, AmbientLight light) {
    if (light.intensity == 0.0)
        return vec3(0);

    return light.color * light.intensity * material.kA;
}

// Shades a directional light and returns its contribution
vec3 shadeDirectionalLight(Material material, DirectionalLight light, vec3 normal, vec3 eye, vec3 vertex_position) {
    vec3 result = vec3(0);
    if (light.intensity == 0.0)
        return result;

    vec3 N = normalize(normal);
    vec3 L = -normalize(light.direction);
    vec3 V = normalize(vertex_position - eye);


    // Diffuse
    float LN = max(dot(L, N), 0.0);
    result += LN * light.color * light.intensity * material.kD;

    // Specular
    vec3 R = reflect(L, N);
    result += pow( max(dot(R, V), 0.0), material.shininess) * light.color * light.intensity * material.kS;


    return result;
}

// Shades a point light and returns its contribution
vec3 shadePointLight(Material material, PointLight light, vec3 normal, vec3 eye, vec3 vertex_position) {
    vec3 result = vec3(0);
    if (light.intensity == 0.0)
        return result;

    vec3 N = normalize(normal);
    float D = distance(light.position, vertex_position);
    vec3 L = normalize(light.position - vertex_position);
    vec3 V = normalize(vertex_position - eye);

    // Diffuse
    float LN = max(dot(L, N), 0.0);
    result += LN * light.color * light.intensity * material.kD;

    // Specular
    vec3 R = reflect(L, N);
    result += pow( max(dot(R, V), 0.0), material.shininess) * light.color * light.intensity * material.kS;

    // Attenuation
    result *= 1.0 / (D*D+1.0);

    return result;
}

float calculateShadow(vec4 light_space_pos, sampler2D shadow_map) {
    // Perspective divide
    vec3 proj_coords = light_space_pos.xyz / light_space_pos.w;
    
    // Transform to [0,1] range
    proj_coords = proj_coords * 0.5 + 0.5;
    
    // Check if outside light frustum
    if (proj_coords.z > 1.0) 
        return 0.0;
    
    // Get closest depth value from light's perspective
    float closest_depth = texture(shadow_map, proj_coords.xy).r;
    
    // Get depth of current fragment from light's perspective
    float current_depth = proj_coords.z;
    
    // Add a small bias to prevent shadow acne
    float bias = max(0.005 * (1.0 - dot(v_normal, u_light_direction)), 0.001);
    
    // Simple percentage-closer filtering (PCF) for soft shadows
    float shadow = 0.0;
    vec2 texel_size = 1.0 / vec2(textureSize(shadow_map, 0));
    for(int x = -1; x <= 1; ++x) {
        for(int y = -1; y <= 1; ++y) {
            float pcf_depth = texture(shadow_map, proj_coords.xy + vec2(x, y) * texel_size).r; 
            shadow += current_depth - bias > pcf_depth ? 1.0 : 0.0;        
        }    
    }
    shadow /= 9.0;
    
    return shadow;
}

void main() {
    // If we want to visualize only the normals, no further computations are needed
    if (u_show_normals) {
        o_fragColor = vec4(o_vertex_normal_world, 1.0);
        return;
    }

    // Calculate shadow
    float shadow = calculateShadow(v_light_space_pos, u_shadow_map);

    // Combine contributions from lights
    vec3 light_contribution = vec3(0.0);
    for (int i = 0; i < MAX_LIGHTS; i++) {
        light_contribution += shadeAmbientLight(u_material, u_lights_ambient[i]);
        light_contribution += shadeDirectionalLight(u_material, u_lights_directional[i], o_vertex_normal_world, u_eye, o_vertex_position_world) * (1.0 - shadow);
        light_contribution += shadePointLight(u_material, u_lights_point[i], o_vertex_normal_world, u_eye, o_vertex_position_world) * (1.0 - shadow);
    }

    o_fragColor = vec4(light_contribution, 1.0);
}