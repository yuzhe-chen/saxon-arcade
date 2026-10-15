/* Saxon Arcade: stand-in for the Miniclip SDK (static.miniclipcdn.com no longer serves it). The game only uses it for
   analytics and a session id, so this keeps the same shape and sends nothing. */
(function(){
  var sid=(Date.now().toString(36)+Math.random().toString(36).slice(2,10));
  var session={_userId:null,_sessionId:sid,getSessionID:function(){return this._sessionId;},getUserID:function(){return this._userId;}};
  var handler={URL:'',onSuccess:null,setUserId:function(id){session._userId=id;},setSessionId:function(id){session._sessionId=id;}};
  var analytics={_handler:handler,os_info:navigator.platform||'',browser_info:navigator.userAgent||'',
    sendEvent:function(){},setEventName:function(){}};
  var SDK={namespace:'MCSDK',version:'1.5-stub',session:session,analytics:analytics,
    init:function(cfg,cb){var self=this;setTimeout(function(){if(cb)cb(self);},0);}};
  window.MCSDK=SDK;
  function ready(){if(typeof window.mcReady==='function')window.mcReady(SDK);}
  setTimeout(ready,0);
})();
