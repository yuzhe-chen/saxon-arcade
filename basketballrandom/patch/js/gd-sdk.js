/* local stand-in for the GameDistribution SDK: no ads, rewarded ads grant at once */
(function(){var o=window.GD_OPTIONS||{};function ev(n){try{o.onEvent&&o.onEvent({name:n,message:'',status:'success'})}catch(e){}}
window.gdsdk={showAd:function(t){ev('SDK_GAME_PAUSE');return new Promise(function(r){setTimeout(function(){if(t==='rewarded')ev('COMPLETE');ev('SDK_GAME_START');r();},0)});},
 preloadAd:function(){return Promise.resolve()},cancelAd:function(){return Promise.resolve()},openConsole:function(){},AdType:{Interstitial:'interstitial',Rewarded:'rewarded'}};
setTimeout(function(){ev('SDK_READY')},0);})();
