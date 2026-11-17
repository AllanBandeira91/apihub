# Guia de Contribuição para o CloudAPI

Agradecemos o interesse em contribuir com o **CloudAPI**! Este é um projeto de código aberto com foco em qualidade, código legível, testes automatizados e custo zero de infraestrutura.

## Diretrizes de Desenvolvimento

1. **Monorepo:** Utilizamos `pnpm` para gerenciamento de dependências e pacotes.
2. **Tipagem Estrita:** Todo o código é escrito em TypeScript com modo estrito (`strict: true`).
3. **Validação:** Todos os inputs de rotas e formulários devem ser validados via esquemas Zod (preferencialmente definidos em `@apihub/shared`).
4. **Segurança:** Nunca exponha senhas, segredos ou chaves em texto puro. Qualquer nova funcionalidade no API Tester deve manter a blindagem contra SSRF ativa.
5. **Testes:** Novas rotas e serviços devem acompanhar testes automatizados em Vitest.

## Fluxo de Trabalho Git

1. Crie uma branch com nome descritivo: `feat/nome-da-feature` ou `fix/nome-do-bug`.
2. Realize commits claros e objetivos.
3. Certifique-se de que `pnpm test` e `pnpm lint` passem sem erros antes de abrir um Pull Request.
