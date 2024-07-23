import request from "supertest";
import app from "../..";

let token;
let server;

beforeAll(async () => {
  const response = await request(app)
    .post("/authentication/login")
    .send({ username: "admin", password: "Kandangrusa123@" });

  server = app.listen(4000, () => {});

  token = response.body.data.token;
});

describe("Create User - /authentication/register", () => {
  it("Create user - missing some field", async () => {
    const response = await request(app)
      .post("/authentication/register")
      .set("Authorization", `${token}`)
      .field("full_name", "Test Account One")
      .field("telephone", "0895371849899")
      .field("password", "Kandangrusa123@")
      .field("confirm_password", "Kandangrusa123@")
      .attach("avatar", "./src/test/assets_test/test_avatar.jpg");

    expect(response.body.message).toBe("Failed");
    expect(response.statusCode).toBe(400);
    expect(typeof response.body.error).toBe("object");
  });

  it("Create user - file is not uploaded", async () => {
    const response = await request(app)
      .post("/authentication/register")
      .set("Authorization", `${token}`)
      .field("username", "admin123")
      .field("full_name", "Test Account One")
      .field("telephone", "0895371849899")
      .field("email", "email@email.com")
      .field("password", "Kandangrusa123@")
      .field("confirm_password", "Kandangrusa123@");

    expect(response.body.message).toBe("Failed");
    expect(response.statusCode).toBe(400);
    expect(typeof response.body.error).toBe("object");
  });

  it("Create user - Success register user", async () => {
    const response = await request(app)
      .post("/authentication/register")
      .set("Authorization", `${token}`)
      .field("username", "admin123")
      .field("full_name", "Test Account One")
      .field("telephone", "0895371849899")
      .field("email", "email@email.com")
      .field("password", "Kandangrusa123@")
      .field("confirm_password", "Kandangrusa123@")
      .attach("avatar", "./src/test/assets_test/test_avatar.jpg");

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe("Success");
  });
});

describe("Login User - /authentication/login", () => {
  it("Login Failed - Wrong credential", async () => {
    const response = await request(app).post("/authentication/login").send({
      username: "admin123",
      password: "Kandangrusa123@123"
    });

    expect(response.body.message).toBe("Failed");
    expect(response.statusCode).toBe(403);
    expect(typeof response.body.error).toBe("object");
  });

  it("Login Success - Correct credential", async () => {
    const response = await request(app).post("/authentication/login").send({
      username: "admin123",
      password: "Kandangrusa123@"
    });

    expect(response.body.message).toBe("Success");
    expect(response.statusCode).toBe(200);
    expect(response.body.error).toBe(false);
  });
});

describe("Get User Pagination /authentication/users/page/:page", () => {
  it("Get User Pagination - Without Filters", async () => {
    const response = await request(app)
      .get(`/authentication/users/page/1`)
      .set("Authorization", `${token}`);

    expect(response.body.message).toBe("Success");
    expect(response.statusCode).toBe(200);
    expect(typeof response.body.data).toBe("object");
    expect(typeof response.body.data.total_page).toBe("number");
    expect(typeof response.body.data.data).toBe("object");
  });

  it("Get User Pagination - With Filters", async () => {
    const response = await request(app)
      .get(`/authentication/users/page/1?full_name=Account`)
      .set("Authorization", `${token}`);

    expect(response.body.message).toBe("Success");
    expect(response.statusCode).toBe(200);
    expect(typeof response.body.data).toBe("object");
    expect(typeof response.body.data.total_page).toBe("number");
    expect(typeof response.body.data.data).toBe("object");
  });
});

describe("Get User Filter - /authentication/users/filter", () => {
  it("Get User Pagination - Without Filters", async () => {
    const response = await request(app)
      .get(`/authentication/users/filter?username=admin123`)
      .set("Authorization", `${token}`);

    expect(response.body.message).toBe("Success");
    expect(response.statusCode).toBe(200);
    expect(typeof response.body.data).toBe("object");
    expect(response.body.error).toBe(false);
  });
});

describe("Update User - /authentication/users/update/:uid", () => {
  let userData;

  beforeAll(async () => {
    const response = await request(app)
      .get(`/authentication/users/filter?username=admin123`)
      .set("Authorization", `${token}`);

    userData = response.body.data[0];
  });

  it("Update user - Success update user without file", async () => {
    const response = await request(app)
      .put(`/authentication/users/update/${userData["uid"]}`)
      .set("Authorization", `${token}`)
      .field("email", "email@email.com");

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Success");
  });

  it("Update user - Success update user with file", async () => {
    const response = await request(app)
      .put(`/authentication/users/update/${userData["uid"]}`)
      .set("Authorization", `${token}`)
      .field("email", "email2@email.com")
      .attach("avatar", "./src/test/assets_test/test_avatar.jpg");

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Success");
  });
});

describe("Delete User - /authentication/users/delete/:uid", () => {
  let userData;

  beforeAll(async () => {
    const response = await request(app)
      .get(`/authentication/users/filter?username=admin123`)
      .set("Authorization", `${token}`);

    userData = response.body.data[0];
  });

  it("Delete user - Success delete user", async () => {
    const response = await request(app)
      .delete(`/authentication/users/delete/${userData["uid"]}`)
      .set("Authorization", `${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Success");
  });
});

afterAll(async () => {
  await server.close();
});
