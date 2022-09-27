const puppeteer = require("puppeteer");
const sessionFactory = require("./factories/sessionFactory");
const userFactory = require("./factories/userFactory");

let page;
let browser;

beforeEach(async () => {
  browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  page = await browser.newPage();
  await page.goto("http://localhost:3000");
});

afterEach(async () => {
  await browser.close();
});

describe("when logged in", () => {
  beforeEach(async () => {
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);

    await page.setCookie(
      { name: "session", value: session },
      { name: "session.sig", value: sig }
    );
    await page.goto("http://localhost:3000/blogs");
    await page.waitForSelector('a[href="/auth/logout"]');
    await page.click(".btn-floating");
  });

  test("showing add blog button", async () => {
    const label = await page.$eval("form label", (el) => el.innerHTML);

    expect(label).toEqual("Blog Title");
  });

  describe("and using valid inputs", () => {
    beforeEach(async () => {
      await page.type(".title input", "My Title");
      await page.type(".content input", "my content");
      await page.click("form button");
    });

    test("confirm your input", async () => {
      const text = await page.$eval("h5", (el) => el.innerHTML);

      expect(text).toEqual("Please confirm your entries");
    });

    test("submitting and redirecting to the blogs page", async () => {
      await page.click("button.green");
      await page.waitForSelector(".card");

      const title = await page.$eval(".card-title", (el) => el.innerHTML);
      const content = await page.$eval(".card-content p", (el) => el.innerHTML);
      expect(title).toEqual("My Title");
      expect(content).toEqual("my content");
    });
  });

  describe("and using invalid input click", () => {
    beforeEach(async () => {
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

describe("when user is not logged in", () => {
  test("cannot not post new blog", async () => {
    const result = await page.evaluate(async () => {
      const res = await fetch("/api/blogs", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "My Another Title",
          content: "My another content",
        }),
      });
      return await res.json();
    });

    expect(result).toEqual({ error: "You must log in!" });
  });

  test("cannot get blog list", async () => {
    const result = await page.evaluate(async () => {
      const res = await fetch("/api/blogs", {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return await res.json();
    });

    expect(result).toEqual({ error: "You must log in!" });
  });
});
