create table "user" ("id" text not null primary key, "email" text not null unique, "firstName" text, "lastName" text, "phone" text, "properties" text, "segments" text, "createdAt" date not null, "updatedAt" date not null);

create table "event" ("id" text not null primary key, "userId" text not null references "user" ("id") on delete cascade, "eventName" text not null, "properties" text, "timestamp" date not null, "sessionId" text, "source" text);

create table "campaign" ("id" text not null primary key, "name" text not null, "type" text not null, "status" text not null, "subject" text, "content" text not null, "segmentIds" text, "scheduledAt" date, "createdAt" date not null, "updatedAt" date not null);

create table "segment" ("id" text not null primary key, "name" text not null, "description" text, "conditions" text, "userCount" integer, "createdAt" date not null, "updatedAt" date not null);

create table "email" ("id" text not null primary key, "to" text not null, "from" text not null, "subject" text not null, "content" text not null, "status" text not null, "messageId" text, "createdAt" date not null);