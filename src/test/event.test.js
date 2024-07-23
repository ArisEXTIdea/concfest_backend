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

describe("Create Event - /event/create", () => {
  it("Create event - missing some fields", async () => {
    const response = await request(app)
      .post("/event/create")
      .set("Authorization", `${token}`)
      .field("event_name", "Test Event One")
      .field("created_by", "ds9cluczoly9sldal")
      .attach("banner", "./src/test/assets_test/test_banner.jpg");

    expect(response.body.message).toBe("Failed");
    expect(response.statusCode).toBe(400);
    expect(typeof response.body.error).toBe("object");
  });

  it("Create Event - file is not uploaded", async () => {
    const response = await request(app)
      .post("/event/create")
      .set("Authorization", `${token}`)
      .field("event_name", "Test Event One")
      .field("location", "Indonesia")
      .field("location_maps", "https://maps.com")
      .field("start_date", "01-01-2024")
      .field("end_date", "12-12-2024")
      .field(
        "bands",
        JSON.stringify([
          {
            bid: "ds9cluof0lyjpcpv8",
            band_name: "Baby Metal",
            country: "Japan"
          },
          {
            bid: "ds9clu82wlyjplkpk",
            band_name: "Bring Me The Horizon",
            country: "England"
          }
        ])
      )
      .field("ticket_price", "1000000")
      .field("created_by", "ds9cluczoly9sldal");

    expect(response.body.message).toBe("Failed");
    expect(response.statusCode).toBe(400);
    expect(typeof response.body.error).toBe("object");
  });

  it("Create Event - Success create event", async () => {
    const response = await request(app)
      .post("/event/create")
      .set("Authorization", `${token}`)
      .field("event_name", "Test Event One")
      .field("location", "Indonesia")
      .field("location_maps", "https://maps.com")
      .field("start_date", "01-01-2024")
      .field("end_date", "12-12-2024")
      .field(
        "bands",
        JSON.stringify([
          {
            bid: "ds9cluof0lyjpcpv8",
            band_name: "Baby Metal",
            country: "Japan"
          },
          {
            bid: "ds9clu82wlyjplkpk",
            band_name: "Bring Me The Horizon",
            country: "England"
          }
        ])
      )
      .field("ticket_price", 1000000)
      .field("website_ticket", "https://helloticket.com")
      .field("created_by", "ds9cluczoly9sldal")
      .attach("banner", "./src/test/assets_test/test_banner.jpg");

    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe("Success");
  });
});

describe("Get Event Pagination /event/page/:page", () => {
  it("Get Event Pagination - Without Filters", async () => {
    const response = await request(app)
      .get(`/event/page/1`)
      .set("Authorization", `${token}`);

    expect(response.body.message).toBe("Success");
    expect(response.statusCode).toBe(200);
    expect(typeof response.body.data).toBe("object");
    expect(typeof response.body.data.total_page).toBe("number");
    expect(typeof response.body.data.data).toBe("object");
  });

  it("Get Event Pagination - With Filters", async () => {
    const response = await request(app)
      .get(`/event/page/1?search=Nex`)
      .set("Authorization", `${token}`);

    expect(response.body.message).toBe("Success");
    expect(response.statusCode).toBe(200);
    expect(typeof response.body.data).toBe("object");
    expect(typeof response.body.data.total_page).toBe("number");
    expect(typeof response.body.data.data).toBe("object");
  });
});

describe("Get Event Filter - /event/filter", () => {
  it("Get Event Pagination - With Filters", async () => {
    const response = await request(app)
      .get(`/event/filter?event_name=Test Event One`)
      .set("Authorization", `${token}`);

    expect(response.body.message).toBe("Success");
    expect(response.statusCode).toBe(200);
    expect(typeof response.body.data).toBe("object");
    expect(response.body.error).toBe(false);
  });
});

describe("Update Event - /event/update/:eid", () => {
  let eventData;

  beforeAll(async () => {
    const response = await request(app)
      .get(`/event/filter?event_name=Test Event One`)
      .set("Authorization", `${token}`);

    eventData = response.body.data[0];
  });

  it("Update event - Success update event without file", async () => {
    const response = await request(app)
      .put(`/event/update/${eventData["eid"]}`)
      .set("Authorization", `${token}`)
      .field("location", "Germany");

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Success");
  });

  it("Update event - Success update event with file", async () => {
    const response = await request(app)
      .put(`/event/update/${eventData["eid"]}`)
      .set("Authorization", `${token}`)
      .field("location", "Germany")
      .attach("banner", "./src/test/assets_test/test_banner.jpg");

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Success");
  });
});

describe("Delete event - /event/delete/:eid", () => {
  let eventData;

  beforeAll(async () => {
    const response = await request(app)
      .get(`/event/filter?event_name=Test Event One`)
      .set("Authorization", `${token}`);

    eventData = response.body.data[0];
  });

  it("Delete Event - Success delete event", async () => {
    const response = await request(app)
      .delete(`/event/delete/${eventData["eid"]}`)
      .set("Authorization", `${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Success");
  });
});

afterAll(async () => {
  await server.close();
});
