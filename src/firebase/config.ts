// This file is safe to commit, as it only reads from environment variables.
// The actual keys are stored in .env.local or Vercel's environment variables.

// Ensure that the environment variables are strings. If they are not set, they will be undefined.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
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
  // During the build process (on Vercel, for example), process.env is available,
  // so we should throw an error if keys are missing.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `ERROR: Missing critical Firebase environment variables: ${missingVars.join(
        ', '
      )}. Please set them in your hosting environment.`
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
