import "./loadEnv.js";
import { encryptSecret } from "./src/utils/crypto.js"; // adjust if your path is different

// Paste your Chapa secret key here
const chapaSecret = "CHASECK_TEST-JFvEBLfeIcKLF3LYNQXv53NEj";

const encrypted = encryptSecret(chapaSecret);

console.log("Encrypted Chapa secret (to save in DB):");
console.log(JSON.stringify(encrypted, null, 2));
