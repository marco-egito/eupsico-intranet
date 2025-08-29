// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.criarUsuarioComDados = functions.https.onCall(async (data, context) => {
  // 1. Verificar se o usuário que está fazendo a chamada está autenticado.
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "Você precisa estar logado para executar esta ação."
    );
  }

  // 2. Verificar se o usuário que está fazendo a chamada é um administrador.
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

  // 3. Se as verificações passaram, extrair os dados para criar o novo usuário.
  const { email, nome, contato, funcoes, inativo, primeiraFase, recebeDireto } = data; // ADICIONADO: primeiraFase e recebeDireto

  if (!email || !nome) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "O e-mail e o nome são obrigatórios."
    );
  }

  try {
    // A. Cria o usuário no Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      displayName: nome,
      disabled: inativo,
    });

    const uidNovoUsuario = userRecord.uid;

    // B. Cria o documento correspondente no Firestore com o UID gerado
    const novoUsuarioParaFirestore = {
      uid: uidNovoUsuario,
      nome: nome,
      email: email,
      contato: contato || "",
      funcoes: funcoes || [],
      inativo: inativo || false,
      primeiraFase: primeiraFase || false,   // ADICIONADO
      recebeDireto: recebeDireto || false,    // ADICIONADO
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await admin
        .firestore()
        .collection("usuarios")
        .doc(uidNovoUsuario)
        .set(novoUsuarioParaFirestore);

    return {
      status: "success",
      message: `Usuário ${nome} criado com sucesso! UID: ${uidNovoUsuario}`,
      uid: uidNovoUsuario,
    };
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});