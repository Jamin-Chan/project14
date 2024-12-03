#version 300 es
precision highp float;

uniform sampler2D u_shadow_map;
uniform vec3 u_light_direction;
uniform vec3 u_light_position;
uniform vec3 u_view_position;

// Define the material structure
struct Material {
    vec3 kA; // Ambient reflectivity
    vec3 kD; // Diffuse reflectivity
    vec3 kS; // Specular reflectivity
    float shininess;
};

uniform Material u_material; // Declare the material uniform

in vec3 v_world_pos;
in vec3 v_normal;
in vec4 v_light_space_pos;

out vec4 out_color;

float calculateShadow(vec4 light_space_pos) {
    // Perspective divide
    vec3 proj_coords = light_space_pos.xyz / light_space_pos.w;
    
    // Transform to [0,1] range
    proj_coords = proj_coords * 0.5 + 0.5;
    
    // Check frustum bounds
    if (proj_coords.z > 1.0 || 
        proj_coords.x < 0.0 || proj_coords.x > 1.0 ||
        proj_coords.y < 0.0 || proj_coords.y > 1.0) {
        return 0.0;
    }
    
    // Current depth from light's perspective
    float current_depth = proj_coords.z;
    
    // Add bias to prevent shadow acne
    float bias = max(0.005 * (1.0 - dot(v_normal, u_light_direction)), 0.005);
    
    // PCF for soft shadows
    float shadow = 0.0;
    vec2 texel_size = 1.0 / vec2(textureSize(u_shadow_map, 0));
    for(int x = -1; x <= 1; ++x) {
        for(int y = -1; y <= 1; ++y) {
            float pcf_depth = texture(u_shadow_map, proj_coords.xy + vec2(x, y) * texel_size).r; 
            shadow += current_depth - bias > pcf_depth ? 1.0 : 0.0;        
        }    
    }
    shadow /= 9.0;
    
    return shadow;
}

void main() {
    vec3 normal = normalize(v_normal);
    vec3 light_dir = normalize(u_light_direction);
    vec3 view_dir = normalize(u_view_position - v_world_pos);
    
    // Calculate shadow
    float shadow = calculateShadow(v_light_space_pos);
    
    // Ambient
    vec3 ambient = u_material.kA * 0.1;
    
    // Diffuse
    float diff = max(dot(normal, light_dir), 0.0);
    vec3 diffuse = u_material.kD * diff * (1.0 - shadow);
    
    // Specular
    vec3 reflect_dir = reflect(-light_dir, normal);
    float spec = pow(max(dot(view_dir, reflect_dir), 0.0), u_material.shininess);
    vec3 specular = u_material.kS * spec * (1.0 - shadow);
    
    // Final color
    out_color = vec4(ambient + diffuse + specular, 1.0);
}
