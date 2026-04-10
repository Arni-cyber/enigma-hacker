// --- CONFIG SUPABASE ---
const URL_PROJETO = 'https://tdunwbeicckdjvlujxjp.supabase.co';
const CHAVE_ANONIMA = 'sb_publishable_hFwT4D2L_PZN8SxF_a4EDg_aYZKPN1l';
const supabaseClient = supabase.createClient(URL_PROJETO, CHAVE_ANONIMA);

// --- ESTADO ---
let enigmasNaoVistos = [];
let enigmaAtual = null;
let pontos = 0;
let combo = 0;
let rankingAnterior = [];

const normalizar = (txt) =>
    txt.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// --- LOGIN COM CARREGAMENTO DE PERFIL ---
async function fazerLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-senha').value;

    const { data: authData, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);

    const user = authData.user;
    document.getElementById('display-user').innerText = email.split('@')[0];

    // Animação de entrada
    document.getElementById('login-screen').style.opacity = "0";
    setTimeout(() => document.getElementById('login-screen').style.display = "none", 400);

    // CARREGAR DADOS DA TABELA PERFIS
    const { data: perfil, error: perfilError } = await supabaseClient
        .from('perfis')
        .select('pontos')
        .eq('id', user.id)
        .single();

    if (perfil) {
        pontos = perfil.pontos || 0;
        document.getElementById('display-pontos').innerText = pontos;
        adicionarLog("Perfil de operador sincronizado.", "cyan");
    }

    carregarEnigma();
    iniciarRealtimeRanking();
}
    if (perfil && perfil.status === "eliminado") {
    alert("ACESSO NEGADO: Este terminal foi permanentemente bloqueado por falha crítica (Pontuação insuficiente).");
    location.reload();
    return;
}

// --- VERIFICAR E SALVAR PONTOS NO PERFIL ---
async function verificar() {
    const campo = document.getElementById('resposta-input');
    const resposta = campo.value;
    if (!resposta) return;

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (normalizar(resposta) === normalizar(enigmaAtual.resposta_correta)) {
        combo++;
        pontos += 5 * combo;
        adicionarLog("✔ Acesso concedido.", "lime");
    } else {
        combo = 0;
        pontos -= 10;
        adicionarLog("✖ Falha na sintaxe.", "red");
    }

    // ATUALIZAR INTERFACE
    document.getElementById('display-pontos').innerText = pontos;
    document.getElementById('display-combo').innerText = `x${combo}`;
    campo.value = "";

    // ATUALIZAR BANCO (Tabela perfis)
    if (user) {
        await supabaseClient
            .from('perfis')
            .update({ pontos: pontos })
            .eq('id', user.id);
    }

    if (pontos <= -50) {
        alert("SISTEMA BLOQUEADO.");
        location.reload();
    } else {
        carregarEnigma();
    }
}

// --- CADASTRO ---
async function fazerCadastro() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-senha').value;

    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Cadastro efetuado! Verifique seu e-mail.");
}

// --- ENIGMAS ---
async function carregarEnigma() {
    const texto = document.getElementById('texto-enigma');

    try {
        texto.innerText = "> Carregando...";

        if (enigmasNaoVistos.length === 0) {
            const { data } = await supabaseClient.from('enigmas').select('*');
            enigmasNaoVistos = [...data].sort(() => Math.random() - 0.5);
        }

        enigmaAtual = enigmasNaoVistos.pop();

        texto.innerHTML = `> <b>TAREFA:</b> ${enigmaAtual.pergunta}`;
    } catch {
        texto.innerText = "> ERRO";
    }
}

// --- VERIFICAR ---
async function verificar() {
    const campo = document.getElementById('resposta-input');
    const resposta = campo.value;

    if (!resposta) return;

    const username = document.getElementById('display-user').innerText;

    let erro = false;

    if (normalizar(resposta) === normalizar(enigmaAtual.resposta_correta)) {
        combo++;
        pontos += 5 * combo;
        adicionarLog("✔ Acerto!", "lime");
    } else {
        combo = 0;
        pontos -= 10;
        erro = true;
        adicionarLog("✖ Erro!", "red");
    }

    document.getElementById('display-pontos').innerText = pontos;
    document.getElementById('display-combo').innerText = `x${combo}`;

    campo.value = "";

    await atualizarRanking(username, pontos, combo, erro);

    if (pontos <= -50) {
        alerta("💀 ELIMINADO", "red");
        location.reload();
    } else {
        carregarEnigma();
    }
  
}

// --- RANKING UPDATE ---
async function atualizarRanking(username, pontos, combo, erro = false) {
    const { data } = await supabaseClient
        .from('ranking')
        .select('*')
        .eq('username', username)
        .maybeSingle();

    if (data) {
        await supabaseClient
            .from('ranking')
            .update({
                pontos,
                sequencia_acertos: erro ? 0 : combo,
                sequencia_erros: erro ? data.sequencia_erros + 1 : 0,
                status: pontos <= -50 ? "eliminado" : "ativo",
                ultima_atividade: new Date()
            })
            .eq('username', username);
    } else {
        await supabaseClient
            .from('ranking')
            .insert([{
                username,
                pontos,
                sequencia_acertos: combo,
                sequencia_erros: 0,
                status: "ativo",
                ultima_atividade: new Date()
            }]);
    }
}

// --- CARREGAR RANKING ---
async function atualizarTudoRanking() {
    const { data } = await supabaseClient
        .from('ranking')
        .select('*')
        .order('pontos', { ascending: false })
        .limit(10);

    renderRanking(data);
    verificarMudancasRanking(data);
}

// --- REALTIME ---
function iniciarRealtimeRanking() {
    supabaseClient
        .channel('ranking-realtime')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'ranking'
        }, async () => {
            const { data } = await supabaseClient
                .from('ranking')
                .select('*')
                .order('pontos', { ascending: false })
                .limit(10);

            renderRanking(data);
            verificarMudancasRanking(data);
        })
        .subscribe();
}

// --- RENDER ---
function renderRanking(lista) {
    const container = document.getElementById('ranking-list');
    container.innerHTML = "";

    lista.forEach((user, index) => {
        let cor = "white";
        if (index === 0) cor = "gold";
        else if (index < 3) cor = "lime";
        else if (user.status === "eliminado") cor = "red";

        const div = document.createElement('div');
        div.innerHTML = `
            <span style="color:${cor}">#${index + 1}</span>
            <span>${user.username}</span>
            <span>${user.pontos}</span>
        `;
        container.appendChild(div);
    });
}

// --- ALERTAS ---
function verificarMudancasRanking(novo) {
    const username = document.getElementById('display-user').innerText;

    const antiga = rankingAnterior.findIndex(u => u.username === username);
    const nova = novo.findIndex(u => u.username === username);

    if (nova === 0 && antiga > 0) alerta("🔥 LÍDER!", "gold");
    if (antiga - nova >= 2) alerta("⚡ SUBIU RÁPIDO!", "cyan");
    if (nova <= 2 && nova !== -1) alerta("🏆 TOP 3!", "lime");
    if (nova >= novo.length - 2) alerta("⚠️ RISCO!", "red");

    rankingAnterior = novo;
}

function alerta(msg, cor) {
    const box = document.getElementById('alert-box');

    box.innerText = msg;
    box.style.color = cor;
    box.style.opacity = "1";
    box.style.transform = "scale(1.1)";

    setTimeout(() => {
        box.style.opacity = "0";
        box.style.transform = "scale(1)";
    }, 3000);
}

// --- LOG ---
function adicionarLog(msg, cor) {
    const feed = document.getElementById('log-feed');
    const p = document.createElement('p');

    p.style.color = cor;
    p.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;

    feed.prepend(p);

    if (feed.children.length > 20) {
        feed.removeChild(feed.lastChild);
    }
}

// ENTER
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('resposta-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') verificar();
    });
});

adicionarLog("Sistema iniciado...", "cyan");
