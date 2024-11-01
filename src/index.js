"use strict";

const express = require("express");
const lowdb = require("lowdb");
const FileAsync = require("lowdb/adapters/FileAsync");

const constants = require("./constants");

const butterflyController = require("./controllers/butterflyController");
const userController = require("./controllers/userController");

async function createApp(dbPath) {
  const app = express();
  app.use(express.json());

  const db = await lowdb(new FileAsync(dbPath));
  await db.read();

  app.get("/", (req, res) => {
    res.json({ message: "Server is running!" });
  });

  /* ----- BUTTERFLIES ----- */

  /**
   * Get an existing butterfly
   * GET
   */
  app.get("/butterflies/:id", butterflyController.getButterfly(db));

  /**
   * Create a new butterfly
   * POST
   */
  app.post("/butterflies", butterflyController.createButterfly(db));

  /**
   * Create rating for a butterfly
   * POST
   */
  app.post(
    "/butterflies/:butterflyID/ratings",
    butterflyController.rateButterfly(db)
  );

  /* ----- USERS ----- */

  /**
   * Get an existing user
   * GET
   */
  app.get("/users/:id", userController.getUser(db));

  /**
   * Create a new user
   * POST
   */
  app.post("/users", userController.createNewUser(db));

  /**
   * Get butterflies rated by a user, sorted by rating
   * GET
   */
  app.get(
    "/users/:userID/rated-butterflies",
    userController.getRatedButterflies(db)
  );

  return app;
}

/* istanbul ignore if */
if (require.main === module) {
  (async () => {
    const app = await createApp(constants.DB_PATH);
    const port = process.env.PORT || 8000;

    app.listen(port, () => {
      console.log(`Butterfly API started at http://localhost:${port}`);
    });
  })();
}

module.exports = createApp;
