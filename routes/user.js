const express = require("express");
const router = express.Router();

const { getUserById, getUser, updateUser, updatePurchaseList } = require("../controllers/user");
const { isSignedIn, isAuthenticated, isAdmin } = require("../controllers/auth");

router.param("userId", getUserById);

router.get("/user/:userId", isSignedIn, isAuthenticated, getUser);
router.put("/user/:userId", isSignedIn, isAuthenticated, updateUser);
router.put("/orders/user/:userId", isSignedIn, isAuthenticated, updatePurchaseList);

module.exports = router;
