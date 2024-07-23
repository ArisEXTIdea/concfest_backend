import jwt from "jsonwebtoken";
import fs from "fs";

const authChecker = (req, res, next) => {
  const token = req.headers.authorization;
  jwt.verify(token, process.env.SERVER_SECRET_TOKEN_KEY, (err, decode) => {
    if (err == null) {
      fs.readFile(
        `./sessions/${decode.login_id}.json`,
        "utf-8",
        (err, data) => {
          if (!err) {
            next();
          } else {
            res.status(401).json({
              message:
                "Your session is not found please login for access the api."
            });
          }
        }
      );
    } else {
      res.status(401).json({
        message: "Your application has no permission to access this api"
      });
    }
  });
};

export default authChecker;
