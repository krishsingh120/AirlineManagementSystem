const express = require("express");
const router = express.Router();

const v1ApiRoutes = require("./v1/index")

router.use("/v1", v1ApiRoutes);

module.exports = router


// router.use("/").post(create); l
// router.use("/detele:id").delete(remove);
// router.use("/get:id").get(get);
// router.use("/update:id").patch(update);



