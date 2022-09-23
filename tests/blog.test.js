const puppeteer = require("puppeteer");
const sessionFactory = require("./factories/sessionFactory");
const userFactory = require("./factories/userFactory");

let page;
let browser;

afterEach(async () => {
  await browser.close();
});

describe("when logged in", () => {
  beforeEach(async () => {
    browser = await puppeteer.launch({ headless: false });
    page = await browser.newPage();
    await page.goto("http://localhost:3000");
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);

    await page.setCookie(
      { name: "session", value: session },
      { name: "session.sig", value: sig }
    );
    await page.goto("http://localhost:3000/blogs");
    await page.waitForSelector('a[href="/auth/logout"]');
  });

  test("showing add blog button", async () => {
    await page.click(".btn-floating");
    const label = await page.$eval("form label", (el) => el.innerHTML);

    expect(label).toEqual("Blog Title");
  });

  describe("and using invalid input click", () => {
    beforeEach(async () => {
      await page.click(".btn-floating");
      await page.click("form button");
    });

    test("showing an error messages", async () => {
      const titleError = await page.$eval(
        ".title .red-text",
        (el) => el.innerHTML
      );
      const contentError = await page.$eval(
        ".content .red-text",
        (el) => el.innerHTML
      );

      expect(titleError).toEqual("You must provide a value");
      expect(contentError).toEqual("You must provide a value");
    });
  });
});
