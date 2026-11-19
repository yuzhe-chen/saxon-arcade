/*! Third-party terms: see THIRD-PARTY-NOTICES.txt in this distribution. */

!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="0a9aa5fe-2167-534a-ad77-5a541ed62d77")}catch(e){}}();
var e=[],t=()=>{},n=new Set,r=()=>{for(let e of n)e()},i={current:()=>e,show(n,i){e=n,t=i,r()},clear(){e=[],t=()=>{},r()},open:e=>t(e),subscribe(e){return n.add(e),()=>{n.delete(e)}}};export{i as t};
//# debugId=0a9aa5fe-2167-534a-ad77-5a541ed62d77
