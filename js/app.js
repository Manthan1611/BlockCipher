/* Landing page content + behaviour (data-driven so Part 2 can reuse MODES) */
const MODES = [
 {id:'ecb',name:'ECB',full:'Electronic Codebook',ico:'▦',accent:'#f87171',text:'Encrypts every block independently with the same key.',more:'Fast and parallel, but identical plaintext blocks give identical ciphertext blocks.',flow:[['P1','AES','C1'],['P2','AES','C2'],['P3','AES','C3']]},
 {id:'cbc',name:'CBC',full:'Cipher Block Chaining',ico:'⛓',accent:'#22d3ee',text:'XORs each plaintext block with the previous ciphertext before encrypting.',more:'The IV makes the first block unique, and every block depends on the ones before it.',flow:[['P1','XOR IV','AES','C1'],['P2','XOR C1','AES','C2'],['P3','XOR C2','AES','C3']]},
 {id:'cfb',name:'CFB',full:'Cipher Feedback',ico:'↻',accent:'#3b82f6',text:'Encrypts the previous ciphertext to make a keystream, then XORs it with the data.',more:'Turns AES into a stream cipher. Only AES encryption is used, even to decrypt.',flow:[['IV','AES','XOR P1','C1'],['C1','AES','XOR P2','C2']]},
 {id:'ofb',name:'OFB',full:'Output Feedback',ico:'⟳',accent:'#a855f7',text:'Feeds AES output back into AES to build a keystream that is independent of the data.',more:'A bit error in the ciphertext only flips the same bit in the plaintext.',flow:[['IV','AES','Keystream','XOR P1','C1']]},
 {id:'ctr',name:'CTR',full:'Counter Mode',ico:'#',accent:'#34d399',text:'Encrypts an incrementing counter to produce the keystream.',more:'Blocks can be processed in parallel. Never reuse a nonce with the same key.',flow:[['Counter','AES','Keystream','XOR P1','C1']]}
];
const STEPS = [
 ['PLAINTEXT','The message you want to protect, such as "Hello, world".'],
 ['PADDING','AES needs full 16-byte blocks, so ECB and CBC add extra bytes to fill the last one.'],
 ['BLOCK DIVISION','The message is cut into 128-bit (16-byte) blocks.'],
 ['AES ENCRYPTION','Each block goes through the AES engine with the secret key. The mode decides how.'],
 ['CIPHERTEXT','The scrambled output. Without the key it looks like random data.']];
const PARTS = [
 ['▣','128-bit Block','AES always works on 16 bytes at a time.'],['🔑','Secret Key','The 128, 192 or 256-bit value only you know.'],
 ['🎲','IV / Nonce','A starting value that makes each encryption different.'],['⚙','AES Engine','Ten to fourteen rounds of substitution and mixing.'],['🔒','Ciphertext','Unreadable output that only the key can reverse.']];
const INSIGHTS = [
 ['⚠','Why ECB reveals patterns','Equal plaintext blocks always produce equal ciphertext blocks, so images and repeated text keep their shape.','#f87171'],
 ['ℹ','Why CBC requires an IV','Without a random IV, the same message always gives the same first block, which leaks information.','#fbbf24'],
 ['ℹ','How feedback modes work','CFB and OFB feed data back into AES to create a keystream, which is XORed with your message.','#3b82f6'],
 ['⚠','Why CTR needs a unique nonce','Reusing a nonce and key repeats the keystream. XORing two ciphertexts then cancels it and exposes the plaintexts.','#f87171'],
 ['⚠','Why key management matters','The strongest mode is useless if the key is weak, reused everywhere or stored in plain sight.','#fbbf24']];
const TIPS = {
 'IV Required':'A random starting value that makes identical messages encrypt differently.','Padding':'Extra bytes added so the last block is a full 16 bytes.',
 'Parallel Encryption':'Can several blocks be encrypted at the same time?','Parallel Decryption':'Can several blocks be decrypted at the same time?',
 'Error Propagation':'How far one damaged ciphertext block spreads into the plaintext.','Feedback Used':'Whether earlier output is fed back into the next step.','Counter Used':'Whether an incrementing counter creates the keystream.'};
const CMP = {
 'IV Required':['No','Yes','Yes','Yes','Nonce'],'Padding':['Yes','Yes','No','No','No'],'Parallel Encryption':['Yes','No','No','No','Yes'],
 'Parallel Decryption':['Yes','Yes','Yes','No','Yes'],'Error Propagation':['1 block','2 blocks','2 blocks','1 bit','1 bit'],
 'Feedback Used':['No','Ciphertext','Ciphertext','Keystream','No'],'Counter Used':['No','No','No','No','Yes']};
const $ = id => document.getElementById(id);
const $$ = id => $(id) || document.createElement('div'); // tolerate pages without a section
const cls = t => /^(P\d|Counter|IV)$/.test(t)?'':/AES/.test(t)?'a':/^C\d$/.test(t)?'c':'x';
function render(){
  $$('modes-grid').innerHTML = MODES.map((m,i)=>`
   <article class="glass card reveal" data-delay="${i*70}" style="--accent:${m.accent}" tabindex="0">
     <span class="ico" aria-hidden="true">${m.ico}</span><h3>${m.name}</h3><div class="full">${m.full}</div><p>${m.text}</p>
     <div class="flow">${m.flow.map(r=>'<div>'+r.map(t=>`<b class="${cls(t)}">${t}</b>`).join('<s>→</s>')+'</div>').join('')}</div>
     <p class="more">${m.more}</p>
     <a class="btn btn-ghost" href="simulator.html?mode=${m.id}">Explore Mode</a>
   </article>`).join('');
  $$('steps').innerHTML = STEPS.map((s,i)=>`<li class="glass reveal" data-delay="${i*80}"><h4>${s[0]}</h4><p>${s[1]}</p></li>`).join('');
  $$('parts').innerHTML = PARTS.map((p,i)=>`<div class="glass part reveal" data-delay="${i*80}"><span class="ico" style="animation-delay:${i*.4}s">${p[0]}</span><h4>${p[1]}</h4><p>${p[2]}</p></div>`).join('');
  $$('insights-grid').innerHTML = INSIGHTS.map((s,i)=>`<div class="glass ins reveal" data-delay="${i*70}" style="--accent:${s[3]}"><h4><span style="color:${s[3]}">${s[0]}</span>${s[1]}</h4><p>${s[2]}</p></div>`).join('');
  const val = v => /^(Yes|Nonce|Ciphertext|Keystream)$/.test(v)?`<span class="yes">${v}</span>`:v==='No'?`<span class="no">No</span>`:v;
  $$('cmp').innerHTML = `<thead><tr><th>Feature</th>${MODES.map(m=>`<th>${m.name}</th>`).join('')}</tr></thead><tbody>`+
    Object.entries(CMP).map(([k,r])=>`<tr><td><span class="tip" tabindex="0" data-tip="${TIPS[k]}">${k}</span></td>${r.map(v=>`<td>${val(v)}</td>`).join('')}</tr>`).join('')+'</tbody>';
}
function initNav(){
  const nav=$('nav'), links=$('links'), b=$('burger');
  const onScroll=()=>nav.classList.toggle('scrolled',scrollY>30); onScroll(); addEventListener('scroll',onScroll,{passive:true});
  b.addEventListener('click',()=>{const o=links.classList.toggle('open');b.setAttribute('aria-expanded',o);});
  links.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{links.classList.remove('open');b.setAttribute('aria-expanded',false);}));
}
document.addEventListener('DOMContentLoaded',()=>{
  render(); initNav(); initLab(); BCL.initTheme();
  BCL.initParticles(); BCL.initBinary(); BCL.initReveal(); BCL.initHexStream(); BCL.initPageTransitions();
});

/* ================= Cryptography Lab (simulator.html) ================= */
const EXPLAIN = {
 ECB:['Electronic Codebook','Every 16-byte block is encrypted on its own with the same key. It is simple and parallel, but identical plaintext blocks give identical ciphertext blocks, so patterns leak. Needs padding. Not suitable for real data.'],
 CBC:['Cipher Block Chaining','Each plaintext block is XORed with the previous ciphertext block (the IV for the first block) before AES. Chaining makes equal blocks look different. Needs padding and an unpredictable IV. Encryption is sequential; decryption can run in parallel.'],
 CFB:['Cipher Feedback','AES encrypts the previous ciphertext block (the IV first) to make a keystream, which is XORed with the plaintext. It turns AES into a stream cipher, needs no padding, and uses only AES encryption, even for decryption.'],
 OFB:['Output Feedback','AES repeatedly encrypts its own output, starting from the IV, to build a keystream that does not depend on the data. XOR with the plaintext gives the ciphertext. No padding is needed, and one flipped ciphertext bit flips just one plaintext bit. Never reuse an IV with the same key.'],
 CTR:['Counter Mode','AES encrypts a counter (nonce plus block number) to produce each keystream block, which is XORed with the plaintext. Blocks are independent, so it is parallel and supports random access. The nonce/counter must never repeat under one key.']};
const SECNOTES = [['⚠','ECB can reveal patterns','Repeated plaintext blocks give repeated ciphertext blocks.','#f87171'],['ℹ','CBC needs an unpredictable IV','A predictable IV makes chosen-plaintext attacks possible.','#fbbf24'],['⚠','CTR needs a unique nonce/counter','Reusing one with the same key repeats the keystream and leaks plaintext.','#f87171'],['🔑','Keys must stay secret','Anyone holding the key can decrypt. Never hard-code or share it.','#3b82f6'],['ℹ','Encryption is not authentication','These modes do not detect tampering. Real systems use AES-GCM or add a MAC.','#fbbf24']];
const hx = b => BCL.crypto.toHex(b), short = b => b ? (b.length > 6 ? hx(b.slice(0,6)) + '…' : hx(b)) : '';
const ascii = b => [...b].map(c => c > 31 && c < 127 ? String.fromCharCode(c) : '·').join('');
const esc = s => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function chipsFor(mode, b){
  const n = b.index, prevName = n === 1 ? (mode === 'CTR' ? '' : 'IV') : (mode === 'OFB' ? 'KS'+(n-1) : 'C'+(n-1));
  const P = ['p','P'+n,b.p], C = ['c','C'+n,b.c], A = ['a','AES',null], X = ['x','XOR',null];
  if(mode === 'ECB') return [P,A,C];
  if(mode === 'CBC') return [P,['i',prevName,b.in],['x','XOR',b.x],A,C];
  if(mode === 'CTR') return [['i','Counter '+n,b.in],A,['k','Keystream',b.ks],P,X,C];
  return [['i',prevName,b.in],A,['k','Keystream',b.ks],P,X,C];
}
const chipHtml = ([c,l,d],k) => `<b class="chip ${c}" style="--d:${k*.32}s"><i>${l}</i><code>${short(d)}</code></b>`;
function detailFor(mode, b){
  const rows = [['Plaintext block',hx(b.p)+'  ("'+ascii(b.p)+'")'],[mode==='CTR'?'Counter block':b.index===1?'IV':'Previous value',b.in&&hx(b.in)],['After XOR (P ⊕ previous)',b.x&&hx(b.x)],['Keystream = AES(input)',b.ks&&hx(b.ks)],['Ciphertext block',hx(b.c)]].filter(r => r[1]);
  const how = {ECB:'C = AES(P).',CBC:'C = AES(P ⊕ previous ciphertext or IV).',CFB:'C = P ⊕ AES(previous ciphertext or IV).',OFB:'C = P ⊕ keystream, where keystream = AES(previous keystream or IV).',CTR:'C = P ⊕ AES(counter), counter = nonce + block number.'}[mode];
  return `<h4>BLOCK ${String(b.index).padStart(2,'0')} · ${mode}</h4><p>${how}${b.p.length<16?' (last block is shorter: only the needed keystream bytes are used.)':''}</p><dl>${rows.map(r=>`<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')}</dl>`;
}

function initLab(){
  if(!$('lab-form')) return;
  const f = {pt:$('pt'), key:$('key'), iv:$('iv'), mode:$('mode')}, SAMPLE = ['Hello, Block Cipher Lab!','MySecretKey12345','0123456789ABCDEF'];
  const DEMO_KEY = 'DEMO-KEY-16-BYTE', DEMO_IV = '0123456789ABCDEF'; let last = null; const history = [];
  const showErr = m => { $('form-error').textContent = m || ''; $('form-error').hidden = !m; };
  const busy = on => { document.querySelectorAll('#lab-form .btn').forEach(b => b.disabled = on); $('lab-form').classList.toggle('loading', on); };
  const copy = async (t, what) => { try{ await navigator.clipboard.writeText(t); }catch{ const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); } BCL.toast(what + ' copied.'); };
  const reset = () => { [f.pt.value, f.key.value, f.iv.value] = SAMPLE; showErr(''); };
  const clearAll = () => { f.pt.value = f.key.value = f.iv.value = ''; showErr(''); $('result').hidden = true; $('viz-wrap').hidden = true; $('dec-box').hidden = true; $('live').hidden = true; last = null; };
  const rand = n => hx(crypto.getRandomValues(new Uint8Array(n)));

  const syncMode = () => { const m = f.mode.value; f.iv.disabled = m === 'ECB'; $('iv-label').textContent = m === 'CTR' ? 'Nonce / initial counter (16 bytes)' : m === 'ECB' ? 'IV (not used by ECB)' : 'IV (16 bytes)';
    $('explain').innerHTML = `<h3>HOW THIS MODE WORKS · ${m}</h3><p><b>${EXPLAIN[m][0]}.</b> ${EXPLAIN[m][1]}</p>`; if(last) showViz(); };
  const q = (new URLSearchParams(location.search).get('mode') || '').toUpperCase(); if(EXPLAIN[q]) f.mode.value = q;
  reset(); syncMode(); f.mode.addEventListener('change', syncMode);

  async function doEncrypt(){
    showErr(''); const mode = f.mode.value;
    try{
      if(!f.pt.value) throw new Error('Plaintext is empty. Enter a message to encrypt.');
      const r = BCL.crypto.encrypt(mode, f.pt.value, f.key.value, f.iv.value);          // validates key/IV too
      busy(true); $('dec-box').hidden = true;
      await BCL.runSteps($('live'), ['Dividing plaintext into blocks…','Applying padding…','Applying selected cipher mode…','AES encryption…','Generating ciphertext…'], 320);
      last = {r, mode, time:new Date()}; showResult(); history.unshift(last); renderHistory();
      BCL.toast('Encryption completed successfully.');
    }catch(e){ showErr(e.message); BCL.toast(e.message, 'error'); } finally { busy(false); }
  }
  function parseCt(s){
    s = s.replace(/\s+/g,''); if(!s) throw new Error('Paste hex or Base64 ciphertext into the message field first.');
    if(/^[0-9a-f]+$/i.test(s) && s.length % 2 === 0) return BCL.crypto.fromHex(s);
    try{ return BCL.crypto.fromB64(s); }catch{ throw new Error('Ciphertext must be valid hex or Base64.'); }
  }
  function doDecrypt(){
    showErr('');
    try{
      const text = BCL.crypto.decrypt(f.mode.value, parseCt(f.pt.value), f.key.value, f.iv.value);
      $('dec-out').textContent = text; $('dec-box').hidden = false; BCL.toast('Decryption completed successfully.');
    }catch(e){ showErr(e.message); BCL.toast(e.message, 'error'); }
  }
  function showResult(){
    const {r, mode} = last; $('result').hidden = false;
    $('n-pt').textContent = r.plainLen + ' bytes'; $('n-bl').textContent = r.blocks.length + ' × 16-byte' + (r.padLen ? ` (+${r.padLen} pad)` : '');
    $('n-pr').textContent = `${mode} · AES-${r.keyBits}`; $('n-ct').textContent = short(r.cipher);
    $('out-hex').value = r.hex; $('out-b64').value = r.b64; showViz(); $('result').scrollIntoView({behavior:'smooth', block:'nearest'});
  }
  function showViz(){
    const {r} = last, mode = f.mode.value; if(mode !== last.mode){ $('viz-note').hidden = false; return; } $('viz-note').hidden = true;
    $('viz-wrap').hidden = false; $('viz-title').textContent = mode + ' block flow';
    $('viz').innerHTML = r.blocks.map((b,i) => `<div class="vrow" data-i="${i}" tabindex="0" role="button"><div class="vlabel">BLOCK ${String(b.index).padStart(2,'0')}</div><div class="vchips">${chipsFor(mode,b).map(chipHtml).join('<s>→</s>')}</div></div>`).join('');
    $('detail').innerHTML = '<p class="mute">Click a block to inspect its values.</p>'; BCL.play($('viz'));
  }
  const pick = e => { const row = e.target.closest('.vrow'); if(!row || !last) return; $('viz').querySelectorAll('.vrow').forEach(x => x.classList.remove('sel')); row.classList.add('sel'); $('detail').innerHTML = detailFor(last.mode, last.r.blocks[+row.dataset.i]); };
  $('viz').addEventListener('click', pick); $('viz').addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); pick(e); } });

  function renderHistory(){
    $('hist').innerHTML = history.length ? history.slice(0,10).map(h => `<tr><td>${h.mode}</td><td>${h.time.toLocaleTimeString()}</td><td>${h.r.plainLen}</td><td class="mono">${h.r.hex.slice(0,32)}${h.r.hex.length>32?'…':''}</td></tr>`).join('') : '<tr><td colspan="4" class="mute">No operations yet.</td></tr>';
  }
  renderHistory();

  function download(){
    if(!last) return; const {r, mode, time} = last;
    const txt = `BLOCK CIPHER LAB – RESULT\nTime: ${time.toISOString()}\nMode: ${mode}\nAES key size: ${r.keyBits} bits (key not saved)\nIV/Nonce: ${r.iv ? hx(r.iv) : 'n/a'}\nPlaintext length: ${r.plainLen} bytes\nPadding added: ${r.padLen} bytes\n\nCiphertext (hex):\n${r.hex}\n\nCiphertext (Base64):\n${r.b64}\n`;
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], {type:'text/plain'})); a.download = `cipher-${mode.toLowerCase()}-result.txt`; a.click(); URL.revokeObjectURL(a.href); BCL.toast('Result downloaded.');
  }

  /* SEE THE DIFFERENCE: same plaintext, five modes, fixed demo key/IV */
  function runDiff(){
    const t = $('diff-text').value || ' ', grp = new Map();
    const dups = hexes => { const cnt = {}; hexes.forEach(h => cnt[h] = (cnt[h]||0)+1); return cnt; };
    const col = (title, hexes, note) => { const cnt = dups(hexes), ids = {}; let g = 0;
      const body = hexes.map(h => { if(cnt[h] > 1 && !(h in ids)) ids[h] = g++; return `<code class="dblk ${cnt[h]>1?'dup dup'+(ids[h]%4):''}">${h}</code>`; }).join('');
      return `<div class="dcol"><h4>${title}</h4>${body}<p>${note}</p></div>`; };
    const modes = ['ECB','CBC','CFB','OFB','CTR'], notes = {ECB:'Same input block → same output block.',CBC:'Each block is mixed with the previous ciphertext.',CFB:'Keystream comes from earlier ciphertext.',OFB:'Keystream comes from repeated AES on the IV.',CTR:'Keystream comes from a different counter each block.'};
    const res = modes.map(m => BCL.crypto.encrypt(m, t, DEMO_KEY, DEMO_IV)), pl = res[0].blocks.map(b => hx(b.p)), pd = Object.values(dups(pl)).filter(n => n>1).length;
    $('diff').innerHTML = col('PLAINTEXT', pl, pd ? 'Repeated blocks are highlighted.' : 'No repeated 16-byte blocks. Try the aligned example.') + res.map(r => { const h = r.blocks.map(b => hx(b.c)), d = h.length - new Set(h).size;
      return col(r.mode, h, (d ? `⚠ ${d} repeated block${d>1?'s':''}. ` : '✓ No repeats. ') + notes[r.mode]); }).join('');
  }
  $('diff-text').addEventListener('input', runDiff); $('diff-aligned').addEventListener('click', () => { $('diff-text').value = 'ATTACK AT DAWN!!ATTACK AT DAWN!!'; runDiff(); });
  runDiff();
  $('secnotes').innerHTML = SECNOTES.map((s,i) => `<div class="glass ins reveal" data-delay="${i*70}" style="--accent:${s[3]}"><h4><span style="color:${s[3]}">${s[0]}</span>${s[1]}</h4><p>${s[2]}</p></div>`).join('');

  $('btn-enc').onclick = doEncrypt; $('btn-dec').onclick = doDecrypt; $('btn-clear').onclick = clearAll; $('btn-reset').onclick = reset;
  $('gen-key').onclick = () => f.key.value = rand(16); $('gen-iv').onclick = () => f.iv.value = rand(16);
  $('copy-hex').onclick = () => copy($('out-hex').value, 'Ciphertext (hex)'); $('copy-b64').onclick = () => copy($('out-b64').value, 'Ciphertext (Base64)');
  $('copy-plain').onclick = () => copy($('dec-out').textContent, 'Plaintext'); $('dl').onclick = download;
  $('clear-hist').onclick = () => { history.length = 0; renderHistory(); };
  $('replay').onclick = () => BCL.play($('viz'));
  const t = BCL.crypto.selfTest(); console.log('AES self-test:', t.every(x => x.ok) ? 'all passed' : t.filter(x => !x.ok)); // runs against CryptoJS on load
}