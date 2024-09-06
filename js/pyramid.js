// Vertex shader source: Processes the vertex positions and applies projection and model-view transformations.
const vsSource = `
    attribute vec4 aVertexPosition;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    }
`;

// Fragment shader source: Takes in a color uniform and applies it to the pixels of the rendered object.
const fsSource = `
    precision mediump float;
    uniform vec4 uColor;
    void main(void) {
        gl_FragColor = uColor;
    }
`;

// Function to create and compile a shader (either vertex or fragment) from the provided source code.
function createShader(gl, sourceCode, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, sourceCode);
    gl.compileShader(shader);

    // Check if shader compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// Function to initialize the shader program by compiling the vertex and fragment shaders.
function initShaderProgram(gl) {
    const vertexShader = createShader(gl, vsSource, gl.VERTEX_SHADER);
    const fragmentShader = createShader(gl, fsSource, gl.FRAGMENT_SHADER);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // Check if the shader program linked successfully
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program:', gl.getProgramInfoLog(shaderProgram));
        return null;
    }
    return shaderProgram;
}

// Function to define the pyramid shapes and their properties (vertices, faces, edges, colors, and positions).
function createPyramids() {
    // Define each pyramid with vertices, faces, edges, position, and color
    const pyramid1 = {
        vertices: [-1, 0, 1, 1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 2, 0],
        faces: [[0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4], [0, 1, 2, 3]],
        edges: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 4], [2, 4], [3, 4]],
        position: [-3, 0, 0],
        color: [0.0, 1.0, 1.0, 1.0] // Cyan
    };

    const pyramid2 = {
        vertices: [-1, 0, 1, 1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 2, 0],
        faces: [[0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4], [0, 1, 2, 3]],
        edges: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 4], [2, 4], [3, 4]],
        position: [0, 0, -5],
        color: [1.0, 0.0, 1.0, 1.0] // Magenta
    };

    const pyramid3 = {
        vertices: [-1, 0, 1, 1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 2, 0],
        faces: [[0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4], [0, 1, 2, 3]],
        edges: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 4], [2, 4], [3, 4]],
        position: [3, 0, 0],
        color: [1.0, 1.0, 0.0, 1.0] // Yellow
    };

    return [pyramid1, pyramid2, pyramid3];
}

// Function to calculate the depth of each face for the Painter's Algorithm.
function calculateFaceDepth(face, vertices, cameraPosition) {
    let depth = 0;
    face.forEach((index) => {
        const vertex = vertices.slice(index * 3, index * 3 + 3);
        const dist = Math.sqrt(
            Math.pow(vertex[0] - cameraPosition[0], 2) +
            Math.pow(vertex[1] - cameraPosition[1], 2) +
            Math.pow(vertex[2] - cameraPosition[2], 2)
        );
        depth += dist;
    });
    return depth / face.length;
}

// Sort the faces of the pyramids based on their depth relative to the camera (Painter's Algorithm).
function sortFacesByDepth(faces, vertices, cameraPosition) {
    return faces.sort((a, b) => {
        return calculateFaceDepth(b, vertices, cameraPosition) - calculateFaceDepth(a, vertices, cameraPosition);
    });
}

// Function to apply the position transformation to vertices.
function transformVertices(vertices, position) {
    return vertices.map((v, i) => {
        return v + position[i % 3];
    });
}

// Draw a pyramid face with the specified vertices and color.
function drawFace(gl, programInfo, face, vertices, color) {
    const faceVertices = face.flatMap(index => vertices.slice(index * 3, index * 3 + 3));

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(faceVertices), gl.STATIC_DRAW);

    const vertexPosition = gl.getAttribLocation(programInfo.program, 'aVertexPosition');
    gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexPosition);

    gl.uniform4fv(programInfo.uniformLocations.color, color);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, face.length);
}

// Draw the edges of the pyramid for a wireframe appearance.
function drawEdges(gl, programInfo, edges, vertices) {
    edges.forEach(edge => {
        const edgeVertices = edge.flatMap(index => vertices.slice(index * 3, index * 3 + 3));

        const edgeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, edgeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(edgeVertices), gl.STATIC_DRAW);

        const vertexPosition = gl.getAttribLocation(programInfo.program, 'aVertexPosition');
        gl.vertexAttribPointer(vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vertexPosition);

        gl.uniform4fv(programInfo.uniformLocations.color, [0.0, 0.0, 0.0, 1.0]);  // Black color for edges

        gl.drawArrays(gl.LINES, 0, 2);  // Draw each edge as a line
    });
}

// Render the scene by drawing all the pyramids and applying the Painter's Algorithm to sort faces by depth.
function drawScene(gl, programInfo, pyramids, cameraPosition) {
    pyramids.forEach((pyramid) => {
        const transformedVertices = transformVertices(pyramid.vertices, pyramid.position);

        const sortedFaces = sortFacesByDepth(pyramid.faces, transformedVertices, cameraPosition);

        // Draw faces
        sortedFaces.forEach(face => {
            drawFace(gl, programInfo, face, transformedVertices, pyramid.color);
        });

        // Draw edges
        drawEdges(gl, programInfo, pyramid.edges, transformedVertices);
    });
}

// Function to compute the camera's position based on rotation angles (X and Y) and zoom radius.
function rotateCamera(angleX, angleY, radius) {
    const cameraX = radius * Math.sin(angleX) * Math.cos(angleY);
    const cameraY = radius * Math.sin(angleY);
    const cameraZ = radius * Math.cos(angleX) * Math.cos(angleY);
    return [cameraX, cameraY, cameraZ];
}

// Main function that sets up the WebGL context and handles rendering and user interactions.
function main() {
    const canvas = document.getElementById('webglCanvas');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
        return;
    }

    const shaderProgram = initShaderProgram(gl);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition')
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            color: gl.getUniformLocation(shaderProgram, 'uColor')
        }
    };

    const pyramids = createPyramids();
    let radius = 10.0;  // Default zoom level
    let angleX = 0;  // Horizontal rotation angle
    let angleY = 0;  // Vertical rotation angle
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Set the clear color (background)
    gl.enable(gl.DEPTH_TEST);  // Enable depth testing
    gl.depthFunc(gl.LEQUAL);   // Set the depth function to less than or equal

    // Event listeners for mouse drag (for camera rotation)
    canvas.addEventListener('mousedown', (event) => {
        isDragging = true;
        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
    });

    canvas.addEventListener('mousemove', (event) => {
        if (isDragging) {
            const deltaX = event.clientX - previousMouseX;
            const deltaY = event.clientY - previousMouseY;

            angleX += deltaX * 0.01;
            angleY += deltaY * 0.01;

            // Limit the vertical rotation angle to prevent flipping
            angleY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, angleY));

            previousMouseX = event.clientX;
            previousMouseY = event.clientY;
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });

    canvas.addEventListener('mouseleave', () => {
        isDragging = false;
    });

    // Zoom slider event listener
    const zoomSlider = document.getElementById('zoomSlider');
    zoomSlider.addEventListener('input', (event) => {
        radius = parseFloat(event.target.value);
    });

    // Main render loop
    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const cameraPosition = rotateCamera(angleX, angleY, radius);

        const projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, 30 * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);

        const modelViewMatrix = mat4.create();
        mat4.lookAt(modelViewMatrix, cameraPosition, [0, 0, 0], [0, 1, 0]);

        gl.useProgram(programInfo.program);
        gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

        // Draw the scene
        drawScene(gl, programInfo, pyramids, cameraPosition);

        requestAnimationFrame(render);  // Request the next frame
    }

    requestAnimationFrame(render);  // Start the render loop
}

window.onload = main;