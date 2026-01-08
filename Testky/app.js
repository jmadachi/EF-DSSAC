// Tomar valores desde CONFIG (definido en config.js)
const NUM_PREGUNTAS = CONFIG.numPreguntasExamen || 10;
const NOMBRE_ASIGNATURA = CONFIG.asignatura || "";

// Preguntas cargadas desde preguntas.js
let todasLasPreguntas = PREGUNTAS_JSON;
let preguntasSeleccionadas = [];
let currentQuestion = 0;
let userAnswers = {};

// Referencias al DOM
const questionsDiv      = document.getElementById('questions');
const prevBtn           = document.getElementById('prev-btn');
const nextBtn           = document.getElementById('next-btn');
const submitBtn         = document.getElementById('submit-btn');
const resultsDiv        = document.getElementById('results');
const quizContainer     = document.getElementById('quiz-container');
const scoreDiv          = document.getElementById('score');
const resultsDetailDiv  = document.getElementById('results-detail');
const resetBtn          = document.getElementById('reset-btn');
const nombreAsigSpan    = document.getElementById('nombre-asignatura');

/* ---------- Utilidades ---------- */

// Mezclar array (Fisher–Yates)
function mezclarArray(array) {
    const copia = array.slice();
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

// Seleccionar y limitar preguntas
function inicializarPreguntas() {
    const mezcladas = mezclarArray(todasLasPreguntas);
    const limite = Math.min(NUM_PREGUNTAS, mezcladas.length);
    preguntasSeleccionadas = mezcladas.slice(0, limite);
}

/* ---------- Lógica del quiz ---------- */

function displayQuestion(index) {
    const q = preguntasSeleccionadas[index];

    questionsDiv.innerHTML = `
        <div class="question">
            <h3>${q.id} - ${q.examen}</h3>
            <p><strong>${q.pregunta}</strong></p>
            <div class="options">
                ${q.opciones.map(opt =>
                    `<div class="option" data-id="${opt.id}">${opt.id}. ${opt.texto}</div>`
                ).join('')}
            </div>
            ${userAnswers[q.id] ? `<p><em>Tu respuesta anterior: ${userAnswers[q.id]}</em></p>` : ''}
        </div>
    `;

    const optionDivs = document.querySelectorAll('.option');
    optionDivs.forEach(opt => {
        opt.addEventListener('click', () => {
            const optionId = opt.getAttribute('data-id');
            selectOption(optionId);
        });
    });

    if (userAnswers[q.id]) {
        selectOption(userAnswers[q.id], true);
    }
}

function selectOption(optionId, restore = false) {
    const q = preguntasSeleccionadas[currentQuestion];
    const optionDivs = document.querySelectorAll('.option');

    optionDivs.forEach(opt => {
        opt.classList.remove('selected');
        if (opt.getAttribute('data-id') === optionId) {
            opt.classList.add('selected');
        }
    });

    if (!restore) {
        userAnswers[q.id] = optionId;
        updateNavigation();
    }
}

function changeQuestion(direction) {
    const newIndex = currentQuestion + direction;
    if (newIndex >= 0 && newIndex < preguntasSeleccionadas.length) {
        currentQuestion = newIndex;
        displayQuestion(currentQuestion);
        updateNavigation();
    }
}

function updateNavigation() {
    prevBtn.disabled = currentQuestion === 0;

    const currentQ = preguntasSeleccionadas[currentQuestion];
    const hasAnswer = !!userAnswers[currentQ.id];

    if (currentQuestion === preguntasSeleccionadas.length - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = hasAnswer ? 'inline-block' : 'none';
    } else {
        nextBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
    }
}

function submitQuiz() {
    if (Object.keys(userAnswers).length !== preguntasSeleccionadas.length) {
        alert('Por favor responde todas las preguntas antes de finalizar.');
        return;
    }
    showResults();
}

function showResults() {
    quizContainer.style.display = 'none';
    resultsDiv.style.display = 'block';

    let correct = 0;
    let html = '';

    preguntasSeleccionadas.forEach(q => {
        const userAnswer = userAnswers[q.id];
        const isCorrect = userAnswer === q.correcta;
        if (isCorrect) correct++;

        html += `
            <div class="question">
                <h4>${q.id}: ${isCorrect ? '✅ Correcta' : '❌ Incorrecta'}</h4>
                <p><strong>${q.pregunta}</strong></p>
                <p>
                    <strong>Tu respuesta:</strong> ${userAnswer} ${isCorrect ? '(Correcta)' : '(Incorrecta)'}<br>
                    <strong>Respuesta correcta:</strong> ${q.correcta}
                </p>
                <div class="explanation">
                    <strong>Justificación:</strong> ${q.justificacion}</strong>
                </div>
                ${q.porqueNo ? `
                    <div class="explanation" style="border-left-color:#ff9800;">
                        <strong>¿Por qué las otras opciones no?:</strong> ${q.porqueNo}
                    </div>` : ''}
            </div>
        `;
    });

    const porcentaje = Math.round(correct / preguntasSeleccionadas.length * 100);
    scoreDiv.textContent =
        `Puntuación: ${correct}/${preguntasSeleccionadas.length} (${porcentaje}%)`;
    resultsDetailDiv.innerHTML = html;

    // Guardar intento en localStorage
    const intento = {
        fecha: new Date().toISOString(),
        asignatura: NOMBRE_ASIGNATURA,
        examen: preguntasSeleccionadas[0]?.examen || 'Examen',
        preguntas: preguntasSeleccionadas.map(q => q.id),
        respuestas: userAnswers,
        correctas: correct,
        total: preguntasSeleccionadas.length,
        porcentaje: porcentaje
    };

    const clave = 'historialEvaluaciones';
    const historialStr = localStorage.getItem(clave);
    const historial = historialStr ? JSON.parse(historialStr) : [];
    historial.push(intento);
    localStorage.setItem(clave, JSON.stringify(historial));
}

function resetQuiz() {
    currentQuestion = 0;
    userAnswers = {};
    quizContainer.style.display = 'block';
    resultsDiv.style.display = 'none';
    inicializarPreguntas();
    displayQuestion(currentQuestion);
    updateNavigation();
}

/* ---------- Eventos y arranque ---------- */

prevBtn.addEventListener('click', () => changeQuestion(-1));
nextBtn.addEventListener('click', () => changeQuestion(1));
submitBtn.addEventListener('click', submitQuiz);
resetBtn.addEventListener('click', resetQuiz);

// Mostrar nombre de la asignatura
if (nombreAsigSpan && NOMBRE_ASIGNATURA) {
    nombreAsigSpan.textContent = NOMBRE_ASIGNATURA;
}

// Inicializar examen
inicializarPreguntas();
displayQuestion(currentQuestion);
updateNavigation();
