"use strict";

exports.butterflyExists = (db, butterflyID) => async () => {
  const exists = await db.get("butterflies").find({ id: butterflyID }).value();
  if (!exists) {
    throw new Error("Butterfly ID does not exist");
  }
};

exports.userExists = (db, userID) => async () => {
  const exists = await db.get("users").find({ id: userID }).value();
  if (!exists) {
    throw new Error("User ID does not exist");
  }
};
