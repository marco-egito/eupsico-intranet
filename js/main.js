// js/main.js

// Importa os serviços de autenticação e banco de dados do nosso arquivo de configuração
import { auth, db } from './firebase-config.js';

// Importa as funções específicas do Firebase que vamos usar
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Disponibiliza o `db` e o `auth` globalmente para que as páginas carregadas dinamicamente possam acessá-los.
window.db = db;
window.auth = auth;

// Pega as referências dos elementos HTML
const authView = document.getElementById('auth-view');
const appView = document.getElementById('app-view');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const appContainer = document.getElementById('app-container');
const userInfo = document.getElementById('user-info');

// --- LÓGICA DE LOGOUT AUTOMÁTICO ---
let inactivityTimer;
function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        alert("Sua sessão expirou por inatividade. Por favor, faça o login novamente.");
        signOut(auth);
    }, 40 * 60 * 1000);
}
function stopInactivityTimer() { clearTimeout(inactivityTimer); }
const userActivityEvents = ['mousemove', 'mousedown', 'click', 'scroll', 'keydown'];
function setupActivityListeners() { userActivityEvents.forEach(event => { window.addEventListener(event, resetInactivityTimer, true); }); }
function removeActivityListeners() { userActivityEvents.forEach(event => { window.removeEventListener(event, resetInactivityTimer, true); }); }

// --- LÓGICA DE CARREGAMENTO DE MÓDULOS ---
async function loadModule(moduleFile) {
    try {
        appContainer.innerHTML = 'Carregando módulo...';
        const response = await fetch(moduleFile);
        if (!response.ok) throw new Error(`Módulo não encontrado (${response.status})`);
        const moduleContent = await response.text();
        appContainer.innerHTML = moduleContent;
        const scripts = appContainer.querySelectorAll('script');
        scripts.forEach(script => {
            const newScript = document.createElement('script');
            newScript.text = script.innerText;
            if (script.type === 'module' || script.innerHTML.includes('import')) {
                newScript.type = 'module';
            }
            document.body.appendChild(newScript).parentNode.removeChild(newScript);
        });
    } catch (error) {
        appContainer.innerHTML = `<p style="color:red;">Erro ao carregar o módulo: ${error.message}</p>`;
        console.error(error);
    }
}
function renderModuleSelection() {
    appContainer.innerHTML = `<div class="module-selection"><div class="module-card" data-module="intranet_geral.html"><h3>Intranet Geral</h3><p>Avisos, notícias e informações para todos.</p></div><div class="module-card" data-module="intranet_rh.html"><h3>Intranet RH</h3><p>Recursos humanos, vagas e comunicados.</p></div><div class="module-card" data-module="financeiro.html"><h3>Intranet Financeiro</h3><p>Painel de controle financeiro e relatórios.</p></div><div class="module-card" data-module="intranet_administrativo.html"><h3>Intranet Administrativo</h3><p>Processos, documentos e organização.</p></div><div class="module-card" data-module="intranet_servico_social.html"><h3>Intranet Serviço Social</h3><p>Atendimentos, casos e acompanhamentos.</p></div><div class="module-card" data-module="intranet_gestao.html"><h3>Intranet Gestão</h3><p>Relatórios gerenciais e planejamento estratégico.</p></div><div class="module-card" data-module="intranet_supervisao.html"><h3>Intranet Supervisão</h3><p>Acompanhamento de equipes e feedback.</p></div><div class="module-card" data-module="intranet_marketing.html"><h3>Intranet Marketing</h3><p>Campanhas, materiais e planejamento.</p></div><div class="module-card" data-module="intranet_captacao.html"><h3>Intranet Captação</h3><p>Leads, matrículas e funil de conversão.</p></div></div>`;
    document.querySelectorAll('.module-card').forEach(card => {
        card.addEventListener('click', () => {
            const moduleFile = card.getAttribute('data-module');
            loadModule(moduleFile);
        });
    });
}

// --- CONTROLE PRINCIPAL DE AUTENTICAÇÃO E EVENTOS ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        userInfo.textContent = user.email;
        authView.classList.add('hidden');
        appView.classList.remove('hidden');
        renderModuleSelection();
        setupActivityListeners();
        resetInactivityTimer();
    } else {
        authView.classList.remove('hidden');
        appView.classList.add('hidden');
        document.getElementById('auth-message').innerText = 'Por favor, faça o login para continuar.';
        loginButton.classList.remove('hidden');
        stopInactivityTimer();
        removeActivityListeners();
    }
});

loginButton.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    signInWithPopup(auth, provider);
});

logoutButton.addEventListener('click', () => signOut(auth));