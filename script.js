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
