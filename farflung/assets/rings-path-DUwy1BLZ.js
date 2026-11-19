/*! Third-party terms: see THIRD-PARTY-NOTICES.txt in this distribution. */

!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="36c6b043-c2e3-5ffe-a065-a7b59eb4594d")}catch(e){}}();
import{Rt as e,zt as t}from"./index-mF_5wo8d.js";function n(){let n=e();if(n)try{return t(n)}catch{return}}function r(e){try{e.gain.setTargetAtTime(0,e.context.currentTime,.015),setTimeout(()=>e.disconnect(),250)}catch{}}function i(e,t,n,r){let i=``,{xy:a,rings:o}=e;for(let e=0;e+1<o.length;e++){let s=0,c=0,l=0,u=``;for(let i=o[e];i<o[e+1];i++){let e=(a[2*i]+t-n.x0)*n.s,o=(a[2*i+1]-n.y0)*n.s;l&&Math.abs(e-s)<r&&Math.abs(o-c)<r||(u+=`${l?`L`:`M`}${e.toFixed(1)} ${o.toFixed(1)}`,s=e,c=o,l++)}l>=3&&(i+=`${u}Z`)}return i}export{r as n,n as r,i as t};
//# debugId=36c6b043-c2e3-5ffe-a065-a7b59eb4594d
