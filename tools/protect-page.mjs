#!/usr/bin/env node
// Encrypts a page so it can be published on a static host behind a password.
//
//   node tools/protect-page.mjs private/servcraft-preview.html servcraft-preview.html
//
// The readable source stays in private/ (git-ignored). The output holds only the page
// encrypted with AES-256-GCM, using a key derived from the password with PBKDF2-SHA256.
// The browser decrypts it after the visitor types the password; nothing readable is published.
// Re-run this after every edit to the source.

import { readFileSync, writeFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';
import readline from 'node:readline';

const ITERATIONS = 600000;
const [src, out] = process.argv.slice(2);
if (!src || !out) {
    console.error('Usage: node tools/protect-page.mjs <readable source> <published output>');
    process.exit(1);
}

// non-interactive use (piped input): read the password lines up front
const piped = process.stdin.isTTY ? null : readFileSync(0, 'utf8').split(/\r?\n/);

// read a line without echoing what is typed
function ask(question) {
    if (piped) return Promise.resolve(piped.shift() ?? '');
    return new Promise(resolve => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
        let muted = false;
        rl._writeToOutput = s => { if (!muted) rl.output.write(s); };
        rl.question(question, answer => { rl.close(); process.stdout.write('\n'); resolve(answer); });
        muted = true;
    });
}

const password = await ask('Password for this page: ');
if (password.length < 10) { console.error('Use at least 10 characters.'); process.exit(1); }
if (await ask('Type it again: ') !== password) { console.error('The passwords did not match. Nothing was written.'); process.exit(1); }

const html = readFileSync(src, 'utf8');
const enc = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(html)));
const b64 = u8 => Buffer.from(u8).toString('base64');
const payload = JSON.stringify({ v: 1, iterations: ITERATIONS, salt: b64(salt), iv: b64(iv), data: b64(data) });

const lock = readFileSync(new URL('./protected-page-template.html', import.meta.url), 'utf8');
writeFileSync(out, lock.replace('__PAYLOAD__', () => payload));
console.log(`Encrypted ${src} → ${out}`);
