// js/main.js (Versão Limpa e Final)

import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

window.db = db;
window.auth = auth;

const authView = document.getElementById('#auth-view');
const appView = document.getElementById('app-view');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const appContainer = document.getElementById('app-container');
const userInfo = document.getElementById('user-info');

// --- LÓGICA DE LOGOUT AUTOMÁTICO ---
let inactivityTimer;
function resetInactivityTimer() { clearTimeout(inactivityTimer); inactivityTimer = setTimeout(() => { alert("Sua sessão expirou por inatividade."); signOut(auth); }, 40 * 60 * 1000); }
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
        appContainer.innerHTML = `<p style="color:red;">Erro: ${error.message}</p>`;
        console.error(error);
    }
}

// Lista de módulos para fácil gerenciamento
const modules = [
    { file: "intranet_geral.html", title: "Intranet Geral", description: "Avisos, notícias e informações para todos.", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V17h6v-1.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V17h6V9H6v1.5a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V6Z"/><path d="M16 3v4"/><path d="M8 3v4"/></svg>` },
    { file: "intranet_rh.html", title: "Intranet RH", description: "Recursos humanos, vagas e comunicados.", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
    { file: "financeiro.html", title: "Intranet Financeiro", description: "Painel de controle financeiro e relatórios.", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>` },
    { file: "intranet_administrativo.html", title: "Intranet Administrativo", description: "Processos, documentos e organização.", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>` },
    { file: "intranet_gestao.html", title: "Intranet Gestão", description: "Relatórios gerenciais e planejamento.", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>` },
    { file: "intranet_supervisao.html", title: "Intranet Supervisão", description: "Acompanhamento de equipes e feedback.", icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>` },
];

function renderModuleSelection() {
    let cardsHtml = modules.map(module => `
        <div class="module-card" data-module="${module.file}">
            <div class="module-card-icon">${module.icon}</div>
            <div class="module-card-text">
                <h3>${module.title}</h3>
                <p>${module.description}</p>
            </div>
        </div>
    `).join('');

    appContainer.innerHTML = `
        <h2 class="page-title">Módulos da Intranet</h2>
        <div class="module-selection">${cardsHtml}</div>
    `;
    
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