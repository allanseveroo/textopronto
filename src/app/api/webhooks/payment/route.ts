'use server';

import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

// Evita a reinicialização do app em ambiente de desenvolvimento
if (!getApps().length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    initializeApp({
      credential: credential.cert(serviceAccount),
    });
  } else {
    // Para desenvolvimento local sem a variável de ambiente setada
    console.warn("FIREBASE_SERVICE_ACCOUNT_KEY não está definida. A API de webhook pode não funcionar.");
    // Você pode querer inicializar com um arquivo local aqui para testes, se necessário
  }
}

const db = getFirestore();

export async function POST(req: NextRequest) {
  const { headers } = req;
  const authorization = headers.get('Authorization');

  // 1. Verificar a chave secreta do webhook
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const userEmail = body.email;

    if (!userEmail) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    // 2. Encontrar o usuário pelo e-mail no Firestore
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', userEmail).limit(1).get();

    if (snapshot.empty) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // 3. Atualizar o documento do usuário
    const userDoc = snapshot.docs[0];
    await userDoc.ref.update({
      messageCount: 9999, // Ou qualquer valor para o plano pro
      plan: 'pro',
    });

    return NextResponse.json({ success: true, userId: userDoc.id });

  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
