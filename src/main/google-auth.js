const { app, session, shell } = require("electron");

const AUTH_HOST = "accounts.google.com";

const PLATFORM_TOKEN = "X11; Linux x86_64";

const FIREFOX_UA = "Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0";

function setupGoogleSignIn() {
  const chromeMajor = process.versions.chrome.split(".")[0];
  app.userAgentFallback = `Mozilla/5.0 (${PLATFORM_TOKEN}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeMajor}.0.0.0 Safari/537.36`;

  session.defaultSession.webRequest.onBeforeSendHeaders({ urls: [`https://${AUTH_HOST}/*`] }, (details, callback) => {
    const headers = { ...details.requestHeaders, "User-Agent": FIREFOX_UA };
    for (const name of Object.keys(headers)) {
      if (name.toLowerCase().startsWith("sec-ch-ua")) delete headers[name];
    }
    callback({ requestHeaders: headers });
  });

  app.on("web-contents-created", (_event, contents) => {
    if (contents.getType() !== "webview") return;

    contents.setWindowOpenHandler(({ url }) => {
      let parsed;
      try {
        parsed = new URL(url);
      } catch {
        return { action: "deny" };
      }

      if (parsed.hostname === AUTH_HOST) contents.loadURL(url);
      else if (parsed.protocol === "https:" || parsed.protocol === "http:") shell.openExternal(url);

      return { action: "deny" };
    });
  });
}

module.exports = { setupGoogleSignIn };
