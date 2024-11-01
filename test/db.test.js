"use strict";

const { butterflyExists, userExists } = require("../src/services/db");

describe("butterflyExists", () => {
  const mockDb = {
    get: jest.fn().mockReturnThis(),
    find: jest.fn().mockReturnThis(),
    value: jest.fn(),
  };

  it("does not throw an error if butterfly exists", async () => {
    mockDb.value.mockResolvedValue(true);

    const checkButterflyExists = butterflyExists(mockDb, "valid-butterfly-id");
    await expect(checkButterflyExists()).resolves.toBeUndefined();
  });

  it("throws an error if butterfly does not exist", async () => {
    mockDb.value.mockResolvedValue(false);

    const checkButterflyExists = butterflyExists(
      mockDb,
      "invalid-butterfly-id"
    );
    await expect(checkButterflyExists()).rejects.toThrow(
      "Butterfly ID does not exist"
    );
  });
});

describe("userExists", () => {
  const mockDb = {
    get: jest.fn().mockReturnThis(),
    find: jest.fn().mockReturnThis(),
    value: jest.fn(),
  };

  it("does not throw an error if user exists", async () => {
    mockDb.value.mockResolvedValue(true);

    const checkUserExists = userExists(mockDb, "valid-user-id");
    await expect(checkUserExists()).resolves.toBeUndefined();
  });

  it("throws an error if user does not exist", async () => {
    mockDb.value.mockResolvedValue(false);

    const checkUserExists = userExists(mockDb, "invalid-user-id");
    await expect(checkUserExists()).rejects.toThrow("User ID does not exist");
  });
});
