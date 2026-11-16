


const scriptsInEvents = {

	async Rhmapi_Event1_Act1(runtime, localVars)
	{
		CallInterstitialAds();
	},

	async Rhmapi_Event2_Act1(runtime, localVars)
	{
		CallRewardedAds();
	},

	async Rhmapi_Event13_Act1(runtime, localVars)
	{
		initSDK();
	}

};

self.C3.ScriptsInEvents = scriptsInEvents;

