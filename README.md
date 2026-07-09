# EcoRoute

Plataforma web full-stack para gerenciamento, descarte orientado e coleta inteligente de resíduos urbanos recicláveis.

## Visão geral

A EcoRoute é uma aplicação web voltada ao contexto brasileiro de gestão de resíduos. O sistema reúne três fluxos principais: consulta de pontos de descarte, solicitação de coleta no endereço informado pelo usuário e gestão operacional por prestadores e administradores.

O projeto foi desenvolvido como demonstração completa para Sistemas de Informação, com frontend, backend, banco de dados, autenticação, perfis de acesso, mapas, precificação, painel administrativo, agenda, notificações, cobrança demonstrativa via Pix e módulo de previsão para apoio à distribuição de coletas.

## Problema atendido

O descarte incorreto de resíduos recicláveis ocorre, em parte, porque o cidadão não encontra rapidamente onde descartar cada material ou não consegue transportar o resíduo até um ecoponto. Empresas, condomínios e residências também precisam de uma forma simples de solicitar retirada no próprio endereço, com preço calculado por material, peso, volume e distância.

A EcoRoute centraliza essas necessidades em uma única plataforma:

- consulta de pontos de descarte por material com endereços verificáveis;
- mapa com ecopontos e cooperativas da base demonstrativa brasileira;
- pedido de coleta domiciliar ou empresarial;
- estimativa de preço por tipo, peso, volume e deslocamento;
- painel do cliente com histórico e cobranças;
- painel do prestador com tarefas, rotas e status;
- painel de administração para gestão de usuários, veículos, áreas, faturamento e indicadores.

## Perfis de demonstração

A aplicação possui três rotas de entrada para demonstração:

| Perfil | Rota | E-mail | Senha |
| --- | --- | --- | --- |
| Cliente | `/demo/cliente` | `demo@ecoroute.com.br` | `EcoRoute@2026` |
| Prestador | `/demo/prestador` | `prestador@ecoroute.com.br` | `EcoRoute@2026` |
| Administração | `/demo/dono` | `dono@ecoroute.com.br` | `EcoRoute@2026` |

Essas rotas criam uma sessão local com token demonstrativo e carregam dados previamente preparados para apresentar o funcionamento do sistema sem depender de cadastro manual.

## Funcionalidades principais

### Área pública

- página inicial institucional da EcoRoute;
- consulta e simulação de coleta;
- mapa com pontos de descarte por tipo de resíduo;
- seleção de endereço pelo mapa;
- estimativa de custo de retirada;
- páginas de contato, ajuda e informações gerais.

### Cliente

- painel com indicadores de pedidos;
- solicitação de coleta;
- upload de imagem do resíduo;
- acompanhamento de status;
- histórico de cobranças;
- pagamento em dinheiro ou Pix demonstrativo;
- comprovante de pagamento;
- perfil do usuário.

### Prestador

- painel de disponibilidade;
- listagem de tarefas;
- aceite de coleta;
- visualização de rota;
- fluxo operacional de atendimento;
- atualização de status;
- confirmação de pagamento em dinheiro;
- notificações de operação.

### Administração

- painel geral com indicadores;
- gestão de usuários;
- gestão de cooperativas;
- gestão de áreas de atendimento;
- gestão de motoristas;
- gestão de veículos;
- painel de cobrança;
- configuração de preços;
- estatísticas de coleta;
- relatórios;
- mensagens internas;
- agenda inteligente com apoio de ML.

## Arquitetura

A EcoRoute utiliza uma arquitetura cliente-servidor:

- **Frontend:** React, Vite, Zustand, Tailwind CSS, Leaflet e componentes reutilizáveis.
- **Backend:** Node.js, Express, Mongoose, autenticação JWT, controllers, services e middlewares.
- **Banco de dados:** MongoDB.
- **Tempo real:** Socket.IO para avisos operacionais.
- **Agenda e automação:** node-cron para rotinas internas.
- **ML demonstrativo:** FastAPI, scikit-learn e modelo Gradient Boosting para previsão de volume de resíduos por área.
- **Deploy:** Railway, com serviços separados para frontend e backend dentro do mesmo projeto.

## Estrutura de pastas

```text
.
├── backend/
│   ├── app.js
│   ├── server.js
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── services/
│   ├── middlewares/
│   ├── domains/
│   ├── data/
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── stores/
│   │   ├── utils/
│   │   └── assets/
│   ├── public/
│   └── server.js
├── ml/
│   ├── data/
│   ├── models/
│   ├── main.py
│   ├── train.py
│   ├── model.py
│   ├── scheduler.py
│   ├── data_generator.py
│   └── brazil_holidays.py
├── package.json
├── railway.json
└── README.md
```

## Backend

O backend concentra regras de negócio, persistência e integração entre módulos.

### Principais grupos de rotas

| Grupo | Finalidade |
| --- | --- |
| `/api/auth` | autenticação, cadastro e sessão |
| `/api/demo` | dados e rotas de demonstração |
| `/api/pickups` | pedidos de coleta |
| `/api/payments` | pagamento de pedidos |
| `/api/billing` | cobranças mensais |
| `/api/locations` | pontos e locais |
| `/api/organizations` | cooperativas e organizações |
| `/api/drivers` | prestadores/motoristas |
| `/api/areas` | áreas de atendimento |
| `/api/ml-schedule` | agenda inteligente |
| `/api/contact` | mensagens de contato |
| `/api/history` | histórico operacional |
| `/api/notifications` | notificações |

### Camadas internas

- **Routes:** recebem as chamadas HTTP e aplicam middlewares.
- **Controllers:** coordenam entrada, validação e resposta.
- **Services:** concentram regras reutilizáveis.
- **Models:** definem entidades MongoDB via Mongoose.
- **Domains:** organizam regras por área funcional.
- **Middlewares:** tratam autenticação, papel, upload, limite de requisição e segurança.

## Banco de dados

As principais entidades são:

| Modelo | Descrição |
| --- | --- |
| `User` | usuários dos perfis cliente, prestador e administração |
| `Organization` | cooperativas ou organizações de coleta |
| `Area` | regiões atendidas |
| `Truck` | veículos disponíveis |
| `PickupRequest` | solicitação de coleta |
| `PickupEvent` | eventos do ciclo de vida da coleta |
| `Payment` | transações de pagamento de pedidos |
| `Billing` | cobranças mensais |
| `PricingConfig` | configuração de preço |
| `Location` | pontos de coleta/descarte |
| `MLSchedule` | agenda gerada para operação |
| `WasteLog` | dados de apoio ao módulo de previsão |

## Fluxo de coleta

1. O usuário informa endereço, tipo de resíduo, peso/volume e observações.
2. O sistema consulta pontos e calcula estimativa.
3. O pedido é criado em `PickupRequest`.
4. O pagamento é escolhido: dinheiro ou Pix demonstrativo.
5. O pedido é liberado para prestadores.
6. O prestador aceita a tarefa.
7. A tarefa passa por deslocamento, chegada, coleta e conclusão.
8. O cliente acompanha o status no painel.
9. A administração vê indicadores e histórico.

## Precificação

O cálculo considera:

- categoria do resíduo;
- dificuldade ou nível informado;
- peso estimado;
- volume;
- distância entre endereço e base/cooperativa;
- área atendida;
- parâmetros configuráveis no painel administrativo.

O objetivo é demonstrar uma regra de negócio coerente com a proposta da work order: cobrança por peso, volume e tipo de material.

## Pagamento Pix demonstrativo

A aplicação usa um serviço interno chamado `pixService`. Ele simula o contrato de uma integração Pix/PagSeguro:

- gera um identificador único de transação;
- assina o payload no backend;
- envia o usuário para um callback demonstrativo;
- valida a assinatura no retorno;
- marca o pagamento como concluído;
- grava uma referência `PAGSEGURO-PIX-*`.

Esse fluxo é suficiente para apresentação acadêmica e não processa pagamento real.

Variáveis relacionadas:

```env
PAGSEGURO_MERCHANT_ID=ECOROUTE-DEMO
PAGSEGURO_SECRET_KEY=replace-with-demo-signature-secret
```

## Frontend

O frontend foi construído com React e Vite. A interface usa navegação por perfil, rotas protegidas, estados globais com Zustand, componentes reutilizáveis e assets brasileiros.

### Rotas públicas

| Rota | Tela |
| --- | --- |
| `/` | página inicial |
| `/request-pickup` | consulta/simulação de coleta |
| `/about-us` | sobre |
| `/contact-us` | contato |
| `/help-support` | ajuda |
| `/login` | login |
| `/signup` | cadastro |

### Rotas autenticadas do cliente

| Rota | Tela |
| --- | --- |
| `/customer-dashboard` | painel do cliente |
| `/upload-waste` | envio de resíduo |
| `/schedule` | agenda |
| `/billing` | cobranças |
| `/searching` | busca de prestador |
| `/payment-success` | comprovante |
| `/profile` | perfil |

### Rotas autenticadas do prestador

| Rota | Tela |
| --- | --- |
| `/driver-dashboard` | painel do prestador |
| `/accept-task` | aceitar tarefa |
| `/task-route/:pickupId` | rota da coleta |
| `/task-flow/:pickupId` | fluxo de atendimento |
| `/driver-notifications` | notificações |

### Rotas administrativas

| Rota | Tela |
| --- | --- |
| `/admin-dashboard` | painel geral |
| `/admin-dashboard/users` | usuários |
| `/admin-dashboard/organizations` | cooperativas |
| `/admin-dashboard/areas` | áreas |
| `/admin-dashboard/drivers` | prestadores |
| `/admin-dashboard/vehicles` | veículos |
| `/admin-dashboard/billing` | cobranças |
| `/admin-dashboard/pricing` | preços |
| `/admin-dashboard/pickup-stats` | estatísticas |
| `/admin-dashboard/reports` | relatórios |
| `/admin-dashboard/contact` | contato |

## ML e agenda inteligente

O módulo `ml` gera previsão de volume de resíduos por área e apoia a distribuição de veículos. Ele usa um dataset sintético da Grande São Paulo, com:

- bairros e regiões paulistas;
- estações brasileiras;
- feriados nacionais e municipais;
- variação por fim de semana;
- tipos de região: comercial, residencial, suburbana, rural e industrial.

Arquivos principais:

| Arquivo | Função |
| --- | --- |
| `data_generator.py` | gera dataset sintético |
| `brazil_holidays.py` | define feriados brasileiros |
| `train.py` | treina o modelo |
| `model.py` | carrega modelo e faz previsão |
| `scheduler.py` | distribui veículos |
| `main.py` | expõe API FastAPI |

## Instalação local

### Requisitos

- Node.js 20 ou superior;
- npm;
- MongoDB local ou URL MongoDB Atlas;
- Python 3.12 ou superior para o módulo ML;
- navegador moderno.

### Backend

```bash
npm install
cp .env.example .env
npm run dev
```

O backend roda, por padrão, em:

```text
http://localhost:5001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend roda, por padrão, em:

```text
http://localhost:5173
```

### ML

```bash
cd ml
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python data_generator.py
.venv/bin/python train.py
.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
```

O serviço de ML roda, por padrão, em:

```text
http://localhost:8000
```

## Variáveis de ambiente

As variáveis principais ficam em `.env.example`:

```env
PORT=5001
NODE_ENV=development
APP_TIMEZONE=America/Sao_Paulo
MONGO_URL=mongodb://localhost:27017/ecoroute
JWT_SECRET=replace-with-a-long-random-secret
CRON_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5001
ML_SERVICE_URL=http://localhost:8000
PAGSEGURO_MERCHANT_ID=ECOROUTE-DEMO
PAGSEGURO_SECRET_KEY=replace-with-demo-signature-secret
```

## Scripts

### Raiz

| Script | Comando | Função |
| --- | --- | --- |
| `npm start` | `node backend/server.js` | inicia backend |
| `npm run dev` | `nodemon backend/server.js` | inicia backend com reload |
| `npm test` | `node --test` | executa testes |
| `npm run lint:frontend` | `npm --prefix frontend run lint -- --max-warnings=0` | lint do frontend |
| `npm run build:frontend` | `npm --prefix frontend run build` | build do frontend |

### Frontend

| Script | Comando | Função |
| --- | --- | --- |
| `npm run dev` | `vite` | servidor local |
| `npm run build` | `vite build` | build de produção |
| `npm run lint` | `eslint .` | lint |
| `npm run preview` | `vite preview` | preview |
| `npm start` | `node server.js` | servidor estático |

## Testes e validação

Comandos recomendados:

```bash
npm test
npm --prefix frontend run lint -- --max-warnings=0
npm --prefix frontend run build
```

Os testes cobrem:

- ciclo de vida de pedidos;
- segurança de cobrança;
- validação de métodos de pagamento;
- otimização de veículos;
- rotas de demonstração.

## Deploy

O deploy recomendado é no Railway, com backend e frontend no mesmo projeto:

- serviço do backend usando `npm start`;
- serviço do frontend usando `frontend/server.js`;
- variáveis de ambiente configuradas no painel;
- MongoDB Atlas ou outro MongoDB externo;
- domínio gerado pelo Railway.

## Segurança

Medidas implementadas:

- autenticação JWT;
- hash de senha;
- controle de papel;
- CORS configurável;
- Helmet;
- rate limit;
- limite de corpo JSON;
- verificação de assinatura no Pix demonstrativo;
- validação de acesso por usuário, organização e papel.

## Status acadêmico

A EcoRoute é uma demonstração funcional de plataforma completa. O sistema apresenta frontend, backend, banco de dados, autenticação, dados de demonstração, painel administrativo, fluxo operacional e módulo de previsão. Para uso comercial, seriam necessários credenciais reais de pagamento, auditoria jurídica, política de privacidade, homologação de mapas, revisão de acessibilidade e operação permanente dos dados de ecopontos.
