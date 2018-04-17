
/**
 * @file A simple WebGL example for viewing meshes read from OBJ files
 * @author Eric Shaffer <shaffer1@illinois.edu>  
 */

// ecmaVersion: 6


/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgramObj = {};

/** @global The Modelview matrix */
var mvMatrix = mat4.create();

/** @global The View matrix */
var vMatrix = mat4.create();

/** @global The Projection matrix */
var pMatrix = mat4.create();

/** @global The Normal matrix */
var nMatrix = mat3.create();

/** @global The matrix stack for hierarchical modeling */
var mvMatrixStack = [];

/** @global An object holding the geometry for a 3D mesh */
var myMeshObj = {};

var invVMatrix = mat3.create();

// View parameters
/** @global Location of the camera in world coordinates */
var eyePt = vec3.fromValues(0.0,0.0,2.0);
/** @global Direction of the view in world coordinates */
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
/** @global Up vector for view matrix creation, in world coordinates */
var up = vec3.fromValues(0.0,1.0,0.0);
/** @global Location of a point along viewDir in world coordinates */
var viewPt = vec3.fromValues(0.0,0.0,0.0);

//Light parameters
/** @global Light position in VIEW coordinates */ //switching this to world coords? actually I think it's model coords.
var lightPosition = [5,5,5];
/** @global Ambient light color/intensity for Phong reflection */
var lAmbient = [0,0,0];
/** @global Diffuse light color/intensity for Phong reflection */
var lDiffuse = [1,1,1];
/** @global Specular light color/intensity for Phong reflection */
var lSpecular =[1,1,1];

//Material parameters
/** @global Ambient material color/intensity for Phong reflection */
var kAmbient = [1.0,1.0,1.0];
/** @global Diffuse material color/intensity for Phong reflection */
var kTerrainDiffuse = [205.0/255.0,163.0/255.0,63.0/255.0];
/** @global Specular material color/intensity for Phong reflection */
var kSpecular = [1.0,1.0,1.0];
/** @global Shininess exponent for Phong reflection */
var shininess = 23;
/** @global Edge color fpr wireframeish rendering */
var kEdgeBlack = [0.0,0.0,0.0];
/** @global Edge color for wireframe rendering */
var kEdgeWhite = [1.0,1.0,1.0];


//Model parameters
var eulerY=0;

//// constructor for a blank object used to store multiple meshes
//function Meshes(){
//    
//}

//-------------------------------------------------------------------------
/**
 * Asynchronously read a server-side text file
 */
function asyncGetFile(url) {
  //Your code here
    console.log("Getting text file")
    return new Promise((resolve,reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET",url);
        xhr.onload = () => resolve(xhr.responseText);
        xhr.onerror = () => reject(xhr.statusText);
        xhr.send();
        console.log("Made promise");
    });
}

//-------------------------------------------------------------------------
/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader(shaderProgram) {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader(shaderProgram) {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

//-------------------------------------------------------------------------
/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader(shaderProgram) {
  mat3.fromMat4(nMatrix,mvMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
/**
 * Pushes matrix onto modelview matrix stack
 */
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}


//----------------------------------------------------------------------------------
/**
 * Pops matrix off of modelview matrix stack
 */
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms(shaderProgram) {
    uploadModelViewMatrixToShader(shaderProgram);
    uploadNormalMatrixToShader(shaderProgram);
    uploadProjectionMatrixToShader(shaderProgram);
}

//----------------------------------------------------------------------------------
/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

//----------------------------------------------------------------------------------
/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
      console.log("shader element not found");
      console.log(id);
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

//----------------------------------------------------------------------------------
/**
 * Setup the fragment and vertex shaders
 * Modified to support compiling multiple programs
 vs and fs are string names of the shaders
 */
function setupShaders(programName,vs, fs) {
  vertexShader = loadShaderFromDOM(vs);
  fragmentShader = loadShaderFromDOM(fs);
  
//  shaderProgram = shaderProgramObj[programName];
  shaderProgramObj[programName] = gl.createProgram();
  // if you do it in this order, the following code actuallly modifies the correct object.
    shaderProgram = shaderProgramObj[programName];

  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
  shaderProgram.uniformShininessLoc = gl.getUniformLocation(shaderProgram, "uShininess");    
  shaderProgram.uniformAmbientMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKAmbient");  
  shaderProgram.uniformDiffuseMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKDiffuse");
  shaderProgram.uniformSpecularMaterialColorLoc = gl.getUniformLocation(shaderProgram, "uKSpecular");
}

//-------------------------------------------------------------------------
/**
 * Sends material information to the shader
 * @param {Float32} alpha shininess coefficient
 * @param {Float32Array} a Ambient material color
 * @param {Float32Array} d Diffuse material color
 * @param {Float32Array} s Specular material color
 */
function setMaterialUniforms(shaderProgram,alpha,a,d,s) {
  gl.uniform1f(shaderProgram.uniformShininessLoc, alpha);
  gl.uniform3fv(shaderProgram.uniformAmbientMaterialColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseMaterialColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularMaterialColorLoc, s);
}

//-------------------------------------------------------------------------
/**
 * Sends light information to the shader
 * @param {Float32Array} loc Location of light source
 * @param {Float32Array} a Ambient light strength
 * @param {Float32Array} d Diffuse light strength
 * @param {Float32Array} s Specular light strength
 */
function setLightUniforms(shaderProgram,loc,a,d,s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

//----------------------------------------------------------------------------------
/**
 * Populate buffers with data
 * the parameter mesh is modified.
 */
function setupMesh(meshName, filename) {
   //Your code here
    myMeshObj[meshName] = new TriMesh();
    var myMesh = myMeshObj[meshName];

    myPromise = asyncGetFile(filename);
    // We define what to do when the promise is resolved with the then() call,
    // and what to do when the promise is rejected with the catch() call
    myPromise.then((retrievedText) =>{
        myMesh.loadFromOBJ(retrievedText);
        console.log("Yay! got the file");
    })
    .catch(
    // Log the rejection reason
    (reason) => {
        console.log('Handle rejected promise(' +reason+') here.')
        });
}



//----------------------------------------------------------------------------------
/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
    //console.log("function draw()")
    
    drawTeapot();
    drawCube();

}

//----------------------------------------------------------------------------------
/**
 * Draw call that applies matrix transformations to model and draws model in frame
 * for the teapot. 
 */
function drawTeapot(){
    var myMesh = myMeshObj.teapot;
    var shaderProgram = shaderProgramObj.teapot;
    gl.useProgram(shaderProgram);
    
      
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(45), 
                     gl.viewportWidth / gl.viewportHeight,
                     0.1, 500.0);

    // We want to look down -z, so create a lookat point in that direction    
    vec3.add(viewPt, eyePt, viewDir);
    
    // Then generate the lookat matrix and initialize the view matrix to that view
    mat4.lookAt(vMatrix,eyePt,viewPt,up);

    //Draw Mesh
    //ADD an if statement to prevent early drawing of myMesh. added. 

    if(myMesh.loaded())
    {
        
        var boundingBox = myMesh.computeAABB(); // a list of lists. min, then max.
        var distXYZ = [boundingBox[1][0]-boundingBox[0][0],boundingBox[1][1]-boundingBox[0][1],boundingBox[1][2]-boundingBox[0][2]];
        mat4.identity(mvMatrix);

        // so confused about the order of matrix multiplication in this library.
        if ((document.getElementById("teapot").checked))
            {
                mat4.rotateY(mvMatrix, mvMatrix, degToRad(eulerY));

            }


                //scale the teapot so its bounding box fits. keep xyz aspect ratio.     

        var scaleBest = 1 /Math.max( distXYZ[0],distXYZ[1],distXYZ[2]  );
        var scaleVec = vec3.fromValues(scaleBest,scaleBest,scaleBest);
        mat4.scale(mvMatrix,mvMatrix,scaleVec);

//        
        // translate the teapot so its bounding box is at 0,0,0. careful to do this before scaling?
        // I'm not sure why, but the correct order is to call scale, then call translate. this causes the combined matrix to have the right scaling, and 
        // a 4th column with a scaled down translation. the equivalent of scale*translate, if the matrices were constructed independently.
        var transVec = vec3.fromValues(-1 * (boundingBox[0][0] + distXYZ[0]/2),
                                       -1* (boundingBox[0][1] + distXYZ[1]/2),
                                       -1* (boundingBox[0][2] + distXYZ[2]/2)
                                      );
        mat4.translate(mvMatrix,mvMatrix,transVec);


        
        //original code from lab 8 below.
        
        mvPushMatrix();

        
        if (!(document.getElementById("teapot").checked))
            mat4.rotateY(mvMatrix, mvMatrix, degToRad(eulerY)); // rotation before viewing means it spins in place.
        mat4.multiply(mvMatrix,vMatrix,mvMatrix);
        
        setMatrixUniforms(shaderProgram);
        setLightUniforms(shaderProgram,lightPosition,lAmbient,lDiffuse,lSpecular);
    
        // probably the correct matrix to invert to transform my reflection vector back into world coordinates?
        // thought it'd be the vMatrix tbh, but then again I also don't get how the nMatrix is constructed.
        // ok it's the vMatrix if you're rotating the teapot object. if rotating the camera, then use mv to account for the way we rotateYd the world.
        if ((document.getElementById("teapot").checked))
            mat3.fromMat4(invVMatrix,vMatrix);
        else
            mat3.fromMat4(invVMatrix,mvMatrix);

        mat3.invert(invVMatrix,invVMatrix);
        gl.uniformMatrix3fv(gl.getUniformLocation(shaderProgram, "invVMatrix"), false, invVMatrix);

        
        if ((document.getElementById("reflection").checked))
            {
                gl.uniform1i(gl.getUniformLocation(shaderProgram, "uDoReflect"), true);

            }
        else
            {
                gl.uniform1i(gl.getUniformLocation(shaderProgram, "uDoReflect"), false);
            }
        
        if ((document.getElementById("polygon").checked) || (document.getElementById("wirepoly").checked))
        {
            setMaterialUniforms(shaderProgram,shininess,kAmbient,
                                kTerrainDiffuse,kSpecular); 
            myMesh.drawTriangles();
        }
    
        if(document.getElementById("wirepoly").checked)
        {   
            setMaterialUniforms(shaderProgram,shininess,kAmbient,
                                kEdgeBlack,kSpecular);
            myMesh.drawEdges();
        }   

        if(document.getElementById("wireframe").checked)
        {
            setMaterialUniforms(shaderProgram,shininess,kAmbient,
                                kEdgeWhite,kSpecular);
            myMesh.drawEdges();
        }   
        
        else
            {
            setMaterialUniforms(shaderProgram,shininess,kAmbient,
            kTerrainDiffuse,kSpecular); 
            myMesh.drawTriangles();
            }
        mvPopMatrix();
    
      }
}



//----------------------------------------------------------------------------------
/**
 * Draw call that applies matrix transformations to model and draws model in frame
 * for the cube.
 * a lot of the code is the same as my drawTeapot (intentionally) but haven't taken the time to look into making more sub functions yet. some comments oudated, ignore stuff about "teapot"
 */
function drawCube(){
    var myMesh = myMeshObj.cube;
    var shaderProgram = shaderProgramObj.cube;
    gl.useProgram(shaderProgram);

//    texture cube stuff
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP,cubeMap);
    gl.uniform1i(gl.getUniformLocation(shaderProgram,"uCubeSampler"),0);

    
    // removed these since teapot does this first???? um.
//    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
//    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(45), 
                     gl.viewportWidth / gl.viewportHeight,
                     0.1, 500.0);

    // We want to look down -z, so create a lookat point in that direction    
    vec3.add(viewPt, eyePt, viewDir);
    
    // Then generate the lookat matrix and initialize the view matrix to that view
    mat4.lookAt(vMatrix,eyePt,viewPt,up);

    //Draw Mesh
    //ADD an if statement to prevent early drawing of myMesh. added. 

    if(myMesh.loaded())
    {
        
        var boundingBox = myMesh.computeAABB(); // a list of lists. min, then max.
        var distXYZ = [boundingBox[1][0]-boundingBox[0][0],boundingBox[1][1]-boundingBox[0][1],boundingBox[1][2]-boundingBox[0][2]];
        mat4.identity(mvMatrix);

                //scale the teapot so its bounding box fits. keep xyz aspect ratio.     

//        var scaleBest = 1 /Math.max( distXYZ[0],distXYZ[1],distXYZ[2]  );
        var scaleBest = 2; // just generally make the cube big enough to fit the teapot, which I scaled to fit in 1x1x1
        var scaleVec = vec3.fromValues(scaleBest,scaleBest,scaleBest);
        mat4.scale(mvMatrix,mvMatrix,scaleVec);

//        
        // translate the teapot so its bounding box is at 0,0,0. careful to do this before scaling?
        // I'm not sure why, but the correct order is to call scale, then call translate. this causes the combined matrix to have the right scaling, and 
        // a 4th column with a scaled down translation. the equivalent of scale*translate, if the matrices were constructed independently.
        var transVec = vec3.fromValues(-1 * (boundingBox[0][0] + distXYZ[0]/2),
                                       -1* (boundingBox[0][1] + distXYZ[1]/2),
                                       -1* (boundingBox[0][2] + distXYZ[2]/2)
                                      );
        mat4.translate(mvMatrix,mvMatrix,transVec);


        
        //original code from lab 8 below.
        
        mvPushMatrix();
        if (!(document.getElementById("teapot").checked))
            mat4.rotateY(mvMatrix, mvMatrix, degToRad(eulerY)); // rotation before viewing means it spins in place.
        mat4.multiply(mvMatrix,vMatrix,mvMatrix);
        
        setMatrixUniforms(shaderProgram);
        setLightUniforms(shaderProgram,lightPosition,lAmbient,lDiffuse,lSpecular);
    
        if ((document.getElementById("polygon").checked) || (document.getElementById("wirepoly").checked)||(document.getElementById("reflection").checked) )
        {
            setMaterialUniforms(shaderProgram,shininess,kAmbient,
                                kTerrainDiffuse,kSpecular); 
            myMesh.drawTriangles();
        }
    
        if(document.getElementById("wirepoly").checked)
        {   
            setMaterialUniforms(shaderProgram,shininess,kAmbient,
                                kEdgeBlack,kSpecular);
            myMesh.drawEdges();
        }   

        if(document.getElementById("wireframe").checked)
        {
            setMaterialUniforms(shaderProgram,shininess,kAmbient,
                                kEdgeWhite,kSpecular);
            myMesh.drawEdges();
        }   
        mvPopMatrix();
    
      }
}

//----------------------------------------------------------------------------------
//Code to handle user interaction
var currentlyPressedKeys = {};

function handleKeyDown(event) {
        //console.log("Key down ", event.key, " code ", event.code);
        currentlyPressedKeys[event.key] = true;
          if (currentlyPressedKeys["a"]) {
            // key A
            eulerY-= 1;
        } else if (currentlyPressedKeys["d"]) {
            // key D
            eulerY+= 1;
        } 
    
        if (currentlyPressedKeys["ArrowUp"]){
            // Up cursor key
            event.preventDefault();
            eyePt[2]+= 0.01;
        } else if (currentlyPressedKeys["ArrowDown"]){
            event.preventDefault();
            // Down cursor key
            eyePt[2]-= 0.01;
        } 
    
}

function handleKeyUp(event) {
        //console.log("Key up ", event.key, " code ", event.code);
        currentlyPressedKeys[event.key] = false;
}

//----------------------------------------------------------------------------------
/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
     
  setupShaders("teapot","shader-vs","shader-fs");
     setupShaders("cube","shader-vs-cube","shader-fs-cube");


  setupMesh("teapot","teapot_0.obj");
  setupMesh("cube","cube.obj");

setupTextures(); //do this while the cube program is active. check this for week 2?     

//  setupMesh("cow.obj");

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;
  tick();
}


//----------------------------------------------------------------------------------
/**
  * Update any model transformations
  */
function animate() {
   //console.log(eulerX, " ", eulerY, " ", eulerZ); 
   document.getElementById("eY").value=eulerY;
   document.getElementById("eZ").value=eyePt[2];   
}


//----------------------------------------------------------------------------------
/**
 * Keeping drawing frames....
 */
function tick() {
    requestAnimFrame(tick);
    animate();
    draw();
}

