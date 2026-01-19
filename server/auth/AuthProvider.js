const msal = require('@azure/msal-node');
const { msalConfig, REDIRECT_URI } = require('./Config');

class AuthProvider {
    constructor(msalConfig) {
        this.msalConfig = msalConfig;
        this.cryptoProvider = new msal.CryptoProvider();
    }

    getMsalInstance(msalConfig) {
        return new msal.ConfidentialClientApplication(msalConfig);
    }

    async login(req, res, next) {
        const msalInstance = this.getMsalInstance(this.msalConfig);

        const { verifier, challenge } = await this.cryptoProvider.generatePkceCodes();

        const state = this.cryptoProvider.base64Encode(
            JSON.stringify({
                csrfToken: this.cryptoProvider.createNewGuid(),
                redirectTo: req.query.redirectTo || '/',
            })
        );

        req.session.pkceCodes = {
            challengeMethod: 'S256',
            verifier: verifier,
            challenge: challenge,
        };

        req.session.authCodeUrlRequest = {
            redirectUri: REDIRECT_URI,
            responseMode: 'form_post',
            codeChallenge: challenge,
            codeChallengeMethod: 'S256',
            state: state,
            scopes: ['User.Read'],
            prompt: 'login',
            loginHint: req.body.username || req.query.username,
        };

        try {
            const authCodeUrlResponse = await msalInstance.getAuthCodeUrl(req.session.authCodeUrlRequest);
            res.redirect(authCodeUrlResponse);
        } catch (error) {
            next(error);
        }
    }

    async handleRedirect(req, res, next) {
        if (!req.body.state) {
            return next(new Error('State not found'));
        }

        const state = JSON.parse(this.cryptoProvider.base64Decode(req.body.state));

        if (!req.session.pkceCodes) {
            return next(new Error('PKCE Codes not found in session'));
        }

        const msalInstance = this.getMsalInstance(this.msalConfig);

        try {
            const tokenRequest = {
                code: req.body.code,
                codeVerifier: req.session.pkceCodes.verifier,
                redirectUri: REDIRECT_URI,
                scopes: ['User.Read'],
            };

            const tokenResponse = await msalInstance.acquireTokenByCode(tokenRequest);

            // ========================================
            // DADOS DA AUTENTICAÇÃO
            // ========================================
            const account = tokenResponse.account;
            const accessToken = tokenResponse.accessToken;
            const idToken = tokenResponse.idToken;
            const expiresOn = tokenResponse.expiresOn;
            const idTokenClaims = tokenResponse.idTokenClaims || {};

            // ========================================
            // BUSCAR TODOS OS DADOS DO MICROSOFT GRAPH
            // ========================================

            // Função auxiliar para chamadas ao Graph
            const fetchGraph = async (endpoint) => {
                try {
                    const response = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    });
                    if (response.ok) return await response.json();
                    return null;
                } catch (e) {
                    console.error(`Erro ao buscar ${endpoint}:`, e.message);
                    return null;
                }
            };

            // 1. Dados completos do perfil (com todos os campos possíveis)
            let graphData = {};
            try {
                const response = await fetch('https://graph.microsoft.com/v1.0/me?$select=id,displayName,givenName,surname,mail,userPrincipalName,jobTitle,department,officeLocation,mobilePhone,businessPhones,preferredLanguage,employeeId,employeeType,employeeHireDate,companyName,streetAddress,city,state,postalCode,country,usageLocation,ageGroup,legalAgeGroupClassification,consentProvidedForMinor,createdDateTime,lastPasswordChangeDateTime,signInSessionsValidFromDateTime,accountEnabled,mailNickname,onPremisesSamAccountName,onPremisesUserPrincipalName,onPremisesDomainName,onPremisesLastSyncDateTime,onPremisesSyncEnabled,proxyAddresses,otherMails,faxNumber,imAddresses,isResourceAccount,showInAddressList,userType', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                if (response.ok) {
                    graphData = await response.json();
                }
            } catch (e) {
                console.error('Erro ao buscar perfil completo:', e.message);
            }

            // 2. Foto do perfil (convertida para base64)
            let photoBase64 = null;
            try {
                const photoResponse = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                if (photoResponse.ok) {
                    const arrayBuffer = await photoResponse.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    photoBase64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
                }
            } catch (e) {
                console.log('Foto não disponível:', e.message);
            }

            // 3. Gerente (manager)
            const manager = await fetchGraph('/me/manager');

            // ========================================
            // ESTRUTURA COMPLETA COM TODOS OS DADOS
            // ========================================
            const userProfile = {
                // === DADOS BÁSICOS DO TOKEN ===
                _tokenInfo: {
                    accessToken: accessToken ? `${accessToken.substring(0, 50)}...` : null,
                    idToken: idToken ? `${idToken.substring(0, 50)}...` : null,
                    expiresOn: expiresOn,
                    scopes: tokenResponse.scopes,
                },

                // === DADOS DA CONTA MSAL ===
                _msalAccount: {
                    homeAccountId: account.homeAccountId,
                    environment: account.environment,
                    tenantId: account.tenantId,
                    username: account.username,
                    localAccountId: account.localAccountId,
                    name: account.name,
                    idTokenClaims: account.idTokenClaims,
                },

                // === ID TOKEN CLAIMS COMPLETO ===
                _idTokenClaims: idTokenClaims,

                // === DADOS DO MICROSOFT GRAPH ===
                graph: {
                    // Identificação
                    id: graphData.id,
                    displayName: graphData.displayName,
                    givenName: graphData.givenName,
                    surname: graphData.surname,
                    mailNickname: graphData.mailNickname,
                    userPrincipalName: graphData.userPrincipalName,
                    userType: graphData.userType,

                    // Contato
                    mail: graphData.mail,
                    otherMails: graphData.otherMails,
                    mobilePhone: graphData.mobilePhone,
                    businessPhones: graphData.businessPhones,
                    faxNumber: graphData.faxNumber,
                    imAddresses: graphData.imAddresses,

                    // Organização
                    companyName: graphData.companyName,
                    department: graphData.department,
                    jobTitle: graphData.jobTitle,
                    officeLocation: graphData.officeLocation,
                    employeeId: graphData.employeeId,
                    employeeType: graphData.employeeType,
                    employeeHireDate: graphData.employeeHireDate,

                    // Endereço
                    streetAddress: graphData.streetAddress,
                    city: graphData.city,
                    state: graphData.state,
                    postalCode: graphData.postalCode,
                    country: graphData.country,
                    usageLocation: graphData.usageLocation,

                    // On-Premises (AD Local)
                    onPremisesSamAccountName: graphData.onPremisesSamAccountName,
                    onPremisesUserPrincipalName: graphData.onPremisesUserPrincipalName,
                    onPremisesDomainName: graphData.onPremisesDomainName,
                    onPremisesLastSyncDateTime: graphData.onPremisesLastSyncDateTime,
                    onPremisesSyncEnabled: graphData.onPremisesSyncEnabled,

                    // Configurações
                    preferredLanguage: graphData.preferredLanguage,
                    accountEnabled: graphData.accountEnabled,
                    showInAddressList: graphData.showInAddressList,
                    isResourceAccount: graphData.isResourceAccount,
                    proxyAddresses: graphData.proxyAddresses,

                    // Datas
                    createdDateTime: graphData.createdDateTime,
                    lastPasswordChangeDateTime: graphData.lastPasswordChangeDateTime,
                    signInSessionsValidFromDateTime: graphData.signInSessionsValidFromDateTime,

                    // Idade/Consentimento
                    ageGroup: graphData.ageGroup,
                    legalAgeGroupClassification: graphData.legalAgeGroupClassification,
                    consentProvidedForMinor: graphData.consentProvidedForMinor,
                },

                // === FOTO DO PERFIL ===
                photo: photoBase64,

                // === GERENTE ===
                manager: manager ? {
                    id: manager.id,
                    displayName: manager.displayName,
                    mail: manager.mail,
                    jobTitle: manager.jobTitle,
                    userPrincipalName: manager.userPrincipalName,
                } : null,

                // === METADADOS DA SESSÃO ===
                _session: {
                    authenticatedAt: new Date().toISOString(),
                    tokenExpiresOn: expiresOn,
                }
            };

            // Log completo para debug
            console.log('\n' + '='.repeat(60));
            console.log('DADOS COMPLETOS DO USUÁRIO AUTENTICADO');
            console.log('='.repeat(60));
            console.log(JSON.stringify(userProfile, null, 2));
            console.log('='.repeat(60) + '\n');

            // Salvar na sessão
            req.session.user = userProfile;
            req.session.accessToken = accessToken;
            req.session.idToken = idToken;
            req.session.isAuthenticated = true;

            const redirectTo = state.redirectTo || '/';
            res.redirect(redirectTo);
        } catch (error) {
            next(error);
        }
    }

    async logout(req, res, next) {
        req.session.destroy(() => {
            res.redirect('/');
        });
    }
}

const authProvider = new AuthProvider(msalConfig);

module.exports = authProvider;
