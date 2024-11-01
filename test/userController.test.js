"use strict";

const {
  getUser,
  createNewUser,
  getRatedButterflies,
} = require("../src/controllers/userController");
const { validateUser } = require("../src/validators");
const { nanoid } = require("nanoid");
const dbService = require("../src/services/db");

jest.mock("nanoid");
jest.mock("../src/validators");
jest.mock("../src/services/db");

describe("userController", () => {
  let mockDb, req, res;

  afterEach(() => {
    jest.resetAllMocks();
  });

  beforeEach(() => {
    mockDb = {
      get: jest.fn().mockReturnThis(),
      find: jest.fn().mockReturnThis(),
      value: jest.fn(),
      push: jest.fn().mockReturnThis(),
      write: jest.fn(),
      filter: jest.fn().mockReturnThis(),
    };

    req = {
      params: {},
      body: {},
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("getUser", () => {
    it("returns user if found", async () => {
      const user = { id: "1", name: "John Doe" };
      mockDb.value.mockResolvedValue(user);
      req.params.id = "1";

      await getUser(mockDb)(req, res);

      expect(res.json).toHaveBeenCalledWith(user);
    });

    it("returns 404 if user not found", async () => {
      mockDb.value.mockResolvedValue(null);
      req.params.id = "1";

      await getUser(mockDb)(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Not found" });
    });
  });

  describe("createNewUser", () => {
    it("creates a new user", async () => {
      const newUser = { id: "1", name: "John Doe" };
      req.body = { name: "John Doe" };
      nanoid.mockReturnValue("1");

      await createNewUser(mockDb)(req, res);

      expect(validateUser).toHaveBeenCalledWith(req.body);
      expect(mockDb.push).toHaveBeenCalledWith(newUser);
      expect(mockDb.write).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(newUser);
    });

    it("returns 400 if validation fails", async () => {
      validateUser.mockImplementation(() => {
        throw new Error("Invalid request body");
      });

      await createNewUser(mockDb)(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid request body" });
    });
  });

  describe("getRatedButterflies", () => {
    it("returns rated butterflies sorted by rating", async () => {
      req.params.userID = "user1";
      req.query.sort = "rating";
      const ratings = [
        { userID: "user1", butterflyID: "butterfly1", rating: 5 },
        { userID: "user1", butterflyID: "butterfly2", rating: 3 },
      ];
      const butterflies = [
        { id: "butterfly1", name: "Monarch" },
        { id: "butterfly2", name: "Swallowtail" },
      ];

      dbService.userExists.mockResolvedValue();
      // Mock db.get("ratings").filter().value() to return the ratings array
      mockDb.get.mockReturnValueOnce({
        filter: jest.fn().mockReturnValueOnce({
          value: jest.fn().mockReturnValueOnce(ratings),
        }),
      });

      // Mock db.get("butterflies").find().value() calls to return individual butterflies
      mockDb.get.mockReturnValue({
        find: jest
          .fn()
          .mockImplementationOnce(() => ({
            value: jest.fn().mockReturnValue(butterflies[0]),
          }))
          .mockImplementationOnce(() => ({
            value: jest.fn().mockReturnValue(butterflies[1]),
          })),
      });

      await getRatedButterflies(mockDb)(req, res);

      expect(dbService.userExists).toHaveBeenCalledWith(mockDb, "user1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([
        { ...butterflies[0], rating: 5 },
        { ...butterflies[1], rating: 3 },
      ]);
    });

    it("returns 404 if no ratings found", async () => {
      req.params.userID = "user1";
      mockDb.value.mockResolvedValue([]);

      dbService.userExists.mockResolvedValue();

      await getRatedButterflies(mockDb)(req, res);

      expect(dbService.userExists).toHaveBeenCalledWith(mockDb, "user1");
      expect(mockDb.filter).toHaveBeenCalledWith({ userID: "user1" });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "No ratings found for this user",
      });
    });

    it("returns 400 if user does not exist", async () => {
      req.params.userID = "user1";

      dbService.userExists.mockImplementation(() => {
        throw new Error("User ID does not exist");
      });

      await getRatedButterflies(mockDb)(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "User ID does not exist",
      });
    });

    it("returns 500 on internal server error", async () => {
      req.params.userID = "user1";
      mockDb.value.mockImplementation(() => {
        throw new Error("Internal Server Error");
      });

      await getRatedButterflies(mockDb)(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
    });
  });
});
