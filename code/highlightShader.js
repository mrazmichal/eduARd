/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 * 
 * The original shader code is taken from https://doc.x3dom.org/tutorials/lighting/customShader/example.html
 **/


/**
 * Shader for highlighting parts of an X3D model
 * Fragments facing the viewer are darker and yellow, fragments at the edges are highlighted and orange
 */
var shaderString = `
<ComposedShader>
    <!-- The "display:none;" CSS attribute is just a trick to prevent the browser from rendering the shader code during page loading -->
    <ShaderPart type='VERTEX' style="display:none;">

        attribute vec3 position;
        attribute vec3 normal;
        
        uniform mat4 modelViewMatrix;
        uniform mat4 modelViewMatrixInverse;
        uniform mat4 modelViewProjectionMatrix;
        uniform mat4 normalMatrix;
        
        varying vec3 fragNormal;
        
        void main()
        {                           
            fragNormal = (normalMatrix * vec4(normal, 0.0)).xyz;           
            
            gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);
        }
        
    </ShaderPart>                
    <ShaderPart type='FRAGMENT' style="display:none;">
    
        #ifdef GL_FRAGMENT_PRECISION_HIGH
            precision highp float;
        #else
            precision mediump float;
        #endif
        
        varying vec3 fragNormal; 
        
        vec3 red = vec3(1.0, 0.0, 0.0);
        vec3 orange = vec3(1.0, 0.5, 0.0);
        vec3 yellow = vec3(1.0, 1.0, 0.0);        

        void main()
        {
            vec3 normal = normalize(fragNormal);
            vec3 toCamera = vec3(0.0, 0.0, 1.0);

            // edgesHighlight value is 1.0 when the normal is perpendicular to the toCamera vector
            // edgesHighlight value is 0.0 when the normal is parallel to the toCamera vector
            float edgesHighlight = (1.0 - dot(toCamera, normal));

            // Keep the highlight more intense only at the edges
            float highlightSq = pow(edgesHighlight, 2.0);
            
            gl_FragColor = vec4(highlightSq * orange + 0.5 * yellow, 1.0);

        }

    </ShaderPart>
</ComposedShader>
`


// original shader:

// <ComposedShader>
//     <field id="alphaParamField" name='alphaParam' type='SFFloat' value='0.25'></field>
//     <field id="betaParamField"  name='betaParam'  type='SFFloat' value='0.5'></field>
//     <!-- The "display:none;" CSS attribute is just a trick to prevent the browser from rendering the shader code during page loading -->
//     <ShaderPart type='VERTEX' style="display:none;">
//         attribute vec3 position;
//         attribute vec3 normal;
        
//         uniform mat4 modelViewMatrix;
//         uniform mat4 modelViewMatrixInverse;
//         uniform mat4 modelViewProjectionMatrix;
//         uniform mat4 normalMatrix;
        
//         varying vec3 fragNormal;
//         varying vec3 fragEyeVector;
        
//         void main()
//         {
//             fragEyeVector = -(modelViewMatrix * vec4(position, 0.0)).xyz;                                 
//             fragNormal    = (normalMatrix * vec4(normal, 0.0)).xyz;           
            
//             gl_Position = modelViewProjectionMatrix * vec4(position, 1.0);
//         }
//     </ShaderPart>                
//     <ShaderPart type='FRAGMENT' style="display:none;">
//         #ifdef GL_FRAGMENT_PRECISION_HIGH
//             precision highp float;
//         #else
//             precision mediump float;
//         #endif
        
//         uniform vec3 light0_Direction;
        
//         varying vec3 fragNormal;
//         varying vec3 fragEyeVector; 
        
//         vec3 base = vec3(0.3);                  
//         vec3 cool = vec3(0.0, 0.0, 0.5);
//         vec3 warm = vec3(1.0, 0.85, 0.0);
        
//         //application parameters                            
//         uniform float alphaParam;
//         uniform float betaParam;

//         void main()
//         {
//             vec3 normal = normalize(fragNormal);
//             vec3 eye    = normalize(fragEyeVector);                            
//             vec3 rVec   = reflect(eye, normal);

//             float spec = pow(max(0.0, dot(light0_Direction, rVec)), 27.0);     
            
//             float diff = dot(-light0_Direction, normal);
//             diff       = (1.0 + diff) * 0.5;                     
//             vec3 col   = diff * (cool + alphaParam * base) + (1.0 - diff) *  (warm + betaParam * base);
            
//             col += vec3(spec);
            
//             gl_FragColor = vec4(col, 1.0);
//         }
//     </ShaderPart>
// </ComposedShader>