'use strict'

import * as mat4 from "./js/lib/glmatrix/mat4.js"
import * as vec3 from './js/lib/glmatrix/vec3.js'

class ShadowMapper {
    constructor(gl, width = 2048, height = 2048) {
        this.gl = gl;
        this.width = width;
        this.height = height;
        // this.depthTexture = gl.createTexture();
        // this.framebuffer = gl.createFramebuffer();

        // Create depth texture
        // this.depth_texture = gl.createTexture();
        // gl.bindTexture(gl.TEXTURE_2D, this.depth_texture);
        // gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, width, height, 0, gl.DEPTH_COMPONENT, gl.FLOAT, null);
        
        // // Set texture parameters
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // // Create framebuffer
        // this.framebuffer = gl.createFramebuffer();
        // gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        
        // // Attach depth texture
        // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depth_texture, 0);
        
        // // Attach depth renderbuffer
        // gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depth_renderbuffer);

        // // Validate framebuffer
        // if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        //     console.error('Framebuffer not complete!');
        // }

        // Create the framebuffer
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        // Create a depth texture
        const depthTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT16, width, height, 0, gl.DEPTH_COMPONENT, gl.FLOAT, null);

        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Attach the depth texture to the framebuffer
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depth_renderbuffer);

        // Disable color buffer rendering
        gl.drawBuffers([]); // WebGL2 supports multiple draw buffers, but here none are used.

        // Check if the framebuffer is complete
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            console.error("Framebuffer is not complete!");
            //return false;
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

        // Create light projection matrix (orthographic)
        const light_projection = mat4.ortho(
            mat4.create(), 
            -scene_extent, scene_extent, 
            -scene_extent, scene_extent, 
            -scene_extent, scene_extent
        );

        // Create light view matrix
        const light_view = mat4.lookAt(
            mat4.create(),
            light_position,
            scene_center,
            [0, 1, 0]  // Up vector
        );

        // Combine to light space matrix
        const light_space_matrix = mat4.multiply(
            mat4.create(), 
            light_projection, 
            light_view
        );

        // Prepare for depth rendering
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.viewport(0, 0, this.width, this.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        return {
            shadow_map: this.depth_texture,
            light_space_matrix: light_space_matrix,
            light_direction: vec3.normalize(vec3.create(), 
                vec3.subtract(vec3.create(), scene_center, light_position)
            )
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