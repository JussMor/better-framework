-- Migration: 20250906213341_auto_migration
-- Created: 2025-09-06T21:33:41.842Z
-- Description: Auto-generated migration

create table "user" ("id" text not null primary key, "email" text not null unique, "firstName" text, "lastName" text, "phone" text, "properties" text, "segments" text, "createdAt" date not null, "updatedAt" date not null);

create table "event" ("id" text not null primary key, "userId" text not null references "user" ("id") on delete cascade, "eventName" text not null, "properties" text, "timestamp" date not null, "sessionId" text, "source" text);

create table "notification" ("id" text not null primary key, "title" text not null, "message" text not null, "type" text not null, "userId" text not null, "priority" text not null, "metadata" text, "read" integer not null, "createdAt" date not null, "updatedAt" date not null);