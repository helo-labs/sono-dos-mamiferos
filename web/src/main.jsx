import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./estilos.css";

const raiz = document.getElementById("root");
// Sem isso, um index.html sem a div dá um erro interno do React e uma tela
// branca sem pista nenhuma do que aconteceu.
if (!raiz) throw new Error('index.html sem <div id="root">: a página não tem onde montar.');

ReactDOM.createRoot(raiz).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
