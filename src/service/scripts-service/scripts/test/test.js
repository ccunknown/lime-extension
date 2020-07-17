const BrewSerial = require(`./test2`);

var brew = new BrewSerial(`COM4`, 9600);

console.log(`Construction Complete.`);

brew.setData({
	d0: 0.5,
	d1: 1,
	d2: 0,
	d3: 167.5,
	d4: 28,
	d5: `1234`
});

brew.start();