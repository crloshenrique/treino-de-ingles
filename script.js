/**
 * Versão: Git 25
 */

const SUPABASE_URL = 'https://byhuejznipdjwoicbmsh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aHVlanpuaXBkandvaWNibXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTUwOTcsImV4cCI6MjA4Mzg5MTA5N30.shEmFonuHGqOpHOnqRmXFh_EmfaUKhU8do57xZ7SK1E';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// SELETORES DE MENUS
const menuBoasVindas = document.getElementById("menu-boas-vindas");
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
const tituloCategoriasDicionario = document.getElementById("titulo-categorias-dicionario");
const btnVoltarRaizDicionario = document.getElementById("btn-voltar-raiz-dicionario");
const menuPerfil = document.getElementById("menu-perfil");

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
    // Verificação de Sessão Real
    const { data: { session } } = await _supabase.auth.getSession();
    
    if (session) {
        // Se já estiver logado, garante o nome antes de mostrar o dashboard
        await carregarNomeUsuario(session.user.id);
        mostrarDashboard();
    } else {
        document.getElementById("tela-login").style.display = "flex";
        document.getElementById("app-content").style.display = "none";
    }

    await carregarCategoriasDoBanco();
    gerarMenuDicionariosVisualizacao();
    gerarMenuTemas();
    
    // Lógica com animação de saída suave
    const userNameSpan = document.getElementById("user-name");
    const welcomeWrapper = document.getElementById("welcome-wrapper");

    userNameSpan.addEventListener('animationend', (event) => {
        if (event.animationName === 'typing') {
            // Adiciona a classe de fade out no container de texto
            welcomeWrapper.classList.add("fade-out");
            
            // Aguarda o fim do fade (500ms) para trocar o menu
            setTimeout(() => {
                irParaHub();
                // Remove a classe para estar pronto para a próxima vez
                welcomeWrapper.classList.remove("fade-out");
            }, 500);
        }
    });

    // Test line: Sempre add essa linha de teste no Git 25
    console.log("Sistema de treino carregado com Git 25");
};

// --- BUSCA NOME COMPLETO DO BANCO ---
async function carregarNomeUsuario(userId) {
    try {
        const { data, error } = await _supabase
            .from('usuarios') 
            .select('nome')
            .eq('id', userId)
            .single();

        if (!error && data) {
            document.getElementById("user-name").textContent = data.nome;
        } else {
            const { data: { user } } = await _supabase.auth.getUser();
            document.getElementById("user-name").textContent = user.email.split('@')[0];
        }
    } catch (e) {
        console.error("Erro ao buscar nome:", e);
        document.getElementById("user-name").textContent = "User";
    }
}

// --- LOGICA DE LOGIN REAL COM FEEDBACK ---
function exibirFeedbackLogin(mensagem, tipo) {
    let feedbackArea = document.getElementById("feedback-login");
    if (!feedbackArea) {
        feedbackArea = document.createElement("div");
        feedbackArea.id = "feedback-login";
        const loginBox = document.querySelector(".login-box");
        loginBox.insertBefore(feedbackArea, loginBox.firstChild);
    }

    feedbackArea.textContent = mensagem;
    feedbackArea.style.display = "block";
    feedbackArea.style.padding = "12px";
    feedbackArea.style.marginBottom = "15px";
    feedbackArea.style.borderRadius = "10px";
    feedbackArea.style.fontSize = "14px";
    feedbackArea.style.fontWeight = "bold";
    feedbackArea.style.textAlign = "center";

    if (tipo === "sucesso") {
        feedbackArea.style.background = "rgba(90, 187, 106, 0.2)";
        feedbackArea.style.border = "1px solid #5abb6a";
        feedbackArea.style.color = "#5abb6a";
    } else {
        feedbackArea.style.background = "rgba(241, 71, 56, 0.2)";
        feedbackArea.style.border = "1px solid #f14738";
        feedbackArea.style.color = "#f14738";
    }
}

async function efetuarLoginReal() {
    const email = document.getElementById("login-email").value;
    const senha = document.getElementById("login-senha").value;
    const btnLogin = document.getElementById("btn-login-confirm");

    if (!email || !senha) {
        exibirFeedbackLogin("Preencha todos os campos!", "erro");
        return;
    }

    btnLogin.disabled = true;
    btnLogin.textContent = "Autenticando...";

    const { data, error } = await _supabase.auth.signInWithPassword({
        email: email,
        password: senha,
    });

    if (error) {
        exibirFeedbackLogin("Erro: " + error.message, "erro");
        btnLogin.disabled = false;
        btnLogin.textContent = "Entrar";
    } else {
        exibirFeedbackLogin("Login efetuado! Buscando perfil...", "sucesso");
        
        await carregarNomeUsuario(data.user.id);
        
        exibirFeedbackLogin("Pronto! Entrando...", "sucesso");
        
        setTimeout(() => {
            mostrarDashboard();
            btnLogin.disabled = false;
            btnLogin.textContent = "Entrar";
        }, 800);
    }
}

function mostrarDashboard() {
    document.getElementById("tela-login").style.display = "none";
    document.getElementById("app-content").style.display = "flex";
    iniciarBoasVindas();
}

function iniciarBoasVindas() {
    esconderTodosMenus();
    const welcomeWrapper = document.getElementById("welcome-wrapper");
    welcomeWrapper.classList.remove("fade-out"); // Garante que esteja visível
    menuBoasVindas.style.display = "flex";
    
    const userNameSpan = document.getElementById("user-name");
    userNameSpan.style.animation = 'none';
    userNameSpan.offsetHeight; 
    userNameSpan.style.animation = null; 
}

async function logout() {
    await _supabase.auth.signOut();
    location.reload();
}

function togglePasswordVisibility() {
    const passInput = document.getElementById("login-senha");
    const addon = document.querySelector(".input-addon");
    
    if (passInput.type === "password") {
        passInput.type = "text";
        addon.classList.add("active");
    } else {
        passInput.type = "password";
        addon.classList.remove("active");
    }
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
    const menus = [menuBoasVindas, menuHub, menuDicionariosRaiz, menuGerenciarDicionarios, areaAdicionarDicionario, 
                   menuTemas, menuPrincipal, menuNiveis, menuIntervalos, visualizacaoPalavras, menuPerfil];
    menus.forEach(m => { if(m) m.style.display = "none"; });
    container.classList.remove("modo-largo");
    interromperJogo();
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

function irParaPerfil() {
    esconderTodosMenus();
    
    menuPerfil.innerHTML = `
        <h2>Meu Perfil</h2>
        <div style="background: #2a2a2a; padding: 20px; border-radius: 15px; border-left: 4px solid var(--accent-color); width: 100%; margin-bottom: 20px;">
            <p style="margin: 0; opacity: 0.7;">Sessão Ativa</p>
            <p id="perfil-email" style="font-weight: bold; margin: 5px 0 0 0;">Carregando...</p>
        </div>
        <button onclick="logout()" class="btn-custom-lateral border-red" style="width: 100%;">Sair da Conta</button>
        <div class="btn-voltar-icone" onclick="irParaHub()">
            <img src="imagens/voltar.png" alt="Voltar">
            <span>Voltar</span>
        </div>
    `;
    
    menuPerfil.style.display = "flex";
    
    _supabase.auth.getUser().then(({data}) => {
        if(data?.user) document.getElementById("perfil-email").textContent = data.user.email;
    });
}

function abrirSubMenuDicionarios() { 
    esconderTodosMenus(); 
    menuGerenciarDicionarios.style.display = "flex"; 
    visualizacaoPalavras.style.display = "none"; 
    listaDicionariosVisualizar.style.display = "grid"; 
    if (tituloCategoriasDicionario) tituloCategoriasDicionario.style.display = "block";
    if (btnVoltarRaizDicionario) btnVoltarRaizDicionario.style.display = "flex";
}

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
    if (btnVoltarRaizDicionario) btnVoltarRaizDicionario.style.display = "flex";
    
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
    const lines = text.split('\n');
    const objetosParaEnviar = [];
    lines.forEach(linha => {
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