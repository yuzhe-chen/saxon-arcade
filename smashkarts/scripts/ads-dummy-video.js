"use strict";
/* no video ads: interstitials finish at once and rewarded ads grant their reward right away */
function showInterstitial(){if(isVideoAdPlaying)return;isVideoAdPlaying=!0;interstitialStart(!1);setTimeout(function(){interstitialComplete(!1)},30)}
function tryInitRewardedInterstitial(){setTimeout(function(){window.unityGame&&window.unityGame.SendMessage(unityFirebaseGameOjbectName,"RewardedInterstitialAvailable")},0)}
function tryShowRewardedInterstitial(){if(isVideoAdPlaying)return;isVideoAdPlaying=!0;interstitialStart(!0);setTimeout(function(){interstitialComplete(!0);tryInitRewardedInterstitial()},30)}
