const SUPABASE_URL = 'https://byhuejznipdjwoicbmsh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aHVlanpuaXBkandvaWNibXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTUwOTcsImV4cCI6MjA4Mzg5MTA5N30.shEmFonuHGqOpHOnqRmXFh_EmfaUKhU8do57xZ7SK1E';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// SELETORES
const menuUsuarios = document.getElementById("menu-usuarios");
const menuHub = document.getElementById("menu-hub");
const menuDicionariosRaiz = document.getElementById("menu-dicionarios-raiz");
const menuGerenciarDicionarios = document.getElementById("menu-gerenciar-dicionarios");
const areaAdicionarDicionario = document.getElementById("area-adicionar-dicionario");
const menuTemas = document.getElementById("menu-temas");
const menuPrincipal = document.getElementById("menu-principal");
const menuNiveis = document.getElementById("menu-niveis");
const menuIntervalos = document.getElementById("menu-intervalos");
const visualizacaoPalavras = document.getElementById("visualizacao-palavras");
const listaDicionariosVisualizar = document.getElementById("lista-dicionarios-visualizar");
const areaListaPalavras = document.getElementById("area-lista-palavras");
const listaTemasBotoes = document.getElementById("lista-temas-botoes");
const container = document.getElementById("container");

menuUsuarios.insertAdjacentHTML('beforeend', '<p style="color:#999; font-size:0.8rem; margin-top:20px;">Version 0.89</p>');

let categoriasDisponiveis = [];
let vocabulario = [];
let palavrasParaOJogo = [];
let acertos = 0, erros = 0;

window.onload = async () => {
    await carregarCategoriasDoBanco();
    gerarMenuDicionariosVisualizacao();
    gerarMenuTemas();
};

// --- NAVEGAÇÃO ---
function irParaDicionariosRaiz() { menuHub.style.display = "none"; menuDicionariosRaiz.style.display = "flex"; }
function abrirSubMenuDicionarios() { menuDicionariosRaiz.style.display = "none"; menuGerenciarDicionarios.style.display = "flex"; visualizacaoPalavras.style.display = "none"; listaDicionariosVisualizar.style.display = "flex"; }
function abrirFormularioAdicionar() { menuDicionariosRaiz.style.display = "none"; areaAdicionarDicionario.style.display = "flex"; }
function voltarRaizParaHub() { menuDicionariosRaiz.style.display = "none"; menuHub.style.display = "flex"; }
function voltarParaDicionariosRaiz() { menuGerenciarDicionarios.style.display = "none"; areaAdicionarDicionario.style.display = "none"; visualizacaoPalavras.style.display = "none"; container.classList.remove("modo-largo"); menuDicionariosRaiz.style.display = "flex"; }

// --- CONTROLE DE FORMULÁRIO ---
function mostrarFormIndividual() { document.getElementById("form-individual").style.display = "block"; document.getElementById("form-massa").style.display = "none"; }
function mostrarFormMassa() { document.getElementById("form-individual").style.display = "none"; document.getElementById("form-massa").style.display = "block"; }

// --- FUNÇÕES DE BANCO ---
async function carregarCategoriasDoBanco() {
    const { data, error } = await _supabase.from('dicionarios').select('categoria');
    if (!error && data) { categoriasDisponiveis = [...new Set(data.map(item => item.categoria))]; }
}

function gerarMenuDicionariosVisualizacao() {
    listaDicionariosVisualizar.innerHTML = "";
    const btnTodos = document.createElement("button");
    btnTodos.textContent = "Todos"; btnTodos.className = "btn-azul";
    btnTodos.onclick = () => carregarEExibirVarios('todos');
    listaDicionariosVisualizar.appendChild(btnTodos);
    categoriasDisponiveis.forEach(cat => {
        const btn = document.createElement("button");
        btn.textContent = cat; btn.className = "btn-azul";
        btn.onclick = () => carregarEExibirVarios(cat);
        listaDicionariosVisualizar.appendChild(btn);
    });
}

async function carregarEExibirVarios(cat) {
    listaDicionariosVisualizar.style.display = "none";
    visualizacaoPalavras.style.display = "block";
    areaListaPalavras.innerHTML = "Carregando...";
    container.classList.add("modo-largo");
    let query = _supabase.from('dicionarios').select('*');
    if (cat !== 'todos') query = query.eq('categoria', cat);
    const { data } = await query.order('palavra', { ascending: true });
    areaListaPalavras.innerHTML = "";
    data.forEach(item => {
        const div = document.createElement("div");
        div.className = "item-dicionario";
        div.innerHTML = `<span>${item.palavra}</span><span>${item.pronuncia}</span><span>${item.significado}</span>`;
        areaListaPalavras.appendChild(div);
    });
}

// --- SALVAMENTO (INDIVIDUAL E MASSA) ---
async function salvarNoBancoLocal() {
    const palavra = document.getElementById("add-palavra").value.trim();
    const pronuncia = document.getElementById("add-pronuncia").value.trim();
    const significado = document.getElementById("add-significado").value.trim();
    const categoria = document.getElementById("add-categoria").value.trim();

    if (!palavra || !significado || !categoria) { alert("Preencha os campos!"); return; }
    const { error } = await _supabase.from('dicionarios').insert([{ palavra, pronuncia, significado, categoria }]);
    if (error) alert("Erro: " + error.message);
    else { alert("Cadastrada!"); location.reload(); }
}

async function salvarEmMassa() {
    const categoria = document.getElementById("add-categoria-massa").value.trim();
    const texto = document.getElementById("texto-massa").value.trim();
    if (!categoria || !texto) { alert("Preencha categoria e texto!"); return; }

    const linhas = texto.split('\n');
    const objetosParaEnviar = [];
    linhas.forEach(linha => {
        if (linha.includes('=') && linha.includes('(')) {
            const partes = linha.split('=');
            const significado = partes[1].trim();
            const antesDoIgual = partes[0].trim();
            const palavra = antesDoIgual.split('(')[0].trim();
            const pronuncia = "(" + antesDoIgual.split('(')[1].split(')')[0].trim() + ")";
            objetosParaEnviar.push({ palavra, pronuncia, significado, categoria });
        }
    });

    if (objetosParaEnviar.length === 0) { alert("Formato inválido!"); return; }
    const { error } = await _supabase.from('dicionarios').insert(objetosParaEnviar);
    if (error) alert("Erro: " + error.message);
    else { alert(`${objetosParaEnviar.length} palavras cadastradas!`); location.reload(); }
}

// --- LÓGICA DO JOGO ---
function selecionarUsuario(n) { menuUsuarios.style.display = "none"; menuHub.style.display = "flex"; }
function irParaTemas() { menuHub.style.display = "none"; menuTemas.style.display = "flex"; }
function voltarParaHub() { menuTemas.style.display = "none"; menuHub.style.display = "flex"; }
function abrirMenuNiveis() { menuPrincipal.style.display = "none"; menuNiveis.style.display = "flex"; }
function abrirMenuIntervalos() { menuPrincipal.style.display = "none"; menuIntervalos.style.display = "flex"; }
function voltarAoMenuPraticar() { menuNiveis.style.display = "none"; menuIntervalos.style.display = "none"; menuPrincipal.style.display = "flex"; }
function voltarParaDicionarios() { menuPrincipal.style.display = "none"; menuTemas.style.display = "flex"; }

function gerarMenuTemas() {
    listaTemasBotoes.innerHTML = "";
    categoriasDisponiveis.forEach(cat => {
        const btn = document.createElement("button");
        btn.textContent = cat; btn.className = "btn-azul";
        btn.onclick = () => carregarVocabulario(cat);
        listaTemasBotoes.appendChild(btn);
    });
}

async function carregarVocabulario(cat) {
    document.getElementById("status-load").style.display = "block";
    const { data } = await _supabase.from('dicionarios').select('*').eq('categoria', cat);
    vocabulario = data.map(item => ({ exibir: `${item.palavra} ${item.pronuncia}`, correta: item.significado.split("/")[0].trim() }));
    menuTemas.style.display = "none"; menuPrincipal.style.display = "flex";
    document.getElementById("status-load").style.display = "none";
}

function iniciarNivel(q) { palavrasParaOJogo = vocabulario.slice(0, q); iniciarJogo(); }
function iniciarIntervalo(i, f) { palavrasParaOJogo = vocabulario.slice(i, f); iniciarJogo(); }

function iniciarJogo() {
    menuNiveis.style.display = "none"; menuIntervalos.style.display = "none";
    document.getElementById("palavra-box").style.display = "flex"; 
    document.getElementById("opcoes-container").style.display = "flex"; 
    document.getElementById("contador-container").style.display = "flex";
    palavrasParaOJogo.sort(() => Math.random() - 0.5);
    proximaRodada();
}

function proximaRodada() {
    if (palavrasParaOJogo.length === 0) { finalizarTeste(); return; }
    let atual = palavrasParaOJogo.shift();
    const box = document.getElementById("palavra-box");
    const containerOpcoes = document.getElementById("opcoes-container");
    box.textContent = atual.exibir;
    containerOpcoes.innerHTML = "";
    let opcoes = [atual.correta];
    while (opcoes.length < 4) {
        let sorteio = vocabulario[Math.floor(Math.random() * vocabulario.length)].correta;
        if (!opcoes.includes(sorteio)) opcoes.push(sorteio);
    }
    opcoes.sort(() => Math.random() - 0.5).forEach(op => {
        const btn = document.createElement("button");
        btn.className = "opcao-btn"; btn.textContent = op;
        btn.onclick = () => {
            if (op === atual.correta) { acertos++; document.getElementById("acertos-box").textContent = acertos; }
            else { erros++; document.getElementById("erros-box").textContent = erros; }
            setTimeout(proximaRodada, 1000);
        };
        containerOpcoes.appendChild(btn);
    });
}

function finalizarTeste() {
    document.getElementById("palavra-box").textContent = "Fim!";
    document.getElementById("opcoes-container").style.display = "none";
    document.getElementById("btn-reiniciar").style.display = "block";
}

function filtrarPalavras() {
    const termo = document.getElementById("campo-busca").value.toLowerCase();
    document.querySelectorAll(".item-dicionario").forEach(item => {
        const txt = item.innerText.toLowerCase();
        item.style.display = txt.includes(termo) ? "grid" : "none";
    });
}