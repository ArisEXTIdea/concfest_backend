import Joi from "joi";
import uniqid from "uniqid";
import fs from "fs";
import { uploadImagePath } from "../utils/global_variable.js";
import { selectUsersFilter } from "../models/auth_m.js";
import {
  insertEvent,
  removeEvent,
  selectEventAll,
  selectEventFilter,
  updateEvent
} from "../models/event_m.js";

// ------------------------ POST ------------------------ //
const postCreateEvent = async (req, res) => {
  // collect variables
  const reqData = req.body;
  const uploadData = req.files;
  const errors = {};
  const d = new Date();

  if (uploadData?.banner != undefined) {
    reqData["banner"] = uploadData["banner"][0];
  } else {
    reqData["banner"] = "";
  } //check if upload file 'banner' is exist

  const sameEvent = await selectEventFilter(
    `event_name='${reqData.event_name}'`
  );

  if (sameEvent.length == 0) {
    const validationSchema = Joi.object({
      event_name: Joi.string().required().messages({
        "string.empty": "Enter event name!",
        "any.required": "Field event_name is not included"
      }),
      location: Joi.string().required().messages({
        "string.empty": "Enter event location!",
        "any.required": "Field location is not included"
      }),
      location_maps: Joi.string()
        .regex(
          /^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/i
        )
        .required()
        .messages({
          "string.empty": "Enter location maps url!",
          "string.pattern.base": "Your maps url is not valid",
          "any.required": "Field location_maps is not included"
        }),
      start_date: Joi.date().required().messages({
        "date.empty": "Choose start event date!",
        "any.required": "Field start_date is not included"
      }),
      end_date: Joi.date().required().messages({
        "date.empty": "Choose date for event end!",
        "any.required": "Field end_date is not included"
      }),
      bands: Joi.string().required().messages({
        "string.empty": "Enter band participant!",
        "any.required": "Field bands is not included"
      }),
      website_ticket: Joi.string()
        .regex(
          /^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/i
        )
        .messages({
          "string.empty": "Enter Website Ticket url!",
          "string.pattern.base": "Your url is not valid"
        }),
      ticket_price: Joi.number().required().messages({
        "number.empty": "Enter event ticket price webiste!",
        "any.required": "Field ticket_price is not included"
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
      banner: Joi.any().external(async (value, helper) => {
        const mimetypeImg = ["image/jpeg", "image/jpg", "image/png"];

        if (value == "") {
          return helper.message("Upload event banner!");
        }

        if (!mimetypeImg.includes(value.mimetype)) {
          return helper.message("Your file is not suported");
        }

        if (value.size > 5000000) {
          return helper.message("File size more than 5MB");
        }
      })
    }); //validation rule

    try {
      await validationSchema.validateAsync(reqData, {
        abortEarly: false
      });

      const dataToSave = reqData;
      dataToSave["eid"] = uniqid(); // id for account
      dataToSave["created_at"] = d.getTime();
      dataToSave["updated_at"] = d.getTime();
      dataToSave["start_date"] = new Date(reqData["start_date"]).getTime();
      dataToSave["end_date"] = new Date(reqData["end_date"]).getTime();

      if (uploadData?.banner == undefined) {
        delete dataToSave["banner"];
      } else {
        dataToSave["banner"] = uploadData.banner[0]["filename"];
      }

      // write data to databse
      insertEvent(dataToSave)
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
          if (uploadData?.banner != undefined) {
            fs.unlinkSync(
              `${uploadImagePath}/${reqData["banner"]["filename"]}`
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

      if (uploadData?.banner != undefined) {
        fs.unlinkSync(`${uploadImagePath}/${reqData["banner"]["filename"]}`); // delete file after error
      }

      res.status(400).json({
        message: "Failed",
        data: [],
        error: errors
      });
    }
  } else {
    if (uploadData?.banner != undefined) {
      fs.unlinkSync(`${uploadImagePath}/${reqData["banner"]["filename"]}`); // delete file after error
    }

    res.status(400).json({
      message: "Failed",
      data: [],
      error: { username: "This band alredy registered." }
    });
  }
};

// ------------------------ GET ------------------------ //
const getEventPagination = async (req, res) => {
  const itemPerPage = 10;
  const page = req.params.page;
  const filter = req.query.search;
  const eventData = await selectEventFilter(
    `event_name like '%${filter}%' or location like '%${filter}%'`
  );

  const totalData = eventData.length;

  var totalPage = Math.ceil(totalData / itemPerPage);
  const currentPageData = eventData.splice(
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

const getEventFilter = async (req, res) => {
  const filter = req.query;
  const queryFilterArray = [];

  Object.keys(filter).map((item) => {
    queryFilterArray.push(`${item}='${filter[item]}'`);
  });

  const eventData = await selectEventFilter(queryFilterArray.join(" and "));

  res.status(200).json({
    message: "Success",
    data: eventData,
    error: false
  });
};

const getResumeEvents = async (req, res) => {
  const dataEvent = await selectEventAll();
  res.status(200).json({
    message: "Success",
    data: {
      total_event: dataEvent.length
    },
    error: false
  });
};

// ------------------------ UPDATE ------------------------ //

const putEvent = async (req, res) => {
  // collect variables
  const reqData = req.body;
  const uploadData = req.files;
  const errors = {};
  const d = new Date();
  const eid = req.params.eid;

  if (uploadData?.banner != undefined) {
    reqData["banner"] = uploadData["banner"][0];
  } else {
    reqData["banner"] = "";
  } //check if upload file 'banner' is exist

  const validationSchema = Joi.object({
    event_name: Joi.string().messages({
      "string.empty": "Enter event name!"
    }),
    location: Joi.string().messages({
      "string.empty": "Enter event location!"
    }),
    location_maps: Joi.string()
      .regex(
        /^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/i
      )

      .messages({
        "string.empty": "Enter location maps url!",
        "string.pattern.base": "Your maps url is not valid"
      }),
    start_date: Joi.date().messages({
      "date.empty": "Choose start event date!"
    }),
    end_date: Joi.date().messages({
      "date.empty": "Choose date for event end!"
    }),
    bands: Joi.string().messages({
      "string.empty": "Enter band participant!"
    }),
    ticket_price: Joi.number().messages({
      "number.empty": "Enter event ticket price webiste!"
    }),
    website_ticket: Joi.string()
      .regex(
        /^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/i
      )
      .messages({
        "string.empty": "Enter Website Ticket url!",
        "string.pattern.base": "Your url is not valid"
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

      return;
    }),
    banner: Joi.any().external(async (value, helper) => {
      const mimetypeImg = ["image/jpeg", "image/jpg", "image/png"];

      if (value == "") {
        return;
      }

      if (!mimetypeImg.includes(value.mimetype)) {
        return helper.message("Your file is not suported");
      }

      if (value.size > 5000000) {
        return helper.message("File size more than 5MB");
      }
    })
  }); //validation rule

  try {
    await validationSchema.validateAsync(reqData, {
      abortEarly: false
    });

    const dataToUpdate = reqData;
    dataToUpdate["updated_at"] = d.getTime();
    if (dataToUpdate["start_date"]) {
      dataToUpdate["start_date"] = new Date(reqData["start_date"]).getTime();
    }

    if (dataToUpdate["end_date"]) {
      dataToUpdate["end_date"] = new Date(reqData["end_date"]).getTime();
    }

    if (uploadData?.banner == undefined || uploadData?.banner == "") {
      delete dataToUpdate["banner"];
    } else {
      dataToUpdate["banner"] = uploadData.banner[0]["filename"];
    }

    const eventData = await selectEventFilter(`eid='${eid}'`);
    const oldBannerFilename = eventData[0]["banner"];

    // write data to databse
    updateEvent(dataToUpdate, eid)
      .then((dbResult) => {
        if (dbResult) {
          if (uploadData?.banner != undefined) {
            fs.unlinkSync(`${uploadImagePath}/${oldBannerFilename}`);
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
        if (uploadData?.banner != undefined) {
          fs.unlinkSync(`${uploadImagePath}/${reqData["banner"]["filename"]}`); // delete file after error
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

    if (uploadData?.banner != undefined) {
      fs.unlinkSync(`${uploadImagePath}/${reqData["banner"]["filename"]}`); // delete file after error
    }

    res.status(400).json({
      message: "Failed",
      data: [],
      error: errors
    });
  }
};

// ------------------------ DELETE ------------------------ //

const deleteEvent = async (req, res) => {
  const eid = req.params.eid;

  var eventData = await selectEventFilter(`eid='${eid}'`);

  if (eventData.length > 0) {
    eventData = eventData[0];
    try {
      removeEvent(eventData.eid);

      fs.unlinkSync(`${uploadImagePath}/${eventData.banner}`);

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
  postCreateEvent,
  getEventPagination,
  getEventFilter,
  getResumeEvents,
  putEvent,
  deleteEvent
};
