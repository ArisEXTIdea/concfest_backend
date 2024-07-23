import express from "express";
import multer from "multer";
import uniqid from "uniqid";
import authChecker from "../middleware/auth_checker.js";
import {
  deleteBand,
  getBandFilter,
  getBandPagination,
  getBandResume,
  getBandSearch,
  postCreateBand,
  putBand
} from "../controllers/band_c.js";
import { putEvent } from "../controllers/event_c.js";

const bandRouter = express.Router();

// -------- Multer Configs -------- //

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./storage/uploads/images");
  },
  filename: function (req, file, cb) {
    const extension = file.originalname.split(".").reverse()[0];
    var fileNameFormat = "";
    switch (file["fieldname"]) {
      case "logo":
        fileNameFormat = `band-logo-${uniqid()}.${extension}`;
        break;
    }
    cb(null, fileNameFormat);
  }
});

const upload = multer({ storage: storage });

// --------------------- POST --------------------- //
bandRouter.post(
  "/create",
  authChecker,
  upload.fields([{ name: "logo", maxCount: 1 }]),
  postCreateBand
);

// --------------------- GET --------------------- //

bandRouter.get("/page/:page", getBandPagination);
bandRouter.get("/filter", getBandFilter);
bandRouter.get("/search", getBandSearch);
bandRouter.get("/resume", getBandResume);

// --------------------- UPDATE --------------------- //

bandRouter.put(
  "/update/:bid",
  upload.fields([{ name: "logo", maxCount: 1 }]),
  authChecker,
  putBand
);
// --------------------- DELETE --------------------- //

bandRouter.delete("/delete/:bid", authChecker, deleteBand);

export default bandRouter;
