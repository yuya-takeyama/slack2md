import { program } from "commander";
import { initializeDatabase, getDatabase, closeDatabase } from "../db/index.js";

const VALID_TABLES = [
  "users",
  "channels",
  "user_groups",
  "bots",
  "messages",
] as const;
type ValidTable = (typeof VALID_TABLES)[number];

function isValidTable(table: string): table is ValidTable {
  return VALID_TABLES.includes(table as ValidTable);
}

program
  .argument("<pattern>", "LIKE pattern to search (e.g., %U12345678%)")
  .option(
    "--table <table>",
    `Table to search (${VALID_TABLES.join(", ")}, or "all")`,
    "all",
  )
  .parse();

const pattern = program.args[0];
const options = program.opts<{ table: string }>();

const QUERIES: Record<ValidTable, string> = {
  users: "SELECT * FROM users WHERE raw LIKE ?",
  channels: "SELECT * FROM channels WHERE raw LIKE ?",
  user_groups: "SELECT * FROM user_groups WHERE raw LIKE ?",
  bots: "SELECT * FROM bots WHERE raw LIKE ?",
  messages: "SELECT * FROM messages WHERE raw LIKE ?",
};

function searchTable(tableName: ValidTable, pattern: string): void {
  const db = getDatabase();
  const query = QUERIES[tableName];
  const rows = db.prepare(query).all(pattern) as Record<string, unknown>[];

  if (rows.length === 0) {
    console.log(`[${tableName}] No results`);
    return;
  }

  console.log(`\n[${tableName}] Found ${rows.length} result(s):`);
  for (const row of rows) {
    const { raw, ...rest } = row;
    console.log("---");
    console.log(JSON.stringify(rest, null, 2));
  }
}

function main() {
  console.log(`Searching for pattern: ${pattern}`);
  initializeDatabase();

  let tables: ValidTable[];
  if (options.table === "all") {
    tables = [...VALID_TABLES];
  } else if (isValidTable(options.table)) {
    tables = [options.table];
  } else {
    console.error(`Invalid table: ${options.table}`);
    console.error(`Valid tables: ${VALID_TABLES.join(", ")}`);
    process.exit(1);
  }

  for (const table of tables) {
    searchTable(table, pattern);
  }

  closeDatabase();
}

main();
