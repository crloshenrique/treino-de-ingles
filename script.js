const SUPABASE_URL = 'https://byhuejznipdjwoicbmsh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aHVlanpuaXBkandvaWNibXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTUwOTcsImV4cCI6MjA4Mzg5MTA5N30.shEmFonuHGqOpHOnqRmXFh_EmfaUKhU8do57xZ7SK1E';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// SELETORES
const menuUsuarios = document.getElementById("menu-usuarios");
const menuHub = document.getElementById("menu-hub");
const menuDicionariosRaiz = document.getElementById("menu-dicionarios-raiz");
const menuGerenciarDicionarios = document.getElementById("menu-gerenciar-dicionarios");
const areaAdicionarDicionario = document.getElementById("area-adicionar-dicionario");
const selecaoTipoAdicao = document.getElementById("selecao-tipo-adicao");
const formIndividual = document.getElementById("form-individual");
const formMassa = document.getElementById("form-massa");
const container = document.getElementById("container");

menuUsuarios.insertAdjacentHTML('beforeend', '<p style="color:#999; font-size:0.8rem; margin-top:20px;">Version 0.93</p>');

let categoriasDisponiveis = [];
let vocabulario = [];
let palavrasParaOJogo = [];
let acertos = 0, erros = 0;

window.onload = async () => { await atualizarTudo(); };

async function atualizarTudo() {
    await carregarCategoriasDoBanco();
    gerarMenuDicionariosVisualizacao();
    gerarMenuTemas();
}

// --- NAVEGAÇÃO AJUSTADA ---
function abrirEscolhaTipoAdicao() {
    menuDicionariosRaiz.style.display = "none";
    areaAdicionarDicionario.style.display = "flex";
    selecaoTipoAdicao.style.display = "flex"; // Mostra os quadrados 1 e N
    formIndividual.style.display = "none";
    formMassa.style.display = "none";
}

function mostrarFormIndividual() {
    selecaoTipoAdicao.style.display = "none";
    formIndividual.style.display = "block";
}

function mostrarFormMassa() {
    selecaoTipoAdicao.style.display = "none";
    formMassa.style.display = "block";
}

function voltarParaDicionariosRaiz() {
    areaAdicionarDicionario.style.display = "none";
    menuGerenciarDicionarios.style.display = "none";
    container.classList.remove("modo-largo");
    menuDicionariosRaiz.style.display = "flex";
}

// --- RESTANTE DAS FUNÇÕES (Mantidas do 0.92) ---
function selecionarUsuario(n) { menuUsuarios.style.display = "none"; menuHub.style.display = "flex"; }
function irParaTemas() { menuHub.style.display = "none"; document.getElementById("menu-temas").style.display = "flex"; }
function voltarRaizParaHub() { menuDicionariosRaiz.style.display = "none"; menuHub.style.display = "flex"; }
function abrirSubMenuDicionarios() { menuDicionariosRaiz.style.display = "none"; menuGerenciarDicionarios.style.display = "flex"; document.getElementById("visualizacao-palavras").style.display = "none"; document.getElementById("lista-dicionarios-visualizar").style.display = "flex"; }

async function carregarCategoriasDoBanco() {
    const { data, error } = await _supabase.from('dicionarios').select('categoria');
    if (!error && data) { categoriasDisponiveis = [...new Set(data.map(item => item.categoria))]; }
}

async function salvarNoBancoLocal() {
    const palavra = document.getElementById("add-palavra").value.trim();
    const pronuncia = document.getElementById("add-pronuncia").value.trim();
    const significado = document.getElementById("add-significado").value.trim();
    const categoria = document.getElementById("add-categoria").value.trim();
    if (!palavra || !significado || !categoria) { alert("Preencha os campos!"); return; }
    const { error } = await _supabase.from('dicionarios').insert([{ palavra, pronuncia, significado, categoria }]);
    if (error) alert("Erro: " + error.message);
    else { 
        alert("Cadastrada!"); 
        document.getElementById("add-palavra").value = "";
        document.getElementById("add-pronuncia").value = "";
        document.getElementById("add-significado").value = "";
        await atualizarTudo(); 
        voltarParaDicionariosRaiz();
    }
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
    const { error } = await _supabase.from('dicionarios').insert(objetosParaEnviar);
    if (error) alert("Erro!");
    else { alert("Sucesso!"); document.getElementById("texto-massa").value = ""; await atualizarTudo(); voltarParaDicionariosRaiz(); }
}

// (Funções de jogo e filtro permanecem as mesmas das versões anteriores)
function gerarMenuDicionariosVisualizacao() {
    const lista = document.getElementById("lista-dicionarios-visualizar");
    lista.innerHTML = "";
    const btnTodos = document.createElement("button");
    btnTodos.textContent = "Todos"; btnTodos.className = "btn-azul";
    btnTodos.onclick = () => carregarEExibirVarios('todos');
    lista.appendChild(btnTodos);
    categoriasDisponiveis.forEach(cat => {
        const btn = document.createElement("button");
        btn.textContent = cat; btn.className = "btn-azul";
        btn.onclick = () => carregarEExibirVarios(cat);
        lista.appendChild(btn);
    });
}

async function carregarEExibirVarios(cat) {
    document.getElementById("lista-dicionarios-visualizar").style.display = "none";
    document.getElementById("visualizacao-palavras").style.display = "block";
    container.classList.add("modo-largo");
    let query = _supabase.from('dicionarios').select('*');
    if (cat !== 'todos') query = query.eq('categoria', cat);
    const { data } = await query.order('palavra', { ascending: true });
    const area = document.getElementById("area-lista-palavras");
    area.innerHTML = "";
    data.forEach(item => {
        const div = document.createElement("div");
        div.className = "item-dicionario";
        div.innerHTML = `<span>${item.palavra}</span><span>${item.pronuncia}</span><span>${item.significado}</span>`;
        area.appendChild(div);
    });
}

function filtrarPalavras() {
    const termo = document.getElementById("campo-busca").value.toLowerCase();
    document.querySelectorAll(".item-dicionario").forEach(item => {
        item.style.display = item.innerText.toLowerCase().includes(termo) ? "grid" : "none";
    });
}

function gerarMenuTemas() {
    const lista = document.getElementById("lista-temas-botoes");
    lista.innerHTML = "";
    categoriasDisponiveis.forEach(cat => {
        const btn = document.createElement("button");
        btn.textContent = cat; btn.className = "btn-azul";
        btn.onclick = () => carregarVocabulario(cat);
        lista.appendChild(btn);
    });
}

async function carregarVocabulario(cat) {
    const { data } = await _supabase.from('dicionarios').select('*').eq('categoria', cat);
    vocabulario = data.map(item => ({ exibir: `${item.palavra} ${item.pronuncia}`, correta: item.significado.split("/")[0].trim() }));
    document.getElementById("menu-temas").style.display = "none";
    document.getElementById("menu-principal").style.display = "flex";
}
// ... (restante das funções de iniciarJogo, proximaRodada, etc permanecem iguais)