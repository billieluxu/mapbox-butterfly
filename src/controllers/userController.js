"use strict";

const { validateUser } = require("../validators");
const { nanoid } = require("nanoid");
const dbService = require("../services/db");

exports.getUser = (db) => async (req, res) => {
  const user = await db.get("users").find({ id: req.params.id }).value();

  if (!user) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json(user);
};

exports.createNewUser = (db) => async (req, res) => {
  try {
    validateUser(req.body);
  } catch (error) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const newUser = {
    id: nanoid(),
    ...req.body,
  };

  await db.get("users").push(newUser).write();

  res.json(newUser);
};

exports.getRatedButterflies = (db) => async (req, res) => {
  try {
    const userID = req.params.userID;
    const sort = req.query.sort;

    // Check if user exists
    try {
      dbService.userExists(db, userID);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    // Get all ratings by the user
    const ratings = await db.get("ratings").filter({ userID }).value();

    if (!ratings.length) {
      return res.status(404).json({ error: "No ratings found for this user" });
    }

    const ratedButterflies = await Promise.all(
      ratings.map(async (rating) => {
        const butterfly = db
          .get("butterflies")
          .find({ id: rating.butterflyID })
          .value();
        return { ...butterfly, rating: rating.rating };
      })
    );

    if (sort === "rating") ratedButterflies.sort((a, b) => b.rating - a.rating);

    res.status(200).json(ratedButterflies);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
