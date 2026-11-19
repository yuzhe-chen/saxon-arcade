/*! Third-party terms: see THIRD-PARTY-NOTICES.txt in this distribution. */

!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="1299e20b-36aa-5673-a674-0899311957a1")}catch(e){}}();
import{$i as e,Ba as t,ca as n,h as r,za as i}from"./index-mF_5wo8d.js";var a=t(),o=i(),s=n();function c(t){let n=(0,a.useRef)({});return(0,a.useLayoutEffect)(()=>{n.current.close=t.onClose}),(0,a.useLayoutEffect)(()=>r(n.current),[]),(0,o.createPortal)((0,s.jsx)(`div`,{className:`dim${t.foot?` is-foot`:``}`,onClick:e=>e.target===e.currentTarget&&t.onClose?.(),onKeyDown:e=>{e.key===`Escape`&&(e.stopPropagation(),t.onClose?.())},children:(0,s.jsx)(e.Provider,{value:null,children:t.children})}),document.body)}export{c as t};
//# debugId=1299e20b-36aa-5673-a674-0899311957a1
