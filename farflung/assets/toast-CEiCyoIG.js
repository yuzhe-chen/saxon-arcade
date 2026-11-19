/*! Third-party terms: see THIRD-PARTY-NOTICES.txt in this distribution. */
/* empty css              */
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="72b63619-2751-58a9-b41d-936d63179202")}catch(e){}}();
var e=null,t=0;function n(){return e?.isConnected?{region:e,fresh:!1}:(e=document.createElement(`div`),e.className=`ff-toast`,e.setAttribute(`role`,`status`),document.body.append(e),{region:e,fresh:!0})}typeof document<`u`&&n();function r(e,r=!1){if(typeof document>`u`)return;let{region:i,fresh:a}=n(),o=()=>{i.textContent=e,i.classList.toggle(`is-failing`,r),i.classList.add(`is-shown`),clearTimeout(t),t=window.setTimeout(()=>i.classList.remove(`is-shown`),2200)};a?requestAnimationFrame(o):o()}export{r as t};
//# debugId=72b63619-2751-58a9-b41d-936d63179202
