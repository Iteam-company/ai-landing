import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.EASYLAND_DB_NAME || "easyland";

if (!uri) {
  console.error(
    "MONGODB_URI is not set. Run with: node --env-file=.env scripts/setup-booking-index.mjs",
  );
  process.exit(1);
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const col = client.db(dbName).collection("bookings");

  console.log(`Connected. Database: "${dbName}", collection: "bookings".`);

  // 1. Duplicate check — active bookings only. Refuse to touch anything if
  // this finds a conflict; resolving it is a judgment call, not a script's.
  const duplicates = await col
    .aggregate([
      { $match: { status: { $in: ["pending", "confirmed"] } } },
      { $group: { _id: { date: "$date", time: "$time" }, count: { $sum: 1 }, ids: { $push: "$id" } } },
      { $match: { count: { $gt: 1 } } },
    ])
    .toArray();

  if (duplicates.length > 0) {
    console.error(`\nFound ${duplicates.length} date+time slot(s) with more than one active booking:\n`);
    for (const dup of duplicates) {
      console.error(`  ${dup._id.date} ${dup._id.time} — ${dup.count} active bookings — ids: ${dup.ids.join(", ")}`);
    }
    console.error(
      "\nRefusing to continue. Resolve these manually first (e.g. cancel every booking on a " +
        "slot but one, via the Admin Panel or a targeted update), then re-run this script. " +
        "No data was changed.",
    );
    await client.close();
    process.exit(1);
  }
  console.log("No duplicate active slots found.");

  // 2. Backfill blocksSlot on documents that predate the field.
  const activeBackfill = await col.updateMany(
    { status: { $in: ["pending", "confirmed"] }, blocksSlot: { $exists: false } },
    { $set: { blocksSlot: true } },
  );
  const cancelledBackfill = await col.updateMany(
    { status: "cancelled", blocksSlot: { $exists: false } },
    { $set: { blocksSlot: false } },
  );
  console.log(
    `Backfilled blocksSlot: ${activeBackfill.modifiedCount} active, ${cancelledBackfill.modifiedCount} cancelled.`,
  );

  // 3. Create the index.
  console.log("Creating uniq_active_slot...");
  await col.createIndex(
    { date: 1, time: 1 },
    { unique: true, partialFilterExpression: { blocksSlot: true }, name: "uniq_active_slot" },
  );

  // 4. Verify — don't just trust that createIndex() resolving means it's
  // actually there with the right shape; read it back.
  const indexes = await col.listIndexes().toArray();
  const created = indexes.find((idx) => idx.name === "uniq_active_slot");
  if (!created || created.unique !== true || !created.partialFilterExpression) {
    console.error("uniq_active_slot was not created as expected:", JSON.stringify(created ?? null));
    await client.close();
    process.exit(1);
  }

  console.log(
    `uniq_active_slot verified: key=${JSON.stringify(created.key)} ` +
      `partialFilterExpression=${JSON.stringify(created.partialFilterExpression)}`,
  );
  console.log("\nDouble booking is now physically impossible at the MongoDB level.");

  await client.close();
}

main().catch((err) => {
  console.error("Setup failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
