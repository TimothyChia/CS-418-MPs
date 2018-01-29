
// based heavily on Eric Shaffer's HelloColor and HelloProjection examples

/**
 * @file A simple WebGL example drawing a triangle with colors
 * @author Eric Shaffer <shaffer1@eillinois.edu>  
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The WebGL buffer holding the triangle */
var vertexPositionBuffer;

/** @global The WebGL buffer holding the vertex colors */
var vertexColorBuffer;


/** @global The Modelview matrix */
var mvMatrix = mat4.create();

/** @global The Projection matrix */
var pMatrix = mat4.create();

/** @global The angle of rotation around the x axis */
var rotAngle = 0;

/** @global Time stamp of previous frame in ms */
var lastTime = 0;

/** @global A glmatrix vector to use for transformations */
var transformVec = vec3.create();    

// Initialize the vector....
vec3.set(transformVec,0.0,0.0,-2.0);


//----------------------------------------------------------------------------------
/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
}

/**
* Translates degrees to radians
* @param {Number} degrees Degree input to function
* @return {Number} The radians that correspond to the degree input
*/
function degToRad(degrees) {
      return degrees * Math.PI / 180;
}


/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var context = null;
  context = canvas.getContext("webgl");
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

/**
 * Setup the fragment and vertex shaders
 */
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor"); 

  //oddly, HelloProjection enables the attributes here, which HelloColor did not.
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
}

/**
 * Populate buffers with data
 */
function setupBuffers() {

  //blue position stuff
  vertexPositionBuffer_Blue = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer_Blue);

  var triangleVertices_Blue = [
    12,220,0,
    12,185,0,
    32,185,0,
    12,220,0,
    32,185,0,
    75,185,0,
    12,220,0,
    75,185,0,
    115,220,0,
    75,185,0,
    115,220,0,
    150,185,0,
    115,220,0,
    150,185,0,
    213,220,0,
    150,185,0,
    193,185,0,
    213,220,0,
    193,185,0,
    213,220,0,
    213,185,0,
    32,185,0,
    75,185,0,
    75,155,0,
    32,185,0,
    32,80,0,
    75,155,0,
    32,80,0,
    75,155,0,
    75,107,0,
    32,80,0,
    75,107,0,
    75,80,0,
    75,155,0,
    92,155,0,
    92,107,0,
    75,155,0,
    75,107,0,
    92,107,0,
    132,155,0,
    132,107,0,
    148,155,0,
    132,107,0,
    148,155,0,
    148,107,0,
    148,185,0,
    148,155,0,
    193,185,0,
    148,155,0,
    193,185,0,
    193,80,0,
    148,155,0,
    148,107,0,
    193,80,0,
    148,107,0,
    148,80,0,
    193,80,0,
    32,70,0];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices_Blue), gl.STATIC_DRAW);
  vertexPositionBuffer_Blue.itemSize = 3;
  vertexPositionBuffer_Blue.numberOfItems = 57;
    
// orange position stuff
vertexPositionBuffer_Orange = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer_Orange);
var triangleVertices_Orange = [
    32,70,0,
    32,57,0,
    45,70,0,
    32,57,0,
    45,70,0,
    45,47,0,
    60,70,0,
    60,38,0,
    75,70,0,
    60,38,0,
    75,70,0,
    75,30,0,
    90,70,0,
    90,19,0,
    105,70,0,
    90,19,0,
    105,70,0,
    105,10,0,
    120,70,0,
    120,10,0,
    135,19,0,
    120,70,0,
    135,70,0,
    135,19,0,
    148,70,0,
    148,30,0,
    163,38,0,
    148,70,0,
    163,70,0,
    163,38,0,
    178,70,0,
    178,47,0,
    193,57,0,
    178,70,0,
    193,70,0,
    193,57,0
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices_Orange), gl.STATIC_DRAW);
vertexPositionBuffer_Orange.itemSize = 3;
vertexPositionBuffer_Orange.numberOfItems = 36;


//blue color stuff
  vertexColorBuffer_Blue = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer_Blue);
  var blue = [
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0,
    0.074509804,    0.156862745,    0.294117647, 1.0 
    ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(blue), gl.STATIC_DRAW);
  vertexColorBuffer_Blue.itemSize = 4;
  vertexColorBuffer_Blue.numItems = 57;  

  //orange color stuff

  vertexColorBuffer_Orange = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer_Orange);
  var orange = [
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0,
    0.91372549,    0.290196078,    0.215686275,1.0
    ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(orange), gl.STATIC_DRAW);
  vertexColorBuffer_Orange.itemSize = 4;
  vertexColorBuffer_Orange.numItems = 36;  

}

/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT);
// might need to clear the depth as well?
  // gl.clear(1.0,1.0,1.0,1.0); // this isn't the right way to make the background white.

  //matrix stuff
  mat4.identity(mvMatrix);
  mat4.identity(pMatrix);
  //fill the JS level matrixes
  mat4.perspective(pMatrix,degToRad(90), 1 , 0.1, 100.0);
  vec3.set(transformVec,0.0,0.0,-1);
  mat4.translate(mvMatrix, mvMatrix,transformVec);
  //console.log(mat4.str(pMatrix));
  mat4.rotateX(mvMatrix, mvMatrix, degToRad(rotAngle));  
  setMatrixUniforms();


 //blue stuff
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer_Blue);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer_Blue.itemSize, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer_Blue);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            vertexColorBuffer_Blue.itemSize, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute)
                          
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer_Blue.numberOfItems);


// orange stuff
gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer_Orange);
gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                       vertexPositionBuffer_Orange.itemSize, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer_Orange);
gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                          vertexColorBuffer_Orange.itemSize, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute)

gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer_Orange.numberOfItems);

}

/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders(); 
  setupBuffers();
  // gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearColor(1.0,1.0,1.0,1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
  // draw();  
}

/**
 * Animation to be called from tick. Updates globals and performs animation for each tick.
 */
function animate() {
  var timeNow = new Date().getTime();
  if (lastTime != 0) {
      var elapsed = timeNow - lastTime;    
      rotAngle= (rotAngle+1.0) % 360;
  }
  lastTime = timeNow;
}

/**
 * Tick called for every animation frame.
 */
function tick() {
  requestAnimFrame(tick);
  draw();
  animate();
}
