/**
 * Versão: Git 25
 */

const SUPABASE_URL = 'https://byhuejznipdjwoicbmsh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aHVlanpuaXBkandvaWNibXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTUwOTcsImV4cCI6MjA4Mzg5MTA5N30.shEmFonuHGqOpHOnqRmXFh_EmfaUKhU8do57xZ7SK1E';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// SELETORES DE MENUS
const menuHub = document.getElementById("menu-hub");
const menuPerfil = document.getElementById("menu-perfil");
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
const tituloCategoriasDicionario = document.getElementById("titulo-categorias-dicionario");
const btnVoltarRaizDicionario = document.getElementById("btn-voltar-raiz-dicionario");

// ESTADOS DE AUTH
let usuarioLogado = null;
let modoCadastro = false;

let categoriasDisponiveis = [];
let vocabulario = [];
let palavrasParaOJogo = [];
let acertos = 0, erros = 0;
let historicoSessao = []; 
let ultimoMenuAberto = "";
let dadosDicionarioAtual = []; 

// --- FUNÇÃO DE FORMATAÇÃO CENTRALIZADA ---
function formatarItem(palavraRaw, pronunciaRaw, significadoRaw) {
    const palavra = palavraRaw.charAt(0).toUpperCase() + palavraRaw.slice(1).toLowerCase();
    let pronuncia = pronunciaRaw.toLowerCase().replace(/\(|\)/g, "");
    const significados = significadoRaw.split(/[/,;=]/).map(s => s.trim().toLowerCase()).join(', ');
    return { palavra, pronuncia, significados };
}

window.onload = async () => {
    await verificarSessao();
    await carregarCategoriasDoBanco();
    gerarMenuDicionariosVisualizacao();
    gerarMenuTemas();
    irParaHub(); 
    // Test line: Sempre add essa linha de teste no Git 25
    console.log("Sistema de treino carregado com Git 25");
};

// --- LOGICA DE AUTENTICAÇÃO ---

function exibirFeedback(mensagem, tipo) {
    const box = document.getElementById("auth-feedback");
    box.textContent = mensagem;
    box.style.display = "block";
    box.className = tipo === "erro" ? "feedback-erro" : "feedback-sucesso";
}

function limparFeedback() {
    const box = document.getElementById("auth-feedback");
    box.style.display = "none";
}

async function verificarSessao() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) {
        usuarioLogado = session.user;
        document.getElementById("label-perfil").textContent = "Perfil";
        carregarDadosPerfil();
    } else {
        usuarioLogado = null;
        document.getElementById("label-perfil").textContent = "Login";
    }
}

async function carregarDadosPerfil() {
    if (!usuarioLogado) return;
    
    const { data, error } = await _supabase
        .from('profiles')
        .select('*')
        .eq('id', usuarioLogado.id)
        .single();

    if (data) {
        document.getElementById("perfil-nome").textContent = data.username || "Usuário";
        document.getElementById("perfil-email").textContent = data.email;
        document.getElementById("perfil-xp").textContent = data.xp || 0;
        
        document.getElementById("sessao-deslogado").style.display = "none";
        document.getElementById("sessao-logado").style.display = "block";
    }
}

function alternarModoAuth() {
    modoCadastro = !modoCadastro;
    const titulo = document.getElementById("titulo-auth");
    const btnMain = document.getElementById("btn-login-main");
    const btnSwitch = document.getElementById("btn-cadastro-switch");
    const inputUser = document.getElementById("auth-username");
    limparFeedback();

    if (modoCadastro) {
        titulo.textContent = "Criar Nova Conta";
        btnMain.textContent = "Cadastrar";
        btnMain.onclick = fazerCadastro;
        btnSwitch.textContent = "Já tem conta? Entre aqui";
        inputUser.style.display = "block";
    } else {
        titulo.textContent = "Entrar na Conta";
        btnMain.textContent = "Entrar";
        btnMain.onclick = fazerLogin;
        btnSwitch.textContent = "Não tem conta? Cadastre-se";
        inputUser.style.display = "none";
    }
}

async function fazerCadastro() {
    const email = document.getElementById("auth-email").value.trim();
    const senha = document.getElementById("auth-senha").value.trim();
    const username = document.getElementById("auth-username").value.trim();

    if (!email || !senha || !username) { 
        exibirFeedback("Preencha todos os campos!", "erro"); 
        return; 
    }

    if (senha.length < 6) {
        exibirFeedback("A senha deve ter no mínimo 6 caracteres.", "erro");
        return;
    }

    const { data, error } = await _supabase.auth.signUp({ email, password: senha });

    if (error) {
        exibirFeedback(error.message, "erro");
    } else {
        const { error: profileError } = await _supabase
            .from('profiles')
            .insert([{ id: data.user.id, email: email, username: username, xp: 0 }]);
        
        exibirFeedback("Conta criada! Verifique seu e-mail para confirmar.", "sucesso");
    }
}

async function fazerLogin() {
    const email = document.getElementById("auth-email").value.trim();
    const senha = document.getElementById("auth-senha").value.trim();

    if (!email || !senha) { 
        exibirFeedback("Preencha e-mail e senha!", "erro"); 
        return; 
    }

    const { data, error } = await _supabase.auth.signInWithPassword({ email, password: senha });

    if (error) {
        if (error.message.includes("Email not confirmed")) {
            exibirFeedback("Por favor, confirme seu e-mail antes de entrar.", "erro");
        } else {
            exibirFeedback("E-mail ou senha incorretos.", "erro");
        }
    } else {
        usuarioLogado = data.user;
        location.reload(); 
    }
}

async function fazerLogout() {
    await _supabase.auth.signOut();
    location.reload();
}

// --- CONTROLE DO MENU LATERAL ---
function toggleMenu() {
    document.body.classList.toggle("menu-aberto");
}

function handleMenuClick() {
    if (window.innerWidth <= 768) {
        document.body.classList.remove("menu-aberto");
    }
}

// --- NAVEGAÇÃO ---
function esconderTodosMenus() {
    const menus = [menuHub, menuPerfil, menuDicionariosRaiz, menuGerenciarDicionarios, areaAdicionarDicionario, 
                   menuTemas, menuPrincipal, menuNiveis, menuIntervalos, visualizacaoPalavras];
    menus.forEach(m => { if(m) m.style.display = "none"; });
    container.classList.remove("modo-largo");
    interromperJogo();
    limparFeedback(); // Limpa as mensagens ao navegar para qualquer lugar
}

function interromperJogo() {
    document.getElementById("palavra-box").style.display = "none"; 
    document.getElementById("opcoes-container").style.display = "none"; 
    document.getElementById("contador-container").style.display = "none";
    document.getElementById("btn-voltar-final").style.display = "none";
    document.getElementById("revisao-teste").style.display = "none"; 
}

function irParaHub() { esconderTodosMenus(); menuHub.style.display = "flex"; }
function irParaTemas() { esconderTodosMenus(); menuTemas.style.display = "flex"; }
function irParaDicionariosRaiz() { esconderTodosMenus(); menuDicionariosRaiz.style.display = "flex"; }
function irParaPerfil() { esconderTodosMenus(); menuPerfil.style.display = "flex"; }

function abrirSubMenuDicionarios() { 
    esconderTodosMenus(); 
    menuGerenciarDicionarios.style.display = "flex"; 
    visualizacaoPalavras.style.display = "none"; 
    listaDicionariosVisualizar.style.display = "grid"; 
    if (tituloCategoriasDicionario) tituloCategoriasDicionario.style.display = "block";
    if (btnVoltarRaizDicionario) btnVoltarRaizDicionario.style.display = "flex";
}

// --- LÓGICA DE ADIÇÃO DE PALAVRAS ---
function abrirEscolhaTipoAdicao() { 
    esconderTodosMenus();
    areaAdicionarDicionario.style.display = "flex"; 
    document.getElementById("selecao-tipo-adicao").style.display = "flex";
    document.getElementById("form-individual").style.display = "none";
    document.getElementById("form-massa").style.display = "none";
    document.getElementById("titulo-adicao").textContent = "Adicionar dicionário";
}

function mostrarFormIndividual() { 
    document.getElementById("selecao-tipo-adicao").style.display = "none";
    document.getElementById("form-individual").style.display = "block"; 
    document.getElementById("titulo-adicao").textContent = "Cadastro Individual";
}

function mostrarFormMassa() { 
    document.getElementById("selecao-tipo-adicao").style.display = "none";
    document.getElementById("form-massa").style.display = "block"; 
    document.getElementById("titulo-adicao").textContent = "Cadastro em Massa";
}

function voltarBotaoAdicao() {
    const individualVisivel = document.getElementById("form-individual").style.display === "block";
    const massaVisivel = document.getElementById("form-massa").style.display === "block";

    if (individualVisivel || massaVisivel) {
        abrirEscolhaTipoAdicao();
    } else {
        irParaDicionariosRaiz();
    }
}

function voltarParaDicionariosRaiz() { 
    abrirSubMenuDicionarios();
}

// --- FUNÇÕES DE BANCO ---
async function carregarCategoriasDoBanco() {
    const { data, error } = await _supabase.from('dicionarios').select('categoria, id').order('id', { ascending: true });
    if (!error && data) { 
        const unicas = [];
        data.forEach(item => {
            if (!unicas.includes(item.categoria)) unicas.push(item.categoria);
        });
        categoriasDisponiveis = unicas;
    }
}

function gerarMenuDicionariosVisualizacao() {
    listaDicionariosVisualizar.innerHTML = "";
    
    const btnTodos = document.createElement("div");
    btnTodos.className = "card-dicionario card-todos";
    btnTodos.textContent = "Todos"; 
    btnTodos.onclick = () => carregarEExibirVarios('todos');
    listaDicionariosVisualizar.appendChild(btnTodos);

    categoriasDisponiveis.forEach(cat => {
        const btn = document.createElement("div");
        btn.className = "card-dicionario";
        btn.textContent = cat; 
        btn.onclick = () => carregarEExibirVarios(cat);
        listaDicionariosVisualizar.appendChild(btn);
    });
}

async function carregarEExibirVarios(cat) {
    listaDicionariosVisualizar.style.display = "none";
    if (tituloCategoriasDicionario) tituloCategoriasDicionario.style.display = "none";
    if (btnVoltarRaizDicionario) btnVoltarRaizDicionario.style.display = "none";
    
    visualizacaoPalavras.style.display = "flex";
    areaListaPalavras.innerHTML = "Carregando...";
    container.classList.add("modo-largo");
    
    let query = _supabase.from('dicionarios').select('*');
    if (cat !== 'todos') {
        query = query.eq('categoria', cat);
    }
    
    const { data, error } = await query.order('palavra', { ascending: true });
    
    if (error) {
        areaListaPalavras.innerHTML = "Erro ao carregar dados.";
        return;
    }

    dadosDicionarioAtual = data || [];
    renderizarListaPalavras(dadosDicionarioAtual);
}

function renderizarListaPalavras(lista) {
    areaListaPalavras.innerHTML = "";
    if (lista && lista.length > 0) {
        lista.forEach(item => {
            const f = formatarItem(item.palavra, item.pronuncia, item.significado);
            const div = document.createElement("div");
            div.className = "item-dicionario";
            div.innerHTML = `
                <div class="col-palavra-info">
                    <span>${f.palavra}</span>
                    <span class="pronuncia-pequena">${f.pronuncia}</span>
                </div>
                <span>${f.significados}</span>
            `;
            areaListaPalavras.appendChild(div);
        });
    } else {
        areaListaPalavras.innerHTML = "<div style='padding:20px'>Nenhuma palavra encontrada.</div>";
    }
}

// LÓGICA DE FILTRAGEM
function filtrarPalavras() {
    const termo = document.getElementById("campo-busca").value.toLowerCase().trim();
    
    if (termo === "") {
        renderizarListaPalavras(dadosDicionarioAtual);
        return;
    }

    const filtradas = dadosDicionarioAtual.filter(item => {
        const palavraIngles = item.palavra.toLowerCase();
        const significado = item.significado.toLowerCase();
        const matchIngles = palavraIngles.startsWith(termo);
        const matchSignificado = significado.includes(termo);
        return matchIngles || matchSignificado;
    });

    renderizarListaPalavras(filtradas);
}

// --- SALVAMENTO ---
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
    const text = document.getElementById("texto-massa").value.trim();
    if (!categoria || !text) { alert("Preencha categoria e texto!"); return; }
    const linhas = text.split('\n');
    const objetosParaEnviar = [];
    linhas.forEach(linha => {
        if (linha.includes('=') && linha.includes('(')) {
            const partes = linha.split('=');
            const significado = partes[1].trim();
            const antesDoIgual = partes[0].trim();
            const palavra = antesDoIgual.split('(')[0].trim();
            const pronunciaRaw = antesDoIgual.split('(')[1].split(')')[0].trim();
            objetosParaEnviar.push({ palavra, pronuncia: pronunciaRaw, significado, categoria });
        }
    });
    if (objetosParaEnviar.length === 0) { alert("Formato inválido!"); return; }
    const { error } = await _supabase.from('dicionarios').insert(objetosParaEnviar);
    if (error) alert("Erro: " + error.message);
    else { alert(`${objetosParaEnviar.length} palavras cadastradas!`); location.reload(); }
}

// --- JOGO ---
function gerarMenuTemas() {
    listaTemasBotoes.innerHTML = "";
    categoriasDisponiveis.forEach(cat => {
        const div = document.createElement("div");
        div.className = "card-dicionario";
        div.textContent = cat;
        div.onclick = () => carregarVocabulario(cat);
        listaTemasBotoes.appendChild(div);
    });
}

async function carregarVocabulario(cat) {
    document.getElementById("status-load").style.display = "block";
    const { data } = await _supabase.from('dicionarios').select('*').eq('categoria', cat);
    
    vocabulario = data.map(item => {
        const f = formatarItem(item.palavra, item.pronuncia, item.significado);
        const corretaFormatada = f.significados.split(",")[0].trim();
        const corretaQuiz = corretaFormatada.charAt(0).toUpperCase() + corretaFormatada.slice(1);
        
        return { 
            palavra: f.palavra,
            pronuncia: f.pronuncia,
            correta: corretaQuiz,
            significadosFormatados: f.significados,
            original: item 
        };
    });
    esconderTodosMenus(); menuPrincipal.style.display = "flex";
    document.getElementById("status-load").style.display = "none";
}

function abrirMenuNiveis() { 
    ultimoMenuAberto = "niveis";
    menuPrincipal.style.display = "none"; 
    menuNiveis.style.display = "flex"; 
}
function abrirMenuIntervalos() { 
    ultimoMenuAberto = "intervalos";
    menuPrincipal.style.display = "none"; 
    menuIntervalos.style.display = "flex"; 
}
function voltarAoMenuPraticar() { menuNiveis.style.display = "none"; menuIntervalos.style.display = "none"; menuPrincipal.style.display = "flex"; }

function iniciarNivel(q) { palavrasParaOJogo = vocabulario.slice(0, q); iniciarJogo(); }
function iniciarIntervalo(i, f) { palavrasParaOJogo = vocabulario.slice(i, f); iniciarJogo(); }

function iniciarJogo() {
    menuNiveis.style.display = "none"; menuIntervalos.style.display = "none";
    document.getElementById("palavra-box").style.display = "flex"; 
    document.getElementById("opcoes-container").style.display = "flex"; 
    document.getElementById("contador-container").style.display = "flex";
    document.getElementById("revisao-teste").style.display = "none"; 
    document.getElementById("btn-voltar-final").style.display = "none";
    
    historicoSessao = []; 
    acertos = 0; 
    erros = 0;
    document.getElementById("num-acertos").textContent = "0";
    document.getElementById("num-erros").textContent = "0";
    palavrasParaOJogo.sort(() => Math.random() - 0.5);
    proximaRodada();
}

function proximaRodada() {
    if (palavrasParaOJogo.length === 0) { finalizarTeste(); return; }
    let atual = palavrasParaOJogo.shift();
    const box = document.getElementById("palavra-box");
    const containerOpcoes = document.getElementById("opcoes-container");
    
    box.innerHTML = `
        <span style="display:block">${atual.palavra}</span>
        <span style="font-size: 1.1rem; color: rgba(255,255,255,0.5); font-weight: normal; margin-top: 5px;">${atual.pronuncia}</span>
    `;

    containerOpcoes.innerHTML = "";
    let opcoes = [atual.correta];
    while (opcoes.length < 4) {
        let sorteioRaw = vocabulario[Math.floor(Math.random() * vocabulario.length)].correta;
        if (!opcoes.includes(sorteioRaw)) opcoes.push(sorteioRaw);
    }
    
    opcoes.sort(() => Math.random() - 0.5).forEach(op => {
        const btn = document.createElement("button");
        btn.className = "opcao-btn"; btn.textContent = op;
        btn.onclick = () => {
            const todosBotoes = containerOpcoes.querySelectorAll("button");
            todosBotoes.forEach(b => b.style.pointerEvents = "none");

            let acertou = (op === atual.correta);
            const f = formatarItem(atual.original.palavra, atual.original.pronuncia, atual.original.significado);
            
            historicoSessao.push({
                palavra: f.palavra,
                pronuncia: f.pronuncia,
                significados: f.significados,
                acertou: acertou
            });

            if (acertou) { 
                acertos++; 
                document.getElementById("num-acertos").textContent = acertos;
                btn.classList.add("correto");
            } else { 
                erros++; 
                document.getElementById("num-erros").textContent = erros;
                btn.classList.add("errado");
                Array.from(todosBotoes).find(b => b.textContent === atual.correta).classList.add("correto");
            }
            setTimeout(proximaRodada, 800);
        };
        containerOpcoes.appendChild(btn);
    });
}

function finalizarTeste() {
    document.getElementById("palavra-box").innerHTML = "<span>Fim do Treino!</span>";
    document.getElementById("opcoes-container").style.display = "none";
    document.getElementById("contador-container").style.display = "none";
    
    container.classList.add("modo-largo");
    
    const revisaoContainer = document.getElementById("revisao-teste");
    const listaRevisao = document.getElementById("lista-revisao");
    listaRevisao.innerHTML = ""; 
    
    historicoSessao.forEach(item => {
        const div = document.createElement("div");
        div.className = `item-revisao ${item.acertou ? 'revisao-correto' : 'revisao-errado'}`;
        div.innerHTML = `
            <div class="col-palavra-info">
                <span>${item.palavra}</span>
                <span class="pronuncia-pequena">${item.pronuncia}</span>
            </div>
            <span>${item.significados}</span>
        `;
        listaRevisao.appendChild(div);
    });
    
    revisaoContainer.style.display = "block";
    document.getElementById("btn-voltar-final").style.display = "flex";
}

function voltarDoTeste() {
    interromperJogo();
    if (ultimoMenuAberto === "niveis") {
        menuNiveis.style.display = "flex";
    } else {
        menuIntervalos.style.display = "flex";
    }
}