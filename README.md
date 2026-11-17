# CloudAPI

> **CloudAPI** é uma plataforma moderna de gestão, catalogação, teste e documentação de APIs em desenvolvimento ativo. O código é aberto para colaboração e contribuição da comunidade.

[![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-amber.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.28-black.svg)](https://fastify.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![Discord](https://img.shields.io/badge/Discord-Comunidade-5865F2.svg?logo=discord&logoColor=white)](#)
[![Suporte](https://img.shields.io/badge/Suporte-apihubsupport%40gmail.com-ea4335.svg?logo=gmail&logoColor=white)](mailto:apihubsupport@gmail.com)

---

## 🌟 Funcionalidades Principais

- **Workspaces & Multi-tenancy:** Organização hierárquica por Workspaces e Projetos com papéis de acesso (`OWNER`, `ADMIN`, `EDITOR`, `VIEWER`).
- **Catalogação Completa de APIs:** Cadastro de endpoints (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`), headers, query parameters, corpo de requisição e múltiplos exemplos de resposta.
- **Exportação OpenAPI Automática:** Geração dinâmica de especificações OpenAPI 3.0 em JSON para consumo por Swagger UI ou ferramentas de terceiros.
- **API Tester com Proteção Ativa Anti-SSRF:** Execução de requisições HTTP reais com bloqueio estrito contra alvos internos (loopback 127.0.0.1, redes RFC 1918 e metadados de nuvem 169.254), sanitização anti-CRLF e medição de latência em milissegundos.
- **Gerenciador de API Keys:** Emissão de chaves criptografadas (hash SHA-256), com exibição única no momento da criação e revogação instantânea.
- **Métricas & Histórico Real:** Registro de execuções com contagem de requisições, latência média e distribuição de status HTTP derivados de dados reais.
- **Conformidade LGPD:** Política de Privacidade, Termos de Uso, gestão de consentimento de cookies e Canal do Titular com geração de protocolo.
- **Tema Visual Adaptativo:** Suporte nativo a Modo Escuro (padrão Black) e Modo Claro com persistência local.

---

## 💬 Comunidade & Suporte Oficial

- **Suporte Oficial por E-mail:** [apihubsupport@gmail.com](mailto:apihubsupport@gmail.com)
- **Servidor do Discord:** Comunidade oficial de desenvolvedores, feedback e novidades (link disponível no portal).
- **Contribuições:** Pull Requests e melhorias da comunidade são bem-vindas conforme as diretrizes do [CONTRIBUTING.md](CONTRIBUTING.md).

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

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 20+ ou 22+ (LTS)
- `pnpm` (`npm install -g pnpm`)
- PostgreSQL ou container Docker

```bash
# 1. Clonar o repositório
git clone https://github.com/AllanBandeira91/apihub.git
cd apihub

# 2. Configurar variáveis de ambiente
cp .env.example .env

# 3. Instalar dependências
pnpm install

# 4. Executar suíte de testes
pnpm test

# 5. Iniciar o frontend
pnpm dev:web
# Acesse em http://localhost:3000
```

---

## 📄 Licença & Termos de Uso

Este projeto não é um software open-source permissivo irrestrito. Todos os direitos sobre a marca e o código da plataforma pertencem aos seus desenvolvedores. Contribuições públicas via Pull Requests são permitidas e incentivadas nos termos de desenvolvimento comunitário da plataforma. Para detalhes comerciais ou parcerias, contate [apihubsupport@gmail.com](mailto:apihubsupport@gmail.com).
