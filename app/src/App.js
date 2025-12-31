import React from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "./authConfig";

function App() {
  const { instance, accounts } = useMsal();

  const handleLogin = () => {
    instance.loginRedirect(loginRequest);
  };

  const handleLogout = () => {
    instance.logoutRedirect();
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Amphibien Erfassung</h1>

      {accounts.length === 0 ? (
        <button onClick={handleLogin}>
          Login (E-Mail Einmalcode)
        </button>
      ) : (
        <>
          <p>
            Angemeldet als: <b>{accounts[0].username}</b>
          </p>
          <button onClick={handleLogout}>Logout</button>
        </>
      )}
    </div>
  );
}

export default App;
