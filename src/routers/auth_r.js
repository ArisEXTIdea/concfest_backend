import express from "express";
import {
  deleteUser,
  getSession,
  getUserFilter,
  getUserPagination,
  postLoginUser,
  postLogoutUser,
  postRegisterUser,
  putSession,
  putUser
} from "../controllers/auth_c.js";
import multer from "multer";
import uniqid from "uniqid";
import authChecker from "../middleware/auth_checker.js";

const authRouter = express.Router();

// -------- Multer Configs -------- //

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./storage/uploads/images");
  },
  filename: function (req, file, cb) {
    const extension = file.originalname.split(".").reverse()[0];
    var fileNameFormat = "";
    switch (file["fieldname"]) {
      case "avatar":
        fileNameFormat = `test-avatar-${uniqid()}.${extension}`;
        break;
    }
    cb(null, fileNameFormat);
  }
});

const upload = multer({ storage: storage });

// --------------------- POST --------------------- //
authRouter.post(
  "/register",
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  authChecker,
  postRegisterUser
);
authRouter.post("/login", postLoginUser);
authRouter.post("/logout", postLogoutUser);
// --------------------- GET --------------------- //
authRouter.get("/users/page/:page", authChecker, getUserPagination);
authRouter.get("/users/filter", authChecker, getUserFilter);
authRouter.get("/session", authChecker, getSession);

// --------------------- PUT --------------------- //

authRouter.put(
  "/users/update/:uid",
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  authChecker,
  putUser
);

authRouter.put("/session", authChecker, putSession);

// --------------------- DELETE --------------------- //
authRouter.delete("/users/delete/:uid", authChecker, deleteUser);

export default authRouter;
