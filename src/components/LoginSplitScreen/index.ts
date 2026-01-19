/**
 * LoginSplitScreen Components Export
 * 
 * Duas versões disponíveis:
 * 
 * 1. LoginSplitScreen (Express)
 *    - Usa servidor Express em https://localhost:3000
 *    - Ideal para desenvolvimento local
 * 
 * 2. LoginSplitScreenMSAL (Browser)
 *    - Usa MSAL diretamente no browser
 *    - Ideal para produção sem servidor backend
 * 
 * @example Express Version
 * import { LoginSplitScreen } from './components/LoginSplitScreen';
 * <LoginSplitScreen authServerUrl="https://localhost:3000" />
 * 
 * @example MSAL Version
 * import { LoginSplitScreenMSAL } from './components/LoginSplitScreen';
 * <LoginSplitScreenMSAL redirectTo="/dashboard" />
 */

// Versão Express (servidor backend)
export { default as LoginSplitScreen } from './LoginSplitScreen';

// Versão MSAL Browser (direto no browser)
export { default as LoginSplitScreenMSAL } from './LoginSplitScreenMSAL';

// Default export (MSAL para produção)
export { default } from './LoginSplitScreenMSAL';
