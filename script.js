const SUPABASE_URL = 'https://byhuejznipdjwoicbmsh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aHVlanpuaXBkandvaWNibXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTUwOTcsImV4cCI6MjA4Mzg5MTA5N30.shEmFonuHGqOpHOnqRmXFh_EmfaUKhU8do57xZ7SK1E';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// SELETORES DE MENUS
const menuApagarDicasLista = document.getElementById("menu-apagar-dicas-lista");
const listaDicasApagar = document.getElementById("lista-dicas-apagar");
const menuEditarDicasLista = document.getElementById("menu-editar-dicas-lista");
const listaDicasEditar = document.getElementById("lista-dicas-editar");
const menuEditarDicaCampos = document.getElementById("menu-editar-dica-campos");
const menuDicas = document.getElementById("menu-dicas");
const menuEscolhaDicionarioApagar = document.getElementById("menu-escolha-dicionario-apagar");
const listaDicionariosApagar = document.getElementById("lista-dicionarios-apagar");
const menuListaApagarPalavras = document.getElementById("menu-lista-apagar-palavras");
const corpoListaApagarPalavras = document.getElementById("corpo-lista-apagar-palavras");
const menuApagarRaiz = document.getElementById("menu-apagar-raiz");
const menuConfiguracoes = document.getElementById("menu-configuracoes");
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
const menuMeusErros = document.getElementById("menu-meus-erros");
const listaMeusErros = document.getElementById("lista-meus-erros");

// Novos seletores de Alteração
const menuAlterarPalavras = document.getElementById("menu-alterar-palavras");
const listaAlterarPalavras = document.getElementById("lista-alterar-palavras");
const telaEdicaoCampos = document.getElementById("tela-edicao-campos");

let dadosDicasParaApagar = []; // Global para o filtro
let cardDicionarioEmConfirmacao = null;
let dicaSendoEditada = null; // Armazena o objeto da dica selecionada
let itemEmConfirmacao = null;
let dadosPalavrasParaApagar = []; // Global para armazenar o que veio do banco
let categoriasDisponiveis = [];
let vocabulario = [];
let palavrasParaOJogo = [];
let acertos = 0, erros = 0;
let historicoSessao = []; 
let ultimoMenuAberto = "";
let dadosDicionarioAtual = []; 
let palavraSendoEditada = null; 

// --- FUNÇÃO DE FORMATAÇÃO CENTRALIZADA ---
function formatarItem(palavraRaw, pronunciaRaw, significadoRaw) {
    const palavra = palavraRaw.charAt(0).toUpperCase() + palavraRaw.slice(1).toLowerCase();
    let pronuncia = pronunciaRaw.toLowerCase().replace(/\(|\)/g, "");
    const significados = significadoRaw.split(/[/,;=]/).map(s => s.trim().toLowerCase()).join(', ');
    return { palavra, pronuncia, significados };
}

window.onload = async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    
    if (session) {
        await carregarNomeUsuario(session.user.id);
        mostrarDashboard();
    } else {
        document.getElementById("tela-login").style.display = "flex";
        document.getElementById("app-content").style.display = "none";
    }

    await carregarCategoriasDoBanco();
    gerarMenuDicionariosVisualizacao();
    gerarMenuTemas();
    
    const userNameSpan = document.getElementById("user-name");
    const welcomeWrapper = document.getElementById("welcome-wrapper");

    userNameSpan.addEventListener('animationend', (event) => {
        if (event.animationName === 'typing') {
            welcomeWrapper.classList.add("fade-out");
            setTimeout(() => {
                irParaHub();
                welcomeWrapper.classList.remove("fade-out");
            }, 500);
        }
    });

    const configSalva = localStorage.getItem('config_quiz');
    if (configSalva) {
        const config = JSON.parse(configSalva);
        document.getElementById('check-som').checked = config.som;
        document.getElementById('check-pronuncia').checked = config.pronuncia;
    }
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

// --- LOGICA DE FEEDBACK VISUAL REUTILIZÁVEL ---
function exibirFeedback(idElemento, mensagem, tipo) {
    let feedbackArea = document.getElementById(idElemento);
    if (!feedbackArea) return;

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

function exibirFeedbackLogin(mensagem, tipo) {
    let feedbackArea = document.getElementById("feedback-login");
    if (!feedbackArea) {
        feedbackArea = document.createElement("div");
        feedbackArea.id = "feedback-login";
        const loginBox = document.querySelector(".login-box");
        loginBox.insertBefore(feedbackArea, loginBox.firstChild);
    }
    exibirFeedback("feedback-login", mensagem, tipo);
}

// --- LOGIN REAL COM TRADUÇÃO DE ERROS ---
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
        let msgPtBr = "Ocorreu um erro ao tentar logar.";
        if (error.message === "Invalid login credentials" || error.status === 400) {
            msgPtBr = "E-mail ou senha incorretos!";
        } else if (error.message === "Email not confirmed") {
            msgPtBr = "Por favor, confirme seu e-mail para entrar.";
        } else if (error.status === 429) {
            msgPtBr = "Muitas tentativas! Aguarde um pouco.";
        } else {
            msgPtBr = "Erro: " + error.message;
        }

        exibirFeedbackLogin(msgPtBr, "erro");
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
    welcomeWrapper.classList.remove("fade-out"); 
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
                   menuTemas, menuPrincipal, menuNiveis, menuIntervalos, visualizacaoPalavras, menuPerfil, menuMeusErros,
                   menuAlterarPalavras, telaEdicaoCampos, menuConfiguracoes, menuApagarRaiz, menuListaApagarPalavras, menuEscolhaDicionarioApagar, menuDicas,
                   menuEditarDicasLista, menuEditarDicaCampos, menuApagarDicasLista];
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

function irParaHub() { 
    esconderTodosMenus(); 
    if(document.getElementById('area-selecao-dicionario')) {
        document.getElementById('area-selecao-dicionario').style.display = "block";
    }
    if(tituloCategoriasDicionario) tituloCategoriasDicionario.style.display = "block";
    if(listaDicionariosVisualizar) listaDicionariosVisualizar.style.display = "grid";
    if(visualizacaoPalavras) visualizacaoPalavras.style.display = "none";
    menuHub.style.display = "flex"; 
    carregarPalavraDoDia();
    carregarEstatisticas();
}
function irParaTemas() { esconderTodosMenus(); menuTemas.style.display = "flex"; }
function irParaDicionariosRaiz() { 
    esconderTodosMenus(); 
    menuDicionariosRaiz.style.display = "flex"; 
    menuDicionariosRaiz.style.flexDirection = "column"; // Adicione esta linha
}

function irParaPerfil() {
    esconderTodosMenus();
    menuPerfil.innerHTML = `
        <h2>Meu Perfil</h2>
        <div style="background: #2a2a2a; padding: 20px; border-radius: 15px; border-left: 4px solid var(--accent-color); border-right: 4px solid var(--accent-color); width: 100%; box-sizing: border-box; margin-bottom: 20px;">
            <p style="margin: 0; opacity: 0.7;">Sessão ativa</p>
            <p id="perfil-email" style="font-weight: bold; margin: 5px 0 0 0; word-break: break-all;">Carregando...</p>
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
    if (document.getElementById('area-selecao-dicionario')) {
        document.getElementById('area-selecao-dicionario').style.display = "block";
    }
    menuGerenciarDicionarios.style.display = "flex"; 
    visualizacaoPalavras.style.display = "none"; 
    listaDicionariosVisualizar.style.display = "grid"; 
    if (tituloCategoriasDicionario) tituloCategoriasDicionario.style.display = "block";
    if (btnVoltarRaizDicionario) btnVoltarRaizDicionario.style.display = "flex";
    container.classList.remove("modo-largo");
}

// --- LOGICA PARA ALTERAR PALAVRAS (CORRIGIDO) ---
async function abrirMenuAlterarPalavras() {
    try {
        const { data: { user } } = await _supabase.auth.getUser();
        if (!user) return;

        esconderTodosMenus();
        container.classList.add("modo-largo");
        menuAlterarPalavras.style.display = "flex";
        
        listaAlterarPalavras.innerHTML = "<div style='color: white;'>Carregando suas palavras...</div>";
        
        // Filtra para garantir que ele só veja o que é DELE
        const { data, error } = await _supabase
            .from('dicionarios')
            .select('*')
            .eq('user_id', user.id)
            .order('palavra', { ascending: true });
        
        if (error) throw error;

        dadosDicionarioAtual = data || [];
        renderizarListaAlterar(dadosDicionarioAtual);
    } catch (err) {
        listaAlterarPalavras.innerHTML = "Erro ao carregar dados.";
        console.error(err);
    }
}

function renderizarListaAlterar(lista) {
    listaAlterarPalavras.innerHTML = "";
    if (lista && lista.length > 0) {
        lista.forEach(item => {
            const f = formatarItem(item.palavra, item.pronuncia, item.significado);
            const div = document.createElement("div");
            // Adicionado classe de controle para evitar estouro
            div.className = "item-dicionario item-clicavel";
            div.style.boxSizing = "border-box";
            div.onclick = () => abrirEdicaoPalavra(item);
            div.innerHTML = `
                <div class="col-palavra-info" style="pointer-events: none;">
                    <span>${f.palavra}</span>
                    <span class="pronuncia-pequena">${f.pronuncia}</span>
                </div>
                <span style="pointer-events: none;">${f.significados}</span>
            `;
            listaAlterarPalavras.appendChild(div);
        });
    } else {
        listaAlterarPalavras.innerHTML = "<div style='color: white; opacity: 0.7;'>Nenhuma palavra encontrada.</div>";
    }
}

function filtrarAlterarPalavras() {
    const termo = document.getElementById("busca-alterar").value.toLowerCase().trim();
    if (termo === "") {
        renderizarListaAlterar(dadosDicionarioAtual);
        return;
    }
    const filtradas = dadosDicionarioAtual.filter(item => {
        return item.palavra.toLowerCase().startsWith(termo) || item.significado.toLowerCase().startsWith(termo);
    });
    renderizarListaAlterar(filtradas);
}

function abrirEdicaoPalavra(item) {
    esconderTodosMenus();
    container.classList.remove("modo-largo");
    telaEdicaoCampos.style.display = "flex";
    document.getElementById("feedback-edicao").style.display = "none";
    
    palavraSendoEditada = item; 

    document.getElementById("edit-palavra").value = item.palavra;
    document.getElementById("edit-pronuncia").value = item.pronuncia;
    document.getElementById("edit-significado").value = item.significado;
}

async function processarAlteracaoBanco() {
    const palavra = document.getElementById("edit-palavra").value.trim();
    const pronuncia = document.getElementById("edit-pronuncia").value.trim();
    const significado = document.getElementById("edit-significado").value.trim();
    const btn = document.getElementById("btn-salvar-alteracao");

    if (!palavra || !significado) {
        exibirFeedback("feedback-edicao", "Palavra e Significado são obrigatórios!", "erro");
        return;
    }

    btn.disabled = true;
    btn.textContent = "Alterando...";

    const { error } = await _supabase
        .from('dicionarios')
        .update({ palavra, pronuncia, significado })
        .eq('id', palavraSendoEditada.id);

    if (error) {
        exibirFeedback("feedback-edicao", "Erro ao atualizar: " + error.message, "erro");
        btn.disabled = false;
        btn.textContent = "Alterar";
    } else {
        exibirFeedback("feedback-edicao", "Alterado com sucesso!", "sucesso");
        setTimeout(() => {
            btn.disabled = false;
            btn.textContent = "Alterar";
            abrirMenuAlterarPalavras();
        }, 1200);
    }
}

function abrirEscolhaTipoAdicao() { 
    esconderTodosMenus();
    areaAdicionarDicionario.style.display = "flex"; 
    document.getElementById("selecao-tipo-adicao").style.display = "flex";
    document.getElementById("form-individual").style.display = "none";
    document.getElementById("form-massa").style.display = "none";
    document.getElementById("titulo-adicao").textContent = "Quantas palavras você deseja adicionar?";
    document.getElementById("feedback-adicao").style.display = "none";
}

function mostrarFormIndividual() { 
    document.getElementById("selecao-tipo-adicao").style.display = "none";
    document.getElementById("form-individual").style.display = "block"; 
    document.getElementById("titulo-adicao").textContent = "Cadastro individual";
}

function mostrarFormMassa() { 
    document.getElementById("selecao-tipo-adicao").style.display = "none";
    document.getElementById("form-massa").style.display = "block"; 
    document.getElementById("titulo-adicao").textContent = "Cadastro em massa";
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
    try {
        const { data: { user } } = await _supabase.auth.getUser();
        if (!user) return;

        // Busca apenas as categorias onde o user_id é do utilizador logado
        const { data, error } = await _supabase
            .from('dicionarios')
            .select('categoria')
            .eq('user_id', user.id);

        if (error) throw error;

        if (data) {
            const unicas = [];
            data.forEach(item => {
                if (!unicas.includes(item.categoria)) unicas.push(item.categoria);
            });
            categoriasDisponiveis = unicas;
            gerarMenuTemas(); // Chama a função que desenha os cards na tela
        }
    } catch (err) {
        console.error("Erro ao carregar categorias:", err.message);
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
    try {
        const { data: { user } } = await _supabase.auth.getUser();
        if (!user) return;

        // Ajustes de interface (esconder menus e mostrar lista)
        if(document.getElementById('area-selecao-dicionario')) document.getElementById('area-selecao-dicionario').style.display = "none";
        listaDicionariosVisualizar.style.display = "none";
        if (tituloCategoriasDicionario) tituloCategoriasDicionario.style.display = "none";
        if (btnVoltarRaizDicionario) btnVoltarRaizDicionario.style.display = "flex";
        visualizacaoPalavras.style.display = "flex";
        
        areaListaPalavras.innerHTML = "<div class='loader' style='color: white; padding:20px'>Carregando palavras...</div>";
        container.classList.add("modo-largo");

        // Montagem da Query com filtro de Usuário
        let query = _supabase
            .from('dicionarios')
            .select('*')
            .eq('user_id', user.id); // SEGURANÇA: Apenas dados do utilizador

        if (cat !== 'todos') {
            query = query.eq('categoria', cat);
        }

        const { data, error } = await query.order('palavra', { ascending: true });

        if (error) throw error;

        dadosDicionarioAtual = data || [];
        renderizarListaPalavras(dadosDicionarioAtual); // Desenha a tabela de palavras

    } catch (err) {
        areaListaPalavras.innerHTML = "<span style='color:red'>Erro ao carregar palavras.</span>";
        console.error(err);
    }
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
        areaListaPalavras.innerHTML = "<div style='color: white; opacity: 0.7; padding:20px'>Nenhuma palavra encontrada.</div>";
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
        return palavraIngles.startsWith(termo) || significado.startsWith(termo);
    });
    renderizarListaPalavras(filtradas);
}

async function salvarNoBancoLocal() {
    const palavra = document.getElementById("add-palavra").value.trim();
    const pronuncia = document.getElementById("add-pronuncia").value.trim();
    const significado = document.getElementById("add-significado").value.trim();
    const categoria = document.getElementById("add-categoria").value.trim().toLowerCase();
    const btn = document.getElementById("btn-salvar-individual");

    if (!palavra || !significado || !categoria) {
        exibirFeedback("feedback-adicao", "Preencha os campos obrigatórios!", "erro");
        return;
    }

    btn.disabled = true;

    try {
        const { data: { user } } = await _supabase.auth.getUser();

        // 1. Verificar quantas palavras já existem nesta categoria para este usuário
        const { count, error: countError } = await _supabase
            .from('dicionarios')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('categoria', categoria);

        if (count >= 100) {
            exibirFeedback("feedback-adicao", "Limite atingido! Este dicionário já tem 100 palavras.", "erro");
            btn.disabled = false;
            return;
        }

        // 2. Se for menos de 100, permite salvar
        const { error } = await _supabase.from('dicionarios').insert([{ 
            palavra, pronuncia, significado, categoria, user_id: user.id 
        }]);

        if (error) throw error;

        exibirFeedback("feedback-adicao", "Palavra adicionada!", "sucesso");
        document.getElementById("add-palavra").value = "";
        document.getElementById("add-pronuncia").value = "";
        document.getElementById("add-significado").value = "";
        setTimeout(() => { location.reload(); }, 1500);

    } catch (e) {
        exibirFeedback("feedback-adicao", "Erro ao salvar.", "erro");
        btn.disabled = false;
    }
}

async function salvarEmMassa() {
    const categoria = document.getElementById("add-categoria-massa").value.trim().toLowerCase();
    const text = document.getElementById("texto-massa").value.trim();
    const btn = document.getElementById("btn-salvar-massa");

    if (!categoria || !text) {
        exibirFeedback("feedback-adicao", "Preencha categoria e texto!", "erro");
        return;
    }

    const lines = text.split('\n').filter(l => l.trim() !== "");
    const totalNovas = lines.length;

    if (totalNovas > 100) {
        exibirFeedback("feedback-adicao", "Você não pode enviar mais de 100 palavras de uma vez.", "erro");
        return;
    }

    try {
        const { data: { user } } = await _supabase.auth.getUser();

        // 1. Verificar ocupação atual
        const { count, error: countError } = await _supabase
            .from('dicionarios')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('categoria', categoria);

        // 2. Verificar se a soma ultrapassa 100
        if (count + totalNovas > 100) {
            const sobra = 100 - count;
            exibirFeedback("feedback-adicao", `Limite excedido! Este dicionário já tem ${count} palavras. Você só pode adicionar mais ${sobra}.`, "erro");
            return;
        }

        // 3. Processar e Enviar
        const objetosParaEnviar = [];
        lines.forEach(linha => {
            const match = linha.match(/^([^(]+)\(([^)]+)\)\s*=\s*(.*)$/);
            if (match) {
                objetosParaEnviar.push({ 
                    palavra: match[1].trim(), 
                    pronuncia: match[2].trim(), 
                    significado: match[3].trim(), 
                    categoria, 
                    user_id: user.id 
                });
            }
        });

        if (objetosParaEnviar.length === 0) {
            exibirFeedback("feedback-adicao", "Formato inválido!", "erro");
            return;
        }

        btn.disabled = true;
        const { error } = await _supabase.from('dicionarios').insert(objetosParaEnviar);
        
        if (error) throw error;

        exibirFeedback("feedback-adicao", `${objetosParaEnviar.length} palavras adicionadas!`, "sucesso");
        setTimeout(() => { location.reload(); }, 1500);

    } catch (e) {
        exibirFeedback("feedback-adicao", "Erro no processamento.", "erro");
        btn.disabled = false;
    }
}

async function gerarMenuTemas() {
    listaTemasBotoes.innerHTML = `<div class="loader" style="color:white;display:flex;align-items:center;justify-content:center;white-space:nowrap;height:100%;text-align:center;grid-column:1/-1;">Carregando seus dicionários...</div>`;
    
    // Buscamos apenas o necessário para contar
    const { data, error } = await _supabase.from('dicionarios').select('categoria');
    
    if (error) {
        listaTemasBotoes.innerHTML = "Erro ao carregar temas.";
        return;
    }

    listaTemasBotoes.innerHTML = "";
    
    // VERIFICAÇÃO DE LISTA VAZIA:
    // Se não houver categorias no banco para este usuário
    if (!categoriasDisponiveis || categoriasDisponiveis.length === 0) {
        listaTemasBotoes.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: white; opacity: 0.7;">
                <p>Sua lista de dicionários está vazia.</p>
            </div>
        `;
        return;
    }

    // Mapeamos a contagem internamente (o usuário não verá isso)
    const contagemPorCategoria = {};
    data.forEach(item => {
        contagemPorCategoria[item.categoria] = (contagemPorCategoria[item.categoria] || 0) + 1;
    });

    categoriasDisponiveis.forEach(cat => {
        const div = document.createElement("div");
        div.className = "card-dicionario";
        
        // Exibe APENAS o nome da categoria
        div.textContent = cat; 

        const total = contagemPorCategoria[cat] || 0;

        div.onclick = async () => {
            if (total < 100) {
                aplicarEfeitoNegativo(div);
            } else {
                carregarVocabulario(cat);
            }
        };
        
        listaTemasBotoes.appendChild(div);
    });
}

async function carregarVocabulario(cat) {
    document.getElementById("status-load").style.display = "block";
    
    // ADICIONADO: .order('palavra') para que o índice no array seja sempre alfabético
    const { data, error } = await _supabase
        .from('dicionarios')
        .select('*')
        .eq('categoria', cat)
        .order('palavra', { ascending: true });

    if (error) {
        console.error("Erro ao carregar:", error);
        return;
    }
    
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

    esconderTodosMenus(); 
    menuPrincipal.style.display = "flex";
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

function iniciarNivel(q) { palavrasParaOJogo = vocabulario.slice(0, q); iniciarJogo(); } //OK

function iniciarIntervalo(i, f) { palavrasParaOJogo = vocabulario.slice(i, f); iniciarJogo(); } //OK

function iniciarJogo() {
    menuNiveis.style.display = "none"; menuIntervalos.style.display = "none"; //OK
    document.getElementById("palavra-box").style.display = "flex"; //OK
    document.getElementById("opcoes-container").style.display = "flex"; //OK
    document.getElementById("contador-container").style.display = "flex"; //OK
    document.getElementById("revisao-teste").style.display = "none"; 
    document.getElementById("btn-voltar-final").style.display = "none";
    
    historicoSessao = []; 
    acertos = 0; 
    erros = 0;
    document.getElementById("num-acertos").textContent = "0";
    document.getElementById("num-erros").textContent = "0";
    palavrasParaOJogo.sort(() => Math.random() - 0.5); //OK
    proximaRodada(); //OK
}

function proximaRodada() {
    if (palavrasParaOJogo.length === 0) { finalizarTeste(); return; }
    let atual = palavrasParaOJogo.shift();

    const devePronunciar = document.getElementById('check-pronuncia').checked;
        if (devePronunciar) {
            // Chamamos a função de voz que você já tem, mas sem passar um botão
            const utterance = new SpeechSynthesisUtterance(atual.palavra);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            window.speechSynthesis.cancel(); 
            window.speechSynthesis.speak(utterance);
        }

    const box = document.getElementById("palavra-box");
    const containerOpcoes = document.getElementById("opcoes-container");
    
    // Nova estrutura: A pronúncia ignora a largura do ícone para ficar centralizada
    box.innerHTML = `
        <div class="quiz-header-container">
            <div class="word-row-wrapper">
                <span class="word-main-text">${atual.palavra}</span>
                <button class="btn-audio-quiz" onclick="falarPalavraQuiz('${atual.palavra}', this)">
                    <img src="imagens/pronuncia.png" class="img-audio-quiz">
                </button>
            </div>
            <span class="pronuncia-quiz-sub">${atual.pronuncia}</span>
        </div>
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
        btn.onclick = async () => {
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
                
                try {
                    const { data: { user } } = await _supabase.auth.getUser();
                    if (user) {
                        await _supabase.from('erros_usuarios').insert([{
                            user_id: user.id,
                            dicionario_id: atual.original.id
                        }]);
                    }
                } catch (e) { console.error("Erro ao registrar erro:", e); }
            }
            setTimeout(proximaRodada, 600);
        };
        containerOpcoes.appendChild(btn);
    });
}


function finalizarTeste() {
    document.getElementById("palavra-box").innerHTML = "<span>Teste finalizado!</span>";
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
    const elementosParaEsconder = [
        'revisao-teste', 'btn-voltar-final', 'contador-container', 
        'palavra-box', 'opcoes-container', 'status-load'
    ];
    elementosParaEsconder.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    container.classList.remove('modo-largo');
    
    irParaHub(); 
}

async function irParaMeusErros() {
    esconderTodosMenus();
    menuMeusErros.style.display = "flex";
    listaMeusErros.innerHTML = "<div style='padding:20px; text-align: center; color: white;'>Carregando seus erros...</div>";
    container.classList.add("modo-largo");

    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await _supabase
        .from('erros_usuarios')
        .select(`id, dicionarios (id, palavra, pronuncia, significado)`)
        .eq('user_id', user.id);

    if (error) {
        listaMeusErros.innerHTML = "Erro ao carregar lista.";
        return;
    }

    listaMeusErros.innerHTML = "";
    if (data && data.length > 0) {
        const errosUnicos = [];
        const idsVistos = new Set();
        data.forEach(reg => {
            const dic = reg.dicionarios;
            if (dic && !idsVistos.has(dic.id)) {
                errosUnicos.push(dic);
                idsVistos.add(dic.id);
            }
        });

        errosUnicos.forEach(item => {
            const f = formatarItem(item.palavra, item.pronuncia, item.significado);
            const div = document.createElement("div");
            div.className = "item-erro"; 
            div.innerHTML = `
                <div class="col-palavra-info">
                    <span>${f.palavra}</span>
                    <span class="pronuncia-pequena">${f.pronuncia}</span>
                </div>
                <span>${f.significados}</span>
            `;
            listaMeusErros.appendChild(div);
        });
    } else {
        listaMeusErros.innerHTML = "<div style='padding:15px; color: white; opacity: 0.7; text-align: center;'>Sua lista de erros está vazia.</div>";
    }
}

async function limparErrosBanco() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return;
    const { error } = await _supabase.from('erros_usuarios').delete().eq('user_id', user.id);
    if (error) {
        alert("Erro ao limpar: " + error.message);
    } else {
        listaMeusErros.innerHTML = "<div style='padding:15px; color: white; opacity: 0.7; text-align: center;' >Sua lista de erros está vazia.</div>";
    }
}

function aplicarEfeitoNegativo(elemento) {
    elemento.classList.add('shake-error');
    setTimeout(() => {
        elemento.classList.remove('shake-error');
    }, 400); // 400ms coincide com a animação CSS
}

async function carregarPalavraDoDia() {
    try {
        const { data: { user } } = await _supabase.auth.getUser();
        if (!user) return;

        const { data: palavras, error } = await _supabase
            .from('dicionarios')
            .select('*')
            .eq('user_id', user.id);

        if (error || !palavras || palavras.length === 0) {
            document.getElementById('word-day-title').innerText = "Lista vazia";
            document.getElementById('word-day-meaning').innerText = "Adicione algum dicionário.";
            return;
        }

        const hoje = new Date().toDateString(); // Ex: "Mon Jan 20 2026"
        const salvaNoCache = localStorage.getItem('palavraDoDia_Cache');
        let palavraDoDia;

        // Tenta recuperar do cache se for o mesmo dia
        if (salvaNoCache) {
            const cache = JSON.parse(salvaNoCache);
            if (cache.data === hoje) {
                // Verifica se a palavra salva ainda existe no banco (caso você a tenha deletado)
                palavraDoDia = palavras.find(p => p.id === cache.id);
            }
        }

        // Se não tem cache, ou mudou o dia, ou a palavra do cache foi deletada do banco
        if (!palavraDoDia) {
            const dataString = new Date().getFullYear() + "-" + new Date().getMonth() + "-" + new Date().getDate();
            let seed = 0;
            for (let i = 0; i < dataString.length; i++) {
                seed += dataString.charCodeAt(i);
            }
            
            const indice = seed % palavras.length;
            palavraDoDia = palavras[indice];

            // Salva a escolha do dia para não mudar se deletar outras palavras
            localStorage.setItem('palavraDoDia_Cache', JSON.stringify({
                id: palavraDoDia.id,
                data: hoje
            }));
        }

        // --- ABAIXO SEGUE O RESTANTE DO SEU CÓDIGO DE EXIBIÇÃO (IGUAL) ---
        document.getElementById('word-day-title').innerText = palavraDoDia.palavra;

        let significadoFormatado = palavraDoDia.significado
            .toLowerCase()
            .replace(/\//g, ', ')
            .split(',')
            .map(s => s.trim())
            .filter(s => s !== "")
            .join(', ');

        document.getElementById('word-day-meaning').innerText = `${significadoFormatado}`;
        
        const btnSom = document.getElementById('play-word-day');
        btnSom.onclick = () => {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
                btnSom.src = "imagens/pronuncia.png";
                return;
            }
            const msg = new SpeechSynthesisUtterance(palavraDoDia.palavra);
            msg.lang = 'en-US';
            msg.onstart = () => { btnSom.src = "imagens/parar.png"; };
            msg.onend = () => { btnSom.src = "imagens/pronuncia.png"; };
            window.speechSynthesis.speak(msg);
        };

    } catch (err) {
        console.error("Erro ao carregar palavra do dia:", err);
    }
}

async function carregarEstatisticas() {
    try {
        const { data: { user } } = await _supabase.auth.getUser();
        if (!user) return;

        // 1. Contagem de Erros Únicos (Lógica de Set para ignorar repetições)
        const { data: errosData } = await _supabase
            .from('erros_usuarios')
            .select('dicionario_id')
            .eq('user_id', user.id);

        if (errosData) {
            const palavrasUnicasComErro = new Set(errosData.map(item => item.dicionario_id));
            document.getElementById('count-erros').innerText = palavrasUnicasComErro.size;
        } else {
            document.getElementById('count-erros').innerText = 0;
        }

        // 2. Contagem de Palavras Descobertas
        const { count: totalPalavras } = await _supabase
            .from('dicionarios')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        const contagemSegura = totalPalavras || 0;
        const apenasCompletos = Math.floor(contagemSegura / 100) * 100;

        document.getElementById('count-descobertas').innerText = apenasCompletos;

    } catch (err) {
        // Silencioso: Sem mensagens de console conforme solicitado
    }
}

function abrirMeusErros() {
    // Em vez de apenas mostrar o menu, chamamos a função que 
    // carrega os dados e aplica o "modo-largo"
    irParaMeusErros(); 
}

function abrirTodosDicionarios() {
    esconderTodosMenus();
    menuDicionariosRaiz.style.display = "flex";
    listarDicionariosRaiz(); 
}

async function pesquisarNaOxford() {
    const palavra = document.getElementById("input-busca-oxford").value.trim();
    const painelResultado = document.getElementById("resultado-oxford");
    const btn = document.getElementById("btn-search-oxford");

    if (!palavra) return;

    btn.innerHTML = `<span style="font-size:10px; color:white;">...</span>`;
    painelResultado.style.display = "block";
    painelResultado.innerHTML = "Buscando...";

    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${palavra}`);
        if (!response.ok) throw new Error("Não encontrada.");

        const data = await response.json();
        const info = data[0];

        const definicao = info.meanings[0].definitions[0].definition;
        const fonetica = info.phonetic || info.phonetics.find(p => p.text)?.text || "";
        const audioUrl = info.phonetics.find(p => p.audio !== "")?.audio;

painelResultado.innerHTML = `
            <div style="display:flex; align-items:center; margin-bottom: 0px; flex-wrap: nowrap; overflow: hidden;">
                <div style="display: flex; align-items: center; white-space: nowrap; flex-shrink: 0;">
                    <strong style="color:white; margin-right: 8px;">${info.word.toUpperCase()}</strong>
                    <span style="opacity:0.5; font-size: 12px;">${fonetica}</span>
                    ${audioUrl ? `
                        <button class="btn-audio-oxford" onclick="tocarAudioOxford(this, '${audioUrl}')">
                            <img src="imagens/pronuncia.png" class="img-audio-status">
                        </button>` : ''}
                </div>
            </div>
        `;

    } catch (err) {
        painelResultado.innerHTML = `<span style="color:#ff4738">${err.message}</span>`;
    } finally {
        btn.innerHTML = `<img src="imagens/lupa.png">`;
    }
}

function tocarAudioOxford(botao, url) {
    const img = botao.querySelector('.img-audio-status');
    const audio = new Audio(url);

    // Muda para o ícone de parar
    img.src = 'imagens/parar.png';

    audio.play();

    // Quando o áudio terminar, volta para o ícone de pronúncia
    audio.onended = () => {
        img.src = 'imagens/pronuncia.png';
    };

    // Caso ocorra erro ou o usuário pause, garante que o ícone volte
    audio.onerror = () => {
        img.src = 'imagens/pronuncia.png';
    };
}

function falarPalavraQuiz(texto, botao) {
    window.speechSynthesis.cancel();
    const img = botao.querySelector('.img-audio-quiz');
    
    // Troca para o ícone de "parar" enquanto fala
    img.src = 'imagens/parar.png';

    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;

    utterance.onend = () => {
        img.src = 'imagens/pronuncia.png'; // Volta ao ícone original
    };

    window.speechSynthesis.cancel(); 
    window.speechSynthesis.speak(utterance);
}

function irParaConfiguracoes() {
    esconderTodosMenus();
    menuConfiguracoes.style.display = "flex";
}

function salvarConfiguracoes() {
    const config = {
        som: document.getElementById('check-som').checked,
        pronuncia: document.getElementById('check-pronuncia').checked
    };
    localStorage.setItem('config_quiz', JSON.stringify(config));
}










function irParaMenuApagar() {
    esconderTodosMenus();
    menuApagarRaiz.style.display = "flex";
}


function solicitarExclusaoPalavra(id, texto) {
    if (confirm(`Deseja realmente apagar a palavra "${texto}"?`)) {
        console.log("ID para deletar:", id);
        // Aqui faremos o DELETE no próximo passo
    }
}

async function abrirApagarPalavras() {
    esconderTodosMenus();
    container.classList.add("modo-largo");
    menuListaApagarPalavras.style.display = "flex";
    
    // Limpa o campo de busca ao abrir o menu
    document.getElementById("busca-apagar").value = "";
    corpoListaApagarPalavras.innerHTML = "<p style='color:white; text-align:center;'>Carregando palavras...</p>";

    try {
        const { data: { user } } = await _supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await _supabase
            .from('dicionarios')
            .select('id, palavra, significado, pronuncia')
            .eq('user_id', user.id)
            .order('palavra', { ascending: true });

        if (error) throw error;

        dadosPalavrasParaApagar = data || []; // Salva na global para o filtro funcionar
        renderizarListaApagar(dadosPalavrasParaApagar);

    } catch (err) {
        console.error("Erro:", err);
        corpoListaApagarPalavras.innerHTML = "<p style='color:#ff4d6d; text-align:center;'>Erro ao carregar.</p>";
    }
}

function renderizarListaApagar(lista) {
    corpoListaApagarPalavras.innerHTML = "";
    
    if (lista.length === 0) {
        corpoListaApagarPalavras.innerHTML = "<p style='color: white; opacity: 0.7; text-align:center;'>Nenhuma palavra encontrada.</p>";
        return;
    }

    lista.forEach(p => {
        const f = formatarItem(p.palavra, p.pronuncia, p.significado);
        const item = document.createElement("div");
        item.className = "item-dicionario item-clicavel";
        item.style.position = "relative";
        
        // Estrutura alinhada conforme solicitado anteriormente
        item.innerHTML = `
            <div class="col-palavra-info" style="pointer-events: none; transition: opacity 0.3s ease;">
                <span>${f.palavra}</span>
                <span class="pronuncia-pequena">${f.pronuncia}</span>
            </div>
            <span style="pointer-events: none; transition: opacity 0.3s ease;">${f.significados}</span>
        `;

        // CORREÇÃO: Função para resetar o estado visual do item
        const resetarEsteItem = () => {
            item.classList.remove("card-confirmar-delete");
            item.aguardando = false;
            
            // 1. Remove o ícone da lixeira
            const icone = item.querySelector(".icon-lixeira-temp");
            if (icone) {
                icone.style.opacity = "0";
                setTimeout(() => icone.remove(), 300);
            }
            
            // 2. Faz os textos (Palavra e Significado) voltarem a aparecer
            const filhos = item.children;
            for (let filho of filhos) {
                if (!filho.classList.contains('icon-lixeira-temp')) {
                    filho.style.opacity = "1";
                }
            }
        };

        item.onclick = async (e) => {
            if (itemEmConfirmacao && itemEmConfirmacao !== item) {
                itemEmConfirmacao.resetar();
            }

            if (!item.aguardando) {
                item.aguardando = true;
                itemEmConfirmacao = item;
                item.resetar = resetarEsteItem;

                item.classList.add("card-confirmar-delete");
                
                // Esconde o conteúdo original
                const filhos = item.children;
                for (let filho of filhos) { filho.style.opacity = "0"; }

                const iconeLixeira = document.createElement("img");
                iconeLixeira.src = "imagens/limpar.png";
                iconeLixeira.className = "icon-lixeira-temp";
                Object.assign(iconeLixeira.style, {
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%) scale(0.5)",
                    width: "35px",
                    height: "35px",
                    opacity: "0",
                    transition: "all 0.3s ease",
                    filter: "brightness(0) invert(1)",
                    pointerEvents: "none"
                });

                item.appendChild(iconeLixeira);

                setTimeout(() => {
                    iconeLixeira.style.opacity = "1";
                    iconeLixeira.style.transform = "translate(-50%, -50%) scale(1.1)";
                }, 50);

                // Timer de 4 segundos para reset automático
                setTimeout(() => {
                    if (item.aguardando && itemEmConfirmacao === item) {
                        resetarEsteItem();
                        itemEmConfirmacao = null;
                    }
                }, 4000);

            } else {
                itemEmConfirmacao = null;
                await efetuarExclusaoPalavra(p.id, f.palavra, item);
            }
        };

        corpoListaApagarPalavras.appendChild(item);
    });
}

function filtrarApagarPalavras() {
    const termo = document.getElementById("busca-apagar").value.toLowerCase().trim();
    
    if (termo === "") {
        renderizarListaApagar(dadosPalavrasParaApagar);
        return;
    }

    const filtradas = dadosPalavrasParaApagar.filter(item => {
        // Verifica se a palavra ou o significado começam com o termo pesquisado
        return (item.palavra && item.palavra.toLowerCase().includes(termo)) || 
               (item.significado && item.significado.toLowerCase().includes(termo));
    });

    renderizarListaApagar(filtradas);
}

function mostrarAviso(mensagem) {
    const toast = document.createElement("div");
    toast.className = "toast-sucesso";
    toast.innerText = mensagem;
    document.body.appendChild(toast);

    // Remove o elemento do HTML depois que a animação acaba
    setTimeout(() => {
        toast.remove();
    }, 2500);
}

async function abrirMenuApagarDicionarios() {
    
    esconderTodosMenus();
    
    // Voltamos para 'flex' como estava no seu original
    const menuEscolha = document.getElementById("menu-escolha-dicionario-apagar");
    const listaCards = document.getElementById("lista-dicionarios-apagar");

    if (menuEscolha) menuEscolha.style.display = "flex"; 
    
    if (listaCards) {
        listaCards.style.display = "grid"; 

        listaCards.innerHTML = `<div class="loader" style="color:white;display:flex;align-items:center;justify-content:center;white-space:nowrap;height:100%;text-align:center;grid-column:1/-1;">Carregando seus dicionários...</div>`;

        await carregarCategoriasDoBanco();
        listaCards.innerHTML = "";

        // 2. Filtramos apenas as categorias válidas e que não sejam "todos"
        const categoriasFiltradas = categoriasDisponiveis.filter(cat => 
            cat && typeof cat === 'string' && cat.toLowerCase() !== 'todos'
        );

        // 3. Se não houver nada, mostra a mensagem, mas mantém a estrutura de grid
        if (categoriasFiltradas.length === 0) {
            listaCards.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: white; opacity: 0.7;">
                    <p>Sua lista de dicionários está vazia.</p>
                </div>
            `;
            return;
        }

        // 4. Adiciona os cards (Sem o card "Todos")
        categoriasFiltradas.forEach(cat => {
            const labelFormatado = cat.charAt(0).toUpperCase() + cat.slice(1);
            listaCards.appendChild(criarCardComConfirmacao(labelFormatado, cat));
        });
    }
}

function voltarParaMenuApagarRaiz() {
    esconderTodosMenus(); // Isso limpa a grade de dicionários da tela
    if (menuApagarRaiz) {
        menuApagarRaiz.style.display = "flex";
    }
}

async function confirmarApagarDicionario(categoria) {
    const mensagem = categoria === 'todos' 
        ? "⚠️ VOCÊ TEM CERTEZA?\nIsso apagará TODAS as palavras do seu dicionário permanentemente." 
        : `Deseja apagar permanentemente todas as palavras da categoria "${categoria}"?`;

    if (!confirm(mensagem)) return;

    try {
        const { data: { user } } = await _supabase.auth.getUser();
        if (!user) return;

        // Inicia a query de delete
        let query = _supabase.from('dicionarios').delete().eq('user_id', user.id);

        // Se não for 'todos', filtra pela categoria específica
        if (categoria !== 'todos') {
            query = query.eq('categoria', categoria);
        }

        const { error } = await query;
        if (error) throw error;

        // Feedback visual de sucesso
        alert(categoria === 'todos' ? "Dicionário totalmente apagado!" : `Categoria "${categoria}" removida!`);

        // Recarrega os dados e atualiza a tela
        await carregarCategoriasDoBanco(); 
        abrirMenuApagarDicionarios(); 

    } catch (err) {
        console.error("Erro ao apagar:", err);
        alert("Ocorreu um erro ao tentar apagar os dados.");
    }
}

function criarCardComConfirmacao(label, categoria) {
    const div = document.createElement("div");
    div.className = "card-dicionario";
    div.innerHTML = `<div class="card-content-wrapper"><span>${label}</span></div>`;
    
    div.aguardandoConfirmacao = false;

    div.resetar = function() {
        this.aguardandoConfirmacao = false;
        this.classList.remove("card-confirmar-delete");
        const wrapper = this.querySelector(".card-content-wrapper");
        if (wrapper) {
            wrapper.style.opacity = "0";
            setTimeout(() => {
                wrapper.innerHTML = `<span>${label}</span>`;
                wrapper.style.opacity = "1";
                wrapper.style.transform = "scale(1)";
            }, 300);
        }
    };

    div.onclick = async () => {
        if (cardDicionarioEmConfirmacao && cardDicionarioEmConfirmacao !== div) {
            cardDicionarioEmConfirmacao.resetar();
        }

        if (!div.aguardandoConfirmacao) {
            div.aguardandoConfirmacao = true;
            cardDicionarioEmConfirmacao = div;
            div.classList.add("card-confirmar-delete");
            
            const wrapper = div.querySelector(".card-content-wrapper");
            wrapper.style.opacity = "0";
            
            setTimeout(() => {
                wrapper.innerHTML = `<img src="imagens/limpar.png" class="icon-lixeira" alt="Confirmar" style="width:40px; height:40px; filter:brightness(0) invert(1);">`;
                wrapper.style.opacity = "1";
            }, 300);

            setTimeout(() => {
                if (div.aguardandoConfirmacao && cardDicionarioEmConfirmacao === div) {
                    div.resetar();
                    cardDicionarioEmConfirmacao = null;
                }
            }, 3000);
        } else {
            cardDicionarioEmConfirmacao = null;
            await executarExclusaoDicionario(categoria, div);
        }
    };
    return div;
}

async function executarExclusaoDicionario(categoria, elementoCard) {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        if (!session) return;

        // Efeito visual imediato
        elementoCard.style.transform = "scale(0) ";
        elementoCard.style.opacity = "0";
        
        setTimeout(() => {
            elementoCard.remove();
            if (listaDicionariosApagar.children.length === 0) {
                listaDicionariosApagar.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: white; opacity: 0.7;">
                        <p>Sua lista de dicionários está vazia.</p>
                    </div>
                `;
            }
        }, 300);

        // Executa a exclusão no banco
        const { error } = await _supabase
            .from('dicionarios')
            .delete()
            .eq('user_id', session.user.id)
            .eq('categoria', categoria);

        if (error) throw error;

        // --- AS LINHAS ABAIXO RESOLVEM O SEU PROBLEMA ---
        await carregarCategoriasDoBanco(); // Atualiza a lista global
        gerarMenuTemas();                  // Reconstrói o menu "Praticar"
        gerarMenuDicionariosVisualizacao(); // Atualiza o menu "Visualizar"
        // ----------------------------------------------

    } catch (err) {
        console.error("Erro ao apagar:", err);
        abrirMenuApagarDicionarios(); 
    }
}

async function efetuarExclusaoPalavra(id, texto, elementoItem) {
    try {
        // 1. Efeito visual imediato na lista de palavras
        if (elementoItem) {
            elementoItem.style.transform = "scale(0.8)";
            elementoItem.style.opacity = "0";
            setTimeout(() => elementoItem.remove(), 300);
        }

        // 2. Executa a exclusão no Supabase
        const { error } = await _supabase
            .from('dicionarios')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // 3. Atualiza a lista local (global) de palavras para o filtro de busca
        dadosPalavrasParaApagar = dadosPalavrasParaApagar.filter(p => p.id !== id);

        // 4. ATUALIZAÇÃO DOS MENUS (O que faltava)
        // Recarregamos as categorias do banco para ver se o dicionário ainda existe
        await carregarCategoriasDoBanco(); 
        
        // Atualizamos todos os menus que dependem das categorias
        gerarMenuTemas();                   // Menu Praticar
        gerarMenuDicionariosVisualizacao(); // Menu Visualizar
        
        // 5. Verifica se a lista na tela de apagar palavras ficou vazia após o filtro
        if (dadosPalavrasParaApagar.length === 0) {
            corpoListaApagarPalavras.innerHTML = "<p style='color:white; text-align:center; opacity: 0.7;'>Sua lista de palavras está vazia.</p>";
        }

        setTimeout(() => {
            const f = document.getElementById("feedback-apagar");
            if (f) {
                f.style.display = "none";
                f.textContent = "";
            }
        }, 3000);

    } catch (err) {
        console.error("Erro ao deletar:", err);
        exibirFeedback("feedback-apagar", "Erro ao apagar no banco.", "erro");
    }
}

// Abre e fecha o formulário de criação dentro da área de dicas
function toggleFormDica() {
    const form = document.getElementById("form-dica");
    form.style.display = form.style.display === "none" ? "block" : "none";
}

async function salvarDicaNoBanco() {
    const assunto = document.getElementById("add-dica-assunto").value.trim();
    const explicacao = document.getElementById("add-dica-explicacao").value.trim();
    const texto = document.getElementById("add-dica-texto").value.trim();
    const feedbackAdd = document.getElementById("feedback-adicionar-dica");
    
    const btnContainer = document.querySelector("#area-adicionar-dica .btn-voltar-icone[onclick*='salvarDicaNoBanco']");

    if (!assunto || !explicacao || !texto) {
        exibirFeedback("feedback-adicionar-dica", "Por favor, preencha todos os campos.", "erro");
        
        // Garante alinhamento também na mensagem de erro
        if (feedbackAdd) {
            feedbackAdd.style.width = "100%";
            feedbackAdd.style.boxSizing = "border-box";
            feedbackAdd.style.textAlign = "center";
            feedbackAdd.style.margin = "10px 0";
        }
        return;
    }

    if (btnContainer) btnContainer.style.pointerEvents = "none";

    const { error } = await _supabase
        .from('dicas')
        .insert([{ 
            assunto: assunto, 
            explicacao: explicacao, 
            texto: texto 
        }]);

    if (error) {
        exibirFeedback("feedback-adicionar-dica", "Erro ao salvar: " + error.message, "erro");
        if (feedbackAdd) {
            feedbackAdd.style.width = "100%";
            feedbackAdd.style.boxSizing = "border-box";
            feedbackAdd.style.textAlign = "center";
        }
        if (btnContainer) btnContainer.style.pointerEvents = "auto";
    } else {
        exibirFeedback("feedback-adicionar-dica", "Dica adicionada com sucesso!", "sucesso");
        
        // CORREÇÃO DE ALINHAMENTO:
        if (feedbackAdd) {
            feedbackAdd.style.width = "100%";
            feedbackAdd.style.boxSizing = "border-box";
            feedbackAdd.style.textAlign = "center";
            feedbackAdd.style.margin = "10px 0";
            feedbackAdd.style.display = "block"; // Garante que aparece como bloco
        }

        // Limpa os campos
        document.getElementById("add-dica-assunto").value = "";
        document.getElementById("add-dica-explicacao").value = "";
        document.getElementById("add-dica-texto").value = "";

        setTimeout(() => {
            if (btnContainer) btnContainer.style.pointerEvents = "auto";
            
            // FAZ A MENSAGEM SUMIR antes de navegar ou ao navegar
            if (feedbackAdd) feedbackAdd.style.display = "none";
            
            navegarDicas('voltar-hub');
        }, 1500); // Tempo que a mensagem fica visível
    }
}

async function carregarDicas() {
    const container = document.getElementById("lista-dicas-container");
    const { data, error } = await _supabase
        .from('dicas')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return;

    if (!data || data.length === 0) {
        container.innerHTML = "<div style='color: white; opacity: 0.7; text-align: center; padding: 20px; width: 100%; box-sizing: border-box;'>Nenhuma dica encontrada.</div>";
        return;
    }

    container.innerHTML = "";
    data.forEach(dica => {
        const card = document.createElement("div");
        card.className = "card-dica";
        
        // Aplicamos a formatação no Assunto e na Explicação curta também
        const assuntoFormatado = formatarNegrito(dica.assunto);
        const explicacaoFormatada = formatarNegrito(dica.explicacao);
        const textoCompletoFormatado = formatarNegrito(dica.texto);

        card.innerHTML = `
            <div class="dica-header">
                <span class="dica-assunto">${assuntoFormatado}</span>
                <p class="dica-explicacao">${explicacaoFormatada}</p>
            </div>
        `;
        
        const textoDiv = document.createElement("div");
        textoDiv.className = "dica-texto-completo";
        
        // IMPORTANTE: Mudamos de .textContent para .innerHTML para aceitar o <b>
        textoDiv.innerHTML = textoCompletoFormatado; 
        
        card.appendChild(textoDiv);
        
        card.onclick = (e) => {
            e.stopPropagation();
            const jaExpandido = card.classList.contains("expandido");
            document.querySelectorAll('.card-dica').forEach(c => c.classList.remove('expandido'));
            if (!jaExpandido) {
                card.classList.add("expandido");
            }
        };
        
        container.appendChild(card);
    });
}

// Lógica para fechar quando clicar fora de qualquer card
document.addEventListener('click', (e) => {
    if (!e.target.closest('.card-dica')) {
        document.querySelectorAll('.card-dica.expandido').forEach(card => {
            card.classList.remove('expandido');
        });
    }
});

function navegarDicas(destino) {
    const hub = document.getElementById("hub-dicas-inicial");
    const areaAdd = document.getElementById("area-adicionar-dica");
    const areaVer = document.getElementById("area-visualizar-dicas");
    const areaEditarLista = document.getElementById("menu-editar-dicas-lista");
    const areaEditarCampos = document.getElementById("menu-editar-dica-campos");
    const areaApagarLista = document.getElementById("menu-apagar-dicas-lista"); 
    const titulo = document.getElementById("titulo-menu-dicas");
    const btnInicioGeral = document.getElementById("btn-inicio-dicas");

    // Esconde absolutamente tudo primeiro (usando verificação de existência para evitar erros)
    if (hub) hub.style.display = "none";
    if (areaAdd) areaAdd.style.display = "none";
    if (areaVer) areaVer.style.display = "none";
    if (areaEditarLista) areaEditarLista.style.display = "none";
    if (areaEditarCampos) areaEditarCampos.style.display = "none";
    if (areaApagarLista) areaApagarLista.style.display = "none";
    if (btnInicioGeral) btnInicioGeral.style.display = "none"; 

    if (destino === 'visualizar') {
        if (titulo) titulo.textContent = "Visualizar anotações";
        if (areaVer) areaVer.style.display = "block";
        carregarDicas();
    } 
    else if (destino === 'adicionar') {
        if (titulo) titulo.textContent = "Adicionar anotação";
        if (areaAdd) areaAdd.style.display = "block";
    } 
    else if (destino === 'editar') {
        if (titulo) titulo.textContent = "Escolha para editar";
        if (areaEditarLista) areaEditarLista.style.display = "flex";
        abrirListagemEditarDicas();
    }
    else if (destino === 'apagar') {
        if (titulo) titulo.textContent = "Toque para apagar";
        if (areaApagarLista) {
            areaApagarLista.style.display = "flex";
            abrirListagemApagarDicas(); 
        }
    }
    else if (destino === 'campos-edicao') {
        if (titulo) titulo.textContent = "Edite a anotação";
        if (areaEditarCampos) areaEditarCampos.style.display = "flex";
    }
    else if (destino === 'voltar-hub') {
        if (titulo) titulo.textContent = "Anotações";
        if (hub) hub.style.display = "flex";
        if (btnInicioGeral) btnInicioGeral.style.display = "flex"; 
    }
}

function irParaDicas() {
    esconderTodosMenus();
    document.getElementById("menu-dicas").style.display = "flex";
    navegarDicas('voltar-hub');
}

async function abrirListagemEditarDicas() {
    const listaDicasEditar = document.getElementById("lista-dicas-editar");
    
    // 1. Limpa e mostra carregando
    listaDicasEditar.innerHTML = "<div style='color: white; padding: 20px;'>Carregando dicas...</div>";
    listaDicasEditar.style.width = "100%";

    try {
        // 2. Busca os dados
        const { data, error } = await _supabase
            .from('dicas')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 3. Verifica se está vazio
        if (!data || data.length === 0) {
            listaDicasEditar.innerHTML = "<div style='color: white; opacity: 0.7; text-align: center; padding: 20px; width: 100%;'>Nenhuma dica encontrada.</div>";
            return;
        }

        // 4. Renderiza os cards
        listaDicasEditar.innerHTML = "";
        data.forEach(dica => {
            const card = document.createElement("div");
            card.className = "card-dica";
            card.style.cursor = "pointer";
            card.style.width = "90%";
            card.style.margin = "0 auto"; 
            
            // Ajuste de aproximação: margin-bottom no span e margin-top 0 no p
            card.innerHTML = `
                <span class="dica-assunto" style="display: block; margin-bottom: 2px;">${dica.assunto}</span>
                <p class="dica-explicacao" style="display: block !important; margin-top: 0px !important;">${dica.explicacao}</p>
            `;
            
            card.onclick = () => preencherFormularioEdicao(dica);
            listaDicasEditar.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        listaDicasEditar.innerHTML = "<div style='color: white;'>Erro ao carregar dicas.</div>";
    }
}

function preencherFormularioEdicao(dica) {
    dicaSendoEditada = dica;
    
    // IDs do teu HTML (index.html) sendo preenchidos com as colunas corretas do Banco
    document.getElementById("edit-dica-titulo").value = dica.assunto || "";    // Coluna: assunto
    document.getElementById("edit-dica-descricao").value = dica.explicacao || ""; // Coluna: explicacao
    document.getElementById("edit-dica-explicacao").value = dica.texto || "";     // Coluna: texto (ajuste se necessário)
    
    document.getElementById("feedback-editar-dica").style.display = "none";
    
    navegarDicas('campos-edicao');
}

async function processarEdicaoDica() {
    const tituloVal = document.getElementById("edit-dica-titulo").value.trim();
    const descricaoVal = document.getElementById("edit-dica-descricao").value.trim();
    const textoVal = document.getElementById("edit-dica-explicacao").value.trim();
    
    // O botão agora não muda mais o texto, apenas processa
    const btnContainer = document.querySelector("#menu-editar-dica-campos .btn-voltar-icone[onclick*='processarEdicaoDica']");

    if (!tituloVal || !descricaoVal || !textoVal) {
        exibirFeedback("feedback-editar-dica", "Por favor, preencha todos os campos.", "erro");
        return;
    }

    if (btnContainer) btnContainer.style.pointerEvents = "none";

    const { error } = await _supabase
        .from('dicas')
        .update({ 
            assunto: tituloVal,      
            explicacao: descricaoVal, 
            texto: textoVal          
        })
        .eq('id', dicaSendoEditada.id);

    if (error) {
        exibirFeedback("feedback-editar-dica", "Erro ao atualizar: " + error.message, "erro");
        if (btnContainer) btnContainer.style.pointerEvents = "auto";
    } else {
        exibirFeedback("feedback-editar-dica", "Dica atualizada com sucesso!", "sucesso");
        setTimeout(() => {
            if (btnContainer) btnContainer.style.pointerEvents = "auto";
            navegarDicas('editar'); 
        }, 1500);
    }
}


async function abrirListagemApagarDicas() {
    const listaContainer = document.getElementById("lista-dicas-apagar");
    listaContainer.innerHTML = "<div style='color: white; padding: 20px;'>Carregando dicas...</div>";
    
    const { data, error } = await _supabase
        .from('dicas')
        .select('*')
        .order('assunto', { ascending: true });
    
    if (error) {
        listaContainer.innerHTML = "<div style='color: white;'>Erro ao carregar.</div>";
        return;
    }

    dadosDicasParaApagar = data || [];
    renderizarListaApagarDicas(dadosDicasParaApagar);
}

function renderizarListaApagarDicas(lista) {
    const listaContainer = document.getElementById("lista-dicas-apagar");
    listaContainer.innerHTML = "";
    
    if (lista.length === 0) {
        listaContainer.innerHTML = "<div style='color: white; opacity: 0.7;'>Nenhuma dica encontrada.</div>";
        return;
    }

    lista.forEach(dica => {
        const div = document.createElement("div");
        div.className = "item-dicionario"; // Mesma classe usada no Editar para ficar um abaixo do outro
        div.style.cursor = "pointer";
        div.style.marginBottom = "10px"; // Garante o espaçamento entre os cards

        // Conteúdo inicial (Assunto e Explicação)
        div.innerHTML = `
            <div class="col-palavra-info">
                <span style="color: #ff007f; font-weight: bold; display: block;">${dica.assunto}</span>
                <span class="pronuncia-pequena" style="display: block; margin-top: 5px;">${dica.explicacao}</span>
            </div>
        `;

        div.onclick = async () => {
            if (!div.classList.contains("confirmar-exclusao")) {
                // Primeiro clique: Transforma o card no botão de apagar
                div.classList.add("confirmar-exclusao");
                div.style.backgroundColor = "#352322";
                div.style.border = "1px solid #f14738";
                // Localize onde você define o innerHTML quando clica para apagar
                div.innerHTML = `
                    <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; min-height: 50px;">
                        <img src="imagens/limpar.png" style="width: 45px; height: auto; filter: brightness(0) invert(1);">
                    </div>
                `;
                
                // Reset após 3 segundos se não clicar novamente
                setTimeout(() => {
                    if (div.parentNode && div.classList.contains("confirmar-exclusao")) {
                        renderizarListaApagarDicas(dadosDicasParaApagar);
                    }
                }, 3000);
            } else {
                // Segundo clique: Deleta
                const { error } = await _supabase.from('dicas').delete().eq('id', dica.id);
                if (!error) {
                    div.style.opacity = "0";
                    div.style.transform = "translateX(50px)"; // Efeito de deslizar ao sair
                    div.style.transition = "0.3s";
                    setTimeout(() => abrirListagemApagarDicas(), 300);
                } else {
                    alert("Erro ao apagar dica.");
                }
            }
        };

        listaContainer.appendChild(div);
    });
}

function formatarNegrito(texto) {
    if (!texto) return "";
    // Procura por **qualquer coisa** e substitui pela tag <b>
    return texto.replace(/\*(.*?)\*/g, "<b>$1</b>");
}