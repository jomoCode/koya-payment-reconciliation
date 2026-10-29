// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

let total = 0;
let count = 0;
let latestEvents = new Map();

const lines = fs.readFileSync("payments.jsonl", "utf8").split("\n").filter((l) => l.length > 0);
for (const line of lines) {
  let event;
  try{
  event = JSON.parse(line);}
  catch (error) {
    // Clean data
  const cleanedRow = line.replace(
    /[\u0000-\u001F]/g,
    ""
  );

  try {
    event = JSON.parse(cleanedRow);
  } catch {
    continue;
  }
}
  if (!event.txn_id) continue;

  // Keep the latest attempt for each transaction, regardless of its status.
  const previous = latestEvents.get(event.txn_id);
  if (!previous || Date.parse(event.ts) > Date.parse(previous.ts)) {
    latestEvents.set(event.txn_id, event);
  }
}

for (const eventItem of latestEvents.values()) {
  if (eventItem.status === "success") {
    total += Number(String(eventItem.amount).replace(/,/g, ""));
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
