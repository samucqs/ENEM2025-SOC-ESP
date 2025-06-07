// Variáveis globais para controlar o estado do quiz
let allQuestions = {}; // Armazena todas as questões carregadas, separadas por matéria
let filteredQuestions = []; // Questões filtradas para o quiz atual
let currentQuestionIndex = 0;
let userAnswers = []; // Armazena as respostas do usuário [ { questionId, userAnswer, isCorrect } ]
let quizStarted = false;
let currentStudentName = '';
let currentStudentGrade = '';
let currentQuizMateria = '';
let currentQuizNivel = '';


// Elementos do DOM
const materiaSelect = document.getElementById('materia-select');
const nivelSelect = document.getElementById('nivel-select');
// Botão "Iniciar Simulado" da tela de seleção (ID corrigido no HTML)
const startSelectionButton = document.getElementById('start-selection-button');

const questionSelection = document.getElementById('question-selection'); // Seção da página inicial
const quizIntroSection = document.getElementById('quiz-intro');         // Seção "Boa Sorte!"
const startQuizFinalButton = document.getElementById('start-quiz-button'); // Botão "Começar" da tela de intro

const quizSection = document.getElementById('quiz-section'); // Seção do quiz (questões)
const questionText = document.getElementById('question-text');
const alternativesContainer = document.getElementById('alternatives-container');
const previousButton = document.getElementById('previous-button');
const nextButton = document.getElementById('next-button');
const questionCounter = document.getElementById('question-counter');
const currentMateriaDisplay = document.getElementById('current-materia');
const feedbackDiv = document.getElementById('feedback'); // Div para feedback de resposta

const quizSummary = document.getElementById('quiz-summary'); // Seção de resumo final
const totalQuestionsDisplay = document.getElementById('total-questions-display');
const correctAnswersDisplay = document.getElementById('correct-answers-display');
const wrongAnswersDisplay = document.getElementById('wrong-answers-display');
const accuracyRateDisplay = document.getElementById('accuracy-rate-display');
const restartQuizButton = document.getElementById('restart-quiz-button');

// Elementos para nome e série
const studentNameInput = document.getElementById('student-name');
const studentGradeSelect = document.getElementById('student-grade');
const studentNameDisplay = document.getElementById('student-name-display'); // Para exibir o nome na intro
const summaryStudentName = document.getElementById('summary-student-name');
const summaryStudentGrade = document.getElementById('summary-student-grade');
const summaryMateria = document.getElementById('summary-materia');
const summaryNivel = document.getElementById('summary-nivel');


// Mapeamento dos níveis de dificuldade para o JSON (1-5)
const nivelMapping = {
    'facil': [1],
    'medio': [2, 3],
    'dificil': [4, 5]
};


// --- Funções de Carregamento e Inicialização ---

// Função para carregar as questões do arquivo JSON
async function loadQuestions() {
    try {
        const [responseEspanhol, responseSociologia] = await Promise.all([
            fetch('data/espanhol.json'),
            fetch('data/sociologia.json')
        ]);

        const questoesEspanhol = await responseEspanhol.json();
        const questoesSociologia = await responseSociologia.json();

        allQuestions = {
            'Espanhol': questoesEspanhol,
            'Sociologia': questoesSociologia
        };
        console.log('Questões carregadas:', allQuestions);
        // Habilita os inputs e selects após carregar
        studentNameInput.disabled = false;
        studentGradeSelect.disabled = false;
        materiaSelect.disabled = false;
        nivelSelect.disabled = false;
        startSelectionButton.disabled = false; // Habilita o botão 'Iniciar Simulado'
    } catch (error) {
        console.error('Erro ao carregar questões:', error);
        alert('Não foi possível carregar as questões. Verifique os arquivos JSON e o caminho.');
        // Desabilita tudo se houver erro
        studentNameInput.disabled = true;
        studentGradeSelect.disabled = true;
        materiaSelect.disabled = true;
        nivelSelect.disabled = true;
        startSelectionButton.disabled = true;
    }
}

// Inicializa o quiz: carrega as questões
document.addEventListener('DOMContentLoaded', loadQuestions);

// --- Funções do Quiz ---

// Event listener para o botão 'Iniciar Simulado' da tela de seleção
startSelectionButton.addEventListener('click', () => {
    currentStudentName = studentNameInput.value.trim();
    currentStudentGrade = studentGradeSelect.value;
    currentQuizMateria = materiaSelect.value;
    currentQuizNivel = nivelSelect.value;

    if (!currentStudentName || !currentStudentGrade || !currentQuizMateria) {
        alert('Por favor, preencha seu nome, selecione sua série e a matéria para iniciar o simulado.');
        return;
    }

    let rawQuestions = allQuestions[currentQuizMateria];
    if (!rawQuestions) {
        alert('Matéria não encontrada.');
        return;
    }

    let tempFilteredQuestions = [];
    if (currentQuizNivel === "") {
        tempFilteredQuestions = [...rawQuestions];
    } else {
        const niveisPermitidos = nivelMapping[currentQuizNivel];
        tempFilteredQuestions = rawQuestions.filter(q => niveisPermitidos.includes(q.nivel));
    }

    if (tempFilteredQuestions.length === 0) {
        alert('Não há questões para a matéria e nível selecionados. Tente outra combinação.');
        return;
    }

    // Se as validações passarem, prepara para a tela de introdução
    questionSelection.classList.add('hidden'); // Esconde a tela de seleção inicial
    quizIntroSection.classList.remove('hidden'); // Mostra a nova tela de introdução
    studentNameDisplay.textContent = currentStudentName; // Exibe o nome do estudante

    // Armazena as questões filtradas globalmente para o quiz real
    filteredQuestions = tempFilteredQuestions;
    shuffleArray(filteredQuestions); // Já embaralha aqui

    // Preenche as respostas do usuário com placeholders para todas as questões
    userAnswers = []; // Limpa quaisquer respostas anteriores
    for (let i = 0; i < filteredQuestions.length; i++) {
        userAnswers.push({
            questionId: filteredQuestions[i].id,
            userAnswer: null,
            isCorrect: null
        });
    }

    // Não inicia o quiz aqui, apenas exibe a tela de introdução
});

// Event listener para o botão 'Começar' da tela de introdução
startQuizFinalButton.addEventListener('click', () => {
    quizIntroSection.classList.add('hidden'); // Esconde a tela de introdução
    quizSection.classList.remove('hidden');   // Mostra a seção do quiz

    // Reinicia o estado do quiz (se necessário, mas já feito no clique anterior)
    currentQuestionIndex = 0;
    quizStarted = true; // Define que o quiz realmente começou

    // Atualiza o título da matéria e mostra a primeira questão
    currentMateriaDisplay.textContent = currentQuizMateria;
    displayQuestion(); // Carrega a primeira questão
});


// Exibe a questão atual
function displayQuestion() {
    if (filteredQuestions.length === 0) {
        console.error("Não há questões para exibir.");
        return;
    }

    const question = filteredQuestions[currentQuestionIndex];
    questionText.textContent = question.pergunta;
    alternativesContainer.innerHTML = '';
    feedbackDiv.classList.add('hidden'); // Esconde feedback anterior
    feedbackDiv.className = 'hidden'; // Limpa classes de feedback (importante para remover 'correct' ou 'wrong')


    question.alternativas.forEach((alt, index) => {
        const div = document.createElement('div');
        div.classList.add('alternative-item');
        div.textContent = String.fromCharCode(65 + index) + ') ' + alt; // A) B) C) D) E)
        div.dataset.alternative = alt; // Armazena a alternativa

        // Verifica se esta alternativa foi a que o usuário selecionou anteriormente
        const userStoredAnswer = userAnswers[currentQuestionIndex].userAnswer;
        if (userStoredAnswer === alt) {
            div.classList.add('selected');
        }

        // Se a resposta já foi marcada (no modo de revisão), mostra a correção e desabilita cliques
        if (userAnswers[currentQuestionIndex].isCorrect !== null) {
            if (alt === question.respostaCorreta) {
                div.classList.add('correct'); // Aplica classe verde e maior para a correta
            } else if (alt === userStoredAnswer && userStoredAnswer !== question.respostaCorreta) {
                div.classList.add('wrong'); // Aplica classe vermelha para a errada escolhida
            }
            div.style.pointerEvents = 'none'; // Desabilita cliques se já respondida
            // Se já respondida e correta/errada, também re-exibe o feedback
            feedbackDiv.classList.remove('hidden');
            feedbackDiv.textContent = userAnswers[currentQuestionIndex].isCorrect ? "Correto!" : `Incorreto. A resposta correta é: ${question.respostaCorreta}.`;
            feedbackDiv.className = userAnswers[currentQuestionIndex].isCorrect ? 'feedback correct' : 'feedback wrong';

        } else {
            // Habilita cliques se a questão ainda não foi respondida
            div.addEventListener('click', () => selectAlternative(alt, div));
        }

        alternativesContainer.appendChild(div);
    });

    updateNavigationButtons();
    updateQuestionCounter();
}

// Lida com a seleção de uma alternativa
function selectAlternative(selectedAlt, clickedDiv) {
    // Só permite selecionar se a questão ainda não foi avaliada
    if (userAnswers[currentQuestionIndex].isCorrect === null) {
        // Remove 'selected' de todas as alternativas
        document.querySelectorAll('.alternative-item').forEach(div => {
            div.classList.remove('selected');
        });

        // Adiciona 'selected' à alternativa clicada
        clickedDiv.classList.add('selected');

        // Armazena a resposta do usuário temporariamente
        userAnswers[currentQuestionIndex].userAnswer = selectedAlt;

        // Avalia a resposta imediatamente após a seleção
        evaluateCurrentQuestion();

        // Habilita o botão "Próxima" assim que uma alternativa é selecionada e avaliada
        updateNavigationButtons();
    }
}

// Atualiza o contador de questões e os botões de navegação
function updateQuestionCounter() {
    questionCounter.textContent = `Questão ${currentQuestionIndex + 1} de ${filteredQuestions.length}`;
}

function updateNavigationButtons() {
    previousButton.disabled = currentQuestionIndex === 0;

    // A lógica do botão 'Próxima' depende se a questão atual foi respondida
    const hasUserSelectedAnswer = userAnswers[currentQuestionIndex].userAnswer !== null;
    const hasQuestionBeenEvaluated = userAnswers[currentQuestionIndex].isCorrect !== null;

    if (currentQuestionIndex === filteredQuestions.length - 1) {
        nextButton.textContent = 'Finalizar Simulado';
        // O botão Finalizar fica habilitado se uma resposta foi selecionada OU se já foi avaliada
        nextButton.disabled = !(hasUserSelectedAnswer || hasQuestionBeenEvaluated);
    } else {
        nextButton.textContent = 'Próxima';
        // O botão Próxima só fica habilitado se uma resposta foi selecionada OU se já foi avaliada
        nextButton.disabled = !(hasUserSelectedAnswer || hasQuestionBeenEvaluated);
    }
}

// Event listener para o botão 'Próxima' (que também pode ser 'Finalizar Simulado')
nextButton.addEventListener('click', () => {
    // Antes de avançar/finalizar, garanta que a questão atual foi avaliada
    if (userAnswers[currentQuestionIndex].isCorrect === null) {
        evaluateCurrentQuestion();
    }

    if (currentQuestionIndex === filteredQuestions.length - 1) {
        // Se for a última questão e o botão é 'Finalizar Simulado'
        finishQuiz();
    } else {
        // Se não for a última, avança para a próxima
        goToNextQuestion();
    }
});


function goToNextQuestion() {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestion(); // Exibe a próxima questão
    } else {
        // Se de alguma forma chegar aqui na última questão sem ter chamado finishQuiz
        finishQuiz();
    }
}

// Navega para a questão anterior
previousButton.addEventListener('click', goToPreviousQuestion);
function goToPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        // Esconde feedback ao voltar
        feedbackDiv.classList.add('hidden');
        feedbackDiv.className = 'hidden'; // Limpa classes de feedback

        currentQuestionIndex--;
        displayQuestion();
    }
}

// Avalia a resposta da questão atual
function evaluateCurrentQuestion() {
    const currentQuestion = filteredQuestions[currentQuestionIndex];
    const userAnswer = userAnswers[currentQuestionIndex].userAnswer;

    if (userAnswer === null) {
        feedbackDiv.textContent = "Por favor, selecione uma alternativa antes de continuar.";
        feedbackDiv.className = 'feedback wrong';
        feedbackDiv.classList.remove('hidden');
        return; // Não avalia se não houver resposta selecionada
    }

    const isCorrect = (userAnswer === currentQuestion.respostaCorreta);
    userAnswers[currentQuestionIndex].isCorrect = isCorrect;

    // Aplica classes de cor nas alternativas e desabilita cliques
    document.querySelectorAll('.alternative-item').forEach(div => {
        const altText = div.dataset.alternative;
        if (altText === currentQuestion.respostaCorreta) {
            div.classList.add('correct'); // A correta sempre fica verde e maior
        } else if (altText === userAnswer && !isCorrect) {
            div.classList.add('wrong'); // A errada escolhida fica vermelha
        }
        div.classList.remove('selected'); // Remove o estado 'selected' para mostrar a cor final
        div.style.pointerEvents = 'none'; // Desabilita cliques após a avaliação
    });

    if (isCorrect) {
        feedbackDiv.textContent = "Correto!";
        feedbackDiv.className = 'feedback correct';
    } else {
        feedbackDiv.textContent = `Incorreto. A resposta correta é: ${currentQuestion.respostaCorreta}.`;
        feedbackDiv.className = 'feedback wrong';
    }
    feedbackDiv.classList.remove('hidden');

    updateNavigationButtons(); // Re-avalia o estado do botão "Próxima"
}


// Finaliza o quiz e mostra o resultado
function finishQuiz() {
    // Garante que a última questão seja avaliada se ainda não foi
    if (userAnswers[currentQuestionIndex].isCorrect === null) {
        evaluateCurrentQuestion();
    }

    // Calcula os resultados FINAIS após a avaliação da última questão
    let correctCount = 0;
    let answeredCount = 0; // Contar apenas as que foram realmente respondidas
    userAnswers.forEach(answer => {
        if (answer.userAnswer !== null) { // Considera respondida se uma alternativa foi selecionada
            answeredCount++;
            if (answer.isCorrect) {
                correctCount++;
            }
        }
    });

    const totalQuestionsInQuiz = filteredQuestions.length; // Total de questões no quiz filtrado
    const wrongCount = answeredCount - correctCount; // Erros baseados nas respondidas
    const accuracyRate = answeredCount > 0 ? ((correctCount / answeredCount) * 100).toFixed(2) + '%' : '0.00%';

    // Atualiza o resumo
    summaryStudentName.textContent = currentStudentName;
    summaryStudentGrade.textContent = currentStudentGrade === 'outro' ? 'Outro' : `${currentStudentGrade}º Ano Ensino Médio`;
    summaryMateria.textContent = currentQuizMateria;
    summaryNivel.textContent = currentQuizNivel === '' ? 'Todos' : currentQuizNivel.charAt(0).toUpperCase() + currentQuizNivel.slice(1);
    totalQuestionsDisplay.textContent = answeredCount; // Mostra quantas foram *respondidas*
    correctAnswersDisplay.textContent = correctCount;
    wrongAnswersDisplay.textContent = wrongCount;
    accuracyRateDisplay.textContent = accuracyRate;

    // Exibe o resumo e oculta as outras seções
    quizSection.classList.add('hidden');
    quizIntroSection.classList.add('hidden'); // Garante que a introdução está escondida
    questionSelection.classList.add('hidden'); // Garante que a seleção está escondida
    quizSummary.classList.remove('hidden');

    // Apenas para garantir que os botões de navegação não fiquem visíveis no resumo
    nextButton.disabled = true;
    previousButton.disabled = true;
}


// Reinicia o quiz completamente
restartQuizButton.addEventListener('click', () => {
    quizStarted = false;
    currentQuestionIndex = 0;
    userAnswers = [];
    filteredQuestions = [];
    currentStudentName = '';
    currentStudentGrade = '';
    currentQuizMateria = '';
    currentQuizNivel = '';

    quizSummary.classList.add('hidden');
    quizSection.classList.add('hidden');
    quizIntroSection.classList.add('hidden'); // Garante que a introdução também está escondida

    questionSelection.classList.remove('hidden'); // Mostra a seção de seleção de novo

    // Reseta os inputs e selects para o estado inicial
    studentNameInput.value = "";
    studentGradeSelect.value = "";
    materiaSelect.value = "";
    nivelSelect.value = "";
    feedbackDiv.classList.add('hidden');
    feedbackDiv.className = 'hidden';

    // Garante que os botões de controle estejam na ordem inicial
    nextButton.textContent = 'Próxima';
    nextButton.disabled = true;
    previousButton.disabled = true;
});

// Função para embaralhar um array (Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}