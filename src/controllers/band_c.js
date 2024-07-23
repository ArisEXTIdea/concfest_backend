import {
  insertBand,
  removeBand,
  selectBandAll,
  selectBandFilter,
  selectBandSearch,
  updateBand
} from "../models/band_m.js";
import Joi from "joi";
import uniqid from "uniqid";
import fs from "fs";
import { uploadImagePath } from "../utils/global_variable.js";
import { selectUsersFilter } from "../models/auth_m.js";

// ------------------------ POST ------------------------ //
const postCreateBand = async (req, res) => {
  // collect variables
  const reqData = req.body;
  const uploadData = req.files;
  const errors = {};
  const d = new Date();

  if (uploadData?.logo != undefined) {
    reqData["logo"] = uploadData["logo"][0];
  } else {
    reqData["logo"] = "";
  } //check if upload file 'logo' is exist

  const sameUsername = await selectBandFilter(
    `band_name='${reqData.band_name}'`
  );

  if (sameUsername.length == 0) {
    const validationSchema = Joi.object({
      band_name: Joi.string().required().messages({
        "string.empty": "Enter band name!",
        "any.required": "Field band_name is not included"
      }),
      country: Joi.string().required().messages({
        "string.empty": "Enter country!",
        "any.required": "Field country is not included"
      }),
      website: Joi.string().required().messages({
        "string.empty": "Enter band webiste!",
        "any.required": "Field website is not included"
      }),
      created_by: Joi.any().external(async (value, helper) => {
        const uid = value;

        if (uid == undefined) {
          return helper.message("Enter your uid!");
        }

        const userData = await selectUsersFilter(`uid='${uid}'`);

        if (userData.length < 1) {
          return helper.message("User not found!");
        }

        return;
      }),
      logo: Joi.any().external(async (value, helper) => {
        const mimetypeImg = ["image/jpeg", "image/jpg", "image/png"];

        if (value == "") {
          return helper.message("Please upload band logo!");
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
      dataToSave["bid"] = uniqid(); // id for account
      dataToSave["created_at"] = d.getTime();
      dataToSave["updated_at"] = d.getTime();

      if (uploadData?.logo == undefined) {
        delete dataToSave["logo"];
      } else {
        dataToSave["logo"] = uploadData.logo[0]["filename"];
      }

      // write data to databse
      insertBand(dataToSave)
        .then((dbResult) => {
          if (dbResult) {
            res.status(201).json({
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

      if (uploadData?.logo != undefined) {
        fs.unlinkSync(`${uploadImagePath}/${reqData["logo"]["filename"]}`); // delete file after error
      }

      res.status(400).json({
        message: "Failed",
        data: [],
        error: errors
      });
    }
  } else {
    if (uploadData?.logo != undefined) {
      fs.unlinkSync(`${uploadImagePath}/${reqData["logo"]["filename"]}`); // delete file after error
    }

    res.status(400).json({
      message: "Failed",
      data: [],
      error: { band_name: "This band alredy registered." }
    });
  }
};

// ------------------------ GET ------------------------ //
const getBandPagination = async (req, res) => {
  const itemPerPage = 10;
  const page = req.params.page;
  const filter = req.query.search;
  const bandData = await selectBandFilter(
    `band_name like '%${filter}%' or country like '%${filter}%'`
  );

  const totalData = bandData.length;

  var totalPage = Math.ceil(totalData / itemPerPage);
  const currentPageData = bandData.splice(
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

const getBandFilter = async (req, res) => {
  const filter = req.query;
  const queryFilterArray = [];

  Object.keys(filter).map((item) => {
    queryFilterArray.push(`${item}='${filter[item]}'`);
  });

  const bandData = await selectBandFilter(queryFilterArray.join(" and "));

  res.status(200).json({
    message: "Success",
    data: bandData,
    error: false
  });
};

const getBandSearch = async (req, res) => {
  const filter = req.query;

  const bandData = await selectBandSearch(filter);

  res.status(200).json({
    message: "Success",
    data: bandData,
    error: false
  });
};

const getBandResume = async (req, res) => {
  const dataBand = await selectBandAll();
  res.status(200).json({
    message: "Success",
    data: {
      total_band: dataBand.length
    },
    error: false
  });
};

// ------------------------ UPDATE ------------------------ //

const putBand = async (req, res) => {
  // collect variables
  const reqData = req.body;
  const uploadData = req.files;
  const errors = {};
  const d = new Date();
  const bid = req.params.bid;

  if (uploadData?.logo != undefined) {
    reqData["logo"] = uploadData["logo"][0];
  } else {
    reqData["logo"] = "";
  } //check if upload file 'logo' is exist

  const sameUsername = await selectBandFilter(
    `band_name='${reqData.band_name}'`
  );

  if (sameUsername.length == 0 || sameUsername[0].bid == bid) {
    const validationSchema = Joi.object({
      band_name: Joi.string().messages({
        "string.empty": "Enter band name!"
      }),
      country: Joi.string().messages({
        "string.empty": "Enter country!"
      }),
      website: Joi.string().messages({
        "string.empty": "Enter band website!"
      }),
      created_by: Joi.any().external(async (value, helper) => {
        const uid = value;

        if (uid == undefined) {
          return;
        }

        const userData = await selectUsersFilter(`uid='${uid}'`);

        if (userData.length < 1) {
          return helper.message("User not found!");
        }
      }),
      logo: Joi.any().external(async (value, helper) => {
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

      const dataToUpdate = reqData;
      dataToUpdate["updated_at"] = d.getTime();

      if (uploadData?.logo == undefined || uploadData?.logo == "") {
        delete dataToUpdate["logo"];
      } else {
        dataToUpdate["logo"] = uploadData.logo[0]["filename"];
      }

      const bandData = await selectBandFilter(`bid='${bid}'`);
      const oldLogoFilename = bandData[0]["logo"];

      // write data to databse
      updateBand(dataToUpdate, bid)
        .then((dbResult) => {
          if (dbResult) {
            if (uploadData?.logo != undefined) {
              fs.unlinkSync(`${uploadImagePath}/${oldLogoFilename}`); // delete file after error
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
          if (uploadData?.logo != undefined) {
            fs.unlinkSync(`${uploadImagePath}/${oldLogoFilename}`); // delete file after error
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

      if (uploadData?.logo != undefined) {
        fs.unlinkSync(`${uploadImagePath}/${reqData["logo"]["filename"]}`); // delete file after error
      }

      res.status(400).json({
        message: "Failed",
        data: [],
        error: errors
      });
    }
  } else {
    if (uploadData?.logo != undefined) {
      fs.unlinkSync(`${uploadImagePath}/${reqData["logo"]["filename"]}`); // delete file after error
    }

    res.status(400).json({
      message: "Failed",
      data: [],
      error: { band_name: "This band alredy registered." }
    });
  }
};

// ------------------------ DELETE ------------------------ //

const deleteBand = async (req, res) => {
  const bid = req.params.bid;

  var bandData = await selectBandFilter(`bid='${bid}'`);

  if (bandData.length > 0) {
    bandData = bandData[0];
    try {
      removeBand(bandData.bid);

      fs.unlinkSync(`${uploadImagePath}/${bandData.logo}`);

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
  postCreateBand,
  getBandPagination,
  getBandFilter,
  getBandSearch,
  getBandResume,
  putBand,
  deleteBand
};
