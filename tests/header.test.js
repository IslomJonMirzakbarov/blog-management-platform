const puppeteer = require("puppeteer");
const sessionFactory = require("./factories/sessionFactory");
const userFactory = require("./factories/userFactory");

let browser, page;

beforeEach(async () => {
  browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });

  page = await browser.newPage();

  await page.goto("http://localhost:3000");
});

afterEach(async () => {
  await browser.close();
});

test("the header has the correct text", async () => {
  const text = await page.$eval("a.brand-logo", (el) => el.innerHTML);

  expect(text).toEqual("Blogster");
});

test("clicking the login button and checking the auth flow", async () => {
  await page.click(".right a");

  const url = await page.url();

  expect(url).toMatch(/accounts\.google\.com/);
});

test("when signed in, shows logout button", async () => {
  const user = await userFactory();
  const { session, sig } = sessionFactory(user);

  await page.setCookie(
    { name: "session", value: session },
    { name: "session.sig", value: sig }
  );
  await page.goto("http://localhost:3000");
  await page.waitForSelector('a[href="/auth/logout"]');

  const text = await page.$eval('a[href="/auth/logout"]', (el) => el.innerHTML);

  expect(text).toEqual("Logout");
});
