import { mysqldb } from "../configs/database.js";

// ------------------------ INSERT ------------------------ //
const insertBand = async (data) => {
  return mysqldb("band")
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

const selectBandFilter = async (filter) => {
  const query = await mysqldb
    .select("band.*", "users.full_name")
    .from("band")
    .leftJoin("users", "band.created_by", "users.uid")
    .where(mysqldb.raw(filter));

  return query;
};

const selectBandSearch = async (filter) => {
  let query = mysqldb
    .select("band.*", "users.full_name")
    .from("band")
    .leftJoin("users", "band.created_by", "users.uid");

  Object.keys(filter).forEach((key, index) => {
    if (index === 0) {
      query = query.where(key, "like", `%${filter[key]}%`);
    } else {
      query = query.orWhere(key, "like", `%${filter[key]}%`);
    }
  });

  // Execute the query
  const result = await query;
  return result;
};

const selectBandCount = async (filter) => {
  const query = await mysqldb
    .count("*", { as: "total_user" })
    .from("band")
    .where(mysqldb.raw(filter));

  return query;
};

const selectBandAll = async (filter) => {
  const query = await mysqldb.select("*").from("band");

  return query;
};

// ------------------------ UPDATE ------------------------ //

const updateBand = async (data, id) => {
  const updateData = await mysqldb("band").where(`bid`, id).update(data);

  return updateData == 1 ? true : false;
};

// ------------------------ DELETE ------------------------ //

const removeBand = async (id) => {
  const query = await mysqldb("band").where("bid", id).del();
  return query == 1 ? true : false;
};

export {
  insertBand,
  selectBandCount,
  selectBandFilter,
  selectBandSearch,
  selectBandAll,
  updateBand,
  removeBand
};
