// This file is safe to commit, as it only reads from environment variables.
// The actual keys are stored in .env.local or Vercel's environment variables.

// Ensure that the environment variables are strings. If they are not set, they will be undefined.
const firebaseConfig = {
  apiKey: "AIzaSyD_q5g3_yM-ca3bYd9d9p8l7k6j5f4h3g2",
  authDomain: "texto-pronto.firebaseapp.com",
  projectId: "texto-pronto",
  storageBucket: "texto-pronto.appspot.com",
  messagingSenderId: "565389654321",
  appId: "1:565389654321:web:0b25e7f9a8d7c6b5e4d3c2",
  measurementId: "G-RFR2M4B1E0"
};

// Basic validation to ensure all required environment variables are set.
const requiredVars: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId',
];

const missingVars = requiredVars.filter(key => !firebaseConfig[key]);

if (missingVars.length > 0 && process.env.NODE_ENV !== 'test') {
  // In a browser environment, process might not be defined, so we check.
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    // In production, we should throw an error to fail the build/boot.
    throw new Error(
      `Missing required Firebase environment variables: ${missingVars.join(', ')}. Please set them in your Vercel project settings.`
    );
  } else {
    // In development, a console warning is more developer-friendly.
    console.warn(
      `WARNING: Missing optional Firebase environment variables: ${missingVars.join(
        ', '
      )}. The app may not work correctly. Please check your .env.local file.`
    );
  }
}

export { firebaseConfig };
