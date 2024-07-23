import dotenv from "dotenv";
import knex from "knex";

dotenv.config();

const mysqldb = knex({
  client: "mysql2",
  connection: {
    host: process.env.DB_HOSTNAME,
    user: process.env.DB_USERNAME,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD
  }
});

export { mysqldb };
