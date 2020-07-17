var port_path = `COM4`;
var dict_file_path = `decode-dict.json`;
var json_dict = null;

const SerialPort = require(`serialport`);
const Readline = require(`@serialport/parser-readline`);
const delay = require('delay');

const port = new SerialPort(port_path, {baudRate: 9600});

var test_string = `{0,16,~0,1,~1,1,~2,1,MO,"MC-780",ID,"0000000000000000",St,0,Da,"18/02/2019",TI,"17:35",Bt,0,GE,1,AG,28,Hm,167.0,Pt,0.5,Wk,87.3,FW,27.5,fW,24.0,MW,63.3,mW,60.0,sW,3,bW,3.3,wW,43.0,ww,49.3,wI,26.1,wO,16.9,wo,39.3,MI,31.3,Sw,61.4,OV,42.2,Sf,17.0,SM,48.3,IF,14,LP,102,rB,1831,rb,7661,rJ,6,rA,43,BA,1,BF,2,gF,0,gW,0.0,gf,0.0,gt,0.0,FR,24.4,fR,4.4,MR,13.7,mR,13.0,SR,2,sR,4,FL,24.5,fL,4.3,ML,13.1,mL,12.4,SL,2,sL,4,Fr,20.5,fr,0.8,Mr,3.0,mr,2.8,Sr,2,sr,2,Fl,21.6,fl,0.8,Ml,2.8,ml,2.6,Sl,2,sl,0,FT,30.9,fT,13.7,MT,30.7,mT,29.2,ST,2,sT,2,aH,0.0,cH,0.0,GH,608.1,HH,-35.6,RH,511.3,XH,-70.3,JH,443.7,KH,-65.4,LH,0.0,QH,0.0,iH,0.0,jH,0.0,aR,0.0,cR,0.0,GR,224.6,HR,-16.4,RR,176.9,XR,-28.6,JR,151.9,KR,-19.9,LR,0.0,QR,0.0,iR,0.0,jR,0.0,aL,0.0,cL,0.0,GL,234.3,HL,-17.8,RL,188.5,XL,-28.6,JL,163.7,KL,-20.1,LL,0.0,QL,0.0,iL,0.0,jL,0.0,ar,0.0,cr,0.0,Gr,337.2,Hr,-19.7,Rr,287.1,Xr,-37.2,Jr,253.1,Kr,-39.0,Lr,0.0,Qr,0.0,ir,0.0,jr,0.0,al,0.0,cl,0.0,Gl,346.3,Hl,-17.7,Rl,298.9,Xl,-37.9,Jl,263.0,Kl,-40.9,Ll,0.0,Ql,0.0,il,0.0,jl,0.0,aF,0.0,cF,0.0,GF,463.3,HF,-34.2,RF,367.8,XF,-57.0,JF,318.4,KF,-40.0,LF,0.0,QF,0.0,iF,0.0,jF,0.0,pH,-7.8,pR,-9.2,pL,-8.6,pr,-7.4,pl,-7.2,pF,-8.8,CS,B8`;

function openJSON(path) {
	var fs = require("fs");

	var contemp = fs.readFileSync(dict_file_path);
	console.log(`content : ${contemp}`);

	var content = new String(contemp);

	content = content.replace(/(\/\/)([^\/]+)(\/\/)/g, ``);

	var jsonDict = JSON.parse(content);

	//console.log(`JSON : ${JSON.stringify(jsonDict, null, 2)}`);
	
	return jsonDict;
}

function decode(line) {
	console.log(`line >> ${line}`);

	if(line.length < 10)
		return;

	for(var i in json_dict){

		// Regex
		var pattern = `(?<=${i},)([^,]*)`;
		var re = new RegExp(pattern, `g`);

		var result = `null`;
		var resultArr = line.match(re);
		if(resultArr.length > 0)
			result = resultArr[0];


		//	Adjust name gap length.
		var name = json_dict[i].name;
		while(name.length < 32) {
			name = `${name} `;
		}

		//	Adjust result position.
		var value = result;
		while(value.length < 8 && (json_dict[i].type == `int` || json_dict[i].type == `float`)) {
			var valArr = value.split(`.`);
			if(valArr[0].length < 6)
				value = ` ${value}`;
			else
				value = `${value} `;
		}

		if(json_dict[i].type == `string-index`) {
			value = json_dict[i].dict[result];
		}

		//	Create unit string.
		var unit = ``;
		if(json_dict[i].hasOwnProperty(`unit`))
			unit = json_dict[i].unit;

		//	Print out.
		console.log(`${name} : ${value} ${unit}`);
	}
}

async function main() {
	json_dict = openJSON(dict_file_path);
	console.log(`init() complete.`);

	const parser = new Readline();
	port.pipe(parser);

	parser.on(`data`, line => onSerial(line));
	//decode(test_string);
	//return ;

	await portwrite(`.\n`);
	await portwrite(`.\n`);
	await portwrite(`.\n`);
	await portwrite(`.\n`);

	await portwrite(`M0\n`);

	await portwrite(`q\n`);

	await portwrite(`Q\n`);

	await portwrite(`M1\n`);

	await portwrite(`D00.5\n`);

	await portwrite(`D11\n`);

	await portwrite(`D20\n`);

	await portwrite(`D3167\n`);

	await portwrite(`D428\n`);

	await portwrite(`G\n`);
}

var flag = false;
var respond = null;

function onSerial(str){
	decode(str);
	flag = false;
}

function portwrite(str){
	var stt = str.replace(`\n`, ``);
	console.log(`send > ${stt}`);

	return new Promise( async function(resolve, reject) {
		flag = true;
		port.write(str);

		while(flag){
			await delay(100);
		}

		resolve(true);
	});
}

main();