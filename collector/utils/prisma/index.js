const { PrismaClient } = require("@prisma/client");

const logLevels = ["error", "info", "warn"]; // add "query" to debug query logs
const prisma = new PrismaClient({
  log: logLevels,
});

module.exports = prisma;
