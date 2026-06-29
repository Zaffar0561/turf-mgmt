import dotenv from "dotenv";
import app from "../app.js";
import Connectdb from "./Db/index.js";

dotenv.config();

const port = process.env.PORT || 3000;

Connectdb()
  .then(() => {
    app.listen(port, () => {
      console.log(`App listening on port http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.log("mongo db connection error", err);
    process.exit(1);
  });
