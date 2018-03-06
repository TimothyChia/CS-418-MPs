/**
 * @fileoverview Terrain-Generated using the diamond square algorithm.
 * @author Eric Shaffer. Modified by Timothy Chia for mp2 SP 2018.
 */

/** Class implementing 3D terrain. */
class Terrain{   
/**
 * Initialize members of a Terrain object
 * @param {number} div Number of triangles along x axis and y axis
 * @param {number} n   
 */
    constructor(div,minX,maxX,minY,maxY){
        this.div = div;
        this.max = div;
        this.minX=minX;
        this.minY=minY;
        this.maxX=maxX;
        this.maxY=maxY;
        this.n = Math.log2(div);
        // Allocate vertex array
        this.vBuffer = [];
        // Allocate triangle array
        this.fBuffer = [];
        // Allocate normal array
        this.nBuffer = [];
        // Allocate array for edges so we can draw wireframe
        this.eBuffer = [];
        console.log("Terrain: Allocated buffers");
        

        console.log("%f,%f,%f,%f",this.maxX,this.maxY,this.minX,this.minY); //don't forget to use %f for floats!
        
        // this.generateTriangles();
        this.generateTerrain();
        // console.log("Terrain: Generated triangles");
        // this.printBuffers();
        this.generateLines();
        console.log("Terrain: Generated lines");
        
        // Get extension for 4 byte integer indices for drwElements
        var ext = gl.getExtension('OES_element_index_uint');
        if (ext ==null){
            alert("OES_element_index_uint is unsupported by your browser and terrain generation cannot proceed.");
        }

        
    }
    
    /**
    * Set the x,y,z coords of a vertex at location(i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    setVertex(v,i,j)
    {
        //Your code here
        // var vid = 3 * (i*(this.div +1)+j);
            
        var vid = 3 * (i*(this.max +1)+j);
        this.vBuffer[vid] = v[0]
        this.vBuffer[vid+1] = v[1];
        this.vBuffer[vid+2] = v[2];
        // console.log("Setting vertex with index %f to %f,%f,%f",vid/3,v[0],v[1],v[2]);
    }
    
    /**
    * Return the x,y,z coordinates of a vertex at location (i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    getVertex(v,i,j)
    {
        //Your code here
        // var vid = 3 * (i*(this.div +1)+j);        
        var vid = 3 * (i*(this.max +1)+j);        
        
        v[0] = this.vBuffer[vid] ;
        v[1] = this.vBuffer[vid+1] ;
        v[2]= this.vBuffer[vid+2];
    }

    getHeight(i,j)
    {
        var vid = 3 * (i*(this.max +1)+j);        
        return this.vBuffer[vid+2];
    }

     /**
    * Fills the Terrain object using the diamond square algorithm
    * @param {Object} 
    * @param {number} 
    * @param {number}
    */
    generateTerrain()
    {
        var deltaX=(this.maxX-this.minX)/this.div;
        var deltaY=(this.maxY-this.minY)/this.div;

        var d = this.max;
        var corners = [ 0.5,0.5,0.5,0.5  ]; // initial seed values for the corners of the largest square

        this.setVertex([this.minY,this.minX,corners[0]],0,0);
        this.setVertex([this.minY,this.maxX,corners[1]],0,d);
        this.setVertex([this.maxY,this.minX,corners[2]],d,0);
        this.setVertex([this.maxY,this.maxX,corners[3]],d,d);
        
        var i,row,col,height,col_offset,count;

        for(i = 0;i < this.n ; i++) // indices must be integers, so we can only execute n-1 times? double check
        {
            // console.log("Outer loop d =  %d",d);
            
            //diamond step
            for(row = d/2;row<=this.max ;row += d)
            {
                for(col = d/2;col<=this.max ; col += d)
                {
                    corners[0] = this.getHeight(row-d/2,col-d/2);
                    corners[1] = this.getHeight(row-d/2,col+d/2);
                    corners[2] = this.getHeight(row+d/2,col-d/2);
                    corners[3] = this.getHeight(row+d/2,col+d/2);
                    height = (0.5-Math.random()) /Math.pow(2,i+1)  +  ( corners[0]+corners[1]+corners[2]+corners[3])/4;
                    // console.log("diamond height = %d",height);
                    this.setVertex([this.minX+deltaX*row,this.minY+deltaY*col,height],row,col);
                }
            }
            // square step
            col_offset = d/2;
            for(row = 0;row<=this.max ;row += d/2)
            {
                for(col = col_offset;col<=this.max ; col += d)
                {
                    corners[0] = corners[1] = corners[2] = corners[3] = count = 0;
                    // if statements only really needed for points on the edges of the array. consider optimizing later.
                    if(row-d/2 >= 0)
                        {corners[0] = this.getHeight( row-d/2, col);count++;}
                    if(row+d/2 <= this.max)
                        {corners[1] = this.getHeight( row+d/2, col);count++;}
                    if(col+d/2 <= this.max)
                        {corners[2] = this.getHeight( row, col+d/2);count++;}
                    if(col-d/2 >= 0)
                        {corners[3] = this.getHeight( row, col-d/2);count++;}
                    height =  (0.5-Math.random())/Math.pow(2,i+1)+ ( corners[0]+corners[1]+corners[2]+corners[3])/count;
                    // console.log("square height = %f",height);
                    this.setVertex([this.minX+deltaX*row,this.minY+deltaY*col,height],row,col);
                   
                }
                if(col_offset == 0)
                    col_offset = d/2;
                else
                    col_offset = 0;
            }
            
            // setup d values for next loop
            d = d/2;
        }
        //face stuff
        // and normals
        for(var i=0; i<this.div; i++)
          for(var j=0; j<this.div; j++){
   
           var vid = i*(this.div+1)+j;
           this.fBuffer.push(vid);
           this.fBuffer.push(vid+1);
           this.fBuffer.push(vid+this.div+1);
   
           this.fBuffer.push(vid+1);
           this.fBuffer.push(vid+1+this.div+1);
           this.fBuffer.push(vid+this.div+1);

          }  

          for(var i=0; i<=this.div; i++)
          for(var j=0; j<=this.div; j++){
 
              this.nBuffer.push(0);
              this.nBuffer.push(0);
              this.nBuffer.push(1);
            }

        this.numVertices = this.vBuffer.length/3;
        this.numFaces = this.fBuffer.length/3;
        // console.log("numFaces = %d",this.numFaces);
    
    }




    // /**
    // * Send the buffer objects to WebGL for rendering 
    // */
    loadBuffers()
    {
        // Specify the vertex coordinates
        this.VertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);      
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vBuffer), gl.STATIC_DRAW);
        this.VertexPositionBuffer.itemSize = 3;
        this.VertexPositionBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexPositionBuffer.numItems, " vertices");
    
        // Specify normals to be able to do lighting calculations
        this.VertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.nBuffer),
                  gl.STATIC_DRAW);
        this.VertexNormalBuffer.itemSize = 3;
        this.VertexNormalBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexNormalBuffer.numItems, " normals");
    
        // Specify faces of the terrain 
        this.IndexTriBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.fBuffer),
                  gl.STATIC_DRAW);
        this.IndexTriBuffer.itemSize = 1;
        this.IndexTriBuffer.numItems = this.fBuffer.length;
        console.log("Loaded ", this.IndexTriBuffer.numItems, " triangles");
    
        //Setup Edges  
        this.IndexEdgeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.eBuffer),
                  gl.STATIC_DRAW);
        this.IndexEdgeBuffer.itemSize = 1;
        this.IndexEdgeBuffer.numItems = this.eBuffer.length;
        
        console.log("triangulatedPlane: loadBuffers");
    }
    
    /**
    * Render the triangles 
    */
    drawTriangles(){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.drawElements(gl.TRIANGLES, this.IndexTriBuffer.numItems, gl.UNSIGNED_INT,0);
    }
    
    /**
    * Render the triangle edges wireframe style 
    */
    drawEdges(){
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.drawElements(gl.LINES, this.IndexEdgeBuffer.numItems, gl.UNSIGNED_INT,0);   
    }
/**
 * Fill the vertex and buffer arrays 
 */    
generateTriangles()
   {
       var deltaX=(this.maxX-this.minX)/this.div;
       var deltaY=(this.maxY-this.minY)/this.div;
    //    this.generateTerrain();
       for(var i=0; i<=this.div; i++)
           for(var j=0; j<=this.div; j++){
               this.vBuffer.push(this.minX+deltaX*i);
               this.vBuffer.push(this.minY+deltaY*j);
               this.vBuffer.push(this.heightArr[(i*this.div)+(j)]);
   
               this.nBuffer.push(0);
               this.nBuffer.push(0);
               this.nBuffer.push(1);
           }
       for(var i=0; i<this.div; i++)
          for(var j=0; j<this.div; j++){
   
           var vid = i*(this.div+1)+j;
           this.fBuffer.push(vid);
           this.fBuffer.push(vid+1);
           this.fBuffer.push(vid+this.div+1);
   
           this.fBuffer.push(vid+1);
           this.fBuffer.push(vid+1+this.div+1);
           this.fBuffer.push(vid+this.div+1);
          }  
       this.numVertices = this.vBuffer.length/3;
       this.numFaces = this.fBuffer.length/3;
   }

/**
 * Print vertices and triangles to console for debugging
 */
printBuffers()
    {
        
    for(var i=0;i<this.numVertices;i++)
          {
           console.log("v ", i,this.vBuffer[i*3], " ", 
                             this.vBuffer[i*3 + 1], " ",
                             this.vBuffer[i*3 + 2], " ");
                       
          }
    
      for(var i=0;i<this.numFaces;i++)
          {
           console.log("f ", this.fBuffer[i*3], " ", 
                             this.fBuffer[i*3 + 1], " ",
                             this.fBuffer[i*3 + 2], " ");
                       
          }
        
    }

/**
 * Generates line values from faces in faceArray
 * to enable wireframe rendering
 */
generateLines()
{
    var numTris=this.fBuffer.length/3;
    for(var f=0;f<numTris;f++)
    {
        var fid=f*3;
        this.eBuffer.push(this.fBuffer[fid]);
        this.eBuffer.push(this.fBuffer[fid+1]);
        
        this.eBuffer.push(this.fBuffer[fid+1]);
        this.eBuffer.push(this.fBuffer[fid+2]);
        
        this.eBuffer.push(this.fBuffer[fid+2]);
        this.eBuffer.push(this.fBuffer[fid]);
    }
    
}
    
}
