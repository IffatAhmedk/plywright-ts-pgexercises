import { test, expect } from "@playwright/test";
import { Client } from "pg";

import fixtures from "../fixtures.json";

const client = new Client({
  connectionString: "postgresql://iffatahmedkhan@localhost:5432/exercises", //change username and add password in connectionString
});

test.beforeAll(async () => {
  await client.connect();
  await client.query(`INSERT INTO cd.members (memid, surname, firstname, address, zipcode, telephone, recommendedby, joindate)
    VALUES (37, 'Smith', 'Darren', '3 Funktown, Denzington, Boston', 66796, '(822) 577-3541', NULL, '2012-09-26 18:08:45')
    ON CONFLICT (memid) DO NOTHING;
    `);
});

test.afterAll(async () => {
  await client.end();
});

test.beforeEach(async () => {
  await client.query("DELETE FROM cd.bookings WHERE facid = 9");
  await client.query("DELETE FROM cd.facilities WHERE facid = 9");
  await client.query(
    "UPDATE cd.facilities SET initialoutlay = 8000 WHERE facid = 1"
  );
});

test("Insert a new facility", async () => {
  const beforeInsert = await client.query(
    "SELECT * FROM cd.facilities WHERE facid = 9"
  );

  expect(beforeInsert.rows.length).toBe(0);
  await client.query(
    "INSERT INTO cd.facilities (facid, name, membercost, guestcost, initialoutlay, monthlymaintenance) VALUES (9, 'Spa', 20, 30, 100000, 800);"
  );
  const spaResponse = await client.query(
    "SELECT * FROM cd.facilities WHERE facid = 9"
  );

  expect(spaResponse.rows.length).toBe(1);
  const row = spaResponse.rows[0];
  expect(row.facid).toBe(9);
  expect(row.name).toBe("Spa");
  expect(row.membercost).toBe("20");
  expect(row.guestcost).toBe("30");
  expect(row.initialoutlay).toBe("100000");
  expect(row.monthlymaintenance).toBe("800");
});

test("Read data from facilities", async () => {
  const readResponse = await client.query(
    "SELECT * FROM cd.facilities ORDER BY facid ASC"
  );
  const expectedData = fixtures.facilities;

  expect(readResponse.rows.length).toBe(9);
  readResponse.rows.forEach((row, index) => {
    expect(row.facid).toBe(expectedData[index].facid);
    expect(row.name).toBe(expectedData[index].name);
    expect(row.membercost).toBe(expectedData[index].membercost);
    expect(row.guestcost).toBe(expectedData[index].guestcost);
    expect(row.initialoutlay).toBe(expectedData[index].initialoutlay);
  });
});

test("Update and validate facility initialoutlay", async () => {
  await client.query(
    "UPDATE cd.facilities SET initialoutlay = 10000 WHERE facid = 1"
  );
  const updateResponse = await client.query(
    "SELECT initialoutlay FROM cd.facilities WHERE facid = 1"
  );

  const row = updateResponse.rows[0];
  expect(row.initialoutlay).toBe("10000");

  expect(typeof row.initialoutlay).toBe("string");
});

test("Update and validate member", async () => {
  const selectResponse = await client.query(
    "SELECT * FROM cd.members WHERE memid = 37;"
  );

  expect(selectResponse.rows.length).toBe(1);

  await client.query("DELETE FROM cd.members WHERE memid = 37;");
  const deleteResponse = await client.query(
    "SELECT * FROM cd.members WHERE memid = 37;"
  );
  expect(deleteResponse.rows.length).toBe(0);
});
