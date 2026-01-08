#!/usr/bin/env node
/**
 * Seed Known Emails Script
 *
 * Seeds the known_emails container in Cosmos DB with required internal user emails.
 * Run this script during deployment to ensure known emails are always present.
 *
 * Usage:
 *   node scripts/seed-known-emails.js
 *
 * Environment variables:
 *   COSMOS_DB_CONNECTION_STRING - Cosmos DB connection string
 *   COSMOS_DB_DATABASE - Database name (default: phoenix-docs)
 */

const { CosmosClient } = require("@azure/cosmos");

// Known emails to seed - these users get special access/features
const KNOWN_EMAILS = [
  {
    email: "smit.jurie@gmail.com",
    profileKey: "jurie",
    displayName: "Jurie Smit",
    notes: "Core team member",
  },
  {
    email: "megatesla@gmail.com",
    profileKey: "pieter",
    displayName: "Pieter",
    notes: "Core team member",
  },
  {
    email: "martynrede@gmail.com",
    profileKey: "martyn",
    displayName: "Martyn Rede",
    notes: "Core team member",
  },
];

async function seedKnownEmails() {
  const connectionString = process.env.COSMOS_DB_CONNECTION_STRING;
  const databaseName = process.env.COSMOS_DB_DATABASE || "phoenix-docs";

  if (!connectionString) {
    console.error(
      "❌ COSMOS_DB_CONNECTION_STRING environment variable is required",
    );
    process.exit(1);
  }

  console.log("🌱 Seeding known emails...");
  console.log(`   Database: ${databaseName}`);
  console.log(`   Emails to seed: ${KNOWN_EMAILS.length}`);
  console.log("");

  try {
    const client = new CosmosClient(connectionString);
    const database = client.database(databaseName);
    const container = database.container("known_emails");

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const emailData of KNOWN_EMAILS) {
      const id = emailData.email.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const now = new Date().toISOString();

      try {
        // Check if email already exists
        const { resource: existing } = await container.item(id, id).read();

        if (existing) {
          // Update if profileKey or displayName changed
          if (
            existing.profileKey !== emailData.profileKey ||
            existing.displayName !== emailData.displayName
          ) {
            await container.item(id, id).replace({
              ...existing,
              profileKey: emailData.profileKey,
              displayName: emailData.displayName,
              notes: emailData.notes,
              updatedAt: now,
            });
            console.log(`   ✏️  Updated: ${emailData.email}`);
            updated++;
          } else {
            console.log(`   ⏭️  Skipped (exists): ${emailData.email}`);
            skipped++;
          }
        }
      } catch (error) {
        if (error.code === 404) {
          // Create new email entry
          await container.items.create({
            id,
            email: emailData.email.toLowerCase(),
            profileKey: emailData.profileKey,
            displayName: emailData.displayName,
            notes: emailData.notes,
            isActive: true,
            addedBy: "system",
            createdAt: now,
            updatedAt: now,
          });
          console.log(`   ✅ Created: ${emailData.email}`);
          created++;
        } else {
          throw error;
        }
      }
    }

    console.log("");
    console.log("📊 Summary:");
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log("");
    console.log("✅ Known emails seeding complete!");
  } catch (error) {
    console.error("❌ Failed to seed known emails:", error.message);
    process.exit(1);
  }
}

// Run the script
seedKnownEmails();
