import { mysqldb } from "../configs/database.js";

// ========================= INSERT ========================= //
const insertUsers = async (data) => {
  return mysqldb("users")
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

// ========================= SELECT ========================= //

const selectUsersFilter = async (filter) => {
  const query = await mysqldb
    .select("*")
    .from("users")
    .where(mysqldb.raw(filter));

  return query;
};

const selectUsersCount = async (filter) => {
  const query = await mysqldb
    .count("*", { as: "total_user" })
    .from("users")
    .where(mysqldb.raw(filter));

  return query;
};

// ========================= UPDATE ========================= //

const updateUser = async (data, id) => {
  const updateData = await mysqldb("users").where(`uid`, id).update(data);

  return updateData == 1 ? true : false;
};

// ========================= DELETE ========================= //

const removeUsers = async (id) => {
  const query = await mysqldb("users").where("uid", id).del();
  return query == 1 ? true : false;
};

export {
  insertUsers,
  selectUsersFilter,
  selectUsersCount,
  updateUser,
  removeUsers
};
