const fs = require("fs");
const path = require("path");

const frontend = path.join(__dirname, "frontend");
const baseUrl = "https://eaglemotion-ai.onrender.com";

const excluded = new Set([
    "login.html",
    "register.html",
    "dashboard.html",
    "studio.html"
]);

const pages = fs
    .readdirSync(frontend)
    .filter(file => file.endsWith(".html"))
    .filter(file => !excluded.has(file));

const urls = pages.map(file => {
    const loc = file === "index.html"
        ? baseUrl + "/"
        : baseUrl + "/" + file;

    return `
    <url>
        <loc>${loc}</loc>
    </url>`;
}).join("");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

fs.writeFileSync(
    path.join(frontend, "sitemap.xml"),
    sitemap.trim() + "\n"
);

console.log("Dynamic sitemap generated successfully.");
console.log("Pages included:", pages.length);
