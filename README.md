# 1. BLOCK CIPHER LAB – Interactive AES Block Cipher Modes Simulator

## 2. Objective
Show both the theory and the practical working of AES block cipher modes (ECB, CBC, CFB, OFB, CTR) in the browser, with real encryption and a visual explanation of every block.

## 3. Technologies used
HTML5, CSS3 (glassmorphism, animations, light/dark theme), vanilla JavaScript, CryptoJS 4.2 (raw AES block function, loaded from cdnjs). No backend.

## 4. Features
Landing page, mode cards and comparison table · Cryptography Lab with validation · real AES-128/192/256 · hex + Base64 output · copy, download TXT, toasts · animated 5-step progress · block visualizer with click-for-detail · mode-specific diagrams · "How this mode works" panel · "See the difference" demo · security notes · in-memory history · dark/light mode · responsive layout.

## 5. Block cipher modes
| Mode | Idea | Padding | IV |
|---|---|---|---|
| ECB | C = AES(P), each block alone | Yes | No |
| CBC | C = AES(P ⊕ previous C) | Yes | Yes |
| CFB | C = P ⊕ AES(previous C) | No | Yes |
| OFB | C = P ⊕ keystream, keystream = AES(previous keystream) | No | Yes |
| CTR | C = P ⊕ AES(counter) | No | Nonce/counter |

## 6. How the simulator works
`js/crypto.js` uses CryptoJS only for one AES block (ECB, no padding). Each mode is built on that block function following NIST SP 800-38A, so the visualizer can show the real XOR results, keystreams and counters. Padding is PKCS#7 (ECB, CBC). CFB is CFB-128. The CTR counter block is IV + block number as a 128-bit big-endian integer. `selfTest()` runs on page load and compares every mode with CryptoJS's own modes (see the browser console).
Key: 16/24/32 characters, or 32/48/64 hex digits. IV/nonce: 16 characters or 32 hex digits. To decrypt, paste hex or Base64 ciphertext into the message field, set the same mode/key/IV, and press DECRYPT.

## 7. Installation
No install. Requires internet for CryptoJS and Google Fonts (or download `crypto-js.min.js` into `js/` and change the script tag).

## 8. How to run
VS Code → install **Live Server** → right-click `index.html` → **Open with Live Server**.

## 9. Sample test cases
| Case | Input | Expected |
|---|---|---|
| Short | "Hi", key `MySecretKey12345`, IV `0123456789ABCDEF`, CBC | 16-byte ciphertext, decrypts to "Hi" |
| Long | 200+ characters, any mode | several blocks, round-trip OK |
| Repeated | `ATTACK AT DAWN!!ATTACK AT DAWN!!`, ECB | block 1 = block 2 |
| Same repeated | same text, CBC/CFB/OFB/CTR | no repeated blocks |
| Bad key | `short` | "Invalid key length" error |
| Bad IV | `123` | "Invalid IV length" error |
| Empty | empty plaintext | "Plaintext is empty" error |
| FIPS-197 | key `000102…0f`, block `00112233…ff` | `69c4e0d86a7b0430d8cdb78070b4c55a` |

## 10. Advantages
Real AES, transparent intermediate values, no server, works offline after assets load, suits viva demonstrations.

## 11. Limitations
No authenticated modes (GCM), no PBKDF2 key derivation (the key is used directly), text input only (UTF-8), CTR counter is a plain 128-bit increment, demo key/IV are fixed in "See the difference". For learning only. Do not protect real secrets with it.

## 12. Future scope
AES-GCM and integrity checks, key derivation from passwords, file and image encryption (ECB penguin demo), bit-flip error-propagation experiment, exportable PDF report.

## 13. Conclusion
The project shows that the cipher (AES) stays the same while the mode decides how blocks are combined, and that this choice decides security properties such as pattern leakage, parallelism and error propagation.

---
# Viva questions
1. **What is a block cipher?** An algorithm that encrypts fixed-size blocks (128 bits for AES) with a secret key.
2. **What key sizes does AES support?** 128, 192 and 256 bits (10, 12 and 14 rounds).
3. **Why do we need modes of operation?** AES handles one 16-byte block. Modes define how to encrypt longer messages safely.
4. **Why is ECB insecure?** Equal plaintext blocks give equal ciphertext blocks, so patterns show through.
5. **What does the IV do in CBC?** It randomises the first block so the same message encrypts differently each time. It must be unpredictable, but it need not be secret.
6. **What is padding and which modes need it?** Extra bytes that fill the last block. ECB and CBC need it (PKCS#7). CFB, OFB and CTR act like stream ciphers and don't.
7. **Which modes can encrypt in parallel?** ECB and CTR. CBC, CFB and OFB are sequential when encrypting.
8. **How do CFB and OFB differ?** CFB feeds the ciphertext back into AES. OFB feeds AES's own output back, so its keystream is independent of the data.
9. **Why must a CTR nonce never repeat?** The same key and counter give the same keystream. XORing two ciphertexts then cancels it and reveals the plaintexts' XOR.
10. **Does encryption alone guarantee integrity?** No. An attacker can alter ciphertext undetected. Use an authenticated mode such as AES-GCM or add a MAC.