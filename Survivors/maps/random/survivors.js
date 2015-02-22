// Find all hills
var noise0 = new Noise2D(20);
for (var ix = 0; ix < mapSize; ix++)
{
	for (var iz = 0; iz < mapSize; iz++)
	{
		var h = getHeight(ix,iz);
		if(h > 40){
			addToClass(ix,iz,clHill);
			
			// Add hill noise
			var x = ix / (mapSize + 1.0);
			var z = iz / (mapSize + 1.0);
			var n = (noise0.get(x,z) - 0.5) * 40;
			setHeight(ix, iz, h + n);
		}
	}
}