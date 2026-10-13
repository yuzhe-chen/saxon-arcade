/* Save bridge for the Saxon Planner arcade.
   The planner wrapper page (games/<id>.html) is our parent. Before the game boots we ask it for the
   player's save, write it back into localStorage / IndexedDB, then start the game. While the game runs
   we snapshot the storage this game owns and send it up whenever it changes.
   Only records this game touches are saved, because every game here shares one origin. */
(function(){
  var DIR=(location.pathname.split('/').filter(Boolean).slice(-2,-1)[0])||'game';
  var CAP=150000, LOAD_TIMEOUT=9000, EVERY=10000;
  var inFrame=window.parent&&window.parent!==window;
  /* testing mode: the wrapper answers with a maxed preset and test:true. Nothing is sent up then, and every key the
     test session touched is listed under MARK so the next normal session wipes it before restoring the real save. */
  var TEST=false,MARK='sx-test:'+DIR;
  var lsOwned={}, idbOwned={}, idbSchema={}, baseline={};
  var origSet=Storage.prototype.setItem, origRemove=Storage.prototype.removeItem;

  /* ---- ownership tracking ---- */
  Storage.prototype.setItem=function(k,v){if(this===window.localStorage)lsOwned[k]=1;return origSet.apply(this,arguments);};
  Storage.prototype.removeItem=function(k){if(this===window.localStorage)delete lsOwned[k];return origRemove.apply(this,arguments);};
  function prefixOf(k){if(typeof k!=='string')return null;if(k.charAt(0)!=='/')return k;var p=k.split('/');return p.slice(0,3).join('/');}
  function own(db,store,key){var p=prefixOf(key);if(p===null)p=JSON.stringify(enc(key));((idbOwned[db]=idbOwned[db]||{})[store]=idbOwned[db][store]||{})[p]=1;}
  function ownedKey(db,store,key){var o=idbOwned[db]&&idbOwned[db][store];if(!o)return false;if(typeof key==='string'){var p=prefixOf(key);if(o[p])return true;for(var q in o)if(key===q||key.indexOf(q+'/')===0)return true;return false;}return !!o[JSON.stringify(enc(key))];}
  function wrapWrite(name){var f=IDBObjectStore.prototype[name];if(!f)return;IDBObjectStore.prototype[name]=function(value,key){
    try{var db=this.transaction.db.name,st=this.name,k=key;if(db==='UnityCache')return f.apply(this,arguments);/* build file cache, not progress */
      if(k===undefined&&this.keyPath!=null)k=pathGet(value,this.keyPath);
      if(k!==undefined){own(db,st,k);rememberSchema(this.transaction.db);}}catch(e){}
    return f.apply(this,arguments);};}
  if(window.IDBObjectStore){wrapWrite('put');wrapWrite('add');}
  function pathGet(v,kp){if(Array.isArray(kp))return kp.map(function(p){return pathGet(v,p)});var o=v;String(kp).split('.').forEach(function(s){o=o==null?undefined:o[s]});return o;}
  function rememberSchema(db){if(idbSchema[db.name]&&idbSchema[db.name].version===db.version)return;try{
    var t=db.transaction(Array.prototype.slice.call(db.objectStoreNames),'readonly');var s={version:db.version,stores:[]};
    Array.prototype.forEach.call(db.objectStoreNames,function(n){var os=t.objectStore(n);var ix=[];Array.prototype.forEach.call(os.indexNames,function(i){var x=os.index(i);ix.push({name:i,keyPath:x.keyPath,unique:x.unique,multiEntry:x.multiEntry});});
      s.stores.push({name:n,keyPath:os.keyPath,autoIncrement:os.autoIncrement,indexes:ix});});idbSchema[db.name]=s;}catch(e){}}

  /* ---- value encoding (Dates, typed arrays and buffers survive JSON) ---- */
  function b64(u8){var s='',i,C=0x8000;for(i=0;i<u8.length;i+=C)s+=String.fromCharCode.apply(null,u8.subarray(i,i+C));return btoa(s);}
  function unb64(s){var b=atob(s),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;}
  function enc(v){if(v===null||typeof v!=='object')return v;
    if(v instanceof Date)return {__t:'D',v:v.getTime()};
    if(v instanceof ArrayBuffer)return {__t:'AB',v:b64(new Uint8Array(v))};
    if(ArrayBuffer.isView(v))return {__t:v.constructor.name,v:b64(new Uint8Array(v.buffer,v.byteOffset,v.byteLength))};
    if(Array.isArray(v))return v.map(enc);
    var o={};for(var k in v)if(Object.prototype.hasOwnProperty.call(v,k))o[k]=enc(v[k]);return o;}
  function dec(v){if(v===null||typeof v!=='object')return v;if(Array.isArray(v))return v.map(dec);
    if(typeof v.__t==='string'&&'v' in v&&Object.keys(v).length===2){
      if(v.__t==='D')return new Date(v.v);var u=unb64(v.v);if(v.__t==='AB')return u.buffer;
      var C=window[v.__t];if(typeof C==='function'&&C.BYTES_PER_ELEMENT)return new C(u.buffer,0,u.byteLength/C.BYTES_PER_ELEMENT);return u;}
    var o={};for(var k in v)o[k]=dec(v[k]);return o;}

  /* ---- gzip + base64 ---- */
  function gz(str){if(!window.CompressionStream)return Promise.resolve('j:'+str);
    var s=new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'));
    return new Response(s).arrayBuffer().then(function(b){return 'g:'+b64(new Uint8Array(b));});}
  function gunz(data){if(data.slice(0,2)==='j:')return Promise.resolve(data.slice(2));
    var s=new Blob([unb64(data.slice(2))]).stream().pipeThrough(new DecompressionStream('gzip'));return new Response(s).text();}

  /* ---- IndexedDB helpers ---- */
  function req(r){return new Promise(function(res,rej){r.onsuccess=function(){res(r.result)};r.onerror=function(){rej(r.error)};});}
  function openFor(name,schema){return new Promise(function(res,rej){
    var r=indexedDB.open(name);r.onerror=function(){rej(r.error)};
    r.onupgradeneeded=function(){build(r.result,schema)};
    r.onsuccess=function(){var db=r.result;var missing=schema.stores.some(function(s){return !db.objectStoreNames.contains(s.name)});
      if(!missing)return res(db);var v=db.version+1;db.close();var r2=indexedDB.open(name,v);
      r2.onupgradeneeded=function(){build(r2.result,schema)};r2.onsuccess=function(){res(r2.result)};r2.onerror=function(){rej(r2.error)};};});}
  function build(db,schema){schema.stores.forEach(function(s){if(db.objectStoreNames.contains(s.name))return;
    var os=db.createObjectStore(s.name,s.keyPath==null?{autoIncrement:!!s.autoIncrement}:{keyPath:s.keyPath,autoIncrement:!!s.autoIncrement});
    (s.indexes||[]).forEach(function(i){try{os.createIndex(i.name,i.keyPath,{unique:i.unique,multiEntry:i.multiEntry})}catch(e){}});});}

  /* ---- restore ---- */
  function restore(save){var jobs=[];
    if(save.ls)Object.keys(save.ls).forEach(function(k){try{origSet.call(localStorage,k,save.ls[k]);lsOwned[k]=1;}catch(e){}});
    if(save.idb)Object.keys(save.idb).forEach(function(name){var d=save.idb[name];if(!d||!d.schema)return;idbSchema[name]=d.schema;
      jobs.push(openFor(name,d.schema).then(function(db){var names=Object.keys(d.data||{}).filter(function(s){return db.objectStoreNames.contains(s)});
        if(!names.length){db.close();return;}
        var t=db.transaction(names,'readwrite');names.forEach(function(st){var os=t.objectStore(st);d.data[st].forEach(function(rec){
          var k=dec(rec[0]),v=dec(rec[1]);own(name,st,k);try{os.keyPath==null?os.put(v,k):os.put(v);}catch(e){}});});
        return new Promise(function(res){t.oncomplete=t.onerror=t.onabort=function(){db.close();res();};});}).catch(function(e){console.warn('bridge idb restore',name,e);}));});
    return Promise.all(jobs);}

  /* ---- snapshot ---- */
  function snapshot(){var out={v:1,ls:{},idb:{}};
    try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k==null)continue;var v=localStorage.getItem(k);
      if(k.indexOf('sx-test:')===0)continue;if(lsOwned[k]||(baseline[k]!==v))out.ls[k]=v;}}catch(e){}
    var jobs=Object.keys(idbOwned).map(function(name){var sch=idbSchema[name];if(!sch)return null;
      return new Promise(function(res){var r=indexedDB.open(name);r.onerror=function(){res()};r.onupgradeneeded=function(){try{r.transaction.abort()}catch(e){}};
        r.onsuccess=function(){var db=r.result;var stores=Object.keys(idbOwned[name]).filter(function(s){return db.objectStoreNames.contains(s)});
          if(!stores.length){db.close();return res();}
          var t=db.transaction(stores,'readonly'),data={};
          stores.forEach(function(st){data[st]=[];var c=t.objectStore(st).openCursor();c.onsuccess=function(){var cur=c.result;if(!cur)return;
            if(ownedKey(name,st,cur.key))data[st].push([enc(cur.key),enc(cur.value)]);cur.continue();};});
          t.oncomplete=function(){db.close();out.idb[name]={schema:sch,data:data};res();};t.onerror=t.onabort=function(){db.close();res();};};});}).filter(Boolean);
    return Promise.all(jobs).then(function(){return JSON.stringify(out);});}

  /* ---- talk to the wrapper ---- */
  var seq=0,waiting={};
  window.addEventListener('message',function(e){if(e.source!==window.parent||!e.data||e.data.type!=='arcade-load-res')return;var w=waiting[e.data.reqId];if(w){delete waiting[e.data.reqId];w(e.data);}});
  function ask(){return new Promise(function(res){if(!inFrame)return res({});var id='b'+(++seq);waiting[id]=res;
    try{window.parent.postMessage({type:'arcade-load',reqId:id,dir:DIR},'*');}catch(e){res({});}
    setTimeout(function(){if(waiting[id]){delete waiting[id];res({});}},LOAD_TIMEOUT);});}
  /* ---- testing mode bookkeeping ---- */
  function readMark(){try{return JSON.parse(localStorage.getItem(MARK)||'null');}catch(e){return null;}}
  function mark(save){var m=readMark()||{ls:[],idb:{}};m.ls=m.ls||[];m.idb=m.idb||{};
    Object.keys(save.ls||{}).forEach(function(k){if(m.ls.indexOf(k)<0)m.ls.push(k);});
    Object.keys(save.idb||{}).forEach(function(n){var d=save.idb[n].data||{};var o=m.idb[n]=m.idb[n]||{};
      Object.keys(d).forEach(function(st){var l=o[st]=o[st]||[];d[st].forEach(function(rec){var k=JSON.stringify(rec[0]);if(l.indexOf(k)<0)l.push(k);});});});
    try{origSet.call(localStorage,MARK,JSON.stringify(m));}catch(e){}}
  function wipe(){var m=readMark();if(!m)return Promise.resolve();
    (m.ls||[]).forEach(function(k){try{origRemove.call(localStorage,k);}catch(e){}});
    var jobs=Object.keys(m.idb||{}).map(function(name){return new Promise(function(res){var r=indexedDB.open(name);r.onerror=function(){res()};
      r.onupgradeneeded=function(){try{r.transaction.abort()}catch(e){}};
      r.onsuccess=function(){var db=r.result;var sts=Object.keys(m.idb[name]).filter(function(s){return db.objectStoreNames.contains(s)});
        if(!sts.length){db.close();return res();}var t=db.transaction(sts,'readwrite');
        sts.forEach(function(st){var os=t.objectStore(st);m.idb[name][st].forEach(function(k){try{os.delete(dec(JSON.parse(k)));}catch(e){}});});
        t.oncomplete=t.onerror=t.onabort=function(){db.close();res();};};});});
    return Promise.all(jobs).then(function(){if(!TEST)try{origRemove.call(localStorage,MARK);}catch(e){}});}
  var lastJson=null,lastSent=null,busy=false;
  function push(force){if(!inFrame||busy)return Promise.resolve();busy=true;
    if(TEST)return snapshot().then(function(json){mark(JSON.parse(json));}).catch(function(e){}).then(function(){busy=false;});
    return snapshot().then(function(json){if(json===lastJson&&!force)return;lastJson=json;return gz(json).then(function(data){
      if(data.length>CAP){console.warn('bridge: save too large ('+data.length+' chars), not sent');return;}
      if(data===lastSent)return;lastSent=data;window.parent.postMessage({type:'arcade-save',dir:DIR,data:data},'*');});})
      .catch(function(e){console.warn('bridge snapshot',e)}).then(function(){busy=false;});}

  /* ---- deferred game scripts: <script type="bridge/defer"> run in order once the save is restored ---- */
  function runDeferred(){var list=Array.prototype.slice.call(document.querySelectorAll('script[type="bridge/defer"]'));
    var p=Promise.resolve();list.forEach(function(old){p=p.then(function(){return new Promise(function(res){var s=document.createElement('script');
      for(var i=0;i<old.attributes.length;i++){var a=old.attributes[i];if(a.name!=='type'&&a.name!=='data-type')s.setAttribute(a.name,a.value);}
      var t=old.getAttribute('data-type');if(t)s.type=t;
      if(old.src){s.onload=s.onerror=function(){res()};old.parentNode.replaceChild(s,old);if(t==='module')setTimeout(res,0);}
      else{s.text=old.text;old.parentNode.replaceChild(s,old);res();}});});});
    return p.then(function(){if(!list.length)return;var st=document.readyState;
      if(st!=="loading")document.dispatchEvent(new Event("DOMContentLoaded",{bubbles:true}));if(st==="complete")window.dispatchEvent(new Event("load"));});}

  var ready=new Promise(function(res){
    var go=function(){try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);baseline[k]=localStorage.getItem(k);}}catch(e){}
      ask().then(function(r){TEST=!!(r&&r.test===true);var data=r&&typeof r.data==='string'?r.data:'';
        return wipe().then(function(){
          baseline={};try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);baseline[k]=localStorage.getItem(k);}}catch(e){}
          if(TEST)mark({});if(!data)return;return gunz(data).then(function(j){var s=JSON.parse(j);if(TEST)mark(s);return restore(s);});});})
        .catch(function(e){console.warn('bridge restore',e)}).then(function(){
          Object.keys(lsOwned).forEach(function(k){delete baseline[k]});res();});};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go,{once:true});else go();});
  ready.then(runDeferred).then(function(){
    setInterval(function(){push(false)},EVERY);
    document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')push(false);});
    window.addEventListener('pagehide',function(){push(false);});});
  /* the planner H shortcut cannot reach into this frame, so pass it up (not while typing) */
  window.addEventListener("keydown",function(e){if((e.key!=="h"&&e.key!=="H")||e.ctrlKey||e.metaKey||e.altKey)return;
    var a=document.activeElement;if(a&&(a.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)))return;
    if(inFrame)try{window.parent.postMessage({type:"arcade-hide"},"*");}catch(_){}},true);
  window.SaveBridge={ready:ready,push:push,snapshot:snapshot,dir:DIR};
})();
