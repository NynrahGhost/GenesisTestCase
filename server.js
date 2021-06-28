//Dependencies
const express = require('express');
const https = require( "https" );
const cookieParser = require('cookie-parser');
const fs = require("fs");
const path = require('path');
const crypto = require('crypto');

//Server data & static variables
var app = express();
var options = JSON.parse(fs.readFileSync("options.json"));
var dataBase = JSON.parse(fs.readFileSync("data.json"));
var dataBaseUpdated = false;
var tokens = [];
var tokensTimestamps = [];

app.use(cookieParser());

httpsOptions = {
    key: fs.readFileSync("localhost.key"),
    cert: fs.readFileSync("localhost.crt")
}

https.createServer(httpsOptions, app).listen(8080);


//Routes
	// /btcRate
app.get('/btcRate', async function(req, res) {
	if(req.cookies !== null) {
		if(tokens.includes(req.cookies['token'])) {
			try {
				let btcRate = await getRate();
				res.type('application/json');
				res.send({rate: btcRate});
			} catch (error) {
				console.log(error);
				res.status(500).send('Internal server error!');
			}
		} else {
			res.status(401);
			res.send("Not authorized!");
		}
	} else {
		res.status(401);
		res.send("Not authorized!");
	}
});

	// /user/login
app.post('/user/login', function(req, res) {	
	if(req.query.email in dataBase) {
		if(crypto.createHash('sha256').update(req.query.password).digest('hex') === dataBase[req.query.email]) {
			let token = crypto.randomBytes(64).toString('hex');
			tokens.push(token);
			tokensTimestamps.push(Date.now() + options.tokenLifespan);
			res.cookie('token', token, {path: '/', maxAge: options.tokenLifespan, httpOnly: true, secure: true});
			res.send('Logged in succesfully!');
		} else {
			res.send("Invalid email or password!");
		}
	} else {
		res.send("Invalid email or password!");
	}
});

	// /user/create
app.put('/user/create', function(req, res) {
	if(req.query.email in dataBase) {
		res.send("Email already registered!");
	} else {
		dataBase[req.query.email] = crypto.createHash('sha256').update(req.query.password).digest('hex');
		dataBaseUpdated = true;
		res.send("Email registered succesfully!");
	}
});

//functions
function getRate() {
	return new Promise((resolve, reject) => {
		let httpsOptions = {
			"method": "GET",
			"hostname": "rest.coinapi.io",
			"path": "/v1/exchangerate/BTC/UAH",
			"headers": {'X-CoinAPI-Key': options.CoinApiKey}
		};
	
		let result = [];
		
		let request = https.request(httpsOptions, function (response) {
			response.on("data", function (chunk) {
				result += chunk;
			});
			
			response.on("end", function (chunk) {
				resolve(JSON.parse(result).rate);
			});
			
			response.on('error', function (error) {
				console.error(error);
				reject(error);
			});
		});
		
		request.end();
	})
}

async function updateDataBase() {
	if(dataBaseUpdated) {
		dataBaseUpdated = false;
		fs.writeFileSync("data.json", JSON.stringify(dataBase));
	}
	setTimeout(updateDataBase, options.dataBaseRefreshRate);
}

async function refreshTokens() {
	
	let time = Date.now();
			
	switch(tokens.length) {
		case 0:
			break;
		case 1:
			if(tokensTimestamps[0] < time) {
				tokensTimestamps = [];
				tokens = [];
				break;
			}
			break;
		default:
			let middle = tokens.length - 1;
			if(tokensTimestamps[middle] < time) {
				tokensTimestamps = [];
				tokens = [];
				break;
			}
			while(true) {
				middle >>= 1;
				if(tokensTimestamps[middle] < time) {
					tokensTimestamps.slice(middle);
					tokens.slice(middle);
					break;
				}
				if(middle <= 0) {
					break;
				}
			}
			break;
	}
	setTimeout(refreshTokens, options.tokensRefreshRate);
}

//Start background process
updateDataBase();
refreshTokens();