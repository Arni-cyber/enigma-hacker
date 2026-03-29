// CONFIGURAÇÕES DO SUPABASE 
const SUPABASE_URL = 'https://tdunwbeicckdjvlujxjp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hFwT4D2L_PZN8SxF_a4EDg_aYZKPN1l';
const supabase = supabasejs.createClient(SUPABASE_URL, SUPABASE_KEY);

let pontos = 0;
let combo = 0;
let enigmaAtual = null;

// Lógica de ADS: Dicionário de respostas da IA
const feedbacksErro = [
    "404: Cérebro não encontrado.",
    "Sintaxe errada, vida errada.",
    "Até um script em Batch faria melhor que isso.",
    "Input corrompido. Tente novamente, estagiário."
];

const feedbacksAcerto = [
    "Root access concedido! 🔥",
    "Compilou de primeira! Você é um gênio?",
    "Stack Overflow de inteligência detectado.",
    "Bypass bem sucedido!"
];

// Busca um enigma aleatório no banco de dados
async function proximoEnigma() {
    const { data, error } = await supabase.from('enigmas').select('*');
    if (data && data.length > 0) {
        enigmaAtual = data[Math.floor(Math.random() * data.length)];
        document.getElementById('texto-enigma').innerHTML = `> <b>TAREFA:</b> ${enigmaAtual.pergunta}`;
    } else {
        console.error("Erro ao buscar enigmas:", error);
    }
}

function adicionarLog(msg, cor) {
    const feed = document.getElementById('log-feed');
    const p = document.createElement('p');
    p.style.color = cor;
    p.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
    feed.prepend(p);
}

function verificar() {
    const campo = document.getElementById('resposta-input');
    const respostaUser = campo.value.toLowerCase().trim();

    if (respostaUser === enigmaAtual.resposta_correta.toLowerCase()) {
        combo++;
        let bonus = 5 * combo;
        pontos += bonus;
        adicionarLog(feedbacksAcerto[Math.floor(Math.random() * feedbacksAcerto.length)] + ` (+${bonus})`, "lime");
    } else {
        combo = 0;
        pontos -= 10;
        adicionarLog(feedbacksErro[Math.floor(Math.random() * feedbacksErro.length)] + " (-10)", "red");
    }

    // Atualiza Interface
    document.getElementById('display-pontos').innerText = pontos;
    document.getElementById('display-combo').innerText = `x${combo}`;
    campo.value = "";

    // Lógica de Eliminação
    if (pontos <= -50) {
        alert("KERNEL PANIC! Seu sistema foi formatado por excesso de burrice.");
        location.reload();
    } else {
        proximoEnigma();
    }
}

// Evento de Teclado
document.getElementById('resposta-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') verificar();
});

// Inicialização
proximoEnigma();
adicionarLog("Conexão estabelecida com a Matrix.", "cyan");
