var userModel = require('./modal');
var nodemailer = require('nodemailer');
let userController = {};
var vcardparser = require('vcardparser');
var vCardsJS = require('vcards-js');
const { exec } = require('child_process');
var cmd = require('node-cmd');
const fs = require('fs');
var request = require('request');
var FormData = require('form-data');
const readline = require('readline');
const {google} = require('googleapis');
const https = require('https');
var vcard = require('vcard-json');


let otp = Math.floor(100000 + Math.random() * 900000)



userController.addUser = function (req, res) {
	console.log(req.body);
	entered_email = req.body.email;
	console.log(req.body.email);
	userModel.findOne({ email: entered_email }, function (err, foundEmail) {
		if (foundEmail) {
			res.status(402).send("Email already registered");
		} else {
			var user = new userModel(req.body);
			console.log("from server", req.body);
			user.save(function (err, savedUser) {
				console.log("User saved", savedUser);
				res.send(savedUser)
			})

		}
	})
	console.log(req.body);
}

userController.logIn = function (req, res) {
	console.log('======', req.body);
	console.log("server entered email", req.body.email);
	console.log("server entered email", req.body.password);
	userModel.findOne({ email: req.body.email }, function (err, foundUser) {
		if (foundUser) {
			console.log("password", foundUser.password);
			if (foundUser.password == req.body.password) {
				res.status(200).send("Logged In success");
			}
			else {
				res.status(402).send("Unauthorizes Access")
				console.log("Wrong password");
			}
		} else {
			res.status(404).send("Email Not Found");
		}
	})
}

userController.sendEmail = function (req, res) {
	var email = req.body.email;
	console.log("email", req.body.email);
	let transporter = nodemailer.createTransport({
		service: 'gmail',
		secure: 'false',
		port: 25,
		auth: {
			user: 'reactNativeAppSync@gmail.com',
			pass: 'raoinfotech'
		},
		tls: {
			rejectUnauthorized: false
		}
	});

	let HelperOptions = {
		from: '"Sync" <reactNativeAppSync@gmail.com',
		to: email,
		subject: 'Password Recovery Email',
		text: 'Your OTP is ' + otp
	};

	transporter.sendMail(HelperOptions, (error, info) => {
		if (error) {
			console.log(error);
		}
		console.log('success');
		console.log(info);
	});

}

userController.checkOTP = function (req, res) {
	if (req.body.otp == otp) {
		res.status(200).send('OK')
	} else {
		res.status(500).send('wrong')
	}
}

userController.changePassword = function (req, res) {
	var email = req.body.email;
	var password = req.body.password


	userModel.findOneAndUpdate({ email: req.body.email }, { $set: { password: req.body.password } }, { upsert: true }, function (err, updatedUser) {
		if (updatedUser) {
			res.status(200).send(updatedUser)
		} else {
			res.status(500).send(err)
		}
	});
}

userController.createFile = function (req, res) {
	console.log("call===========server")
	let name = []
	let number = []
	const path = require('path');
	
	for (let i = 0; i < req.body.length; i++) {
		name = req.body[i].name;
		number = req.body[i].number;
		var vCard = vCardsJS();
		vCard.firstName = name
		vCard.cellPhone = number
		vCard.saveToFile('./contacts/' + name + '.vcf');
	}
	cmd.get('cat ./contacts/*.vcf > ./all.vcf', function (err, data, stderr) {
		console.log('done======');
	})
	res.status(200).send();
}


userController.uploadToDrive = function (req, res) {
	console.log(":::::::::::::::::::::::::::::::::::::::::::::", req.body)
	token = req.body.token;
	console.log("token", token);
	
	const oauth2Client = new google.auth.OAuth2('587952985192-jljuov8sjk2i2a1fi52rfi9f5b5sbi3a.apps.googleusercontent.com');
	oauth2Client.setCredentials({
		  refresh_token: '1//0gf5SKvM8qNJBCgYIARAAGBASNwF-L9Ir2NagVZ_dE0Uyf-yZuKEqcUdei1CKTObgljduqaVpj8n0PM9fmQSMuDJwh5A4pT3e0ac',
		  access_token: 'ya29.a0AfH6SMCxsO4vyr1bW6py0A_8gg6RbQFh4Eovd7vz5f4heZoDZGz9kPxWE2XmDU_w51fytr46REsdAaz6m8ZbXn3EYeiSGXeW7UDhSZgYDryFyrUnsPyvG7qnl0XGbelOYRGGQGBUaosawbX0HJiM6QrA9CD68cEZmSg',
	});
	const drive = google.drive({ version: 'v3', auth: oauth2Client });

	var fileMetadata = {
		'name': 'all.vcf'
	  };
	  var media = {
		mimeType: 'text/x-vcard\r\n',
		body: fs.createReadStream('./all.vcf')
	  };
	  drive.files.create({
		resource: fileMetadata,
		media: media,
		fields: 'id'
	  }, function (err, file) {
		if (err) {
			console.log("err", err);
		} else {
			console.log('Upload',file);
			res.status(200).send()
			fs.readdir('./contacts', function (err, files) {

				var removefiles = function (file) {
					fs.unlinkSync('./contacts/' + file)
				}
				files.forEach(function (file) {
					removefiles(file)
				})

			})
		}
	  });
	  
	// console.log("=======================", formData)
	// request({
	// 	headers: {
	// 		'Authorization': token
	// 	},
	// 	uri: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
	// 	body: formData,
	// 	method: 'POST'
	// }, function (err, resp, body) {
	// 	console.log("body============", body)
	// 	if (err) {
	// 		console.log("err", err);
	// 	} else {
	// 		console.log('resp');
	// 		res.status(200).send()
	// 		fs.readdir('./contacts', function (err, files) {

	// 			var removefiles = function (file) {
	// 				fs.unlinkSync('./contacts/' + file)
	// 			}
	// 			files.forEach(function (file) {
	// 				removefiles(file)
	// 			})

	// 		})
	// 	}
	// });
}

userController.readVCF = function (req, res) {
	console.log('reading...');
	content = req.body.content;
	vcardparser.parseString(content, function (err, json) {
		if (err)
			return console.log(err);
		console.log(json);
		res.send(json);
	});
}

module.exports = userController;
