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
    prepareShadowMap() {
        const light = this.findMainDirectionalLight();
        if (!light) return null;
    
        // More sophisticated light position and scene bounds calculation
        const lightPos = light.getPosition();
        const sceneCenter = this.calculateSceneBounds();
        const sceneExtent = this.calculateSceneExtent(sceneCenter);
    
        return this.shadowMapper.prepareShadowMap(
            lightPos,      // Light position
            sceneCenter,   // Scene center
            sceneExtent    // Scene extent
        );
    }
    
    calculateSceneBounds() {
        // Implement logic to find scene center
        // Could involve averaging bounding boxes of all scene nodes
        return [0, 0, 0];  // Placeholder
    }
    
    calculateSceneExtent(center) {
        // Calculate scene's maximum dimension from center
        // This helps determine orthographic projection size
        return 10;  // Placeholder value
    }

        
    findMainDirectionalLight() {
        if (!this.scene) return null;

        const lightNodes = this.scene.getNodes().filter(node => node.type === 'light');
        //console.log(lightNodes.find(node => node.light instanceof DirectionalLight))
        return lightNodes.find(node => node.light instanceof DirectionalLight);
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