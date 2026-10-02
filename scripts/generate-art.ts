import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { seedProducts } from "../src/lib/products";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public/products");
const palettes = [
  { background: "#f7e5eb", body: "#9a506d", dark: "#5e2940", light: "#e8b9ca" },
  { background: "#f3e7e2", body: "#a97767", dark: "#6b433c", light: "#e6c4b7" },
  { background: "#eee9eb", body: "#806b76", dark: "#4d3d48", light: "#d3b9c4" },
  { background: "#f5e8e9", body: "#7d3b58", dark: "#481f35", light: "#d7a4b9" },
  { background: "#f2ebe6", body: "#9a7967", dark: "#5c473d", light: "#dcc8b9" },
];

const xml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ellipse = '<ellipse cx="360" cy="665" rx="205" ry="25" fill="#2b1020" opacity=".08"/>';

function bottle(variant: number, color: string, dark: string) {
  const width = 235 + (variant % 3) * 20;
  const x = (720 - width) / 2;
  return `${ellipse}<rect x="315" y="169" width="90" height="74" rx="9" fill="${dark}"/><rect x="321" y="225" width="78" height="34" rx="5" fill="${color}" opacity=".8"/><rect x="${x}" y="246" width="${width}" height="393" rx="${variant % 2 ? 53 : 28}" fill="url(#glass)" stroke="${dark}" stroke-width="4"/><rect x="${x + 30}" y="394" width="${width - 60}" height="162" rx="5" fill="#fff8f8" opacity=".84"/><text x="360" y="453" text-anchor="middle" font-family="Georgia" font-size="22" letter-spacing="5" fill="${dark}">LUXARA</text><path d="M${x + 28} 278v250" stroke="#fff" stroke-width="17" opacity=".26"/>`;
}

function diffuser(variant: number, color: string, dark: string) {
  const reeds = Array.from({ length: 5 + variant % 3 }, (_, i) => `<line x1="${325 + i * 15}" y1="340" x2="${260 + i * 33}" y2="${132 + (i % 2) * 24}" stroke="${dark}" stroke-width="5" stroke-linecap="round"/>`).join("");
  return `${ellipse}${reeds}<path d="M272 344 Q268 318 291 313 H429 Q452 318 448 344 L421 633 Q360 652 299 633 Z" fill="url(#glass)" stroke="${dark}" stroke-width="4"/><rect x="302" y="430" width="116" height="95" rx="4" fill="#fff8f8" opacity=".8"/><text x="360" y="483" text-anchor="middle" font-family="Georgia" font-size="19" letter-spacing="3" fill="${dark}">LUXARA</text><path d="M300 345H420" stroke="${color}" stroke-width="17"/>`;
}

function humidifier(variant: number, color: string, dark: string) {
  const width = 235 + (variant % 3) * 22;
  const x = (720 - width) / 2;
  return `${ellipse}<path d="M322 190 C290 161 310 132 326 108 M371 183 C341 153 362 129 376 104 M420 190 C392 160 411 139 428 115" fill="none" stroke="${color}" stroke-width="9" opacity=".33" stroke-linecap="round"/><rect x="${x}" y="291" width="${width}" height="350" rx="${variant % 2 ? 76 : 45}" fill="url(#solid)" stroke="${dark}" stroke-width="4"/><ellipse cx="360" cy="293" rx="${width / 2}" ry="27" fill="${color}"/><ellipse cx="360" cy="291" rx="38" ry="8" fill="${dark}" opacity=".65"/><circle cx="360" cy="547" r="13" fill="#fff4f7"/><path d="M${x + 24} 600 H${x + width - 24}" stroke="${dark}" stroke-width="5" opacity=".5"/>`;
}

function aromatic(name: string, variant: number, color: string, dark: string) {
  if (/spray|mist/i.test(name)) return `${ellipse}<rect x="302" y="223" width="116" height="68" rx="8" fill="${dark}"/><path d="M418 240h55v20h-55" fill="${dark}"/><rect x="284" y="281" width="152" height="354" rx="26" fill="url(#glass)" stroke="${dark}" stroke-width="4"/><rect x="305" y="391" width="110" height="143" rx="5" fill="#fff8f8" opacity=".85"/><text x="360" y="453" text-anchor="middle" font-family="Georgia" font-size="19" fill="${dark}">LUXARA</text>`;
  if (/oil/i.test(name)) return `${ellipse}<rect x="306" y="270" width="108" height="58" rx="8" fill="${dark}"/><rect x="339" y="202" width="42" height="72" fill="${dark}"/><path d="M295 328H425L446 635H274Z" fill="url(#glass)" stroke="${dark}" stroke-width="4"/><rect x="300" y="431" width="120" height="110" rx="4" fill="#fff8f8" opacity=".8"/><text x="360" y="489" text-anchor="middle" font-family="Georgia" font-size="18" fill="${dark}">LUXARA</text>`;
  if (/incense/i.test(name)) return `${ellipse}<path d="M230 608 Q360 647 490 608" fill="none" stroke="${dark}" stroke-width="17" stroke-linecap="round"/>${Array.from({ length: 6 }, (_, i) => `<line x1="${279 + i * 31}" y1="594" x2="${255 + i * 35}" y2="${227 + (i % 2) * 45}" stroke="${color}" stroke-width="7" stroke-linecap="round"/>`).join("")}<path d="M275 180 C235 140 278 100 300 78" fill="none" stroke="${color}" stroke-width="7" opacity=".35"/>`;
  if (/sachet|wax/i.test(name)) return `${ellipse}<path d="M240 296H480L454 630Q360 660 266 630Z" fill="url(#solid)" stroke="${dark}" stroke-width="4"/><path d="M240 296Q360 335 480 296" fill="none" stroke="${dark}" stroke-width="4"/><rect x="290" y="405" width="140" height="120" rx="4" fill="#fff8f8" opacity=".8"/><text x="360" y="469" text-anchor="middle" font-family="Georgia" font-size="19" fill="${dark}">LUXARA</text>`;
  return `${ellipse}<path d="M274 283H446L427 635Q360 653 293 635Z" fill="url(#glass)" stroke="${dark}" stroke-width="4"/><path d="M274 283Q360 306 446 283" fill="none" stroke="${dark}" stroke-width="7"/><path d="M360 255 C337 230 347 199 363 179 C382 210 381 236 360 255Z" fill="#e0a363"/><path d="M360 294v-43" stroke="${dark}" stroke-width="3"/><rect x="300" y="415" width="120" height="125" rx="5" fill="#fff8f8" opacity=".83"/><text x="360" y="478" text-anchor="middle" font-family="Georgia" font-size="18" fill="${dark}">LUXARA</text>`;
}

function furniture(name: string, variant: number, color: string, dark: string) {
  if (/table|console/i.test(name)) return `${ellipse}<path d="M190 374H530V415H190Z" fill="url(#solid)" stroke="${dark}" stroke-width="4"/><path d="M228 415L209 638M492 415l19 223" stroke="${dark}" stroke-width="22" stroke-linecap="round"/><path d="M231 386H489" stroke="#fff" stroke-width="7" opacity=".35"/>`;
  if (/bookshelf/i.test(name)) return `${ellipse}<path d="M242 164v476M478 164v476M242 168h236M242 322h236M242 475h236M242 632h236" stroke="${dark}" stroke-width="17"/><rect x="276" y="220" width="29" height="96" fill="${color}"/><rect x="315" y="200" width="38" height="116" fill="#d9a9bd"/><rect x="370" y="360" width="53" height="108" fill="${color}"/><rect x="278" y="530" width="132" height="96" rx="40" fill="${color}"/>`;
  if (/bench|ottoman|stool/i.test(name)) return `${ellipse}<rect x="219" y="361" width="282" height="127" rx="${variant % 2 ? 52 : 21}" fill="url(#solid)" stroke="${dark}" stroke-width="4"/><path d="M267 485v151M453 485v151" stroke="${dark}" stroke-width="19" stroke-linecap="round"/>`;
  return `${ellipse}<path d="M253 193 Q360 147 467 193 L447 489 H273Z" fill="url(#solid)" stroke="${dark}" stroke-width="4"/><rect x="244" y="442" width="232" height="105" rx="32" fill="${color}" stroke="${dark}" stroke-width="4"/><path d="M277 540l-24 98M443 540l24 98" stroke="${dark}" stroke-width="20" stroke-linecap="round"/>`;
}

function lighting(name: string, variant: number, color: string, dark: string) {
  const pendant = /pendant|sconce/i.test(name);
  if (pendant) return `${ellipse}<path d="M360 112v203" stroke="${dark}" stroke-width="8"/><path d="M229 421 Q250 313 360 301 Q470 313 491 421Z" fill="url(#solid)" stroke="${dark}" stroke-width="4"/><path d="M249 422Q360 449 471 422" fill="none" stroke="${dark}" stroke-width="7"/><circle cx="360" cy="455" r="37" fill="#fff4c9" opacity=".85"/>`;
  return `${ellipse}<path d="M225 355 Q244 243 360 225 Q476 243 495 355Z" fill="url(#solid)" stroke="${dark}" stroke-width="4"/><path d="M248 357Q360 392 472 357" fill="none" stroke="${dark}" stroke-width="6"/><path d="M360 377v212" stroke="${dark}" stroke-width="17"/><path d="M264 619H456" stroke="${dark}" stroke-width="25" stroke-linecap="round"/><circle cx="360" cy="401" r="27" fill="#fff4c9" opacity=".8"/>`;
}

function object(name: string, variant: number, color: string, dark: string) {
  if (/tray|board|dish|bookends/i.test(name)) return `${ellipse}<path d="M170 514 Q360 468 550 514L514 602Q360 640 206 602Z" fill="url(#solid)" stroke="${dark}" stroke-width="4"/><path d="M207 545Q360 584 513 545" fill="none" stroke="#fff" stroke-width="8" opacity=".3"/>`;
  if (/bowl|planter/i.test(name)) return `${ellipse}<path d="M219 380H501Q490 608 360 626Q230 608 219 380Z" fill="url(#solid)" stroke="${dark}" stroke-width="4"/><ellipse cx="360" cy="379" rx="141" ry="26" fill="${color}" stroke="${dark}" stroke-width="4"/>`;
  return `${ellipse}<path d="M316 238H404L390 327Q455 365 451 464Q445 609 360 636Q275 609 269 464Q265 365 330 327Z" fill="url(#solid)" stroke="${dark}" stroke-width="4"/><path d="M316 238Q360 250 404 238" fill="none" stroke="${dark}" stroke-width="5"/><path d="M306 493Q360 460 414 493" fill="none" stroke="#fff" stroke-width="9" opacity=".3"/>`;
}

function textile(name: string, variant: number, color: string, dark: string) {
  if (/cushion|pillow/i.test(name)) return `${ellipse}<rect x="224" y="284" width="272" height="284" rx="${variant % 2 ? 52 : 31}" fill="url(#solid)" stroke="${dark}" stroke-width="4"/><path d="M254 311Q360 349 466 311M254 540Q360 501 466 540" fill="none" stroke="#fff" stroke-width="9" opacity=".3"/>`;
  return `${ellipse}<path d="M200 334 Q360 275 520 334 L486 615 Q360 660 234 615Z" fill="url(#solid)" stroke="${dark}" stroke-width="4"/><path d="M211 390Q360 335 509 390M220 474Q360 425 500 474" fill="none" stroke="#fff" stroke-width="9" opacity=".28"/><path d="M246 618v27M269 628v27M292 633v27M428 633v27M451 628v27M474 618v27" stroke="${dark}" stroke-width="5"/>`;
}

function accessory(name: string, variant: number, color: string, dark: string) {
  if (/wallet|holder|case|sleeve|pouch/i.test(name)) return `${ellipse}<rect x="223" y="313" width="274" height="294" rx="${variant % 2 ? 42 : 18}" fill="url(#solid)" stroke="${dark}" stroke-width="4"/><path d="M224 399H496" stroke="${dark}" stroke-width="5"/><circle cx="360" cy="402" r="12" fill="#fff4f7"/>`;
  return `${ellipse}<path d="M272 302Q271 198 360 198Q449 198 448 302" fill="none" stroke="${dark}" stroke-width="17"/><path d="M240 303H480L455 628H265Z" fill="url(#solid)" stroke="${dark}" stroke-width="4"/><path d="M275 335V601M445 335V601" stroke="#fff" stroke-width="8" opacity=".26"/><text x="360" y="474" text-anchor="middle" font-family="Georgia" font-size="21" letter-spacing="3" fill="#fff8fa">LUXARA</text>`;
}

function artwork(category: string, name: string, variant: number) {
  const palette = palettes[variant % palettes.length];
  const { background, body, dark, light } = palette;
  const shape = category === "Perfumes" ? bottle(variant, body, dark)
    : category === "Diffusers" ? diffuser(variant, body, dark)
    : category === "Humidifiers" ? humidifier(variant, body, dark)
    : category === "Aromatics" ? aromatic(name, variant, body, dark)
    : category === "Furniture" ? furniture(name, variant, body, dark)
    : category === "Lighting" ? lighting(name, variant, body, dark)
    : category === "Objects" ? object(name, variant, body, dark)
    : category === "Textiles" ? textile(name, variant, body, dark)
    : accessory(name, variant, body, dark);
  const words = name.split(" ");
  const lines: string[] = [""];
  for (const word of words) {
    const current = lines[lines.length - 1];
    if ((current + " " + word).trim().length > 27 && lines.length < 2) lines.push(word);
    else lines[lines.length - 1] = `${current} ${word}`.trim();
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 820" role="img" aria-label="Illustration of ${xml(name)}"><defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${background}"/><stop offset="1" stop-color="#fff9fa"/></linearGradient><linearGradient id="solid" x1="0" x2="1" y1="0" y2="1"><stop stop-color="${light}"/><stop offset=".55" stop-color="${body}"/><stop offset="1" stop-color="${dark}"/></linearGradient><linearGradient id="glass" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#fff" stop-opacity=".72"/><stop offset=".45" stop-color="${light}" stop-opacity=".82"/><stop offset="1" stop-color="${body}" stop-opacity=".9"/></linearGradient></defs><rect width="720" height="820" fill="url(#bg)"/><circle cx="597" cy="134" r="157" fill="#fff" opacity=".2"/><text x="54" y="72" font-family="Arial,sans-serif" font-size="20" letter-spacing="5" fill="${dark}" opacity=".7">LUXARA</text><text x="54" y="105" font-family="Arial,sans-serif" font-size="12" letter-spacing="3" fill="${dark}" opacity=".55">${xml(category.toUpperCase())} · SAMPLE ART</text>${shape}<text x="360" y="730" text-anchor="middle" font-family="Georgia,serif" font-size="28" fill="${dark}">${xml(lines[0])}</text>${lines[1] ? `<text x="360" y="764" text-anchor="middle" font-family="Georgia,serif" font-size="28" fill="${dark}">${xml(lines[1])}</text>` : ""}<path d="M54 785H666" stroke="${dark}" opacity=".18"/></svg>`;
}

await mkdir(root, { recursive: true });
const counts = new Map<string, number>();
for (const product of seedProducts) {
  const index = counts.get(product.category) ?? 0;
  counts.set(product.category, index + 1);
  await writeFile(path.join(root, `${product.id}.svg`), artwork(product.category, product.name, index));
}
console.log(`Generated ${seedProducts.length} matching sample product illustrations.`);
