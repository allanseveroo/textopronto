'use server';

import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

// Garante que o app Firebase Admin seja inicializado apenas uma vez.
if (!getApps().length) {
  try {
    // Tenta inicializar a partir da variável de ambiente (ideal para produção)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({
        credential: credential.cert(serviceAccount),
      });
    } else if (process.env.GCP_PROJECT) {
       // Em ambientes Google Cloud (como App Hosting/Cloud Run), as credenciais são automáticas
       initializeApp({
         projectId: process.env.GCP_PROJECT,
       });
    }
     else {
      console.warn("FIREBASE_SERVICE_ACCOUNT_KEY ou GCP_PROJECT não está definida. A API de webhook pode não funcionar corretamente.");
    }
  } catch (error) {
    console.error("Erro ao inicializar Firebase Admin SDK:", error);
  }
}

const db = getFirestore();

export async function POST(req: NextRequest) {
  const { headers } = req;
  const authorization = headers.get('Authorization');

  // 1. Validar a chave secreta do webhook
  const secret = process.env.WEBHOOK_SECRET;
  if (secret && authorization !== `Bearer ${secret}`) {
    console.warn('Falha na autorização do webhook: Chave secreta inválida ou ausente.');
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();
    // Ajuste para pegar o e-mail da estrutura de dados correta
    const userEmail = data.body?.customer?.email;

    if (!userEmail) {
      console.log('Webhook: O e-mail do cliente não foi encontrado no corpo da requisição.', data);
      return NextResponse.json({ success: false, error: 'Customer email is required in the request body' }, { status: 400 });
    }

    // 2. Encontrar o usuário pelo e-mail no Firestore
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', userEmail).limit(1).get();

    if (snapshot.empty) {
      console.log(`Webhook: Usuário com e-mail ${userEmail} não encontrado.`);
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // 3. Atualizar o documento do usuário encontrado
    const userDoc = snapshot.docs[0];
    await userDoc.ref.update({
      messageCount: 9999, // Define um valor alto para o plano pro
      plan: 'pro',       // Define o plano como 'pro'
    });

    console.log(`Usuário ${userDoc.id} (${userEmail}) atualizado para o plano 'pro'.`);
    return NextResponse.json({ success: true, userId: userDoc.id });

  } catch (error) {
    console.error('Erro no processamento do webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
