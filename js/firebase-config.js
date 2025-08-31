// js/firebase-config.js

// Este arquivo agora depende que 'firebase-keys.js' tenha sido carregado antes no HTML,
// o que torna a variável `firebaseConfig` globalmente disponível.

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Inicializa o app usando a configuração do arquivo firebase-keys.js
const app = initializeApp(firebaseConfig);

// Exporta os serviços que serão usados em outras partes do código
export const auth = getAuth(app);
export const db = getFirestore(app);
