import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const password = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@finanzas.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@finanzas.com",
      password,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "editor@finanzas.com" },
    update: {},
    create: {
      name: "Editor",
      email: "editor@finanzas.com",
      password: await bcrypt.hash("editor123", 10),
      role: "EDITOR",
    },
  });

  await prisma.user.upsert({
    where: { email: "visor@finanzas.com" },
    update: {},
    create: {
      name: "Visor",
      email: "visor@finanzas.com",
      password: await bcrypt.hash("visor123", 10),
      role: "VISOR",
    },
  });

  await prisma.configuracion.upsert({
    where: { id: "global" },
    update: {},
    create: { tasaUsdGlobal: 600 },
  });

  await prisma.persona.createMany({
    data: [
      { nombre: "Juan Perez", alias: "juanpe", tipo: "REMESERO" },
      { nombre: "Maria Lopez", alias: "marilo", tipo: "REMESERO" },
      { nombre: "Carlos Ruiz", alias: "carlosr", tipo: "COMPRADOR" },
    ],
    skipDuplicates: true,
  });

  await prisma.cuentaBancaria.createMany({
    data: [
      { nombre: "Wells Fargo Zelle", moneda: "USD", tipo: "ZELLE" },
      { nombre: "Bank of America", moneda: "USD", tipo: "BANCO" },
      { nombre: "Efectivo CUP", moneda: "CUP", tipo: "EFECTIVO" },
      { nombre: "Efectivo USD", moneda: "USD", tipo: "EFECTIVO" },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
