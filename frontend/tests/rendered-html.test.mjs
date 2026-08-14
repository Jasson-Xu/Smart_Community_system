import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Smart Community homepage", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Smart Community \| Report local issues<\/title>/i);
  assert.match(html, /A simpler way to make local issues visible\./);
  assert.match(html, /Report an issue/);
  assert.match(html, /Prototype preview/);
  assert.match(html, /href="\/privacy"/);
  assert.match(html, /href="\/security"/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/i);
});

test("server-renders public privacy and security pages", async () => {
  const [privacyResponse, securityResponse] = await Promise.all([
    render("/privacy"),
    render("/security"),
  ]);

  assert.equal(privacyResponse.status, 200);
  assert.equal(securityResponse.status, 200);
  assert.match(await privacyResponse.text(), /Privacy at Smart Community/);
  assert.match(await securityResponse.text(), /Security is part of the service\./);
});

test("server-renders registration, login, and logout pages", async () => {
  const [registrationResponse, loginResponse, logoutResponse] = await Promise.all([
    render("/register"),
    render("/login"),
    render("/logout"),
  ]);

  assert.equal(registrationResponse.status, 200);
  assert.equal(loginResponse.status, 200);
  assert.equal(logoutResponse.status, 200);

  const [registrationHtml, loginHtml, logoutHtml] = await Promise.all([
    registrationResponse.text(),
    loginResponse.text(),
    logoutResponse.text(),
  ]);

  assert.match(registrationHtml, /Create your account/);
  assert.match(registrationHtml, /Registration is not connected to a database yet\./);
  assert.match(registrationHtml, /name="confirmPassword"/);
  assert.match(loginHtml, /Sign in to your account/);
  assert.match(loginHtml, /name="password"/);
  assert.match(logoutHtml, /Ready to sign out\?/);
  assert.match(logoutHtml, /No authentication cookie, token, or server session exists yet\./);
});

test("uses the approved palette and production metadata", async () => {
  const [css, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  for (const colour of ["#e9e6e7", "#5e5653", "#7b7f8a", "#ab978c", "#6b7c98"]) {
    assert.match(css.toLowerCase(), new RegExp(colour));
  }

  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(layout, /openGraph/);
  assert.match(layout, /twitter/);
  assert.doesNotMatch(layout, /codex-preview|Starter Project|_sites-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
