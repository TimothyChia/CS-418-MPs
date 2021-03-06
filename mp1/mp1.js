
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

/** @global A counter used to keep track of how many frames have been drawn*/
var frame = 0;

/** @global The number of frames used for this animation*/
var animLength = 180;

/** @global The number of frames used for this animation*/
var anim_offset_blue_y = 0;

/** @global Time stamp of previous frame in ms */
var lastTime = 0;

/** @global A glmatrix vector to use for transformations */
var transformVec = vec3.create();    

/** @global A vector to use for blue color */
var blue = [
  0.074509804,    0.156862745,    0.294117647, 1.0,
  ];

/** @global A vector to use for orange color */
var orange = [
  0.91372549,    0.290196078,    0.215686275,1.0,
  ];

  /** @global Two times pi to save some multiplications...*/
var twicePi=2.0*3.14159;


  /** @global Indicates the blue is touching the orange*/
  var contact=0;

  /** @global Indicates the blue is touching the orange*/
  var blue_vy=0;


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

  shaderProgram.vertexColorUniform = gl.getUniformLocation(shaderProgram, "aVertexColor"); 

  //oddly, HelloProjection enables the attributes here, which HelloColor did not.
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
}

/**
 * Populate buffers with data. Mostly for the blue vertices, though it also calls loadOrange()
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
    
  loadOrange();
}

/**
 * Populate buffers with orange vertex data. 
 */
function loadOrange()
{

// orange position stuff
vertexPositionBuffer_Orange = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer_Orange);
//key x points are 32 and 45, 60 and 75, 90 and 105, 120 and 135, 148 and 163, 178 and 193
//key y points are 70,57,47,38,30,19,10
//probably measured these a little wrong, but oh well. 
//scaling 2 pi to 70-47

var triangleVertices_Orange = [];

add_body_orange(triangleVertices_Orange,32,45,70,57,47);
add_body_orange(triangleVertices_Orange,60,75,70,38,30);
add_body_orange(triangleVertices_Orange,90,105,70,19,10);

add_body_orange(triangleVertices_Orange,120,135,70,10,19);
add_body_orange(triangleVertices_Orange,148,163,70,30,38);
add_body_orange(triangleVertices_Orange,178,193,70,47,57);



gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices_Orange), gl.DYNAMIC_DRAW);
vertexPositionBuffer_Orange.itemSize = 3;
vertexPositionBuffer_Orange.numberOfItems = triangleVertices_Orange.length/3;

}

/**
 * Helper function to calculate vertex positions for each of the orange segments, calculating the non-uniform translation for each one.
 */
function add_body_orange(triangleVertices_Orange,left,right,top,bottom_left,bottom_right) { 

  y_left  = top-contact;
  if(contact)
    x_left  = left + (contact/3)*Math.cos(twicePi * y_left /25  );
  else
    x_left = left;

  triangleVertices_Orange.push(x_left );
  triangleVertices_Orange.push(y_left );
  triangleVertices_Orange.push(0);

  numVerts = 40;

  for (i=0;i<=numVerts;i+=2){

    y_left  = (top-contact)* (1 - i/numVerts) + bottom_left*(i/numVerts) ;
    y_right = (top-contact)* (1 - i/numVerts) + bottom_right*(i/numVerts) ;

    if(contact)
    {
    x_left  = left  + (contact/3)*Math.cos(twicePi * y_left /25 );
    x_right = right + (contact/3)*Math.cos(twicePi * y_left /25 );
    }
    else
    {
    x_left = left;
    x_right = right;
    }
    triangleVertices_Orange.push(x_left );
    triangleVertices_Orange.push(y_left );
    triangleVertices_Orange.push(0);
    triangleVertices_Orange.push(x_right);
    triangleVertices_Orange.push(y_right);
    triangleVertices_Orange.push(0);
  }

  triangleVertices_Orange.push(x_right);
  triangleVertices_Orange.push(y_right);
  triangleVertices_Orange.push(0);

  
}



/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT);
// might need to clear the depth as well?
  // gl.clear(1.0,1.0,1.0,1.0); // this isn't the right way to make the background white.

 //blue stuff

 mat4.identity(mvMatrix);
 mat4.identity(pMatrix);
 mat4.ortho(pMatrix,-gl.viewportWidth/2,gl.viewportWidth/2,-gl.viewportHeight/2,gl.viewportHeight/2,-1,1); //couple of ways to get the width/height, but I chose to copy the example code that used gl.viewportWidth. recall in the html we used a 500x500 canvas.
 vec3.set(transformVec,-224/2,  - 150 + anim_offset_blue_y,0); //horizontally center the badge on the origin. shift it 150 pixels downwards and add the vertical animation.
 mat4.translate(mvMatrix, mvMatrix,transformVec);
 setMatrixUniforms();

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer_Blue);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer_Blue.itemSize, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  gl.uniform4fv(shaderProgram.vertexColorUniform, blue);
                          
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer_Blue.numberOfItems);


// orange stuff

mat4.identity(mvMatrix);
mat4.identity(pMatrix);
mat4.ortho(pMatrix,-gl.viewportWidth/2,gl.viewportWidth/2,-gl.viewportHeight/2,gl.viewportHeight/2,-1,1); //couple of ways to get the width/height, but I chose to copy the example code that used gl.viewportWidth. recall in the html we used a 500x500 canvas.
vec3.set(transformVec,-224/2,  - 150 ,0); //horizontally center the badge on the origin. shift it 150 pixels downwards.
mat4.translate(mvMatrix, mvMatrix,transformVec);
setMatrixUniforms();

loadOrange(); // My "non-affine transformation" is computed on the JS level, so reload the buffers with new vertex positions.

gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer_Orange);
gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                       vertexPositionBuffer_Orange.itemSize, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

gl.uniform4fv(shaderProgram.vertexColorUniform, orange);

gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPositionBuffer_Orange.numberOfItems);

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
  anim_offset_blue_y = 150;
  blue_vy = 0;
}

/**
 * Animation to be called from tick. Updates globals and calculates variables for animation for each tick.
 */
function animate() {
  // two older approaches currently unused.
  // var timeNow = new Date().getTime();
  // if (lastTime != 0) {
  //     var elapsed = timeNow - lastTime;    
  //     rotAngle= (rotAngle+1.0) % 360;
  // }
  // lastTime = timeNow; 
  // frame = (frame + 1) % (animLength); //use 300 frames for one animation loop
  // anim_offset_blue_y = -30 + Math.abs(animLength/2-frame); //constant velocity version. 10 is the original gap between the orange and blue components.

  blue_vy += -0.1;
  anim_offset_blue_y += blue_vy ; //using d = a * t^2 as a kinematic approximation
  if(anim_offset_blue_y <= -10)
    blue_vy += 1.5;


  if(anim_offset_blue_y < -10)
    contact = -10-anim_offset_blue_y;
  else
    contact = 0;
}

/**
 * Tick called for every animation frame.
 */
function tick() {
  requestAnimFrame(tick);
  draw();
  animate();
}
