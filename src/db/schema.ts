import {
    boolean,
    integer,
    pgTable,
    primaryKey,
    serial,
    text,
    timestamp,
  } from "drizzle-orm/pg-core";

  export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    // googleToken: text("google_token").notNull(), might not be neccessary to store, will see when creating OAuth flow
    dietaryRequirements: text("dietary_requirements"),
    points: integer("points").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  });

  export const clubs = pgTable("clubs", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    abbreviation: text("abbreviation").notNull().unique(),
    adminEmail: text("admin_email").notNull(),
    // googleToken: text("google_token").notNull(), might not be neccessary to store, will see when creating OAuth flow
    signupUrl: text("signup_url").notNull(),
    spreadsheetUrl: text("spreadsheet_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  });

  export const events = pgTable("events", {
    id: serial("id").primaryKey(),
    clubId: integer("club_id").notNull().references(() => clubs.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    isMemberOnly: boolean("is_member_only").notNull().default(false),
    qrCodeToken: text("qr_code_token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  });

  export const eventRsvps = pgTable("event_rsvps", {
    eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
      primaryKey({ columns: [table.eventId, table.userId] }),
    ]);

  export const eventAttendance = pgTable("event_attendance", {
      eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
      userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      checkedInAt: timestamp("checked_in_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    },
    (table) => [
      primaryKey({ columns: [table.eventId, table.userId] }),
    ]);

  export const memberOf = pgTable("member_of", {
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    clubId: integer("club_id").notNull().references(() => clubs.id, { onDelete: "cascade" }),
  },
  (table) => [
      primaryKey({ columns: [table.userId, table.clubId] }),
    ]);