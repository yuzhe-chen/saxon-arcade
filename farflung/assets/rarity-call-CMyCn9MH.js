/*! Third-party terms: see THIRD-PARTY-NOTICES.txt in this distribution. */

!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="2e112472-701e-5576-9909-09e9cd5d0c5b")}catch(e){}}();
import{Ft as e,Lt as t,Pt as n}from"./index-mF_5wo8d.js";var r=[523,659,784,988,1175,1568],i={tourist:1,guidebook:1,traveller:2,wayfarer:3,uncharted:4,farflung:6},a=e=>r[i[e]-1];function o(a,o=0,s){let c=i[a];if(c>=3&&t({f0:104-c*5,f1:42,dur:.3+c*.07,peak:.16+c*.02,at:o,bus:s}),n(r.slice(0,c),.062,{dur:.3+c*.06,peak:.062,lp:3e3+c*320,bus:s},o+.07),a===`farflung`){for(let e of[784,1047,1568])t({type:`triangle`,f0:e,dur:1.1,peak:.03,lp:3600,a:.06,at:o+.46,bus:s});e({dur:1.2,lp:9e3,hp:4400,peak:.024,a:.25,at:o+.2,bus:s})}}export{a as n,o as t};
//# debugId=2e112472-701e-5576-9909-09e9cd5d0c5b
