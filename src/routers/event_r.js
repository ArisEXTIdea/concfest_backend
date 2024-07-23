import express from "express";
import multer from "multer";
import uniqid from "uniqid";
import authChecker from "../middleware/auth_checker.js";
import {
  deleteBand,
  getBandFilter,
  getBandPagination,
  postCreateBand,
  putBand
} from "../controllers/band_c.js";
import {
  deleteEvent,
  getEventFilter,
  getEventPagination,
  getResumeEvents,
  postCreateEvent,
  putEvent
} from "../controllers/event_c.js";

const eventRouter = express.Router();

// -------- Multer Configs -------- //

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./storage/uploads/images");
  },
  filename: function (req, file, cb) {
    const extension = file.originalname.split(".").reverse()[0];
    var fileNameFormat = "";
    switch (file["fieldname"]) {
      case "banner":
        fileNameFormat = `event-banner-${uniqid()}.${extension}`;
        break;
    }
    cb(null, fileNameFormat);
  }
});

const upload = multer({ storage: storage });

// --------------------- POST --------------------- //
eventRouter.post(
  "/create",
  authChecker,
  upload.fields([{ name: "banner", maxCount: 1 }]),
  postCreateEvent
);

// --------------------- GET --------------------- //

eventRouter.get("/page/:page", getEventPagination);
eventRouter.get("/filter", getEventFilter);
eventRouter.get("/resume", getResumeEvents);

// --------------------- UPDATE --------------------- //

eventRouter.put(
  "/update/:eid",
  upload.fields([{ name: "banner", maxCount: 1 }]),
  authChecker,
  putEvent
);
// --------------------- DELETE --------------------- //

eventRouter.delete("/delete/:eid", authChecker, deleteEvent);

export default eventRouter;
