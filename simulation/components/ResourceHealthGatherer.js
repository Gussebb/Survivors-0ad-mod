function ResourceHealthGatherer() {}

ResourceHealthGatherer.prototype.Schema =
	"<a:help>Lets the unit gather resources from entities that have the ResourceSupply component.</a:help>" +
	"<a:example>" +
		"<MaxDistance>2.0</MaxDistance>" +
		"<BaseSpeed>1.0</BaseSpeed>" +
		"<Rates>" +
			"<food.fish>1</food.fish>" +
			"<metal.ore>3</metal.ore>" +
			"<stone.rock>3</stone.rock>" +
			"<wood.tree>2</wood.tree>" +
		"</Rates>" +
	"</a:example>" +
	"<element name='MaxDistance' a:help='Max resource-gathering distance'>" +
		"<ref name='positiveDecimal'/>" +
	"</element>" +
	"<element name='BaseSpeed' a:help='Base resource-gathering rate (in resource units per second)'>" +
		"<ref name='positiveDecimal'/>" +
	"</element>" +
	"<element name='Rates' a:help='Per-resource-type gather rate multipliers. If a resource type is not specified then it cannot be gathered by this unit'>" +
		"<interleave>" +
			"<optional><element name='food' a:help='Food gather rate (may be overridden by \"food.*\" subtypes)'><ref name='positiveDecimal'/></element></optional>" +
			"<optional><element name='wood' a:help='Wood gather rate'><ref name='positiveDecimal'/></element></optional>" +
			"<optional><element name='stone' a:help='Stone gather rate'><ref name='positiveDecimal'/></element></optional>" +
			"<optional><element name='metal' a:help='Metal gather rate'><ref name='positiveDecimal'/></element></optional>" +
			"<optional><element name='treasure' a:help='Treasure gather rate (only presense on value makes sense, size is only used to determine the delay before gathering, so it should be set to 1)'><ref name='positiveDecimal'/></element></optional>" +
			"<optional><element name='food.fish' a:help='Fish gather rate (overrides \"food\")'><ref name='positiveDecimal'/></element></optional>" +
			"<optional><element name='food.fruit' a:help='Fruit gather rate (overrides \"food\")'><ref name='positiveDecimal'/></element></optional>" +
			"<optional><element name='food.grain' a:help='Grain gather rate (overrides \"food\")'><ref name='positiveDecimal'/></element></optional>" +
			"<optional><element name='food.meat' a:help='Meat gather rate (overrides \"food\")'><ref name='positiveDecimal'/></element></optional>" +
			"<optional><element name='food.milk' a:help='Milk gather rate (overrides \"food\")'><ref name='positiveDecimal'/></element></optional>" +
			"<optional><element name='wood.tree' a:help='Tree gather rate (overrides \"wood\")'><ref name='positiveDecimal'/></element></optional>" +
			"<optional><element name='wood.ruins' a:help='Tree gather rate (overrides \"wood\")'><ref name='positiveDecimal'/></element></optional>" +
			"<optional><element name='stone.rock' a:help='Rock gather rate (overrides \"stone\")'><ref name='positiveDecimal'/></element></optional>" +
			"<optional><element name='stone.ruins' a:help='Rock gather rate (overrides \"stone\")'><ref name='positiveDecimal'/></element></optional>" +
			"<optional><element name='metal.ore' a:help='Ore gather rate (overrides \"metal\")'><ref name='positiveDecimal'/></element></optional>" +
			"<optional><element name='treasure.food' a:help='Food treasure gather rate (overrides \"treasure\")'><ref name='positiveDecimal'/></element></optional>" +
			"<optional><element name='treasure.wood' a:help='Wood treasure gather rate (overrides \"treasure\")'><ref name='positiveDecimal'/></element></optional>" +
			"<optional><element name='treasure.stone' a:help='Stone treasure gather rate (overrides \"treasure\")'><ref name='positiveDecimal'/></element></optional>" +
			"<optional><element name='treasure.metal' a:help='Metal treasure gather rate (overrides \"treasure\")'><ref name='positiveDecimal'/></element></optional>" +
		"</interleave>" +
	"</element>";

ResourceHealthGatherer.prototype.Init = function()
{
};

ResourceHealthGatherer.prototype.GetCarryingStatus = function()
{
	return [];
};

ResourceHealthGatherer.prototype.GiveResources = function(resources)
{
};

ResourceHealthGatherer.prototype.GetMainCarryingType = function()
{
	return undefined;
};

ResourceHealthGatherer.prototype.GetLastCarriedType = function()
{
	return undefined;
};

ResourceHealthGatherer.prototype.GetBaseSpeed = function()
{
	let cmpPlayer = QueryOwnerInterface(this.entity, IID_Player);
	let multiplier = cmpPlayer ? cmpPlayer.GetGatherRateMultiplier() : 1;
	return multiplier * ApplyValueModificationsToEntity("ResourceHealthGatherer/BaseSpeed", +this.template.BaseSpeed, this.entity);
};

ResourceHealthGatherer.prototype.GetGatherRates = function()
{
	let ret = {};
	let baseSpeed = this.GetBaseSpeed();

	for (let r in this.template.Rates)
	{
		let rate = ApplyValueModificationsToEntity("ResourceHealthGatherer/Rates/" + r, +this.template.Rates[r], this.entity);
		ret[r] = rate * baseSpeed;
	}

	return ret;
};

ResourceHealthGatherer.prototype.GetGatherRate = function(resourceType)
{
	if (!this.template.Rates[resourceType])
		return 0;

	let baseSpeed = this.GetBaseSpeed();
	let rate = ApplyValueModificationsToEntity("ResourceHealthGatherer/Rates/" + resourceType, +this.template.Rates[resourceType], this.entity);
	return rate * baseSpeed;
};

ResourceHealthGatherer.prototype.GetCapacity = function(resourceType)
{
// TODO likely breaks UnitAI
	//if(!this.template.Capacities[resourceType])
	return 0;
};

ResourceHealthGatherer.prototype.GetRange = function()
{
	return { "max": +this.template.MaxDistance, "min": 0 };
	// maybe this should depend on the unit or target or something?
};

/**
 * Try to gather treasure
 * @return 'true' if treasure is successfully gathered and 'false' in the other case
 */
ResourceHealthGatherer.prototype.TryInstantGather = function(target)
{
	let cmpResourceSupply = Engine.QueryInterface(target, IID_ResourceSupply);
	let type = cmpResourceSupply.GetType();

	if (type.generic != "treasure")
		return false;

	let status = cmpResourceSupply.TakeResources(cmpResourceSupply.GetCurrentAmount());

	let cmpHealth = QueryInterface(this.entity, IID_Health);
	if (cmpHealth)
		cmpHealth.Increase(status.amount);

	let cmpStatisticsTracker = QueryOwnerInterface(this.entity, IID_StatisticsTracker);
	if (cmpStatisticsTracker)
		cmpStatisticsTracker.IncreaseTreasuresCollectedCounter();

	let cmpPlayer = QueryOwnerInterface(this.entity, IID_Player);
	let cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);  
	if (cmpTrigger && cmpPlayer) 
		cmpTrigger.CallEvent("TreasureCollected", {"player": cmpPlayer.GetPlayerID(), "type": type.specific, "amount": status.amount });  

	return true;
};

/**
 * Gather from the target entity. This should only be called after a successful range check,
 * and if the target has a compatible ResourceSupply.
 * Call interval will be determined by gather rate, so always gather 1 amount when called.
 */
ResourceHealthGatherer.prototype.PerformGather = function(target)
{
	if (!this.GetTargetGatherRate(target))
		return { "exhausted": true };

	let gatherAmount = 1;

	let cmpResourceSupply = Engine.QueryInterface(target, IID_ResourceSupply);
	let type = cmpResourceSupply.GetType();

	// Find the maximum so we won't exceed our capacity
	let status = cmpResourceSupply.TakeResources(gatherAmount);

	let cmpHealth = QueryInterface(this.entity, IID_Health);
	if (cmpHealth)
		cmpHealth.Increase(status.amount);

	// Update stats of how much the player collected.
	// (We have to do it here rather than at the dropsite, because we
	// need to know what subtype it was)
	let cmpStatisticsTracker = QueryOwnerInterface(this.entity, IID_StatisticsTracker);
	if (cmpStatisticsTracker)
		cmpStatisticsTracker.IncreaseResourceGatheredCounter(type.generic, status.amount, type.specific);

	// Tell the target we're gathering from it
	Engine.PostMessage(target, MT_ResourceGather,
		{ "entity": target, "gatherer": this.entity });

	return {
		"amount": status.amount,
		"exhausted": status.exhausted,
		"filled": false
	};
};

/**
 * Compute the amount of resources collected per second from the target.
 * Returns 0 if resources cannot be collected (e.g. the target doesn't
 * exist, or is the wrong type).
 */
ResourceHealthGatherer.prototype.GetTargetGatherRate = function(target)
{
	let type;
	let cmpResourceSupply = Engine.QueryInterface(target, IID_ResourceSupply);
	let cmpMirage = Engine.QueryInterface(target, IID_Mirage);
	if (cmpResourceSupply)
		type = cmpResourceSupply.GetType();
	else if (cmpMirage && cmpMirage.ResourceSupply())
		type = cmpMirage.GetType();
	else
		return 0;

	let rate = 0;
	if (type.specific)
		rate = this.GetGatherRate(type.generic+"."+type.specific);
	if (rate == 0 && type.generic)
		rate = this.GetGatherRate(type.generic);

	let cmpPlayer = QueryOwnerInterface(this.entity, IID_Player);
	let cheatMultiplier = cmpPlayer ? cmpPlayer.GetCheatTimeMultiplier() : 1;
	rate = rate / cheatMultiplier;

	return rate;
};

ResourceHealthGatherer.prototype.CanCarryMore = function(type)
{
	return true;
};

ResourceHealthGatherer.prototype.IsCarryingAnythingExcept = function(exceptedType)
{
	return false;
};

ResourceHealthGatherer.prototype.CommitResources = function(types)
{
};

ResourceHealthGatherer.prototype.DropResources = function()
{
};

Engine.RegisterComponentType(IID_ResourceGatherer, "ResourceHealthGatherer", ResourceHealthGatherer);
