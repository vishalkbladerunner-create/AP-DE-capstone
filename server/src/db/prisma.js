// The one PrismaClient for the whole server.
// Every service requires this file instead of creating its own client,
// so the app shares a single connection pool.
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;
