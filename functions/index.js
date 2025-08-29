// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Função auxiliar para gerar o username
const gerarUsername = (nomeCompleto) => {
  if (!nomeCompleto || typeof nomeCompleto !== "string") {
    return "";
  }
  const nomes = nomeCompleto.trim().split(" ").filter(Boolean);
  if (nomes.length === 0) {
    return "";
  }
  if (nomes.length === 1) {
    return nomes[0];
  }
  return `${nomes[0]} ${nomes[nomes.length - 1]}`;
};

exports.criarUsuarioComDados = functions.https.onCall(async (data, context) => {
  // 1. Verificações de segurança (se o chamador está logado e é admin)
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "Você precisa estar logado para executar esta ação."
    );
  }
  const uidChamador = context.auth.uid;
  const usuarioChamadorDoc = await admin
      .firestore()
      .collection("usuarios")
      .doc(uidChamador)
      .get();
  const funcoesChamador = usuarioChamadorDoc.data().funcoes || [];
  if (!funcoesChamador.includes("admin")) {
    throw new functions.https.HttpsError(
        "permission-denied",
        "Você não tem permissão de administrador para criar novos usuários."
    );
  }

  // 2. Extrair todos os dados, incluindo os novos
  const {
    email,
    nome,
    contato,
    funcoes,
    inativo,
    primeiraFase,
    recebeDireto,
    profissao,          // ADICIONADO
    fazAtendimento,     // ADICIONADO
  } = data;

  if (!email || !nome) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "O e-mail e o nome são obrigatórios."
    );
  }

  try {
    // 3. Gerar o username a partir do nome completo
    const username = gerarUsername(nome); // ADICIONADO

    // 4. Criar o usuário no Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      displayName: nome,
      disabled: inativo,
    });

    const uidNovoUsuario = userRecord.uid;

    // 5. Preparar o documento completo para o Firestore
    const novoUsuarioParaFirestore = {
      uid: uidNovoUsuario,
      nome: nome,
      username: username,                 // ADICIONADO
      email: email,
      contato: contato || "",
      funcoes: funcoes || [],
      inativo: inativo || false,
      primeiraFase: primeiraFase || false,
      recebeDireto: recebeDireto || false,
      profissao: profissao || "Não especificada", // ADICIONADO
      fazAtendimento: fazAtendimento || false,      // ADICIONADO
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await admin
        .firestore()
        .collection("usuarios")
        .doc(uidNovoUsuario)
        .set(novoUsuarioParaFirestore);

    return {
      status: "success",
      message: `Usuário ${nome} criado com sucesso!`,
      uid: uidNovoUsuario,
    };
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});