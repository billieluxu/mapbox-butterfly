"use strict";

const {
  getButterfly,
  createButterfly,
  rateButterfly,
} = require("../src/controllers/butterflyController");
const { validateRating, validateButterfly } = require("../src/validators");
const { nanoid } = require("nanoid");
const dbService = require("../src/services/db");

jest.mock("nanoid");
jest.mock("../src/validators");
jest.mock("../src/services/db");

describe("butterflyController", () => {
  let mockDb, req, res;

  afterEach(() => {
    jest.resetAllMocks();
  });

  beforeEach(() => {
    mockDb = {
      get: jest.fn().mockReturnThis(),
      find: jest.fn().mockReturnThis(),
      value: jest.fn().mockResolvedValue(null),
      push: jest.fn().mockReturnThis(),
      write: jest.fn(),
      assign: jest.fn().mockReturnThis(),
    };

    req = {
      params: {},
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("getButterfly", () => {
    it("returns butterfly if found", async () => {
      const butterfly = { id: "1", name: "Monarch" };
      mockDb.value.mockResolvedValue(butterfly);
      req.params.id = "1";

      await getButterfly(mockDb)(req, res);

      expect(res.json).toHaveBeenCalledWith(butterfly);
    });

    it("returns 404 if butterfly not found", async () => {
      mockDb.value.mockResolvedValue(null);
      req.params.id = "1";

      await getButterfly(mockDb)(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Not found" });
    });
  });

  describe("createButterfly", () => {
    it("creates a new butterfly", async () => {
      const newButterfly = { id: "1", name: "Monarch" };
      req.body = { name: "Monarch" };
      nanoid.mockReturnValue("1");

      await createButterfly(mockDb)(req, res);

      expect(validateButterfly).toHaveBeenCalledWith(req.body);
      expect(mockDb.push).toHaveBeenCalledWith(newButterfly);
      expect(mockDb.write).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(newButterfly);
    });

    it("returns 400 if validation fails", async () => {
      validateButterfly.mockImplementation(() => {
        throw new Error("Invalid request body");
      });

      await createButterfly(mockDb)(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid request body" });
    });
  });

  describe("rateButterfly", () => {
    it("adds a new rating", async () => {
      req.body = { userID: "user1", rating: 5 };
      req.params.butterflyID = "butterfly1";
      mockDb.value.mockResolvedValue(null);

      dbService.butterflyExists.mockResolvedValue();
      dbService.userExists.mockResolvedValue();

      await rateButterfly(mockDb)(req, res);

      expect(validateRating).toHaveBeenCalledWith(req.body);
      expect(dbService.butterflyExists).toHaveBeenCalledWith(
        mockDb,
        "butterfly1"
      );
      expect(dbService.userExists).toHaveBeenCalledWith(mockDb, "user1");
      expect(mockDb.push).toHaveBeenCalledWith({
        userID: "user1",
        butterflyID: "butterfly1",
        rating: 5,
      });
      expect(mockDb.write).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Rating added",
        rating: { userID: "user1", butterflyID: "butterfly1", rating: 5 },
      });
    });

    it("updates an existing rating", async () => {
      req.body = { userID: "user1", rating: 4 };
      req.params.butterflyID = "butterfly1";
      mockDb.value.mockResolvedValue({
        userID: "user1",
        butterflyID: "butterfly1",
        rating: 3,
      });

      dbService.butterflyExists.mockResolvedValue();
      dbService.userExists.mockResolvedValue();

      await rateButterfly(mockDb)(req, res);

      expect(validateRating).toHaveBeenCalledWith(req.body);
      expect(dbService.butterflyExists).toHaveBeenCalledWith(
        mockDb,
        "butterfly1"
      );
      expect(dbService.userExists).toHaveBeenCalledWith(mockDb, "user1");
      expect(mockDb.assign).toHaveBeenCalledWith({ rating: 4 });
      expect(mockDb.write).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Rating updated",
        rating: { userID: "user1", butterflyID: "butterfly1", rating: 4 },
      });
    });

    it("returns 400 if butterfly or user does not exist", async () => {
      req.body = { userID: "user1", rating: 4 };
      req.params.butterflyID = "butterfly1";

      dbService.butterflyExists.mockImplementation(() => {
        throw new Error("Butterfly ID does not exist");
      });

      await rateButterfly(mockDb)(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Butterfly ID does not exist",
      });
    });

    it("returns 400 if validation fails", async () => {
      validateRating.mockImplementation(() => {
        throw new Error("Invalid request body");
      });

      await rateButterfly(mockDb)(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid request body" });
    });
  });
});
