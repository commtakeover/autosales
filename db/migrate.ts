import { AppDataSource } from "./data-source";

AppDataSource.initialize()
  .then(async () => {
    await AppDataSource.runMigrations();
    console.log("✅ Migrations ran successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });