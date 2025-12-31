// app/src/authConfig.js

const tenantId = "ea38bc20-4e77-45d4-8709-9cd306790122";
const tenantSubdomain = "amphibienusers"; // dein External-ID Tenant Subdomain-Name
const signUpSignInPolicy = "signup_signin_otp";

export const msalConfig = {
  auth: {
    clientId: "1ca61a25-3215-44b7-baf7-dbb0bc9960dc",
    // WICHTIG: authority ohne /v2.0 am Ende
    authority: `https://${tenantSubdomain}.ciamlogin.com/${tenantId}`,
    knownAuthorities: [`${tenantSubdomain}.ciamlogin.com`],

    // Damit es lokal UND in der SWA funktioniert:
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["openid", "profile", "email"],
  extraQueryParameters: {
    // Userflow/Policy an die Authorize-URL anhängen
    p: signUpSignInPolicy,
  },
};
