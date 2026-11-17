import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding CloudAPI database with initial demo data...');

  // 1. Create Demo User
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const user = await prisma.user.upsert({
    where: { email: 'demo@apihub.dev' },
    update: {},
    create: {
      email: 'demo@apihub.dev',
      name: 'Allan Silva',
      passwordHash,
    },
  });

  // 2. Create Workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'allan-workspace' },
    update: {},
    create: {
      name: 'Allan Workspace',
      slug: 'allan-workspace',
      description: 'Workspace principal para gerenciamento e documentação de APIs',
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: 'OWNER',
        },
      },
    },
  });

  // 3. Create Project
  const project = await prisma.project.upsert({
    where: {
      workspaceId_slug: {
        workspaceId: workspace.id,
        slug: 'ecommerce-catalog',
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: 'E-commerce & Catalog',
      slug: 'ecommerce-catalog',
      description: 'APIs responsáveis pelo catálogo de produtos e autenticação de clientes',
    },
  });

  // 4. Create API Definition
  const api = await prisma.apiDefinition.create({
    data: {
      projectId: project.id,
      name: 'Storefront Core API',
      description: 'Endpoints públicos e autenticados da loja virtual',
      baseUrl: 'https://api.loja.exemplo.com/v1',
      version: 'v1.2.0',
      isPublic: true,
      endpoints: {
        create: [
          {
            method: 'GET',
            path: '/products',
            summary: 'Busca lista de produtos ativos',
            description: 'Retorna a listagem de produtos com paginação e filtro por categoria',
            tags: ['Catálogo'],
            parameters: {
              create: [
                { name: 'category', in: 'query', required: false, description: 'Slug da categoria' },
                { name: 'limit', in: 'query', required: false, description: 'Itens por página' },
              ],
            },
            responseExamples: {
              create: [
                {
                  statusCode: 200,
                  description: 'Produtos retornados com sucesso',
                  body: JSON.stringify({
                    items: [{ id: 'prod_1', name: 'Notebook Pro 16', price: 8499.0 }],
                    total: 1,
                  }),
                },
              ],
            },
          },
          {
            method: 'POST',
            path: '/orders',
            summary: 'Cria novo pedido',
            description: 'Gera uma ordem de compra a partir de itens do carrinho',
            tags: ['Checkout'],
            requestBody: JSON.stringify({
              items: [{ productId: 'prod_1', quantity: 2 }],
            }),
            responseExamples: {
              create: [
                {
                  statusCode: 201,
                  description: 'Pedido gerado com sucesso',
                  body: JSON.stringify({ orderId: 'ord_9871', status: 'PENDING_PAYMENT' }),
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`Seed finalizado com sucesso! Workspace: ${workspace.name}, API: ${api.name}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
