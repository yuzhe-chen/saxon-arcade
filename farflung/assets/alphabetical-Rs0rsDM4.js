/*! Third-party terms: see THIRD-PARTY-NOTICES.txt in this distribution. */

!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="ddfbca5e-0c11-5fc5-8730-5cd36a2e6d70")}catch(e){}}();
var e={ø:`o`,æ:`ae`,œ:`oe`,ł:`l`,đ:`d`,ß:`ss`};function t(t,n){try{return t.localeCompare(n,`en`)}catch{let r=t=>t.normalize(`NFD`).replace(/\p{M}/gu,``).toLowerCase().replace(/[øæœłđß]/g,t=>e[t]),[i,a]=[r(t),r(n)];return i<a?-1:i>a?1:t<n?-1:+(t>n)}}export{t};
//# debugId=ddfbca5e-0c11-5fc5-8730-5cd36a2e6d70
