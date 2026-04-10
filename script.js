// --- CONFIG SUPABASE ---
const URL_PROJETO = 'https://tdunwbeicckdjvlujxjp.supabase.co';
const CHAVE_ANONIMA = 'sb_publishable_hFwT4D2L_PZN8SxF_a4EDg_aYZKPN1l';
const supabaseClient = supabase.createClient(URL_PROJETO, CHAVE_ANONIMA);

// --- ESTADO ---
let enigmasNaoVistos = [];
let enigmaAtual = null;
let pontos = 0;
let combo = 0;

// --- UTIL ---
const normalizar = (txt) => 
    txt.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// --- LOGIN ---
async function fazerLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-senha').value;

    const { data: { user }, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return alert("Erro: " + error.message);

    // Checagem de segurança: usuário eliminado
    const { data: perfil } = await supabaseClient.from('ranking').select('*').eq('username', email.split('@')[0]).maybeSingle();
    if (perfil && perfil.status === "eliminado") {
        alert("TERMINAL BLOQUEADO: Acesso permanentemente negado.");
        location.reload();
        return;
    }

    document.getElementById('display-user').innerText = email.split('@')[0];
    document.getElementById('login-screen').style.display = "none";
    
    if (perfil) {
        pontos = perfil.pontos;
        document.getElementById('display-pontos').innerText = pontos;
    }

    adicionarLog("Sistema pronto. Operador: " + email.split('@')[0], "cyan");
    carregarEnigma();
    iniciarRealtimeRanking();
}

// --- VERIFICAR (COM TRAVA DE ELIMINAÇÃO) ---
async function verificar() {
    const campo = document.getElementById('resposta-input');
    const resposta = campo.value;
    if (!resposta) return;

    const username = document.getElementById('display-user').innerText;

    // Lógica de pontos
    if (normalizar(resposta) === normalizar(enigmaAtual.resposta_correta)) {
        combo++;
        pontos += 5 * combo;
        adicionarLog("✔ Acesso concedido.", "lime");
    } else {
        combo = 0;
        pontos -= 10;
        adicionarLog("✖ Falha crítica.", "red");
    }

    // Trava de eliminação
    if (pontos <= -50) {
        await atualizarRanking(username, pontos, combo, true, "eliminado");
        alert("💀 ELIMINADO: Pontuação crítica atingida.");
        location.reload();
        return; // Interrompe a execução
    }

    document.getElementById('display-pontos').innerText = pontos;
    document.getElementById('display-combo').innerText = `x${combo}`;
    campo.value = "";

    await atualizarRanking(username, pontos, combo, false, "ativo");
    carregarEnigma();
}

// --- BANCO DE DADOS (RANKING) ---
async function atualizarRanking(username, pontos, combo, isErro, status) {
    const { data } = await supabaseClient.from('ranking').select('*').eq('username', username).maybeSingle();

    if (data) {
        await supabaseClient.from('ranking').update({
            pontos,
            sequencia_acertos: isErro ? 0 : combo,
            status: status,
            ultima_atividade: new Date()
        }).eq('username', username);
    } else {
        await supabaseClient.from('ranking').insert([{
            username, pontos, sequencia_acertos: combo, status: "ativo"
        }]);
    }
}

// --- ENIGMAS ---
async function carregarEnigma() {
    try {
        if (enigmasNaoVistos.length === 0) {
            const { data } = await supabaseClient.from('enigmas').select('*');
            enigmasNaoVistos = [...data].sort(() => Math.random() - 0.5);
        }
        enigmaAtual = enigmasNaoVistos.pop();
        document.getElementById('texto-enigma').innerHTML = `> <b>TAREFA:</b> ${enigmaAtual.pergunta}`;
    } catch {
        document.getElementById('texto-enigma').innerText = "> Erro ao carregar tarefa.";
    }
}

// --- LOG & UI ---
function adicionarLog(msg, cor) {
    const feed = document.getElementById('log-feed');
    const p = document.createElement('p');
    p.style.color = cor;
    p.innerText = `[${new Date().toLocaleTimeString()
