// ==============================================================================
// 1. CONFIGURACIÓN DEL CANVAS Y CENTRO DE PANTALLA
// ==============================================================================
const canvas = document.getElementById('lienzo3D');
const ctx = canvas.getContext('2d');
const CENTRO_X = canvas.width / 2;
const CENTRO_Y = canvas.height / 2;
const distanciaCamara = 500;
// ==============================================================================
// 2. TEMAS 3.1 & 3.2: GEOMETRÍA (VÉRTICES Y ARISTAS DE CADA PRIMITIVA)
// ==============================================================================
// Cada figura tiene una lista de vértices (x,y,z) y una lista de aristas
// (pares de índices de vértices). Todas están centradas en el origen (0,0,0).
const figuras = {

    // Cubo original (8 vértices, 12 aristas)
    cubo: {
        vertices: [
            {x: -80, y: -80, z: -80}, {x:  80, y: -80, z: -80},
            {x:  80, y:  80, z: -80}, {x: -80, y:  80, z: -80},
            {x: -80, y: -80, z:  80}, {x:  80, y: -80, z:  80},
            {x:  80, y:  80, z:  80}, {x: -80, y:  80, z:  80}
        ],
        aristas: [
            [0, 1], [1, 2], [2, 3], [3, 0],   // cara trasera
            [4, 5], [5, 6], [6, 7], [7, 4],   // cara frontal
            [0, 4], [1, 5], [2, 6], [3, 7]    // aristas longitudinales
        ]
    },

    // Opción A: Pirámide de base cuadrada (5 vértices, 8 aristas)
    piramide: {
        vertices: [
            {x: -80, y: -80, z: -80}, // V0: base trasera izq
            {x:  80, y: -80, z: -80}, // V1: base trasera der
            {x:  80, y: -80, z:  80}, // V2: base frontal der
            {x: -80, y: -80, z:  80}, // V3: base frontal izq
            {x:   0, y:  80, z:   0}  // V4: ápice (punta)
        ],
        aristas: [
            [0, 1], [1, 2], [2, 3], [3, 0],   // 4 aristas de la base
            [0, 4], [1, 4], [2, 4], [3, 4]    // 4 aristas hacia el ápice
        ]
    },

    // Opción B: Prisma triangular (6 vértices, 9 aristas)
    prisma: {
        vertices: [
            {x: -80, y: -80, z: -80}, // V0: triángulo trasero, esquina izq
            {x:  80, y: -80, z: -80}, // V1: triángulo trasero, esquina der
            {x:   0, y:  80, z: -80}, // V2: triángulo trasero, punta
            {x: -80, y: -80, z:  80}, // V3: triángulo frontal, esquina izq
            {x:  80, y: -80, z:  80}, // V4: triángulo frontal, esquina der
            {x:   0, y:  80, z:  80}  // V5: triángulo frontal, punta
        ],
        aristas: [
            [0, 1], [1, 2], [2, 0],   // triángulo trasero
            [3, 4], [4, 5], [5, 3],   // triángulo frontal
            [0, 3], [1, 4], [2, 5]    // aristas que unen ambos triángulos
        ]
    },

    // Opción C: Octaedro (6 vértices, 12 aristas)
    octaedro: {
        vertices: [
            {x:  110, y:    0, z:    0}, // V0: +X
            {x: -110, y:    0, z:    0}, // V1: -X
            {x:    0, y:  110, z:    0}, // V2: +Y
            {x:    0, y: -110, z:    0}, // V3: -Y
            {x:    0, y:    0, z:  110}, // V4: +Z
            {x:    0, y:    0, z: -110}  // V5: -Z
        ],
        // Cada vértice se une con todos menos con su opuesto (0-1, 2-3, 4-5)
        aristas: [
            [0, 2], [0, 3], [0, 4], [0, 5],
            [1, 2], [1, 3], [1, 4], [1, 5],
            [2, 4], [2, 5], [3, 4], [3, 5]
        ]
    }
};

// Figura activa (cambia con el selector del HTML)
let figuraActual = figuras.cubo;

// ==============================================================================
// 3. TEMA 3.3: PIPELINE DE TRANSFORMACIONES TRIDIMENSIONALES
// ==============================================================================
function transformarVertice3D(v, params) {
    let { tx, ty, tz, sx, sy, sz, rx, ry, rz, shxy, shxz } = params;

    // Convertir ángulos a radianes
    let radX = rx * Math.PI / 180;
    let radY = ry * Math.PI / 180;
    let radZ = rz * Math.PI / 180;

    // --- 3.3.2 ESCALAMIENTO (S) ---
    let x1 = v.x * sx;
    let y1 = v.y * sy;
    let z1 = v.z * sz;

    // --- 3.3.4 SESGADO / SHEAR (Sh) ---
    let x2 = x1 + (shxy * y1) + (shxz * z1);
    let y2 = y1;
    let z2 = z1;

    // --- 3.3.3 ROTACIÓN EN EJE X (Pitch) ---
    let x3 = x2;
    let y3 = y2 * Math.cos(radX) - z2 * Math.sin(radX);
    let z3 = y2 * Math.sin(radX) + z2 * Math.cos(radX);

    // --- 3.3.3 ROTACIÓN EN EJE Y (Yaw) ---
    let x4 = x3 * Math.cos(radY) + z3 * Math.sin(radY);
    let y4 = y3;
    let z4 = -x3 * Math.sin(radY) + z3 * Math.cos(radY);

    // --- 3.3.3 ROTACIÓN EN EJE Z (Roll) ---
    let x5 = x4 * Math.cos(radZ) - y4 * Math.sin(radZ);
    let y5 = x4 * Math.sin(radZ) + y4 * Math.cos(radZ);
    let z5 = z4;

    // --- 3.3.1 TRASLACIÓN (T) ---
    return { x: x5 + tx, y: y5 + ty, z: z5 + tz };
}

// ==============================================================================
// 4. TEMA 3.1: PROYECCIÓN PERSPECTIVA (3D A PANTALLA 2D)
// ==============================================================================
function proyectar3Da2D(v3d) {
    const distanciaCamara = 500;

    let zAjustado = v3d.z + distanciaCamara;
    if (zAjustado < 1) zAjustado = 1;

    // Factor de escala por perspectiva (división entre Z)
    let factorProyeccion = distanciaCamara / zAjustado;

    // Mapeo a píxeles en el lienzo
    let x2d = CENTRO_X + (v3d.x * factorProyeccion);
    let y2d = CENTRO_Y - (v3d.y * factorProyeccion); // Inversión en eje Y

    return { x: x2d, y: y2d };
}

// ==============================================================================
// 5. BUCLE DE RENDERIZADO EN TIEMPO REAL
// ==============================================================================
// Paleta propia (Parte 3)
const COLOR_ARISTAS  = '#fbbf24'; // ámbar
const COLOR_VERTICES = '#a78bfa'; // violeta
const COLOR_EJES     = '#334155';

function renderizar() {
    // 1. Obtener parámetros del panel
    const params = {
        tx: parseFloat(document.getElementById('tx').value),
        ty: parseFloat(document.getElementById('ty').value),
        tz: parseFloat(document.getElementById('tz').value),
        sx: parseFloat(document.getElementById('sx').value),
        sy: parseFloat(document.getElementById('sy').value),
        sz: parseFloat(document.getElementById('sz').value),
        rx: parseFloat(document.getElementById('rx').value),
        ry: parseFloat(document.getElementById('ry').value),
        rz: parseFloat(document.getElementById('rz').value),
        shxy: parseFloat(document.getElementById('shxy').value),
        shxz: parseFloat(document.getElementById('shxz').value)
    };

    // 2. Actualizar indicadores numéricos
    document.getElementById('valTx').innerText = params.tx;
    document.getElementById('valTy').innerText = params.ty;
    document.getElementById('valTz').innerText = params.tz;
    document.getElementById('valSx').innerText = params.sx.toFixed(1);
    document.getElementById('valSy').innerText = params.sy.toFixed(1);
    document.getElementById('valSz').innerText = params.sz.toFixed(1);
    document.getElementById('valRx').innerText = params.rx + '°';
    document.getElementById('valRy').innerText = params.ry + '°';
    document.getElementById('valRz').innerText = params.rz + '°';
    document.getElementById('valShXY').innerText = params.shxy.toFixed(1);
    document.getElementById('valShXZ').innerText = params.shxz.toFixed(1);

    // 3. Limpiar lienzo
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 4. Dibujar ejes cartesianos de guía
    ctx.strokeStyle = COLOR_EJES;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CENTRO_X, 0); ctx.lineTo(CENTRO_X, canvas.height);
    ctx.moveTo(0, CENTRO_Y); ctx.lineTo(canvas.width, CENTRO_Y);
    ctx.stroke();

    // 5. Aplicar transformaciones 3D a la figura activa
    let verticesTransformados = figuraActual.vertices.map(v => transformarVertice3D(v, params));

    // 6. Proyectar a coordenadas 2D
    let vertices2D = verticesTransformados.map(proyectar3Da2D);

    // 7. Renderizar aristas: el grosor varía según la escala promedio (Parte 3)
    let escalaPromedio = (params.sx + params.sy + params.sz) / 3;
    ctx.strokeStyle = COLOR_ARISTAS;
    ctx.lineWidth = 1 + escalaPromedio * 1.5;
    ctx.lineCap = 'round';
    for (let arista of figuraActual.aristas) {
        let p1 = vertices2D[arista[0]];
        let p2 = vertices2D[arista[1]];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }

    // 8. Renderizar vértices
    ctx.fillStyle = COLOR_VERTICES;
    for (let p of vertices2D) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4 + escalaPromedio, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ==============================================================================
// 6. EVENTOS: DESLIZADORES, SELECTOR DE FIGURA Y AUTO-ROTACIÓN (RETO)
// ==============================================================================
document.querySelectorAll('input[type=range]').forEach(input => {
    input.addEventListener('input', renderizar);
});

// Cambiar de figura
document.getElementById('selectorFigura').addEventListener('change', (e) => {
    figuraActual = figuras[e.target.value];
    renderizar();
});

// Auto-rotación sobre el eje Y con requestAnimationFrame
let autoRotando = false;
let anguloAuto = 0;
const botonAuto = document.getElementById('btnAutoRotar');
const sliderRy = document.getElementById('ry');

function animarRotacion() {
    if (!autoRotando) return;

    anguloAuto += 1; // grados por fotograma
    if (anguloAuto > 180) anguloAuto = -180;

    sliderRy.value = Math.round(anguloAuto); // el deslizador sigue la animación
    renderizar();

    requestAnimationFrame(animarRotacion);
}

botonAuto.addEventListener('click', () => {
    autoRotando = !autoRotando;
    botonAuto.textContent = autoRotando ? 'Detener auto-rotación' : 'Auto-rotar (eje Y)';
    if (autoRotando) {
        anguloAuto = parseFloat(sliderRy.value);
        requestAnimationFrame(animarRotacion);
    }
});

// Ejecución inicial
renderizar();
