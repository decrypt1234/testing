const router = require("express").Router();
const utilsController = require("./lib/controllers");
const utilsMiddleware = require("./lib/middleware");

router.post("/addCategory", utilsMiddleware.verifyToken, utilsController.addCategory);

router.post("/addBrand", utilsMiddleware.verifyToken, utilsController.addBrand);

router.get("/getAllCategory", utilsMiddleware.verifyToken, utilsController.getAllCategory);
router.get("/getAllBrand", utilsMiddleware.verifyToken, utilsController.getAllBrand);

module.exports = router;
