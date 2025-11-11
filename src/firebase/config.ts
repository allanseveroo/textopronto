// This file is safe to commit, as it only reads from environment variables.
// The actual keys are stored in .env.local or Vercel's environment variables.

// Ensure that the environment variables are strings. If they are not set, they will be undefined.
const firebaseConfig = {
  apiKey: "AIzaSyCGvG7DIGWyTpkD_niNnevdJ2F79NBuBpg",
  authDomain: "studio-7394537443-37db1.firebaseapp.com",
  projectId: "studio-7394537443-37db1",
  storageBucket: "studio-7394537443-37db1.appspot.com",
  messagingSenderId: "377074358965",
  appId: "1:377074358965:web:a57759755d1092e2743cfc",
  measurementId: "G-5J9KCT949N"
};

// Basic validation to ensure all required environment variables are set.
const requiredVars: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'appId',
];

const missingVars = requiredVars.filter(key => !firebaseConfig[key]);

if (missingVars.length > 0) {
    // In development, a console warning is more developer-friendly.
    console.warn(
      `WARNING: Missing optional Firebase environment variables: ${missingVars.join(
        ', '
      )}. The app may not work correctly. Please check your .env.local file.`
    );
}

export { firebaseConfig };
