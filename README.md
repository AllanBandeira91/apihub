# APIHub

> **APIHub** is an open-source API management platform for organizing API projects, documenting endpoints, testing requests, managing API keys, and monitoring usage.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.28-black.svg)](https://fastify.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-indigo.svg)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌟 Funcionalidades Principais

- **Workspaces & Multi-tenancy:** Organização hierárquica por Workspaces e Projetos com permissões granulares (`OWNER`, `ADMIN`, `EDITOR`, `VIEWER`).
- **Catalogação Completa de APIs:** Cadastro de endpoints (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`), headers, query parameters, corpo de requisição e múltiplos exemplos de resposta.
- **Exportação OpenAPI Automática:** Geração dinâmica e em tempo real de especificações OpenAPI 3.0 em JSON para consumo por Swagger UI ou ferramentas de terceiros.
- **API Tester com Proteção Ativa Anti-SSRF:** Execução de requisições HTTP/HTTPS com bloqueio estrito contra destinos internos (loopback 127.0.0.1, redes RFC 1918 e metadados de nuvem 169.254), além de limites configuráveis de timeout e tamanho de resposta.
- **Gerenciador de API Keys:** Emissão de chaves criptografadas (hash SHA-256), com exibição única no momento da criação e revogação instantânea.
- **Métricas & Logs Reais:** Histórico de execuções com contagem de requisições, latência média e distribuição de status HTTP derivados de dados reais.
- **Tema Visual Adaptativo:** Suporte nativo a Modo Escuro (padrão Black) e Modo Claro com persistência local.

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia | Propósito |
|---|---|---|
| **Frontend** | Next.js 14 + React + Tailwind CSS | Interface moderna, responsiva com suporte a temas |
| **Backend** | Node.js + Fastify + TypeScript | API REST de alta performance |
| **Validação** | Zod | Validação de schemas e entradas no frontend e backend |
| **Banco de Dados** | PostgreSQL + Prisma ORM | Modelagem relacional e migrações tipadas |
| **Segurança** | bcryptjs, ipaddr.js, JWT, Rate Limiting | Criptografia, blindagem anti-SSRF e controle de taxa |
| **Testes** | Vitest + Fastify Inject | Testes unitários e de integração automatizados |

---

## 📂 Arquitetura do Monorepo

```text
apihub/
├── apps/
│   ├── web/                     # Frontend Next.js (App Router, Tailwind, UI)
│   └── api/                     # Backend Fastify (Módulos de negócio, Rotas REST)
├── packages/
│   └── shared/                  # Schemas Zod, tipos TypeScript e contratos compartilhados
├── prisma/
│   └── schema.prisma            # Modelagem do banco de dados e migrações
├── .env.example                 # Modelo de variáveis de ambiente
├── pnpm-workspace.yaml          # Configuração do monorepo pnpm
└── README.md
```

---

## 🚀 Como Executar Localmente (Custo Zero)

### Pré-requisitos
- Node.js 20+ ou 22+ (LTS)
- `pnpm` (`npm install -g pnpm`)
- PostgreSQL (local ou container Docker)

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/apihub.git
cd apihub
```

### 2. Configurar variáveis de ambiente
Copie o arquivo de exemplo e ajuste a URL de conexão do PostgreSQL se necessário:
```bash
cp .env.example .env
```

### 3. Instalar as dependências
```bash
pnpm install
```

### 4. Executar as migrações do banco de dados
```bash
pnpm --filter @apihub/api prisma migrate dev
```

### 5. Iniciar os serviços em modo de desenvolvimento
- **Backend (Fastify):**
```bash
pnpm dev:api
# Executando em http://localhost:3333 (Health check em http://localhost:3333/health)
```

- **Frontend (Next.js):**
```bash
pnpm dev:web
# Executando em http://localhost:3000
```

---

## 🧪 Como Executar os Testes

Execute a suíte automatizada de testes (incluindo testes de segurança anti-SSRF e endpoints):
```bash
pnpm test
```

---

## 🛡️ Políticas de Segurança

- **Anti-SSRF:** Todas as requisições disparadas pelo API Tester passam por resolução DNS prévia e validação de faixa de IP via `ipaddr.js`. Faixas privadas, link-local, loopback e metadados de cloud são sumariamente rejeitados.
- **Proteção de Segredos:** API Keys nunca são gravadas em texto puro no banco de dados; apenas o hash criptográfico SHA-256 e um prefixo identificador público (`ah_live_...`) são persistidos.

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte o arquivo `LICENSE` para mais informações.
