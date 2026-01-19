const SUPABASE_URL = 'https://byhuejznipdjwoicbmsh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aHVlanpuaXBkandvaWNibXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTUwOTcsImV4cCI6MjA4Mzg5MTA5N30.shEmFonuHGqOpHOnqRmXFh_EmfaUKhU8do57xZ7SK1E';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// SELETORES DE MENUS
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

    console.log("Sistema de treino carregado com Correção Visual");

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
                   menuAlterarPalavras, telaEdicaoCampos, menuConfiguracoes];
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
        
        listaAlterarPalavras.innerHTML = "<div style='padding:20px; color: var(--accent-color);'>Carregando suas palavras...</div>";
        
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
        listaAlterarPalavras.innerHTML = "<div style='padding:20px'>Nenhuma palavra encontrada.</div>";
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
            renderizarCategoriasDicionario(unicas); // Chama a função que desenha os cards na tela
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
        
        areaListaPalavras.innerHTML = "<div class='loader'>Carregando palavras...</div>";
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
    listaTemasBotoes.innerHTML = "Carregando temas...";
    
    // Buscamos apenas o necessário para contar
    const { data, error } = await _supabase.from('dicionarios').select('categoria');
    
    if (error) {
        listaTemasBotoes.innerHTML = "Erro ao carregar temas.";
        return;
    }

    listaTemasBotoes.innerHTML = "";
    
    // Mapeamos a contagem internamente (o usuário não verá isso)
    const contagemPorCategoria = {};
    data.forEach(item => {
        contagemPorCategoria[item.categoria] = (contagemPorCategoria[item.categoria] || 0) + 1;
    });

    categoriasDisponiveis.forEach(cat => {
        const div = document.createElement("div");
        div.className = "card-dicionario";
        
        // Exibe APENAS o nome da categoria, como era antes
        div.textContent = cat; 

        const total = contagemPorCategoria[cat] || 0;

        div.onclick = async () => {
            if (total < 100) {
                // O efeito de tremer continua funcionando aqui
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
    listaMeusErros.innerHTML = "Carregando seus erros...";
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
        listaMeusErros.innerHTML = "<div style='padding:20px'>Sua lista de erros está vazia.</div>";
    }
}

async function limparErrosBanco() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return;
    const { error } = await _supabase.from('erros_usuarios').delete().eq('user_id', user.id);
    if (error) {
        alert("Erro ao limpar: " + error.message);
    } else {
        listaMeusErros.innerHTML = "<div style='padding:20px'>Sua lista de erros está vazia.</div>";
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
        // 1. Obtém o usuário logado para filtrar os dados
        const { data: { user } } = await _supabase.auth.getUser();
        if (!user) return;

        // 2. Busca apenas as palavras pertencentes ao usuário logado
        const { data: palavras, error } = await _supabase
            .from('dicionarios')
            .select('*')
            .eq('user_id', user.id); // Garante que a palavra venha do dicionário do próprio usuário

        // Se houver erro ou o usuário não tiver palavras cadastradas
        if (error || !palavras || palavras.length === 0) {
            document.getElementById('word-day-title').innerText = "---";
            document.getElementById('word-day-meaning').innerText = "Adicione palavras ao seu dicionário.";
            return;
        }

        // 3. Lógica da Data: Criamos uma string baseada no ano-mês-dia
        const hoje = new Date();
        const dataString = hoje.getFullYear() + "-" + hoje.getMonth() + "-" + hoje.getDate();
        
        // 4. Geramos um índice determinístico baseado na data
        let seed = 0;
        for (let i = 0; i < dataString.length; i++) {
            seed += dataString.charCodeAt(i);
        }
        
        const indice = seed % palavras.length;
        const palavraDoDia = palavras[indice];

        // 5. Preenche o HTML com os dados da palavra sorteada
        document.getElementById('word-day-title').innerText = palavraDoDia.palavra;

        let significadoFormatado = palavraDoDia.significado
            .toLowerCase()
            .replace(/\//g, ', ')
            .split(',')
            .map(s => s.trim())
            .filter(s => s !== "")
            .join(', ');

        document.getElementById('word-day-meaning').innerText = `${significadoFormatado}`;
        
        // 6. Configura a funcionalidade de áudio
        const btnSom = document.getElementById('play-word-day');
        btnSom.onclick = () => {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
                btnSom.src = "imagens/pronuncia.png";
                return;
            }

            const msg = new SpeechSynthesisUtterance(palavraDoDia.palavra);
            msg.lang = 'en-US';

            msg.onstart = () => {
                btnSom.src = "imagens/parar.png";
            };

            msg.onend = () => {
                btnSom.src = "imagens/pronuncia.png";
            };

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

        // 1. Contagem de Erros (Continua igual)
        const { count: totalErros } = await _supabase
            .from('erros_usuarios')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
        
        document.getElementById('count-erros').innerText = totalErros || 0;

        // 2. Contagem de Palavras Descobertas
        // Como você só tem a tabela 'dicionarios', vamos contar o total dela
        const { count: totalPalavras, error: errDics } = await _supabase
            .from('dicionarios')
            .select('*', { count: 'exact', head: true });

        if (errDics) {
            console.error("Erro ao ler tabela dicionarios:", errDics.message);
            return;
        }

        // Aplicando a sua regra: Se você quer que conte apenas blocos de 100
        // Exemplo: se tiver 250 palavras, ele mostra 200 (2 dicionários completos)
        const apenasCompletos = Math.floor(totalPalavras / 100) * 100;

        document.getElementById('count-descobertas').innerText = apenasCompletos;

    } catch (err) {
        console.error("Erro nas estatísticas:", err);
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