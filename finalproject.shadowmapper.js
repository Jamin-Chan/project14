'use strict'

import * as mat4 from "./js/lib/glmatrix/mat4.js"
import * as vec3 from './js/lib/glmatrix/vec3.js'

class ShadowMapper {
    constructor(gl, width = 2048, height = 2048) {
        this.gl = gl;
        this.width = width;
        this.height = height;

        // Create depth texture
        this.depth_texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.depth_texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, width, height, 0, gl.DEPTH_COMPONENT, gl.FLOAT, null);
        
        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Create framebuffer
        this.framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        
        // Attach depth texture
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depth_texture, 0);
        
        // Attach depth renderbuffer
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depth_renderbuffer);

        // Validate framebuffer
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error('Framebuffer not complete!');
        }

        // Reset bindings
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    /**
     * Prepare for shadow map rendering
     * @param {vec3} light_position Position of the light source
     * @param {vec3} scene_center Center of the scene
     * @param {number} scene_extent Extent of the scene
     * @returns {Object} Shadow mapping parameters
     */
    prepareShadowMap(light_position, scene_center, scene_extent) {
        const gl = this.gl;
    
        // Validate framebuffer and texture setup
        if (!this.framebuffer || !this.depth_texture) {
            console.error("Framebuffer or depth texture not initialized!");
            return null;
        }
    
        // Validate and use scene extent
        const extent = Array.isArray(scene_extent) 
            ? scene_extent 
            : [-scene_extent, scene_extent, -scene_extent, scene_extent, -scene_extent, scene_extent];
    
        // Create light projection matrix (orthographic)
        const light_projection = mat4.ortho(
            mat4.create(), 
            extent[0], extent[1],   // Left, Right
            extent[2], extent[3],   // Bottom, Top
            extent[4], extent[5]    // Near, Far
        );
    
        // Create light view matrix
        const light_view = mat4.lookAt(
            mat4.create(),
            light_position,
            scene_center,
            [0, 1, 0]  // Up vector
        );
    
        // Combine to form light space matrix
        const light_space_matrix = mat4.multiply(
            mat4.create(), 
            light_projection, 
            light_view
        );
    
        // Bind framebuffer for shadow map rendering
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.viewport(0, 0, this.width, this.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        // Calculate normalized light direction
        const light_direction = vec3.normalize(
            vec3.create(), 
            vec3.subtract(vec3.create(), scene_center, light_position)
        );
    
        // Reset framebuffer to avoid unintended rendering issues
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
        return {
            shadow_map: this.depth_texture,
            light_space_matrix: light_space_matrix,
            light_direction: light_direction
        };
    }

    /**
     * Finalize shadow map rendering
     */
    finalizeShadowMap() {
        const gl = this.gl;
        // Reset to default framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}

export {ShadowMapper};