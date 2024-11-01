"use strict";

const { validateRating, validateButterfly } = require("../validators");
const { nanoid } = require("nanoid");
const dbService = require("../services/db");

exports.getButterfly = (db) => async (req, res) => {
  const butterfly = await db
    .get("butterflies")
    .find({ id: req.params.id })
    .value();

  if (!butterfly) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json(butterfly);
};

exports.createButterfly = (db) => async (req, res) => {
  try {
    validateButterfly(req.body);
  } catch (error) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const newButterfly = {
    id: nanoid(),
    ...req.body,
  };

  await db.get("butterflies").push(newButterfly).write();

  res.json(newButterfly);
};

exports.rateButterfly = (db) => async (req, res) => {
  try {
    validateRating(req.body);
  } catch (error) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { userID, rating } = req.body;
  const butterflyID = req.params.butterflyID;

  try {
    dbService.butterflyExists(db, butterflyID);
    dbService.userExists(db, userID);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  // Check if the rating already exists
  const existingRating = await db
    .get("ratings")
    .find({ userID, butterflyID })
    .value();

  if (existingRating) {
    // Update the existing rating
    await db
      .get("ratings")
      .find({ userID, butterflyID })
      .assign({ rating })
      .write();

    res.status(200).json({
      message: "Rating updated",
      rating: { userID, butterflyID, rating },
    });
  } else {
    // Create a new rating
    const newRating = {
      userID: req.body.userID,
      butterflyID: req.params.butterflyID,
      rating: req.body.rating,
    };

    await db.get("ratings").push(newRating).write();

    res.status(200).json({
      message: "Rating added",
      rating: { userID, butterflyID, rating },
    });
  }
};
