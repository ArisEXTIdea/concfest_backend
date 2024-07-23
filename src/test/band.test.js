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

describe("Create Band - /band/create", () => {
  it("Create band - missing some fields", async () => {
    const response = await request(app)
      .post("/band/create")
      .set("Authorization", `${token}`)
      .field("band_name", "Test Band One")
      .field("created_by", "ds9cluczoly9sldal")
      .attach("logo", "./src/test/assets_test/test_logo.png");

    expect(response.body.message).toBe("Failed");
    expect(response.statusCode).toBe(400);
    expect(typeof response.body.error).toBe("object");
  });

  it("Create band - file is not uploaded", async () => {
    const response = await request(app)
      .post("/band/create")
      .set("Authorization", `${token}`)
      .field("band_name", "Test Band One")
      .field("country", "Indonesia")
      .field("website", "https://bandone.com")
      .field("created_by", "ds9cluczoly9sldal");

    expect(response.body.message).toBe("Failed");
    expect(response.statusCode).toBe(400);
    expect(typeof response.body.error).toBe("object");
  });

  it("Create band - Success create band", async () => {
    const response = await request(app)
      .post("/band/create")
      .set("Authorization", `${token}`)
      .field("band_name", "Test Band One")
      .field("country", "Indonesia")
      .field("website", "https://bandone.com")
      .field("created_by", "ds9cluczoly9sldal")
      .attach("logo", "./src/test/assets_test/test_logo.png");

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe("Success");
  });
});

describe("Get Band Pagination /band/page/:page", () => {
  it("Get Band Pagination - Without Filters", async () => {
    const response = await request(app)
      .get(`/band/page/1`)
      .set("Authorization", `${token}`);

    expect(response.body.message).toBe("Success");
    expect(response.statusCode).toBe(200);
    expect(typeof response.body.data).toBe("object");
    expect(typeof response.body.data.total_page).toBe("number");
    expect(typeof response.body.data.data).toBe("object");
  });

  it("Get Band Pagination - With Filters", async () => {
    const response = await request(app)
      .get(`/band/page/1?search=baby`)
      .set("Authorization", `${token}`);

    expect(response.body.message).toBe("Success");
    expect(response.statusCode).toBe(200);
    expect(typeof response.body.data).toBe("object");
    expect(typeof response.body.data.total_page).toBe("number");
    expect(typeof response.body.data.data).toBe("object");
  });
});

describe("Get Band Filter - /band/filter", () => {
  it("Get Band Pagination - With Filters", async () => {
    const response = await request(app)
      .get(`/band/filter?band_name=Baby Metal`)
      .set("Authorization", `${token}`);

    expect(response.body.message).toBe("Success");
    expect(response.statusCode).toBe(200);
    expect(typeof response.body.data).toBe("object");
    expect(response.body.error).toBe(false);
  });
});

describe("Update Band - /band/update/:bid", () => {
  let bandData;

  beforeAll(async () => {
    const response = await request(app)
      .get(`/band/filter?band_name=Test Band One`)
      .set("Authorization", `${token}`);

    bandData = response.body.data[0];
  });

  it("Update band - Success update band without file", async () => {
    const response = await request(app)
      .put(`/band/update/${bandData["bid"]}`)
      .set("Authorization", `${token}`)
      .field("country", "Germany");

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Success");
  });

  it("Update band - Success update band with file", async () => {
    const response = await request(app)
      .put(`/band/update/${bandData["bid"]}`)
      .set("Authorization", `${token}`)
      .field("country", "USA")
      .attach("logo", "./src/test/assets_test/test_logo.png");

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Success");
  });
});

describe("Delete band - /band/delete/:bid", () => {
  let bandData;

  beforeAll(async () => {
    const response = await request(app)
      .get(`/band/filter?band_name=Test Band One`)
      .set("Authorization", `${token}`);

    bandData = response.body.data[0];
  });

  it("Delete Band - Success delete band", async () => {
    const response = await request(app)
      .delete(`/band/delete/${bandData["bid"]}`)
      .set("Authorization", `${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Success");
  });
});

afterAll(async () => {
  await server.close();
});
