import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de chamados (Ordens de Serviço)
 */
export const chamados = mysqlTable("chamados", {
  id: int("id").autoincrement().primaryKey(),
  numeroOS: varchar("numeroOS", { length: 20 }).notNull().unique(),
  numeroTarefa: varchar("numeroTarefa", { length: 50 }),
  dataOS: timestamp("dataOS").notNull(),
  dataAtendimento: timestamp("dataAtendimento"),
  distrito: varchar("distrito", { length: 10 }),
  nomeGT: varchar("nomeGT", { length: 100 }),
  codCliente: varchar("codCliente", { length: 20 }),
  cliente: text("cliente"),
  nomeTRA: varchar("nomeTRA", { length: 100 }),
  observacao: text("observacao"),
  status: mysqlEnum("status", ["aberto", "em_andamento", "fechado"]).default("aberto").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy").references(() => users.id),
});

export type Chamado = typeof chamados.$inferSelect;
export type InsertChamado = typeof chamados.$inferInsert;

/**
 * Tabela de evoluções dos chamados
 */
export const evolucoes = mysqlTable("evolucoes", {
  id: int("id").autoincrement().primaryKey(),
  chamadoId: int("chamadoId").notNull().references(() => chamados.id, { onDelete: "cascade" }),
  descricao: text("descricao").notNull(),
  statusAnterior: mysqlEnum("statusAnterior", ["aberto", "em_andamento", "fechado"]),
  statusNovo: mysqlEnum("statusNovo", ["aberto", "em_andamento", "fechado"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy").notNull().references(() => users.id),
});

export type Evolucao = typeof evolucoes.$inferSelect;
export type InsertEvolucao = typeof evolucoes.$inferInsert;