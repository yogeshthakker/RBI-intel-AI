import { PDFParse } from "pdf-parse";
import fs from "fs";

const buf = fs.readFileSync(process.argv[2]);
const parser = new PDFParse({ data: buf });
const result = await parser.getText();
const idx = result.text.indexOf("Funds received from Head Office");
console.log(JSON.stringify(result.text.slice(idx - 300, idx + 100)));