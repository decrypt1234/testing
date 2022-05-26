const router = require("express").Router();
const userController = require("./lib/controllers");
const userMiddleware = require("./lib/middleware");


router.post("/getUsers", userMiddleware.verifyToken, userController.getUsers);
router.post("/getAllUsers",  userController.getAllUsers);
router.get("/getIndividualUser/:userID", userMiddleware.verifyToken, userController.getIndividualUser);
router.post("/blockUser", userMiddleware.verifyToken, userController.blockUser);

router.get("/profile", userMiddleware.verifyToken, userController.profile);

router.post("/addCollaborator", userMiddleware.verifyToken, userController.addCollaborator);
router.post("/collaboratorList", userMiddleware.verifyToken, userController.collaboratorList);
router.get("/getCollaboratorList", userMiddleware.verifyToken, userController.getCollaboratorList);
router.get("/deleteCollaborator/:collaboratorAddress",userMiddleware.verifyToken, userController.deleteCollaborator);
router.get("/getCollaboratorName/:collaboratorAddress", userMiddleware.verifyToken, userController.getCollaboratorName );
router.put("/editCollaborator", userMiddleware.verifyToken, userController.editCollaborator);
router.get("/categories", userController.getCategories);
router.get("/getAboutusData", userController.getAboutusData);
router.get("/getFAQsData", userController.getFAQsData);
router.get("/getTermsData", userController.getTermsData);
router.post("/profileDetail", userController.getUserProfilewithNfts);
router.post( "/profileWithNfts", userMiddleware.verifyWithoutToken, userController.getUserWithNfts);
router.post( "/allDetails", userMiddleware.verifyWithoutToken, userController.getAllUserDetails);


router.put("/updateProfile", userMiddleware.verifyToken, userController.updateProfile);
router.post("/getAllUsers", userMiddleware.verifyToken, userController.getAllUsers);


router.post("/follow", userMiddleware.verifyToken, userController.followUser);

module.exports = router;