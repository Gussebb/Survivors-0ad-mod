function AddPlayerResources(PlayerID, resources) {
	var cmpPlayer = TriggerHelper.GetPlayerComponent(PlayerID);
	
	for(var type in resources) {
		var resource = cmpPlayer.GetResourceCounts()[type];
		
		if ((resources[type] < 0) && (-resources[type] > resource))
			resources[type] = -resource;
		
		cmpPlayer.AddResource(type, resources[type]);
	}
}
