/* crypto.js – all AES logic. Uses CryptoJS ONLY for the raw AES block function (ECB, no padding, one 16-byte block).
   Every mode (ECB/CBC/CFB/OFB/CTR) is built on top of it exactly as in NIST SP 800-38A, so each intermediate value
   (XOR result, keystream, counter) can be shown in the visualizer. selfTest() cross-checks against CryptoJS's own modes. */
window.BCL = window.BCL || {};
BCL.crypto = (() => {
  const CJ = () => window.CryptoJS;
  const utf8 = new TextEncoder(), utf8d = new TextDecoder('utf-8', {fatal:true});
  const toHex = b => [...b].map(x => x.toString(16).padStart(2,'0')).join('');
  const fromHex = h => Uint8Array.from(h.match(/../g) || [], x => parseInt(x,16));
  const toB64 = b => btoa(String.fromCharCode(...b));
  const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const xor = (a, b) => a.map((v,i) => v ^ b[i]);              // truncates to a's length (partial last block)
  const concat = arr => { const o = new Uint8Array(arr.reduce((n,a)=>n+a.length,0)); let p=0; arr.forEach(a=>{o.set(a,p);p+=a.length;}); return o; };
  const wa = b => CJ().enc.Hex.parse(toHex(b));
  const isHex = s => /^[0-9a-f]+$/i.test(s);
  const ECB_OPT = () => ({mode:CJ().mode.ECB, padding:CJ().pad.NoPadding});

  /* The one real AES call: encrypt/decrypt a single 128-bit block with the raw key */
  const aesEnc = (key, blk) => fromHex(CJ().enc.Hex.stringify(CJ().AES.encrypt(wa(blk), wa(key), ECB_OPT()).ciphertext));
  const aesDec = (key, blk) => fromHex(CJ().enc.Hex.stringify(CJ().AES.decrypt({ciphertext:wa(blk)}, wa(key), ECB_OPT())));

  function parseKey(s){
    s = (s||'').trim(); if(!s) throw new Error('AES key is required.');
    const b = isHex(s) && [32,48,64].includes(s.length) ? fromHex(s) : utf8.encode(s);
    if(![16,24,32].includes(b.length)) throw new Error(`Invalid key length (${b.length} bytes). Use 16, 24 or 32 characters (or 32, 48, 64 hex digits) for AES-128, 192 or 256.`);
    return b;
  }
  function parseIV(s, label){
    s = (s||'').trim(); if(!s) throw new Error(`${label} is required for this mode.`);
    const b = isHex(s) && s.length === 32 ? fromHex(s) : utf8.encode(s);
    if(b.length !== 16) throw new Error(`Invalid ${label} length (${b.length} bytes). It must be exactly 16 characters or 32 hex digits.`);
    return b;
  }
  const needsPad = m => m === 'ECB' || m === 'CBC';
  const pkcs7 = d => { const n = 16 - d.length % 16; return concat([d, new Uint8Array(n).fill(n)]); };   // always adds 1..16 bytes
  function unpkcs7(d){
    const n = d[d.length-1];
    if(!d.length || n < 1 || n > 16 || d.slice(-n).some(x => x !== n)) throw new Error('Decryption failed: wrong key/IV, wrong mode or corrupted ciphertext (bad padding).');
    return d.slice(0, -n);
  }
  /* Counter block i = IV + i as a 128-bit big-endian integer */
  const incr = (c, n) => { const r = Uint8Array.from(c); let carry = n; for(let i=15; i>=0 && carry; i--){ const v = r[i]+carry; r[i] = v & 255; carry = v >> 8; } return r; };

  function encrypt(mode, text, keyStr, ivStr){
    const key = parseKey(keyStr);
    const iv = mode === 'ECB' ? null : parseIV(ivStr, mode === 'CTR' ? 'Nonce / counter' : 'IV');
    const raw = utf8.encode(text), data = needsPad(mode) ? pkcs7(raw) : raw;
    const blocks = []; let prev = iv, ks = iv;
    for(let i=0; i*16 < data.length; i++){
      const p = data.slice(i*16, i*16+16), b = {index:i+1, p};
      if(mode === 'ECB'){ b.c = aesEnc(key, p); }                                        // C = E(P)
      else if(mode === 'CBC'){ b.in = prev; b.x = xor(p, prev); b.c = aesEnc(key, b.x); prev = b.c; }   // C = E(P xor prevC)
      else if(mode === 'CFB'){ b.in = prev; b.ks = aesEnc(key, prev); b.c = xor(p, b.ks); prev = b.c; } // C = P xor E(prevC)
      else if(mode === 'OFB'){ b.in = ks; b.ks = aesEnc(key, ks); ks = b.ks; b.c = xor(p, b.ks); }      // keystream feeds itself
      else { b.in = incr(iv, i); b.ks = aesEnc(key, b.in); b.c = xor(p, b.ks); }                        // CTR: E(counter)
      blocks.push(b);
    }
    const cipher = concat(blocks.map(b => b.c));
    return {mode, blocks, cipher, hex:toHex(cipher), b64:toB64(cipher), plainLen:raw.length, padLen:data.length-raw.length, keyBits:key.length*8, iv};
  }

  function decrypt(mode, ct, keyStr, ivStr){
    const key = parseKey(keyStr);
    const iv = mode === 'ECB' ? null : parseIV(ivStr, mode === 'CTR' ? 'Nonce / counter' : 'IV');
    if(!ct.length) throw new Error('Ciphertext is empty.');
    if(needsPad(mode) && ct.length % 16) throw new Error(`Ciphertext length (${ct.length} bytes) must be a multiple of 16 for ${mode}.`);
    const out = []; let prev = iv, ks = iv;
    for(let i=0; i*16 < ct.length; i++){
      const c = ct.slice(i*16, i*16+16);
      if(mode === 'ECB') out.push(aesDec(key, c));
      else if(mode === 'CBC'){ out.push(xor(aesDec(key, c), prev)); prev = c; }
      else if(mode === 'CFB'){ out.push(xor(c, aesEnc(key, prev))); prev = c; }      // CFB/OFB/CTR decrypt with AES *encrypt*
      else if(mode === 'OFB'){ ks = aesEnc(key, ks); out.push(xor(c, ks)); }
      else out.push(xor(c, aesEnc(key, incr(iv, i))));
    }
    let data = concat(out); if(needsPad(mode)) data = unpkcs7(data);
    try { return utf8d.decode(data); } catch { throw new Error('Decryption failed: wrong key/IV or mode (output is not valid text).'); }
  }

  /* Cross-check against FIPS-197 vector and CryptoJS built-in modes; returns [{name, ok}] */
  function selfTest(){
    const r = [], K = 'MySecretKey12345', IV = '0123456789ABCDEF', T = 'Hello, Block Cipher Lab! Long enough for 3 blocks.';
    r.push({name:'FIPS-197 AES-128', ok: toHex(aesEnc(fromHex('000102030405060708090a0b0c0d0e0f'), fromHex('00112233445566778899aabbccddeeff'))) === '69c4e0d86a7b0430d8cdb78070b4c55a'});
    ['ECB','CBC','CFB','OFB','CTR'].forEach(m => {
      const mine = encrypt(m, T, K, IV);
      const ref = CJ().AES.encrypt(CJ().enc.Utf8.parse(T), wa(utf8.encode(K)), {iv:wa(utf8.encode(IV)), mode:CJ().mode[m], padding: needsPad(m) ? CJ().pad.Pkcs7 : CJ().pad.NoPadding});
      r.push({name:m+' matches CryptoJS', ok: CJ().enc.Hex.stringify(ref.ciphertext) === mine.hex});
      r.push({name:m+' round-trip', ok: decrypt(m, mine.cipher, K, IV) === T});
    });
    return r;
  }
  return {encrypt, decrypt, selfTest, toHex, fromHex, toB64, fromB64};
})();