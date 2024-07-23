import { mysqldb } from "../configs/database.js";

// ------------------------ INSERT ------------------------ //
const insertEvent = async (data) => {
  return mysqldb("event")
    .insert(data)
    .then((result) => {
      if (result.rowCount > 0) {
        return false;
      } else {
        return true;
      }
    })
    .catch((error) => {
      return false;
    });
};

// ------------------------ SELECT ------------------------ //

const selectEventFilter = async (filter) => {
  const query = await mysqldb
    .select("*")
    .from("event")
    .where(mysqldb.raw(filter));

  return query;
};

const selectEventAll = async (filter) => {
  const query = await mysqldb.select("*").from("event");

  return query;
};

const selectEventCount = async (filter) => {
  const query = await mysqldb
    .count("*", { as: "total_event" })
    .from("event")
    .where(mysqldb.raw(filter));

  return query;
};

// ------------------------ UPDATE ------------------------ //

const updateEvent = async (data, id) => {
  const updateData = await mysqldb("event").where(`eid`, id).update(data);

  return updateData == 1 ? true : false;
};

// ------------------------ DELETE ------------------------ //

const removeEvent = async (id) => {
  const query = await mysqldb("event").where("eid", id).del();
  return query == 1 ? true : false;
};

export {
  insertEvent,
  selectEventCount,
  selectEventFilter,
  selectEventAll,
  updateEvent,
  removeEvent
};
