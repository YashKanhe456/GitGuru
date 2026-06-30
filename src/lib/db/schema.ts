import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const analyses = pgTable("analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  repoUrl: text("repo_url").notNull(),
  repoName: text("repo_name").notNull(),
  status: text("status").notNull().default("completed"),
  techStack: jsonb("tech_stack").$type<string[]>().notNull().default([]),
  report: jsonb("report").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
