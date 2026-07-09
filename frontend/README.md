# EcoRoute Frontend

Este diretório contém a aplicação React/Vite da EcoRoute.

Documentação completa do projeto, arquitetura, rotas, variáveis de ambiente, deploy e perfis de demonstração está no [README principal](../README.md).

## Scripts principais

```bash
npm run dev
npm run lint -- --max-warnings=0
npm run build
npm start
```

## Observação de deploy

No Railway, o frontend é compilado com `npm run build` e servido por `server.js`, que entrega os arquivos estáticos de `dist` e aplica fallback para rotas internas da SPA.
