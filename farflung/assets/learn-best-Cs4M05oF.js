/*! Third-party terms: see THIRD-PARTY-NOTICES.txt in this distribution. */

!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="1e48c487-2665-5661-8298-36a664d71ff2")}catch(e){}}();
import{o as e}from"./learn-souvenirs-B6x6PvCe.js";import{a as t,c as n,i as r}from"./learn-kept-mceZVOu5.js";function i(e,n,r){let i=null;for(let[t,a]of e){let e=n[t];if(e===void 0)continue;let o=r[t],s=[o?.first??``,o?.perfect??``].sort().at(-1)??``;(!i||s>i.latest)&&(i={id:t,name:a,ms:e,latest:s})}return i&&{sheet:i.id,name:i.name,time:t(i.ms),perfect:!!r[i.id]?.perfect}}var a=e=>i(e,r(),n()),o=()=>a(e);export{o as learnBest};
//# debugId=1e48c487-2665-5661-8298-36a664d71ff2
