
var port_path = `COM4`;
var dict_file_path = `decode-dict.json`;
//var decode_dict = null;

const SerialPort = require(`serialPort`);
const Readline = require(`@serialport/parser-readline`);
const delay = require(`delay`);

var serial_flag = false;
//var serial;

class serialTanita {

	constructor(port, baudrate) {
		this.decode_dict = jsonOpenDecodeStructure(dict_file_path);
		this.serialInit(port, baudrate);
	}

	serialInit(port, baudrate) {
		this.serialInfo = {};
		this.serialInfo.port = port;
		this.serialInfo.baudrate = baudrate;

		this.serial = new SerialPort(this.serialInfo.port, {baudRate : this.serialInfo.baudrate});

		this.parser = new Readline();
		this.serial.pipe(this.parser);

		this.parser.on(`data`, line => this.onSerial(line));
	}

	setData(data) {
		this.data = data;
	}

	async start() {
		await this.send(`.\n`);
		await this.send(`.\n`);
		await this.send(`.\n`);
		await this.send(`.\n`);

		await this.send(`M0\n`);

		await this.send(`q\n`);

		await this.send(`Q\n`);

		await this.send(`M1\n`);

		await this.send(`D0${this.data.d0}\n`);

		await this.send(`D1${this.data.d1}\n`);

		await this.send(`D2${this.data.d2}\n`);

		await this.send(`D3${this.data.d3}\n`);

		await this.send(`D4${this.data.d4}\n`);

		await this.send(`D5${this.data.d5}\n`);

		await this.send(`G\n`);
	}

	onSerial(str){
		console.log(`on Serial >> ${str}`);
		this.decode(str);
		serial_flag = false;
	}

	send(cmd) {
		//var str = cmd.replace(`\n`, ``);
		var str = cmd;
		console.log(`send > ${str}`);

		var serial = this.serial;

		return new Promise( async function(resolve, reject) {
			serial_flag = true;
			serial.write(str);

			while(serial_flag){
				console.log(`before delay`);
				await delay(100);
			}

			resolve(true);
		});
	}

	decode(encrypted_msg) {
		//console.log(`encrypted message : ${encrypted_msg}`);

		if(encrypted_msg.length < 10)
			return ;

		var resultObj = {};

		for(var i in this.decode_dict) {

			// Regex
			var pattern = `(?<=${i},)([^,]*)`;
			var re = new RegExp(pattern, `g`);

			var value = `null`;
			var valueArr = encrypted_msg.match(re);
			if(valueArr.length > 0)
				value = valueArr[0];
			
			if(this.decode_dict[i].type == `string-index`) {
				value = this.decode_dict[i].dict[value];
			}

			resultObj[this.decode_dict[i].name] = {};
			if(this.decode_dict[i].type == `int`)
				resultObj[this.decode_dict[i].name].value = parseInt(value);
			else if(this.decode_dict[i].type == `float`)
				resultObj[this.decode_dict[i].name].value = parseFloat(value);
			else
				resultObj[this.decode_dict[i].name].value = value;
			if(this.decode_dict[i].hasOwnProperty(`unit`))
				resultObj[this.decode_dict[i].name].unit = this.decode_dict[i].unit;

			//	Adjust name gap length.
			var name = this.decode_dict[i].name;
			while(name.length < 32) {
				name = `${name} `;
			}

			//	Adjust position.
			while(value.length < 8 && (this.decode_dict[i].type == `int` || this.decode_dict[i].type == `float`)) {
				var valArr = value.split(`.`);
				if(valArr[0].length < 6)
					value = ` ${value}`;
				else
					value = `${value} `;
			}

			//	Create unit string.
			var unit = ``;
			if(this.decode_dict[i].hasOwnProperty(`unit`))
				unit = this.decode_dict[i].unit;

			//	Print out.
			//console.log(`${name} : ${value} ${unit}`);
		}
		this.resultObj = resultObj;
		console.log(`result object : ${JSON.stringify(resultObj, null, 2)}`);
	}
}

function jsonOpenDecodeStructure(path) {

	var fs = require("fs");

	var contemp = fs.readFileSync(path);
	//console.log(`content : ${contemp}`);

	var content = new String(contemp);

	content = content.replace(/(\/\/)([^\/]+)(\/\/)/g, ``);

	var jsonDict = JSON.parse(content);

	//console.log(`JSON : ${JSON.stringify(jsonDict, null, 2)}`);
	
	return jsonDict;
}

module.exports = serialTanita;