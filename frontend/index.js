import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent ensures the app is set up correctly for both
// Expo Go and native/web builds. Metro will use this file as the
// entry point instead of package.json "main" (which points to Electron).
registerRootComponent(App);
