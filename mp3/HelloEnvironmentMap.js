/**
 * @file A simple WebGL example for environment mapping onto a sphere
 * @author Eric Shaffer <shaffer1@illinois.edu>  
 * @author Sidney Oderberg <sidney02@illinois.edu>
 * @author Ashwin Vijay <akvijay2@illinois.edu>
 */

// some things from lab 9 ? for texture cube stuff.

var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;

var days=0;
var yAngle = 0.0;

// Create a place to store the textures
var cubeImage0;
var cubeImage1;
var cubeImage2;
var cubeImage3;
var cubeImage4;
var cubeImage5;
var cubeImages = [cubeImage0, cubeImage1, cubeImage2, cubeImage3, cubeImage4, cubeImage5]
var cubeMap;

// Variable to count the number of textures loaded
var texturesLoaded = 0;

// Create a place to store sphere geometry
var sphereVertexPositionBuffer;

//Create a place to store normals for shading
var sphereVertexNormalBuffer;

// View parameters
var eyePt = vec3.fromValues(0.0,0.0,150.0);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var up = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);

// Create the normal
var nMatrix = mat3.create();

// Create ModelView matrix
var mvMatrix = mat4.create();

//Create Projection matrix
var pMatrix = mat4.create();

var mvMatrixStack = [];


//---------------------------------------------------------------------------------
/**
 * @param {number} value Value to determine whether it is a power of 2
 * @return {boolean} Boolean of whether value is a power of 2
 */
function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}



//----------------------------------------------------------------------------------
/**
 * Populate buffers with data
 */
function setupBuffers() {
    setupSphereBuffers();     
}

//-------------------------------------------------------------------------
/**
 * Draws a sphere from the sphere buffer
 */
function drawSphere(){
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sphereVertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

  // Bind normal buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           sphereVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);

  // CODE GOES HERE
    // Set the texture for the cube map.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP,cubeMap);
    gl.uniform1i(gl.getUniformLocation(shaderProgram,"uCubeSampler"),0);
                 
    gl.drawArrays(gl.TRIANGLES,0,sphereVertexPositionBuffer.numItems);

}


//-------------------------------------------------------------------------
/**
 * Asynchronously read a server-side text file
 */
function asyncGetImage(url, face) {
  console.log("Getting image");
  return new Promise((resolve, reject) => {
    cubeImages[face] = new Image();
    cubeImages[face].onload = () => resolve({url, status: 'ok'});
    cubeImages[face].onerror = () => reject({url, status: 'error'});
    cubeImages[face].src = url
    console.log("Made promise");  
  });
}
//----------------------------------------------------------------------------------
/**
 * Setup a promise to load a texture
 */
function setupPromise(filename, face) {
    myPromise = asyncGetImage(filename, face);
    // We define what to do when the promise is resolved with the then() call,
    // and what to do when the promise is rejected with the catch() call
    myPromise.then((status) => {
        handleTextureLoaded(cubeImages[face], face)
        console.log("Yay! got the file");
    })
    .catch(
        // Log the rejection reason
       (reason) => {
            console.log('Handle rejected promise ('+reason+') here.');
        });
}

//----------------------------------------------------------------------------------
/**
 * Creates textures for application to cube.
 */
function setupTextures() {

  cubeMap = gl.createTexture();
  setupPromise("pos-z.png", 0);
  setupPromise("neg-z.png", 1);
  setupPromise("pos-y.png", 2);
  setupPromise("neg-y.png", 3);
  setupPromise("pos-x.png", 4);
  setupPromise("neg-x.png", 5);

}
//----------------------------------------------------------------------------------
/**
 * Texture handling. Generates mipmap and sets texture parameters.
 * @param {Object} image Image for cube application
 * @param {Number} face Which face of the cubeMap to add texture to
 */
function handleTextureLoaded(image, face) {

  // CODE GOES HERE
    
    console.log("handleTextureLoaded,image = "+image);
    texturesLoaded++;
    
    gl.bindTexture(gl.TEXTURE_CUBE_MAP,cubeMap);
    
    if (face == 0){
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    } else if (face == 1){
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    }   else if (face == 2){
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    }   else if (face == 3){
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    }   else if (face == 4){
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    }   else if (face == 5){
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    }   
    
    // Clamping
    gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    //Filtering
    gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
}



