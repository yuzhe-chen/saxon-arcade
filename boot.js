/* Saxon Arcade boot, injected by the planner wrapper (games/<id>.html) at the very start of the game page.
   The page is written into a sandboxed frame (no allow-same-origin), so it has an opaque origin: it can never
   see the planner's localStorage, cookies, IndexedDB or DOM. Everything the game stores lives in memory here,
   per game, and the save bridge below snapshots it for the planner and restores it on the next visit.
   window.__SX = {game, dir, cdn} is set by the wrapper; <base href> already points at cdn/dir/. */
(function(){
'use strict';
var W=window,SX=W.__SX=W.__SX||{};
var CDN=String(SX.cdn||'').replace(/\/+$/,''),DIR=SX.dir||'game',BASE=CDN+'/'+DIR+'/';
SX.base=BASE;SX.url=BASE+'index.html';SX.boot=true;
/* files over the CDN's 20 MB limit are stored as name.part0, name.part1, ... : [parts, total bytes] */
var PARTS={
"smashkarts/Build/2e08f04997659c12d4a76f7a3c93c397.data":[15,22635302],
"smashkarts/Build/38b60fd1add28cff51a89bd015c1bdad.wasm":[34,53042875],
"gladihoppers/Build/Gladihoppers.data.unityweb":[16,24739996],
"gladihoppers/Build/Gladihoppers.wasm.code.unityweb":[15,22620489],
"getaway/Build/078579ebdbd7e90539ba3ce278785287.wasm":[11,16957890],
"getaway/Build/323862927f75a9b36201c486bc3975d5.data":[4,5236721],
"drivemad/webapp/index.data":[2,2931903]
};
SX.parts=PARTS;
function def(o,k,get,set){try{Object.defineProperty(o,k,{configurable:true,enumerable:true,get:get,set:set});return true;}catch(e){return false;}}
function val(o,k,v){try{Object.defineProperty(o,k,{configurable:true,writable:true,enumerable:false,value:v});}catch(e){}}

/* fast task queue (setTimeout is clamped when nested) */
var mq=[],mc=new MessageChannel();
mc.port1.onmessage=function(){var q=mq;mq=[];for(var i=0;i<q.length;i++){try{q[i]();}catch(e){(function(x){setTimeout(function(){throw x;},0);})(e);}}};
function sched(f){mq.push(f);if(mq.length===1)mc.port2.postMessage(0);}

/* anything the game writes marks the save dirty */
var dirtyN=0;function touch(){dirtyN++;if(SX.onDirty)try{SX.onDirty();}catch(e){}}

/* ================= localStorage / sessionStorage ================= */
var SP=W.Storage&&Storage.prototype,maps=new WeakMap();
function makeStorage(track){
  var m=new Map(),target=Object.create(SP||Object.prototype);
  var api={getItem:function(k){k=String(k);return m.has(k)?m.get(k):null;},
    setItem:function(k,v){k=String(k);v=String(v);if(m.get(k)!==v){m.set(k,v);if(track)touch();}},
    removeItem:function(k){if(m.delete(String(k))&&track)touch();},
    clear:function(){if(m.size){m.clear();if(track)touch();}},
    key:function(i){i=Number(i)|0;if(i<0)return null;var n=0,r=null;m.forEach(function(v,k){if(n++===i)r=k;});return r;},
    _map:m};
  var p=new Proxy(target,{
    get:function(t,k,r){if(typeof k==='string'&&!(k in t)&&m.has(k))return m.get(k);return Reflect.get(t,k,r);},
    set:function(t,k,v,r){if(typeof k!=='string')return Reflect.set(t,k,v,r);api.setItem(k,v);return true;},
    has:function(t,k){return (typeof k==='string'&&m.has(k))||(k in t);},
    deleteProperty:function(t,k){if(typeof k==='string')api.removeItem(k);return true;},
    ownKeys:function(t){return Array.from(m.keys()).concat(Reflect.ownKeys(t));},
    getOwnPropertyDescriptor:function(t,k){if(typeof k==='string'&&m.has(k))return {value:m.get(k),writable:true,enumerable:true,configurable:true};return Reflect.getOwnPropertyDescriptor(t,k);},
    defineProperty:function(t,k,d){if(typeof k==='string'&&'value' in d){api.setItem(k,d.value);return true;}return Reflect.defineProperty(t,k,d);}
  });
  maps.set(p,api);maps.set(target,api);return p;}
if(SP){['getItem','setItem','removeItem','clear','key'].forEach(function(n){val(SP,n,function(){var a=maps.get(this);if(!a)throw new TypeError('Illegal invocation');return a[n].apply(a,arguments);});});
  def(SP,'length',function(){var a=maps.get(this);return a?a._map.size:0;});}
var LS=makeStorage(true),SS=makeStorage(false);
def(W,'localStorage',function(){return LS;});def(W,'sessionStorage',function(){return SS;});

/* ================= document.cookie (per game, in memory) ================= */
var jar=new Map();
def(document,'cookie',function(){var a=[];jar.forEach(function(v,k){a.push(k?k+'='+v:v);});return a.join('; ');},
  function(s){s=String(s);var parts=s.split(';'),kv=parts[0],i=kv.indexOf('='),k=i<0?'':kv.slice(0,i).trim(),v=i<0?kv.trim():kv.slice(i+1).trim(),del=false;
    parts.slice(1).forEach(function(a){var j=a.indexOf('='),n=(j<0?a:a.slice(0,j)).trim().toLowerCase(),x=j<0?'':a.slice(j+1).trim();
      if(n==='max-age'&&Number(x)<=0)del=true;if(n==='expires'){var t=Date.parse(x);if(!isNaN(t)&&t<Date.now())del=true;}});
    if(del){if(jar.delete(k))touch();}else if(jar.get(k)!==v){jar.set(k,v);touch();}});

/* ================= IndexedDB (per game, in memory) ================= */
/* the Unity build caches would only keep a second copy of 100 MB of downloads in memory, so it is refused (Unity then loads without it) */
var IDB_BLOCK=/^(UnityCache|CachedXMLHttpRequest)$/;
var DBS={};
function Ex(name,msg){return new DOMException(msg||name,name);}
function keyType(k){if(typeof k==='number')return isNaN(k)?0:1;if(k instanceof Date)return isNaN(k.getTime())?0:2;if(typeof k==='string')return 3;
  if(k instanceof ArrayBuffer||ArrayBuffer.isView(k))return 4;if(Array.isArray(k))return 5;return 0;}
function validKey(k,seen){var t=keyType(k);if(!t)return false;if(t===5){seen=seen||[];if(seen.indexOf(k)>=0)return false;seen.push(k);
  for(var i=0;i<k.length;i++)if(!validKey(k[i],seen))return false;}return true;}
function u8(k){return k instanceof ArrayBuffer?new Uint8Array(k):new Uint8Array(k.buffer,k.byteOffset,k.byteLength);}
function cmp(a,b){var ta=keyType(a),tb=keyType(b),i,n,c;if(ta!==tb)return ta>tb?1:-1;
  switch(ta){case 1:case 3:return a<b?-1:a>b?1:0;
    case 2:a=a.getTime();b=b.getTime();return a<b?-1:a>b?1:0;
    case 4:var x=u8(a),y=u8(b);n=Math.min(x.length,y.length);for(i=0;i<n;i++)if(x[i]!==y[i])return x[i]<y[i]?-1:1;return x.length===y.length?0:x.length<y.length?-1:1;
    case 5:n=Math.min(a.length,b.length);for(i=0;i<n;i++){c=cmp(a[i],b[i]);if(c)return c;}return a.length===b.length?0:a.length<b.length?-1:1;}return 0;}
function ckey(k){if(!validKey(k))throw Ex('DataError','The parameter is not a valid key.');return copyKey(k);}
function copyKey(k){var t=keyType(k);if(t===2)return new Date(k.getTime());if(t===4)return u8(k).slice().buffer;if(t===5)return k.map(copyKey);return k;}
function clone(v){return structuredClone(v);}
function evalKP(v,kp){if(Array.isArray(kp)){var out=[];for(var i=0;i<kp.length;i++){var x=evalKP(v,kp[i]);if(x===undefined)return undefined;out.push(x);}return out;}
  if(kp==='')return v;var parts=String(kp).split('.'),o=v;for(var j=0;j<parts.length;j++){if(o==null||typeof o!=='object'&&typeof o!=='string')return undefined;
    if(typeof o==='string'&&parts[j]==='length')o=o.length;else if(!(parts[j] in Object(o)))return undefined;else o=o[parts[j]];}return o;}
function injectKP(v,kp,k){var parts=String(kp).split('.'),o=v;for(var i=0;i<parts.length-1;i++){if(o[parts[i]]==null)o[parts[i]]={};o=o[parts[i]];}o[parts[parts.length-1]]=k;}

function KeyRange(lower,upper,lo,uo){this._l=lower;this._u=upper;this._lo=!!lo;this._uo=!!uo;}
KeyRange.prototype={get lower(){return this._l;},get upper(){return this._u;},get lowerOpen(){return this._lo;},get upperOpen(){return this._uo;},
  includes:function(k){ckey(k);return inRange(this,k);}};
KeyRange.prototype.constructor=KeyRange;
function inRange(r,k){var c;if(r._l!==undefined){c=cmp(k,r._l);if(c<0||(c===0&&r._lo))return false;}if(r._u!==undefined){c=cmp(k,r._u);if(c>0||(c===0&&r._uo))return false;}return true;}
KeyRange.only=function(k){k=ckey(k);return new KeyRange(k,k,false,false);};
KeyRange.lowerBound=function(k,o){return new KeyRange(ckey(k),undefined,o,true);};
KeyRange.upperBound=function(k,o){return new KeyRange(undefined,ckey(k),true,o);};
KeyRange.bound=function(l,u,lo,uo){l=ckey(l);u=ckey(u);var c=cmp(l,u);if(c>0||(c===0&&(lo||uo)))throw Ex('DataError','The lower key is greater than the upper key.');return new KeyRange(l,u,lo,uo);};
function toRange(q,need){if(q==null){if(need)throw Ex('DataError','No key or key range specified.');return null;}if(q instanceof KeyRange)return q;return KeyRange.only(q);}

function dsl(a){a=a.slice().sort();val(a,'contains',function(x){return a.indexOf(x)>=0;});val(a,'item',function(i){return a[i]===undefined?null:a[i];});return a;}
function fire(t,type,opts,props){var ev=new Event(type,{bubbles:!!(opts&&opts.bubbles),cancelable:!!(opts&&opts.cancelable)});
  if(props)Object.keys(props).forEach(function(k){try{Object.defineProperty(ev,k,{value:props[k],configurable:true});}catch(e){}});t.dispatchEvent(ev);return ev;}
function handlers(o,types){types.forEach(function(ty){o['on'+ty]=null;o.addEventListener(ty,function(e){var h=this['on'+ty];if(typeof h==='function')return h.call(this,e);});});}

class IDBRequestX extends EventTarget{constructor(source,tx){super();this._r=undefined;this._e=null;this._done=false;this.source=source||null;this.transaction=tx||null;handlers(this,['success','error']);}
  get result(){if(!this._done)throw Ex('InvalidStateError','The request has not finished.');return this._r;}
  get error(){if(!this._done)throw Ex('InvalidStateError','The request has not finished.');return this._e;}
  get readyState(){return this._done?'done':'pending';}}
class IDBOpenDBRequestX extends IDBRequestX{constructor(){super(null,null);handlers(this,['upgradeneeded','blocked']);}}

function storeDirty(s){if(!IDB_BLOCK.test(s._db))touch();}
class IDBTransactionX extends EventTarget{
  constructor(db,names,mode){super();this.db=db;this.mode=mode;this._names=names;this._q=[];this._state='active';this._err=null;this._bk=null;this._os={};this._sch=0;this._fin=null;
    handlers(this,['complete','error','abort']);this._kick();}
  get objectStoreNames(){return dsl(this._names);}
  get error(){return this._err;}
  get durability(){return 'default';}
  objectStore(n){if(this._state==='finished')throw Ex('InvalidStateError','The transaction has finished.');
    if(this._names.indexOf(n)<0||!this.db._d.stores[n])throw Ex('NotFoundError','No objectStore named '+n+' in this transaction.');
    return this._os[n]||(this._os[n]=new IDBObjectStoreX(this,this.db._d.stores[n]));}
  _add(req,op){if(this._state!=='active')throw Ex('TransactionInactiveError','The transaction is not active.');this._q.push([req,op]);this._kick();return req;}
  _kick(){var t=this;if(t._sch)return;t._sch=1;sched(function(){t._sch=0;t._run();});}
  _backup(s){if(this.mode==='readonly')return;var b=this._bk||(this._bk={});if(!b[s.name])b[s.name]={s:s,recs:s.recs.slice(),gen:s.gen};}
  _run(){var t=this;
    while(t._q.length&&t._state==='active'){var it=t._q.shift(),req=it[0];
      try{var r=it[1]();req._r=r;req._e=null;req._done=true;fire(req,'success');}
      catch(err){if(!(err instanceof DOMException))err=Ex('UnknownError',String(err&&err.message||err));
        req._e=err;req._r=undefined;req._done=true;
        var ev=fire(req,'error',{bubbles:true,cancelable:true});
        if(!ev.defaultPrevented)ev=fire(t,'error',{bubbles:true,cancelable:true},{target:req});
        if(!ev.defaultPrevented)ev=fire(t.db,'error',{bubbles:false,cancelable:true},{target:req});
        if(!ev.defaultPrevented){t._abort(err);return;}}}
    if(t._state==='active'&&!t._q.length)sched(function(){if(t._state==='active'&&!t._q.length&&!t._sch)t._commit();});}
  _commit(){this._state='finished';this._bk=null;fire(this,'complete');if(this._fin)this._fin(false);}
  _abort(err){if(this._state==='finished')return;this._state='finished';var b=this._bk;this._bk=null;
    if(b)Object.keys(b).forEach(function(n){b[n].s.recs=b[n].recs;b[n].s.gen=b[n].gen;});
    var q=this._q;this._q=[];q.forEach(function(it){it[0]._e=Ex('AbortError','The transaction was aborted.');it[0]._done=true;fire(it[0],'error',{bubbles:true,cancelable:true});});
    this._err=err||null;fire(this,'abort',{bubbles:true});if(this._fin)this._fin(true);}
  abort(){if(this._state==='finished')throw Ex('InvalidStateError','The transaction has finished.');this._abort(null);}
  commit(){var t=this;if(t._state==='finished')throw Ex('InvalidStateError','The transaction has finished.');}
}
function lowerIdx(recs,k){var lo=0,hi=recs.length;while(lo<hi){var mid=(lo+hi)>>1;if(cmp(recs[mid].k,k)<0)lo=mid+1;else hi=mid;}return lo;}
function indexEntries(s,ix){var out=[];s.recs.forEach(function(r){var ik=evalKP(r.v,ix.keyPath);if(ik===undefined)return;
    if(ix.multiEntry&&Array.isArray(ik)){var seen=[];ik.forEach(function(x){if(validKey(x)&&!seen.some(function(y){return cmp(x,y)===0;})){seen.push(x);out.push({k:x,pk:r.k,v:r.v});}});}
    else if(validKey(ik))out.push({k:ik,pk:r.k,v:r.v});});
  out.sort(function(a,b){return cmp(a.k,b.k)||cmp(a.pk,b.pk);});return out;}
function checkUnique(s,v,pk){Object.keys(s.indexes).forEach(function(n){var ix=s.indexes[n];if(!ix.unique)return;var ik=evalKP(v,ix.keyPath);if(ik===undefined)return;
  var keys=ix.multiEntry&&Array.isArray(ik)?ik:[ik];var ents=indexEntries(s,ix);
  keys.forEach(function(k){if(!validKey(k))return;if(ents.some(function(e){return cmp(e.k,k)===0&&cmp(e.pk,pk)!==0;}))throw Ex('ConstraintError','Unique index constraint failed: '+n);});});}
/* entries for a source in key order: store -> {k,pk,v} with pk=k */
function entriesOf(src){if(src._ix)return indexEntries(src._s,src._ix);return src._s.recs.map(function(r){return {k:r.k,pk:r.k,v:r.v};});}
function inR(r,k){return !r||inRange(r,k);}

class IDBObjectStoreX{
  constructor(tx,s){this.transaction=tx;this._s=s;}
  get name(){return this._s.name;} get keyPath(){return this._s.keyPath;} get autoIncrement(){return this._s.autoIncrement;}
  get indexNames(){return dsl(Object.keys(this._s.indexes));}
  _req(op){var tx=this.transaction;return tx._add(new IDBRequestX(this,tx),op);}
  _w(v,k,noOver){var tx=this.transaction,s=this._s;if(tx.mode==='readonly')throw Ex('ReadOnlyError','The transaction is read-only.');
    if(tx._state!=='active')throw Ex('TransactionInactiveError','The transaction is not active.');
    var value=clone(v),key;
    if(s.keyPath!=null){if(k!==undefined)throw Ex('DataError','The object store uses in-line keys and the key parameter was provided.');
      key=evalKP(value,s.keyPath);if(key===undefined){if(!s.autoIncrement)throw Ex('DataError','Evaluating the object store\'s key path did not yield a value.');}else key=ckey(key);}
    else{if(k===undefined){if(!s.autoIncrement)throw Ex('DataError','The object store uses out-of-line keys and has no key generator and the key parameter was not provided.');}else key=ckey(k);}
    return this._req(function(){tx._backup(s);var kk=key;
      if(kk===undefined){kk=s.gen++;if(s.keyPath!=null)injectKP(value,s.keyPath,kk);}else if(s.autoIncrement&&typeof kk==='number'&&kk>=s.gen)s.gen=Math.floor(kk)+1;
      var i=lowerIdx(s.recs,kk),exists=i<s.recs.length&&cmp(s.recs[i].k,kk)===0;
      if(exists&&noOver)throw Ex('ConstraintError','Key already exists in the object store.');
      checkUnique(s,value,kk);var rec={k:kk,v:value};if(exists)s.recs[i]=rec;else s.recs.splice(i,0,rec);storeDirty(s);return copyKey(kk);});}
  put(v,k){return this._w(v,k,false);} add(v,k){return this._w(v,k,true);}
  _find(r){var s=this._s;if(!r)return s.recs[0];var i=r._l===undefined?0:lowerIdx(s.recs,r._l);for(;i<s.recs.length;i++){if(inRange(r,s.recs[i].k))return s.recs[i];if(r._u!==undefined&&cmp(s.recs[i].k,r._u)>0)return null;}return null;}
  get(q){var r=toRange(q,true),t=this;return this._req(function(){var x=t._find(r);return x?clone(x.v):undefined;});}
  getKey(q){var r=toRange(q,true),t=this;return this._req(function(){var x=t._find(r);return x?copyKey(x.k):undefined;});}
  getAll(q,c){var r=toRange(q),s=this._s;c=c>>>0;return this._req(function(){var o=[];for(var i=0;i<s.recs.length&&(!c||o.length<c);i++)if(inR(r,s.recs[i].k))o.push(clone(s.recs[i].v));return o;});}
  getAllKeys(q,c){var r=toRange(q),s=this._s;c=c>>>0;return this._req(function(){var o=[];for(var i=0;i<s.recs.length&&(!c||o.length<c);i++)if(inR(r,s.recs[i].k))o.push(copyKey(s.recs[i].k));return o;});}
  count(q){var r=toRange(q),s=this._s;return this._req(function(){var n=0;s.recs.forEach(function(x){if(inR(r,x.k))n++;});return n;});}
  delete(q){var tx=this.transaction,s=this._s;if(tx.mode==='readonly')throw Ex('ReadOnlyError','The transaction is read-only.');var r=toRange(q,true);
    return this._req(function(){tx._backup(s);var n=s.recs.length;s.recs=s.recs.filter(function(x){return !inRange(r,x.k);});if(s.recs.length!==n)storeDirty(s);return undefined;});}
  clear(){var tx=this.transaction,s=this._s;if(tx.mode==='readonly')throw Ex('ReadOnlyError','The transaction is read-only.');
    return this._req(function(){tx._backup(s);if(s.recs.length){s.recs=[];storeDirty(s);}return undefined;});}
  openCursor(q,d){return openCur(this,this,toRange(q),d,true);}
  openKeyCursor(q,d){return openCur(this,this,toRange(q),d,false);}
  index(n){var ix=this._s.indexes[n];if(!ix)throw Ex('NotFoundError','The specified index was not found.');return new IDBIndexX(this,ix);}
  createIndex(n,kp,o){var tx=this.transaction;if(tx.mode!=='versionchange')throw Ex('InvalidStateError','Not in a version change transaction.');
    if(this._s.indexes[n])throw Ex('ConstraintError','An index with the specified name already exists.');o=o||{};
    if(o.multiEntry&&Array.isArray(kp))throw Ex('InvalidAccessError','multiEntry with an array key path.');
    var ix={name:n,keyPath:kp,unique:!!o.unique,multiEntry:!!o.multiEntry};if(ix.unique){var e=indexEntries(this._s,ix);for(var i=1;i<e.length;i++)if(cmp(e[i].k,e[i-1].k)===0){tx._abort(Ex('ConstraintError'));break;}}
    this._s.indexes[n]=ix;return new IDBIndexX(this,ix);}
  deleteIndex(n){if(this.transaction.mode!=='versionchange')throw Ex('InvalidStateError','Not in a version change transaction.');if(!this._s.indexes[n])throw Ex('NotFoundError');delete this._s.indexes[n];}
}
class IDBIndexX{
  constructor(os,ix){this.objectStore=os;this._s=os._s;this._ix=ix;}
  get name(){return this._ix.name;} get keyPath(){return this._ix.keyPath;} get unique(){return this._ix.unique;} get multiEntry(){return this._ix.multiEntry;}
  _req(op){return this.objectStore._req(op);}
  _all(r){var t=this;return entriesOf(t).filter(function(e){return inR(r,e.k);});}
  get(q){var r=toRange(q,true),t=this;return this._req(function(){var e=t._all(r)[0];return e?clone(e.v):undefined;});}
  getKey(q){var r=toRange(q,true),t=this;return this._req(function(){var e=t._all(r)[0];return e?copyKey(e.pk):undefined;});}
  getAll(q,c){var r=toRange(q),t=this;c=c>>>0;return this._req(function(){var a=t._all(r);if(c)a=a.slice(0,c);return a.map(function(e){return clone(e.v);});});}
  getAllKeys(q,c){var r=toRange(q),t=this;c=c>>>0;return this._req(function(){var a=t._all(r);if(c)a=a.slice(0,c);return a.map(function(e){return copyKey(e.pk);});});}
  count(q){var r=toRange(q),t=this;return this._req(function(){return t._all(r).length;});}
  openCursor(q,d){return openCur(this.objectStore,this,toRange(q),d,true);}
  openKeyCursor(q,d){return openCur(this.objectStore,this,toRange(q),d,false);}
}
class IDBCursorX{
  constructor(store,src,range,dir,req){this._store=store;this._src=src;this._range=range;this.direction=dir||'next';this._req=req;this._k=undefined;this._pk=undefined;this._v=undefined;this._got=false;}
  get source(){return this._src;} get key(){return copyKey(this._k);} get primaryKey(){return copyKey(this._pk);} get request(){return this._req;}
  _step(target,targetPk){var dir=this.direction,ents=entriesOf(this._src).filter(function(e){return inR(this._range,e.k);},this),k=this._k,pk=this._pk,started=k!==undefined,isIx=!!this._src._ix,i,e,c,hit=null;
    if(dir==='next'||dir==='nextunique'){for(i=0;i<ents.length;i++){e=ents[i];
        if(started){c=cmp(e.k,k);if(c<0)continue;if(c===0){if(dir==='nextunique'||!isIx)continue;if(cmp(e.pk,pk)<=0)continue;}}
        if(target!==undefined){c=cmp(e.k,target);if(c<0)continue;if(c===0&&targetPk!==undefined&&cmp(e.pk,targetPk)<0)continue;}
        hit=e;break;}}
    else{for(i=ents.length-1;i>=0;i--){e=ents[i];
        if(started){c=cmp(e.k,k);if(c>0)continue;if(c===0){if(dir==='prevunique'||!isIx)continue;if(cmp(e.pk,pk)>=0)continue;}}
        if(target!==undefined){c=cmp(e.k,target);if(c>0)continue;if(c===0&&targetPk!==undefined&&cmp(e.pk,targetPk)>0)continue;}
        hit=e;break;}
      if(hit&&dir==='prevunique'){for(i=0;i<ents.length;i++)if(cmp(ents[i].k,hit.k)===0){hit=ents[i];break;}}}
    if(!hit){this._k=this._pk=this._v=undefined;return null;}
    this._k=hit.k;this._pk=hit.pk;this._v=hit.v;this._got=false;return this;}
  _again(f){var t=this,tx=t._store.transaction;if(t._got)throw Ex('InvalidStateError','The cursor is being iterated or has iterated past its end.');t._got=true;
    t._req._done=false;tx._add(t._req,f);}
  continue(key){var t=this;if(key!==undefined){key=ckey(key);var c=cmp(key,t._k);if((t.direction.indexOf('next')===0&&c<=0)||(t.direction.indexOf('prev')===0&&c>=0))throw Ex('DataError','The parameter is less than or equal to this cursor\'s position.');}
    this._again(function(){return t._step(key);});}
  continuePrimaryKey(key,pk){var t=this;key=ckey(key);pk=ckey(pk);this._again(function(){return t._step(key,pk);});}
  advance(n){var t=this;n=n>>>0;if(!n)throw new TypeError('A count argument with value 0 (zero) was supplied, must be greater than 0.');
    this._again(function(){var r=t;for(var i=0;i<n&&r;i++)r=t._step();return r;});}
  update(v){if(this._src._ix&&false)return;var s=this._store;return s.keyPath!=null?s.put(v):s.put(v,this._pk);}
  delete(){return this._store.delete(this._pk);}
}
class IDBCursorWithValueX extends IDBCursorX{get value(){return clone(this._v);}}
function openCur(store,src,range,dir,withValue){var tx=store.transaction,req=new IDBRequestX(src,tx),C=withValue?IDBCursorWithValueX:IDBCursorX,cur=new C(store,src,range,dir,req);
  if(dir&&['next','nextunique','prev','prevunique'].indexOf(dir)<0)throw new TypeError('Invalid cursor direction');
  cur._got=true;return tx._add(req,function(){return cur._step();});}

class IDBDatabaseX extends EventTarget{
  constructor(d){super();this._d=d;this._closed=false;this._vtx=null;d.conns.push(this);handlers(this,['versionchange','close','abort','error']);}
  get name(){return this._d.name;} get version(){return this._d.version;}
  get objectStoreNames(){return dsl(Object.keys(this._d.stores));}
  createObjectStore(n,o){var tx=this._vtx;if(!tx||tx._state!=='active')throw Ex('InvalidStateError','Not in a version change transaction.');
    n=String(n);if(this._d.stores[n])throw Ex('ConstraintError','An object store with the specified name already exists.');o=o||{};
    var kp=o.keyPath===undefined?null:o.keyPath;if(o.autoIncrement&&(kp===''||Array.isArray(kp)))throw Ex('InvalidAccessError','autoIncrement with an empty or array key path.');
    this._d.stores[n]={name:n,keyPath:kp,autoIncrement:!!o.autoIncrement,gen:1,recs:[],indexes:{},_db:this._d.name};if(tx._names.indexOf(n)<0)tx._names.push(n);return tx.objectStore(n);}
  deleteObjectStore(n){var tx=this._vtx;if(!tx)throw Ex('InvalidStateError','Not in a version change transaction.');if(!this._d.stores[n])throw Ex('NotFoundError');
    delete this._d.stores[n];delete tx._os[n];tx._names=tx._names.filter(function(x){return x!==n;});touch();}
  transaction(names,mode){if(this._closed)throw Ex('InvalidStateError','The database connection is closing.');
    if(this._vtx&&this._vtx._state==='active')throw Ex('InvalidStateError','A version change transaction is running.');
    if(typeof names==='string')names=[names];names=Array.from(names||[]).map(String).filter(function(x,i,a){return a.indexOf(x)===i;});
    if(!names.length)throw Ex('InvalidAccessError','The storeNames parameter was empty.');
    var d=this._d;names.forEach(function(n){if(!d.stores[n])throw Ex('NotFoundError','One of the specified object stores was not found.');});
    mode=mode||'readonly';if(mode!=='readonly'&&mode!=='readwrite')throw new TypeError('Invalid transaction mode');
    return new IDBTransactionX(this,names,mode);}
  close(){if(this._closed)return;this._closed=true;var d=this._d,me=this;d.conns=d.conns.filter(function(c){return c!==me;});}
}
class IDBFactoryX{
  open(name,version){name=String(name);if(version!==undefined){version=Number(version);if(!(version>=1)||version!==Math.floor(version))throw new TypeError('The version provided must not be 0.');}
    var req=new IDBOpenDBRequestX();
    sched(function(){
      if(IDB_BLOCK.test(name)){req._e=Ex('UnknownError','Not available here.');req._done=true;fire(req,'error',{bubbles:true,cancelable:true});return;}
      var d=DBS[name],old=d?d.version:0,v=version===undefined?(old||1):version;
      if(v<old){req._e=Ex('VersionError','The requested version ('+v+') is less than the existing version ('+old+').');req._done=true;fire(req,'error',{bubbles:true,cancelable:true});return;}
      if(!d)d=DBS[name]={name:name,version:0,stores:{},conns:[]};
      var others=d.conns.slice(),db=new IDBDatabaseX(d);
      if(v>old){others.forEach(function(c){if(!c._closed)fire(c,'versionchange',null,{oldVersion:old,newVersion:v});});
        var snap={};Object.keys(d.stores).forEach(function(n){snap[n]=d.stores[n];});
        d.version=v;var tx=new IDBTransactionX(db,Object.keys(d.stores),'versionchange');db._vtx=tx;req.transaction=tx;req._r=db;req._done=true;
        tx._fin=function(aborted){db._vtx=null;req.transaction=null;
          if(aborted){d.version=old;d.stores=snap;if(!old)delete DBS[name];db.close();req._r=undefined;req._e=Ex('AbortError','Version change transaction was aborted.');fire(req,'error',{bubbles:true,cancelable:true});}
          else{touch();fire(req,'success');}};
        fire(req,'upgradeneeded',null,{oldVersion:old,newVersion:v});tx._kick();}
      else{req._r=db;req._done=true;fire(req,'success');}});
    return req;}
  deleteDatabase(name){name=String(name);var req=new IDBOpenDBRequestX();
    sched(function(){var d=DBS[name],old=d?d.version:0;
      if(d){d.conns.forEach(function(c){if(!c._closed)fire(c,'versionchange',null,{oldVersion:old,newVersion:null});});delete DBS[name];touch();}
      req._r=undefined;req._done=true;fire(req,'success',null,{oldVersion:old,newVersion:null});});
    return req;}
  databases(){return Promise.resolve(Object.keys(DBS).map(function(n){return {name:n,version:DBS[n].version};}));}
  cmp(a,b){return cmp(ckey(a),ckey(b));}
}
var factory=new IDBFactoryX();
def(W,'indexedDB',function(){return factory;});
['mozIndexedDB','webkitIndexedDB','msIndexedDB'].forEach(function(n){def(W,n,function(){return undefined;});});
[['IDBFactory',IDBFactoryX],['IDBDatabase',IDBDatabaseX],['IDBTransaction',IDBTransactionX],['IDBObjectStore',IDBObjectStoreX],['IDBIndex',IDBIndexX],
 ['IDBCursor',IDBCursorX],['IDBCursorWithValue',IDBCursorWithValueX],['IDBKeyRange',KeyRange],['IDBRequest',IDBRequestX],['IDBOpenDBRequest',IDBOpenDBRequestX],
 ['IDBVersionChangeEvent',Event]].forEach(function(p){val(W,p[0],p[1]);});

/* ================= other storage APIs an opaque origin can't use ================= */
var noCache={open:function(){return Promise.reject(Ex('SecurityError','Cache storage is disabled here.'));},has:function(){return Promise.resolve(false);},
  match:function(){return Promise.resolve(undefined);},keys:function(){return Promise.resolve([]);},delete:function(){return Promise.resolve(false);}};
def(W,'caches',function(){return noCache;});
/* no service workers: their scope would not be this game */
var sw={controller:null,ready:new Promise(function(){}),oncontrollerchange:null,onmessage:null,onmessageerror:null,
  register:function(){return Promise.reject(Ex('SecurityError','Service workers are disabled here.'));},
  getRegistration:function(){return Promise.resolve(undefined);},getRegistrations:function(){return Promise.resolve([]);},
  startMessages:function(){},addEventListener:function(){},removeEventListener:function(){},dispatchEvent:function(){return true;}};
def(navigator,'serviceWorker',function(){return sw;});
if(navigator.storage)try{var st=navigator.storage;['persist','persisted'].forEach(function(n){val(st,n,function(){return Promise.resolve(false);});});
  val(st,'estimate',function(){return Promise.resolve({quota:2147483648,usage:0});});}catch(e){}

/* ================= page URL: the document is about:srcdoc, the game expects its folder ================= */
def(document,'URL',function(){return SX.url;});def(document,'documentURI',function(){return SX.url;});
['pushState','replaceState'].forEach(function(n){var f=History.prototype[n];val(History.prototype,n,function(s,t,u){
  try{return f.apply(this,arguments);}catch(e){try{return f.call(this,s,t);}catch(e2){}}});});

/* ================= network ================= */
function abs(u){try{return new URL(u,document.baseURI).href;}catch(e){return null;}}
function onCdn(a){return !!a&&a.indexOf(CDN+'/')===0;}
function partOf(a){if(!onCdn(a))return null;var rel=a.slice(CDN.length+1).split(/[?#]/)[0];try{rel=decodeURIComponent(rel);}catch(e){}var p=PARTS[rel];return p?{rel:rel,n:p[0],size:p[1],url:a}:null;}
var MIME={wasm:'application/wasm',js:'application/javascript',json:'application/json',data:'application/octet-stream',unityweb:'application/octet-stream'};
function mimeOf(rel){var x=rel.split('.').pop().toLowerCase();return MIME[x]||'application/octet-stream';}
var nfetch=W.fetch.bind(W);
function wait(ms){return new Promise(function(r){setTimeout(r,ms);});}
/* jsDelivr can answer 5xx while it pulls a cold file from GitHub: retry */
function fetchRetry(input,init,tries){return nfetch(input,init).then(function(r){if(r.status>=500&&tries>0)return wait(700).then(function(){return fetchRetry(input,init,tries-1);});return r;},
  function(e){if(tries>0&&!(init&&init.signal&&init.signal.aborted))return wait(700).then(function(){return fetchRetry(input,init,tries-1);});throw e;});}
function partsBody(p){
  var reqs=[];for(var i=0;i<p.n;i++)reqs.push(fetchRetry(CDN+'/'+p.rel+'.part'+i,{credentials:'omit'},4).then(function(r){if(!r.ok)throw new Error('could not load '+r.url+' ('+r.status+')');return r;}));
  reqs.forEach(function(q){q.catch(function(){});});
  var i2=0,reader=null;
  return new ReadableStream({pull:function(c){return (function step(){
    if(!reader){if(i2>=p.n){c.close();return;}return reqs[i2++].then(function(r){reader=r.body.getReader();return step();});}
    return reader.read().then(function(x){if(x.done){reader=null;return step();}c.enqueue(x.value);});})();},
    cancel:function(){if(reader)try{reader.cancel();}catch(e){}}});}
function partsResponse(p){var r=new Response(partsBody(p),{status:200,statusText:'OK',headers:{'Content-Type':mimeOf(p.rel),'Content-Length':String(p.size)}});
  try{Object.defineProperty(r,'url',{value:p.url});}catch(e){}return r;}
SX.partsResponse=function(u){var p=partOf(abs(u));return p?partsResponse(p):null;};
W.fetch=function(input,init){
  var url=typeof input==='string'?input:(input&&input.url)||String(input),a=abs(url),m=String((init&&init.method)||(input&&input.method)||'GET').toUpperCase();
  if(a&&NOADS.test(a))return Promise.resolve(new Response(null,{status:204}));
  if(m==='GET'||m==='HEAD'){var p=partOf(a);if(p){if(m==='HEAD')return Promise.resolve(new Response(null,{status:200,headers:{'Content-Type':mimeOf(p.rel),'Content-Length':String(p.size)}}));return Promise.resolve(partsResponse(p));}
    if(onCdn(a))return fetchRetry(input,init,2);}
  return nfetch(input,init);};
/* XMLHttpRequest for split files (old Unity loaders use XHR with progress events) */
(function(){var XP=XMLHttpRequest.prototype,xopen=XP.open,xsend=XP.send,xabort=XP.abort;
  XP.open=function(m,u){var a=abs(u),p=String(m).toUpperCase()==='GET'?partOf(a):null;this.__sxp=p;return xopen.apply(this,arguments);};
  XP.send=function(){var x=this,p=x.__sxp;if(!p)return xsend.apply(this,arguments);
    var rs=1,status=0,resp=null,text='',aborted=false,type=p&&mimeOf(p.rel);x.__sxab=function(){aborted=true;};
    def(x,'readyState',function(){return rs;});def(x,'status',function(){return status;});def(x,'statusText',function(){return status?'OK':'';});
    def(x,'responseURL',function(){return rs===4?p.url:'';});
    def(x,'response',function(){return rs===4?resp:null;});
    def(x,'responseText',function(){if(x.responseType&&x.responseType!=='text')throw Ex('InvalidStateError','responseText is only available if responseType is \'\' or \'text\'.');return rs===4?text:'';});
    val(x,'getResponseHeader',function(h){if(rs<2)return null;h=String(h).toLowerCase();return h==='content-type'?type:h==='content-length'?String(p.size):null;});
    val(x,'getAllResponseHeaders',function(){return rs<2?'':'content-length: '+p.size+'\r\ncontent-type: '+type+'\r\n';});
    function pe(t,l){x.dispatchEvent(new ProgressEvent(t,{lengthComputable:true,loaded:l,total:p.size}));}
    function st(n){rs=n;x.dispatchEvent(new Event('readystatechange'));}
    pe('loadstart',0);
    var buf=new Uint8Array(p.size),off=0,rd=partsBody(p).getReader(),first=true;
    (function pump(){return rd.read().then(function(r){if(aborted)return;
      if(first){first=false;status=200;st(2);st(3);}
      if(r.done){var ab=off===p.size?buf.buffer:buf.slice(0,off).buffer,t=x.responseType;
        if(t==='arraybuffer')resp=ab;else if(t==='blob')resp=new Blob([ab],{type:type});else{text=new TextDecoder().decode(ab);resp=t==='json'?(function(){try{return JSON.parse(text);}catch(e){return null;}})():text;}
        st(4);pe('load',off);pe('loadend',off);return;}
      if(off+r.value.length>buf.length){var nb=new Uint8Array(Math.max(buf.length*2,off+r.value.length));nb.set(buf.subarray(0,off));buf=nb;}
      buf.set(r.value,off);off+=r.value.length;pe('progress',off);return pump();});})()
    .catch(function(e){if(aborted)return;console.error('arcade: '+(e&&e.message||e));status=0;st(4);pe('error',0);pe('loadend',0);});};
  /* read headers from the exposed list, so asking for one the CDN doesn't expose (ETag) returns null without a console error */
  var grh=XP.getResponseHeader,gall=XP.getAllResponseHeaders;
  XP.getResponseHeader=function(h){if(this.__sxp)return grh.apply(this,arguments);var all=gall.call(this);if(!all)return null;h=String(h).toLowerCase();var out=null;
    all.split(/\r?\n/).forEach(function(l){var i=l.indexOf(':');if(i>0&&l.slice(0,i).trim().toLowerCase()===h){var v=l.slice(i+1).trim();out=out==null?v:out+', '+v;}});return out;};
  XP.abort=function(){if(this.__sxp&&this.__sxab){this.__sxab();return;}return xabort.apply(this,arguments);};})();
/* WebAssembly: streaming compile needs application/wasm; anything else is compiled from bytes */
(function(){var WA=W.WebAssembly;if(!WA)return;var is=WA.instantiateStreaming,cs=WA.compileStreaming;
  function isWasm(r){return /application\/wasm/i.test(r&&r.headers&&r.headers.get('content-type')||'');}
  WA.instantiateStreaming=function(src,imp){return Promise.resolve(src).then(function(r){if(is&&isWasm(r))return is.call(WA,r,imp);return r.arrayBuffer().then(function(b){return WA.instantiate(b,imp);});});};
  WA.compileStreaming=function(src){return Promise.resolve(src).then(function(r){if(cs&&isWasm(r))return cs.call(WA,r);return r.arrayBuffer().then(function(b){return WA.compile(b);});});};})();
/* workers must be same-origin: start them from a blob that loads the real script, with relative URLs resolved against it */
(function(){var NW=W.Worker;if(!NW)return;
  function X(u,o){var a=abs(u);if(!a||/^(blob|data):/i.test(a))return new NW(u,o);
    var pre='(function(){var B='+JSON.stringify(a)+';function R(u){try{return new URL(u,B).href}catch(e){return u}}'+
      'var f=self.fetch;if(f)self.fetch=function(i,o){return f.call(self,typeof i==="string"?R(i):i,o)};'+
      'if(self.XMLHttpRequest){var op=XMLHttpRequest.prototype.open;XMLHttpRequest.prototype.open=function(m,u){arguments[1]=R(u);return op.apply(this,arguments)}}'+
      'var is=self.importScripts;if(is)self.importScripts=function(){return is.apply(self,Array.prototype.map.call(arguments,R))};})();\n';
    var src=o&&o.type==='module'?pre+'await import('+JSON.stringify(a)+');\n':pre+'importScripts('+JSON.stringify(a)+');\n';
    return new NW(URL.createObjectURL(new Blob([src],{type:'text/javascript'})),o);}
  X.prototype=NW.prototype;val(W,'Worker',X);})();
/* images and media from the CDN load with CORS so WebGL and WebAudio can use them */
(function(){function patch(P){var d=P&&Object.getOwnPropertyDescriptor(P,'src');if(!d||!d.set)return;
  Object.defineProperty(P,'src',{configurable:true,enumerable:true,get:d.get,set:function(v){try{if(this.getAttribute('crossorigin')==null&&onCdn(abs(v)))this.crossOrigin='anonymous';}catch(e){}d.set.call(this,v);}});}
  patch(W.HTMLImageElement&&HTMLImageElement.prototype);patch(W.HTMLMediaElement&&HTMLMediaElement.prototype);
  var sa=Element.prototype.setAttribute;val(Element.prototype,'setAttribute',function(n,v){
    if(String(n).toLowerCase()==='src'&&(this instanceof HTMLImageElement||(W.HTMLMediaElement&&this instanceof HTMLMediaElement))&&this.getAttribute('crossorigin')==null&&onCdn(abs(v)))sa.call(this,'crossorigin','anonymous');
    return sa.apply(this,arguments);});})();

/* Crossy Road's loader adds three.min.js and game.min.js at the same moment; from a fast CDN the game script can
   arrive first and fail with "THREE is not defined". Its own scripts run in the order they were added. */
/* ad, payment-popup and tracking scripts are not loaded (they are often blocked at school and some wait forever):
   they are swapped for an empty script that still fires onload */
var NOADS=/^https?:\/\/([a-z0-9-]+\.)*(applixir\.com|doubleclick\.net|googlesyndication\.com|googletagservices\.com|googletagmanager\.com|google-analytics\.com|zdassets\.com|zopim\.com|zendesk\.com|connect\.facebook\.net|facebook\.com|supersonicads\.com|renotifier\.miniclippt\.com|imasdk\.googleapis\.com|adinplay\.com|amazon-adsystem\.com)(\/|$)/i;
SX.noAds=NOADS;
['appendChild','insertBefore'].forEach(function(n){var f=Node.prototype[n];val(Node.prototype,n,function(c){
  try{if(c&&c.tagName==='SCRIPT'&&!c.isConnected&&c.src){
      if(NOADS.test(c.src)){c.removeAttribute('crossorigin');c.removeAttribute('integrity');c.src='data:text/javascript,';}
      else if(DIR==='crossyroad'&&onCdn(c.src)&&!c.hasAttribute('async'))c.async=false;}
    else if(c&&c.tagName==='IFRAME'&&c.src&&NOADS.test(c.src))c.src='about:blank';}catch(e){}
  return f.apply(this,arguments);});});

/* ================= save bridge ================= */
var CAP=150000,LOAD_TIMEOUT=9000,EVERY=10000;
var inFrame=W.parent&&W.parent!==W,PARENT=W.parent,TEST=false;
function b64(u){var s='',i,C=0x8000;for(i=0;i<u.length;i+=C)s+=String.fromCharCode.apply(null,u.subarray(i,i+C));return btoa(s);}
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
    var C=W[v.__t];if(typeof C==='function'&&C.BYTES_PER_ELEMENT)return new C(u.buffer,0,u.byteLength/C.BYTES_PER_ELEMENT);return u;}
  var o={};for(var k in v)o[k]=dec(v[k]);return o;}
function gz(str){if(!W.CompressionStream)return Promise.resolve('j:'+str);
  return new Response(new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer().then(function(b){return 'g:'+b64(new Uint8Array(b));});}
function gunz(data){if(data.slice(0,2)==='j:')return Promise.resolve(data.slice(2));
  return new Response(new Blob([unb64(data.slice(2))]).stream().pipeThrough(new DecompressionStream('gzip'))).text();}

/* the save holds only what this game stored: its own in-memory localStorage, cookies and databases */
function restore(save){
  if(save.ls)Object.keys(save.ls).forEach(function(k){if(k.indexOf('sx-test:')===0)return;LS._map||0;maps.get(LS)._map.set(k,String(save.ls[k]));});
  if(save.ck)Object.keys(save.ck).forEach(function(k){jar.set(k,String(save.ck[k]));});
  if(save.idb)Object.keys(save.idb).forEach(function(name){var d=save.idb[name];if(!d||!d.schema||IDB_BLOCK.test(name))return;
    var db=DBS[name]={name:name,version:d.schema.version||1,stores:{},conns:[]};
    (d.schema.stores||[]).forEach(function(s){var st=db.stores[s.name]={name:s.name,keyPath:s.keyPath==null?null:s.keyPath,autoIncrement:!!s.autoIncrement,gen:1,recs:[],indexes:{},_db:name};
      (s.indexes||[]).forEach(function(i){st.indexes[i.name]={name:i.name,keyPath:i.keyPath,unique:!!i.unique,multiEntry:!!i.multiEntry};});
      ((d.data||{})[s.name]||[]).forEach(function(rec){try{var k=dec(rec[0]),v=dec(rec[1]);if(st.keyPath!=null&&k===undefined)k=evalKP(v,st.keyPath);if(!validKey(k))return;
        var i=lowerIdx(st.recs,k);if(i<st.recs.length&&cmp(st.recs[i].k,k)===0)st.recs[i]={k:k,v:v};else st.recs.splice(i,0,{k:k,v:v});
        if(typeof k==='number'&&k>=st.gen)st.gen=Math.floor(k)+1;}catch(e){}});});});}
function snapshotObj(){var out={v:1,ls:{},idb:{}};
  maps.get(LS)._map.forEach(function(v,k){out.ls[k]=v;});
  if(jar.size){out.ck={};jar.forEach(function(v,k){out.ck[k]=v;});}
  Object.keys(DBS).forEach(function(name){if(IDB_BLOCK.test(name))return;var d=DBS[name],sch={version:d.version,stores:[]},data={};
    Object.keys(d.stores).forEach(function(n){var s=d.stores[n];
      sch.stores.push({name:n,keyPath:s.keyPath,autoIncrement:s.autoIncrement,indexes:Object.keys(s.indexes).map(function(i){var x=s.indexes[i];return {name:x.name,keyPath:x.keyPath,unique:x.unique,multiEntry:x.multiEntry};})});
      data[n]=s.recs.map(function(r){return [enc(r.k),enc(r.v)];});});
    out.idb[name]={schema:sch,data:data};});
  return out;}
function snapshot(){return Promise.resolve(JSON.stringify(snapshotObj()));}

var seq=0,waiting={};
W.addEventListener('message',function(e){if(e.source!==PARENT||!e.data||typeof e.data!=='object')return;var m=e.data;
  if(m.type==='arcade-load-res'){var w=waiting[m.reqId];if(w){delete waiting[m.reqId];w(m);}}
  else if(m.type==='arcade-flush'){push(true).then(function(){try{PARENT.postMessage({type:'arcade-flushed',reqId:m.reqId},'*');}catch(_){}});}});
function ask(){return new Promise(function(res){if(!inFrame)return res({});var id='b'+(++seq);waiting[id]=res;
  try{PARENT.postMessage({type:'arcade-load',reqId:id,dir:DIR},'*');}catch(e){res({});}
  setTimeout(function(){if(waiting[id]){delete waiting[id];res({});}},LOAD_TIMEOUT);});}
var lastJson=null,lastSent=null,busy=null,sentAt=0,ready=false;
function push(force){if(!inFrame||!ready||TEST)return Promise.resolve();if(busy)return busy;
  var json=JSON.stringify(snapshotObj()),n=dirtyN;
  if(json===lastJson&&!force)return Promise.resolve();
  busy=gz(json).then(function(data){if(data.length>CAP){console.warn('arcade: save too large ('+data.length+' chars), not sent');return;}
    lastJson=json;sentAt=n;if(data===lastSent)return;lastSent=data;PARENT.postMessage({type:'arcade-save',dir:DIR,data:data},'*');})
    .catch(function(e){console.warn('arcade: snapshot failed',e);}).then(function(){busy=null;});
  return busy;}
/* a write schedules a save a moment later; the interval and leaving the page catch the rest */
var soon=0;SX.onDirty=function(){if(!ready||TEST||soon)return;soon=setTimeout(function(){soon=0;push(false);},2500);};

/* <script type="bridge/defer"> run in order once the save is restored */
/* while they run, the page reports readyState 'loading' as it would have when the scripts were parsed, so a script
   that checks readyState waits for the DOMContentLoaded / load events sent below instead of starting twice */
var fakeState=null,RS=Object.getOwnPropertyDescriptor(Document.prototype,'readyState');
def(document,'readyState',function(){return fakeState||RS.get.call(document);});
function runDeferred(){var list=Array.prototype.slice.call(document.querySelectorAll('script[type="bridge/defer"]'));
  if(list.length)fakeState='loading';
  var p=Promise.resolve();list.forEach(function(old){p=p.then(function(){return new Promise(function(res){var s=document.createElement('script');
    for(var i=0;i<old.attributes.length;i++){var a=old.attributes[i];if(a.name!=='type'&&a.name!=='data-type')s.setAttribute(a.name,a.value);}
    var t=old.getAttribute('data-type');if(t)s.type=t;
    if(old.src){s.onload=s.onerror=function(){res();};old.parentNode.replaceChild(s,old);if(t==='module')setTimeout(res,0);}
    else{s.text=old.text;old.parentNode.replaceChild(s,old);res();}});});});
  return p.then(function(){if(!list.length)return;var st=RS.get.call(document);
    fakeState=st==='loading'?null:'interactive';if(st!=='loading'){document.dispatchEvent(new Event('readystatechange'));document.dispatchEvent(new Event('DOMContentLoaded',{bubbles:true}));}
    fakeState=null;if(st==='complete'){document.dispatchEvent(new Event('readystatechange'));W.dispatchEvent(new Event('load'));}});}

var domReady=new Promise(function(r){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){r();},{once:true});else r();});
var loaded=ask().then(function(r){TEST=!!(r&&r.test===true);var data=r&&typeof r.data==='string'?r.data:'';if(!data)return;
  return gunz(data).then(function(j){restore(JSON.parse(j));});}).catch(function(e){console.warn('arcade: restore failed',e);});
var readyP=Promise.all([loaded,domReady]).then(function(){lastJson=JSON.stringify(snapshotObj());ready=true;});
readyP.then(runDeferred).then(function(){
  setInterval(function(){if(dirtyN!==sentAt)push(false);},EVERY);
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')push(false);});
  W.addEventListener('pagehide',function(){push(false);});});
/* H goes back to the planner: the planner's own shortcut can't see keys pressed in here */
W.addEventListener('keydown',function(e){if((e.key!=='h'&&e.key!=='H')||e.ctrlKey||e.metaKey||e.altKey)return;
  var a=document.activeElement;if(a&&(a.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)))return;
  if(!inFrame)return;var go=function(){try{PARENT.postMessage({type:'arcade-hide'},'*');}catch(_){}};
  Promise.race([push(false),wait(600)]).then(go,go);},true);
W.SaveBridge={ready:readyP,push:push,snapshot:snapshot,dir:DIR};
})();
