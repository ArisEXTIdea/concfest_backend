import Joi from "joi";
import fs from "fs";
import uniqid from "uniqid";
import bcrypt from "bcrypt";
import { uploadImagePath } from "../utils/global_variable.js";
import {
  insertUsers,
  removeUsers,
  selectUsersFilter,
  updateUser
} from "../models/auth_m.js";
import jwt from "jsonwebtoken";

// ====================== POST ====================== //

const postRegisterUser = async (req, res) => {
  // collect variables
  const reqData = req.body;
  const uploadData = req.files;
  const errors = {};
  const d = new Date();

  if (uploadData?.avatar != undefined) {
    reqData["avatar"] = uploadData["avatar"][0];
  } else {
    reqData["avatar"] = "";
  } //check if upload file 'avatar' is exist

  const sameUsername = await selectUsersFilter(
    `username='${reqData.username}'`
  );

  if (sameUsername.length == 0) {
    const validationSchema = Joi.object({
      username: Joi.string()
        .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/)
        .required()
        .messages({
          "string.empty": "Enter your username!",
          "string.pattern.base":
            "Your username must created with alphabets and numbers",
          "any.required": "Field username is not included"
        }),
      full_name: Joi.string().required().messages({
        "string.empty": "Enter your full name!",
        "any.required": "Field username is not included"
      }),
      telephone: Joi.number().required().messages({
        "number.empty": "Enter your phone!",
        "any.required": "Field username is not included"
      }),
      email: Joi.string().email().required().messages({
        "string.empty": "Enter your email!",
        "string.email": "Your email is invalid!",
        "any.required": "Field username is not included"
      }),
      password: Joi.string()
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        )
        .required()
        .messages({
          "string.empty": "Enter your password!",
          "string.pattern.base":
            "8 characters, including one uppercase letter, one lowercase letter, one number, and one special character!",
          "any.required": "Field username is not included"
        }),
      confirm_password: Joi.string()
        .valid(reqData.password)
        .required()
        .messages({
          "string.empty": "Enter your password!",
          "any.only": "Your password does not match!",
          "any.required": "Field username is not included"
        }),
      avatar: Joi.any().external(async (value, helper) => {
        const mimetypeImg = ["image/jpeg", "image/jpg", "image/png"];

        if (value == "") {
          return helper.message("Your profile picture is not uploaded");
        }

        if (!mimetypeImg.includes(value.mimetype)) {
          return helper.message("Your file is not suported");
        }

        if (value.size > 1000000) {
          return helper.message("File size more than 1MB");
        }
      })
    }); //validation rule

    try {
      await validationSchema.validateAsync(reqData, {
        abortEarly: false
      });

      const dataToSave = reqData;
      dataToSave["uid"] = uniqid(); // id for account
      // encrypt password
      const salt = bcrypt.genSaltSync(10);
      dataToSave["password"] = bcrypt.hashSync(reqData["password"], salt); //encrypt password
      dataToSave["avatar"] = reqData.avatar.filename;
      delete dataToSave["confirm_password"];
      dataToSave["created_at"] = d.getTime();
      dataToSave["updated_at"] = d.getTime();

      if (uploadData?.avatar == undefined) {
        delete dataToSave["avatar"];
      }

      // write data to databse
      insertUsers(dataToSave)
        .then((dbResult) => {
          if (dbResult) {
            res.status(201).json({
              message: "Success",
              data: [],
              error: false
            });
          } else {
            if (uploadData?.avatar != undefined) {
              fs.unlinkSync(
                `${uploadImagePath}/${reqData["avatar"]["filename"]}`
              ); // delete file after error
            }
            res.status(500).json({
              message: "Internal Server Error",
              data: [],
              error: {
                db: "Failed to save data to database."
              }
            });
          }
        })
        .catch((dbErrResult) => {
          if (uploadData?.avatar != undefined) {
            fs.unlinkSync(
              `${uploadImagePath}/${reqData["avatar"]["filename"]}`
            ); // delete file after error
          }
          res.status(500).json({
            message: "Internal Server Error",
            data: [],
            error: {
              db: "Failed to save data to database."
            }
          });
        });
    } catch (error) {
      error.details.map((detail) => {
        errors[detail.context.key] = detail.message;
      }); // create error object

      if (uploadData?.avatar != undefined) {
        fs.unlinkSync(`${uploadImagePath}/${reqData["avatar"]["filename"]}`); // delete file after error
      }

      res.status(400).json({
        message: "Failed",
        data: [],
        error: errors
      });
    }
  } else {
    if (uploadData?.avatar != undefined) {
      fs.unlinkSync(`${uploadImagePath}/${reqData["avatar"]["filename"]}`); // delete file after error
    }

    res.status(400).json({
      message: "Failed",
      data: [],
      error: { username: "This username alredy in use." }
    });
  }
};

const postLoginUser = async (req, res) => {
  const reqData = req.body;
  const errors = {};
  const d = new Date();

  const validationSchema = Joi.object({
    username: Joi.string().required().messages({
      "string.empty": "Enter your username!",
      "any.required": "Field username is not included"
    }),
    password: Joi.string().required().messages({
      "string.empty": "Enter your password!",
      "any.required": "Field username is not included"
    })
  }); //validation rule

  try {
    await validationSchema.validateAsync(reqData, {
      abortEarly: false
    });

    const loginCredetial = reqData;

    // check if username exis
    const userData = await selectUsersFilter(
      `username='${loginCredetial["username"]}'`
    );

    if (userData.length > 0) {
      // check password
      const passwordValidate = bcrypt.compareSync(
        loginCredetial.password,
        userData[0]["password"]
      );

      if (passwordValidate) {
        // create sesssion and JWT token
        const loginSession = {
          login_id: uniqid(),
          uid: userData[0].uid,
          login_date: d.getTime(),
          username: userData[0].username,
          full_name: userData[0].full_name,
          telephone: userData[0].telephone,
          email: userData[0].email,
          avatar: userData[0].avatar,
          expired_at: d.getTime() + 2629800000
        };

        fs.writeFile(
          `./sessions/${loginSession["login_id"]}.json`,
          JSON.stringify(loginSession),
          (err) => {}
        );

        const jwtTokenData = {
          login_id: loginSession.login_id
        };

        const jwtToken = jwt.sign(
          jwtTokenData,
          process.env.SERVER_SECRET_TOKEN_KEY
        );

        res.status(200).json({
          message: "Success",
          data: {
            token: jwtToken
          },
          error: false
        });
      } else {
        res.status(403).json({
          message: "Failed",
          data: [],
          error: {
            password: "Your password is wrong!"
          }
        });
      }
    } else {
      res.status(404).json({
        message: "Failed",
        data: [],
        error: {
          username: "Account not found!"
        }
      });
    }
  } catch (error) {
    error.details.map((detail) => {
      errors[detail.context.key] = detail.message;
    }); // create error object

    res.status(400).json({
      message: "Failed",
      data: [],
      error: errors
    });
  }
};

const postLogoutUser = async (req, res) => {
  const reqData = req.body;
  const errors = {};

  const validationSchema = Joi.object({
    token: Joi.string().required().messages({
      "string.empty": "Enter your token!",
      "any.required": "Field token is not included"
    })
  }); //validation rule

  try {
    await validationSchema.validateAsync(reqData, {
      abortEarly: false
    });

    const token = reqData.token;

    jwt.verify(token, process.env.SERVER_SECRET_TOKEN_KEY, (err, decoded) => {
      const sessionId = decoded.login_id;
      fs.unlinkSync(`./sessions/${sessionId}.json`);
    });

    res.status(200).json({
      message: "Success",
      data: [],
      error: false
    });
  } catch (error) {
    error.details.map((detail) => {
      errors[detail.context.key] = detail.message;
    }); // create error object

    res.status(400).json({
      message: "Failed",
      data: [],
      error: errors
    });
  }
};

// ====================== GET ====================== //

const getUserPagination = async (req, res) => {
  const itemPerPage = 10;
  const page = req.params.page;
  const filter = req.query.search;
  const userData = await selectUsersFilter(
    `username like '%${filter}%' or full_name like '%${filter}%' or email like '%${filter}%'`
  );
  console.log(page);
  const totalData = userData.length;
  var totalPage = Math.ceil(totalData / itemPerPage);
  const currentPageData = userData.splice(
    (page - 1) * itemPerPage,
    itemPerPage
  );

  res.status(200).json({
    message: "Success",
    data: {
      total_page: totalPage,
      data: currentPageData
    },
    error: false
  });
};

const getUserFilter = async (req, res) => {
  const filter = req.query;
  const queryFilterArray = [];

  Object.keys(filter).map((item) => {
    queryFilterArray.push(`${item}='${filter[item]}'`);
  });

  const userData = await selectUsersFilter(queryFilterArray.join(" and "));

  res.status(200).json({
    message: "Success",
    data: userData,
    error: false
  });
};

const getSession = (req, res) => {
  const token = req.headers.authorization;
  jwt.verify(token, process.env.SERVER_SECRET_TOKEN_KEY, (err, decode) => {
    if (err == null) {
      fs.readFile(
        `./sessions/${decode.login_id}.json`,
        "utf-8",
        (err, data) => {
          if (!err) {
            res.status(200).json({
              message: "Success",
              data: JSON.parse(data),
              error: false
            });
          } else {
            res.status(404).json({
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

// ====================== PUT ====================== //
const putUser = async (req, res) => {
  // collect variables
  const reqData = req.body;
  const uploadData = req.files;
  const errors = {};
  const d = new Date();
  const uid = req.params.uid;

  if (uploadData?.avatar != undefined) {
    reqData["avatar"] = uploadData["avatar"][0];
  } else {
    reqData["avatar"] = "";
  } //check if upload file 'avatar' is exist

  const sameUsername = await selectUsersFilter(
    `username='${reqData.username}'`
  );

  if (sameUsername.length == 0) {
    const validationSchema = Joi.object({
      username: Joi.string()
        .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/)
        .messages({
          "string.empty": "Enter your username!",
          "string.pattern.base":
            "Your username must created with alphabets and numbers"
        }),
      full_name: Joi.string().messages({
        "string.empty": "Enter your full name!"
      }),
      telephone: Joi.number().messages({
        "number.empty": "Enter your phone!"
      }),
      email: Joi.string().email().messages({
        "string.empty": "Enter your email!",
        "string.email": "Your email is invalid!"
      }),
      password: Joi.string()
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        )

        .messages({
          "string.empty": "Enter your password!",
          "string.pattern.base":
            "8 characters, including one uppercase letter, one lowercase letter, one number, and one special character!"
        }),
      avatar: Joi.any().external(async (value, helper) => {
        const mimetypeImg = ["image/jpeg", "image/jpg", "image/png"];

        if (value == "") {
          return;
        }

        if (!mimetypeImg.includes(value.mimetype)) {
          return helper.message("Your file is not suported");
        }

        if (value.size > 1000000) {
          return helper.message("File size more than 1MB");
        }
      })
    }); //validation rule

    try {
      await validationSchema.validateAsync(reqData, {
        abortEarly: false
      });

      const dataToSave = reqData;

      // encrypt password
      if ("password" in dataToSave) {
        const salt = bcrypt.genSaltSync(10);
        dataToSave["password"] = bcrypt.hashSync(reqData["password"], salt); //encrypt password
      }

      if (uploadData?.avatar != undefined) {
        dataToSave["avatar"] = reqData.avatar.filename;
      } else {
        delete dataToSave["avatar"];
      }

      dataToSave["updated_at"] = d.getTime();

      const userData = await selectUsersFilter(`uid='${uid}'`);
      const oldFileName = userData[0]["avatar"];

      // write data to databse
      updateUser(dataToSave, uid)
        .then((dbResult) => {
          if (dbResult) {
            if (uploadData?.avatar != undefined) {
              fs.unlinkSync(`${uploadImagePath}/${oldFileName}`);
            }

            res.status(200).json({
              message: "Success",
              data: [],
              error: false
            });
          } else {
            res.status(500).json({
              message: "Internal Server Error",
              data: [],
              error: {
                db: "Failed to save data to database."
              }
            });
          }
        })
        .catch((dbErrResult) => {
          res.status(500).json({
            message: "Internal Server Error",
            data: [],
            error: {
              db: "Failed to save data to database."
            }
          });
        });
    } catch (error) {
      error.details.map((detail) => {
        errors[detail.context.key] = detail.message;
      }); // create error object

      if (uploadData?.avatar != undefined) {
        fs.unlinkSync(`${uploadImagePath}/${reqData["avatar"]["filename"]}`); // delete file after error
      }

      res.status(400).json({
        message: "Failed",
        data: [],
        error: errors
      });
    }
  } else {
    res.status(400).json({
      message: "Failed",
      data: [],
      error: { username: "This username alredy in use." }
    });
  }
};

const putSession = async (req, res) => {
  const d = new Date();
  const token = req.headers.authorization;

  jwt.verify(token, process.env.SERVER_SECRET_TOKEN_KEY, (err, decode) => {
    fs.readFile(
      `./sessions/${decode.login_id}.json`,
      "utf-8",
      (error, sessionData) => {
        const sessionJSON = JSON.parse(sessionData);
        selectUsersFilter(`uid='${sessionJSON["uid"]}'`)
          .then((userData) => {
            const loginSession = {
              login_id: decode.login_id,
              uid: userData[0].uid,
              login_date: d.getTime(),
              username: userData[0].username,
              full_name: userData[0].full_name,
              telephone: userData[0].telephone,
              email: userData[0].email,
              avatar: userData[0].avatar,
              expired_at: d.getTime() + 2629800000
            };

            fs.writeFile(
              `./sessions/${loginSession["login_id"]}.json`,
              JSON.stringify(loginSession),
              (err) => {}
            );

            res.status(200).json({
              message: "Success",
              data: {},
              error: false
            });
          })
          .catch((err) => {
            res.status(500).json({
              message: "Internal server error",
              data: {},
              error: true
            });
          });
      }
    );
  });
};
// ====================== DELETE ====================== //
const deleteUser = async (req, res) => {
  const uid = req.params.uid;

  var userData = await selectUsersFilter(`uid='${uid}'`);

  if (userData.length > 0) {
    userData = userData[0];
    try {
      removeUsers(userData.uid);

      fs.unlinkSync(`${uploadImagePath}/${userData.avatar}`);

      res.status(200).json({
        message: "Success"
      });
    } catch (err) {
      res.status(500).json({
        message: "Internal server error!"
      });
    }
  } else {
    res.status(404).json({
      message: "Data not found."
    });
  }
};

export {
  postRegisterUser,
  postLoginUser,
  postLogoutUser,
  getUserFilter,
  getUserPagination,
  getSession,
  putUser,
  putSession,
  deleteUser
};
