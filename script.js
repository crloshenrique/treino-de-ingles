// Git 25 - Versão Completa e Corrigida
const SUPABASE_URL = 'https://byhuejznipdjwoicbmsh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5aHVlanpuaXBkandvaWNibXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTUwOTcsImV4cCI6MjA4Mzg5MTA5N30.shEmFonuHGqOpHOnqRmXFh_EmfaUKhU8do57xZ7SK1E';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// SELETORES GERAIS
const sidebar = document.getElementById("sidebar");
const container = document.getElementById("container");

// VARIÁVEIS DE ESTADO
let categoriasDisponiveis = [];
let vocabulario = [];
let palavrasParaOJogo = [];
let acertos = 0, erros = 0;

// INICIALIZAÇÃO
window.onload = async () => {
    await carregarCategoriasDoBanco();
    gerarMenuDicionariosVisualizacao();
    gerarMenuTemas();
    irParaHub(); 
};

// --- LOGICA DO MENU (ACCORDION / HOVER) ---

function toggleMenuMobile() {
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('aberto-mobile');
        // Garante que a tela suba para ver o menu se estiver lá embaixo
        if(sidebar.classList.contains('aberto-mobile')) {
            window.scrollTo({top: 0, behavior: 'smooth'});
        }
    }
}

function fecharMenuSeMobile() {
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('aberto-mobile');
    }
}

// --- NAVEGAÇÃO ENTRE TELAS ---

function esconderTodosMenus() {
    // Esconde todos os elementos que tenham a classe 'menu' ou IDs específicos
    const IDsParaEsconder = [
        'menu-hub', 'menu-dicionarios-raiz', 'area-adicionar-dicionario', 
        'menu-gerenciar-dicionarios', 'menu-temas', 'menu-principal', 
        'menu-niveis', 'menu-intervalos', 'palavra-box', 'opcoes-container', 
        'contador-container', 'btn-reiniciar', 'visualizacao-palavras'
    ];
    
    IDsParaEsconder.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = "none";
    });

    container.classList.remove("modo-largo");
    fecharMenuSeMobile();
}

function irParaHub() { esconderTodosMenus(); document.getElementById("menu-hub").style.display = "flex"; }
function irParaTemas() { esconderTodosMenus(); document.getElementById("menu-temas").style.display = "flex"; }
function irParaDicionariosRaiz() { esconderTodosMenus(); document.getElementById("menu-dicionarios-raiz").style.display = "flex"; }

function abrirSubMenuDicionarios() { 
    esconderTodosMenus(); 
    document.getElementById("menu-gerenciar-dicionarios").style.display = "flex"; 
    document.getElementById("lista-dicionarios-visualizar").style.display = "flex"; 
}

function abrirEscolhaTipoAdicao() { 
    esconderTodosMenus();
    document.getElementById("area-adicionar-dicionario").style.display = "flex"; 
    document.getElementById("selecao-tipo-adicao").style.display = "flex";
    document.getElementById("form-individual").style.display = "none";
    document.getElementById("form-massa").style.display = "none";
}

function voltarParaDicionariosRaiz() { irParaDicionariosRaiz(); }
function mostrarFormIndividual() { document.getElementById("selecao-tipo-adicao").style.display = "none"; document.getElementById("form-individual").style.display = "block"; }
function mostrarFormMassa() { document.getElementById("selecao-tipo-adicao").style.display = "none"; document.getElementById("form-massa").style.display = "block"; }

// --- BANCO DE DADOS (SUPABASE) ---

async function carregarCategoriasDoBanco() {
    const { data, error } = await _supabase.from('dicionarios').select('categoria');
    if (!error && data) {
        categoriasDisponiveis = [...new Set(data.map(item => item.categoria))];
    }
}

function gerarMenuDicionariosVisualizacao() {
    const area = document.getElementById("lista-dicionarios-visualizar");
    if(!area) return;
    area.innerHTML = "";
    categoriasDisponiveis.forEach(cat => {
        const btn = document.createElement("button");
        btn.textContent = cat; btn.className = "btn-azul";
        btn.onclick = () => carregarEExibirVarios(cat);
        area.appendChild(btn);
    });
}

async function carregarEExibirVarios(cat) {
    document.getElementById("lista-dicionarios-visualizar").style.display = "none";
    document.getElementById("visualizacao-palavras").style.display = "block";
    container.classList.add("modo-largo");
    
    const { data } = await _supabase.from('dicionarios')
        .select('*')
        .eq('categoria', cat)
        .order('palavra', { ascending: true });

    const area = document.getElementById("area-lista-palavras");
    area.innerHTML = "";
    data.forEach(item => {
        const div = document.createElement("div");
        div.className = "item-dicionario";
        div.innerHTML = `<span>${item.palavra}</span><span>${item.pronuncia}</span><span>${item.significado}</span>`;
        area.appendChild(div);
    });
}

// --- SALVAMENTO ---

async function salvarNoBancoLocal() {
    const palavra = document.getElementById("add-palavra").value.trim();
    const pronuncia = document.getElementById("add-pronuncia").value.trim();
    const significado = document.getElementById("add-significado").value.trim();
    const categoria = document.getElementById("add-categoria").value.trim();

    if (!palavra || !significado || !categoria) { alert("Preencha os campos obrigatórios!"); return; }

    const { error } = await _supabase.from('dicionarios').insert([{ palavra, pronuncia, significado, categoria }]);
    if (error) alert("Erro ao salvar: " + error.message);
    else { alert("Sucesso!"); location.reload(); }
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

    if (objetosParaEnviar.length === 0) { alert("Formato inválido! Use: Palavra (pronuncia) = significado"); return; }
    
    const { error } = await _supabase.from('dicionarios').insert(objetosParaEnviar);
    if (error) alert("Erro: " + error.message);
    else { alert(`${objetosParaEnviar.length} palavras cadastradas!`); location.reload(); }
}

// --- LÓGICA DO JOGO (TREINO) ---

function gerarMenuTemas() {
    const area = document.getElementById("lista-temas-botoes");
    if(!area) return;
    area.innerHTML = "";
    categoriasDisponiveis.forEach(cat => {
        const btn = document.createElement("button");
        btn.textContent = cat; btn.className = "btn-azul";
        btn.onclick = () => carregarVocabulario(cat);
        area.appendChild(btn);
    });
}

async function carregarVocabulario(cat) {
    const { data } = await _supabase.from('dicionarios').select('*').eq('categoria', cat);
    if(data) {
        vocabulario = data.map(item => ({ 
            exibir: `${item.palavra} ${item.pronuncia}`, 
            correta: item.significado.split("/")[0].trim() 
        }));
        esconderTodosMenus(); 
        document.getElementById("menu-principal").style.display = "flex";
    }
}

function abrirMenuNiveis() { document.getElementById("menu-principal").style.display = "none"; document.getElementById("menu-niveis").style.display = "flex"; }
function abrirMenuIntervalos() { document.getElementById("menu-principal").style.display = "none"; document.getElementById("menu-intervalos").style.display = "flex"; }
function voltarAoMenuPraticar() { document.getElementById("menu-niveis").style.display = "none"; document.getElementById("menu-intervalos").style.display = "none"; document.getElementById("menu-principal").style.display = "flex"; }

function iniciarNivel(q) { palavrasParaOJogo = vocabulario.slice(0, q); iniciarJogo(); }
function iniciarIntervalo(i, f) { palavrasParaOJogo = vocabulario.slice(i, f); iniciarJogo(); }

function iniciarJogo() {
    esconderTodosMenus();
    document.getElementById("palavra-box").style.display = "flex"; 
    document.getElementById("opcoes-container").style.display = "flex"; 
    document.getElementById("contador-container").style.display = "flex";
    palavrasParaOJogo.sort(() => Math.random() - 0.5);
    acertos = 0; erros = 0;
    document.getElementById("acertos-box").textContent = "0";
    document.getElementById("erros-box").textContent = "0";
    proximaRodada();
}

function proximaRodada() {
    if (palavrasParaOJogo.length === 0) { finalizarTeste(); return; }
    
    let atual = palavrasParaOJogo.shift();
    document.getElementById("palavra-box").textContent = atual.exibir;
    
    const containerOpcoes = document.getElementById("opcoes-container");
    containerOpcoes.innerHTML = "";
    
    let opcoes = [atual.correta];
    while (opcoes.length < 4) {
        let sorteio = vocabulario[Math.floor(Math.random() * vocabulario.length)].correta;
        if (!opcoes.includes(sorteio)) opcoes.push(sorteio);
    }
    
    opcoes.sort(() => Math.random() - 0.5).forEach(op => {
        const btn = document.createElement("button");
        btn.className = "opcao-btn"; 
        btn.textContent = op;
        btn.onclick = () => {
            if (op === atual.correta) { 
                acertos++; 
                document.getElementById("acertos-box").textContent = acertos; 
            } else { 
                erros++; 
                document.getElementById("erros-box").textContent = erros; 
            }
            setTimeout(proximaRodada, 400);
        };
        containerOpcoes.appendChild(btn);
    });
}

function finalizarTeste() {
    document.getElementById("palavra-box").textContent = "Fim do Treino!";
    document.getElementById("opcoes-container").style.display = "none";
    document.getElementById("btn-reiniciar").style.display = "block";
}

function filtrarPalavras() {
    const termo = document.getElementById("campo-busca").value.toLowerCase();
    document.querySelectorAll(".item-dicionario").forEach(item => {
        item.style.display = item.innerText.toLowerCase().includes(termo) ? "grid" : "none";
    });
}