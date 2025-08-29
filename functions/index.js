// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const gerarUsername = (nomeCompleto) => {
  if (!nomeCompleto || typeof nomeCompleto !== "string") return "";
  const nomes = nomeCompleto.trim().split(" ").filter(Boolean);
  if (nomes.length === 0) return "";
  if (nomes.length === 1) return nomes[0];
  return `${nomes[0]} ${nomes[nomes.length - 1]}`;
};

exports.criarUsuarioComDados = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Você precisa estar logado para executar esta ação.");
  }

  const uidChamador = context.auth.uid;
  const usuarioChamadorDoc = await admin.firestore().collection("usuarios").doc(uidChamador).get();

  if (!usuarioChamadorDoc.exists) {
      throw new functions.https.HttpsError("permission-denied", "O seu usuário admin não possui um registro no banco de dados.");
  }

  const funcoesChamador = usuarioChamadorDoc.data().funcoes || [];
  if (!funcoesChamador.includes("admin")) {
    throw new functions.https.HttpsError("permission-denied", "Você não tem permissão de administrador para criar novos usuários.");
  }

  const { email, nome, contato, funcoes, inativo, primeiraFase, recebeDireto, profissao, fazAtendimento } = data;

  if (!email || !nome) {
    throw new functions.https.HttpsError("invalid-argument", "O e-mail e o nome são obrigatórios.");
  }

  try {
    const username = gerarUsername(nome);

    const userRecord = await admin.auth().createUser({
      email: email,
      displayName: nome,
      disabled: inativo,
    });

    const uidNovoUsuario = userRecord.uid;

    const novoUsuarioParaFirestore = {
      uid: uidNovoUsuario,
      nome: nome,
      username: username,
      email: email,
      contato: contato || "",
      funcoes: funcoes || [],
      inativo: inativo || false,
      primeiraFase: primeiraFase || false,
      recebeDireto: recebeDireto || false,
      profissao: profissao || "Não especificada",
      fazAtendimento: fazAtendimento || false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await admin.firestore().collection("usuarios").doc(uidNovoUsuario).set(novoUsuarioParaFirestore);

    return {
      status: "success",
      message: `Usuário ${nome} criado com sucesso!`,
      uid: uidNovoUsuario,
    };
  } catch (error) {
    console.error("Erro interno detalhado ao criar usuário:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});