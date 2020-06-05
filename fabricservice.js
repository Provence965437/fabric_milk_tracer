var path = require('path');
var fs = require('fs');
var util = require('util');
var hfc = require('fabric-client');
var Peer = require('fabric-client/lib/Peer.js');
var EventHub = require('fabric-client/lib/ChannelEventHub.js');
var User = require('fabric-client/lib/User.js');
var crypto = require('crypto');
var FabricCAService = require('fabric-ca-client');

//
var log4js = require('log4js');
var logger = log4js.getLogger();
logger.level = "debug";

var channelid = "milkgen";

var tempdir = "/home/gopath/src/github.com/hyperledger/cow/nodejs/fabric-sdk-node-master/fabric-client-kvs";

let client = new hfc();
var channel = client.newChannel(channelid);
var order = client.newOrderer('grpc://127.0.0.1:7050');
channel.addOrderer(order);

var peer1 = client.newPeer('grpc://127.0.0.1:7051')
var peer2 = client.newPeer('grpc://127.0.0.1:8051')
var peer3 = client.newPeer('grpc://127.0.0.1:9051')
channel.addPeer(peer1);
channel.addPeer(peer2);
channel.addPeer(peer3);

var queryCc = function (chaincodeid,func,chaincode_args) {
	return getOrgUser4Local().then((user)=>{
		
		tx_id = client.newTransactionID();
		
		var request = {

			chaincodeId: chaincodeid,
			fcn: func,
			args: chaincode_args,
			txId: tx_id
		};
		console.log(request);
		
		return channel.queryByChaincode(request,peer1);

	},(err)=>{
		console.log('error',e);

	}).then((sendtransresult)=>{
		console.log("dasdasd");
		console.log(sendtransresult);
		return sendtransresult;

	},(err)=>{
		console.log('error',e);
	});
}

var sendTransaction = function (chaincodeid,func,chaincode_args){
	
	var tx_id = null;
		
	return getOrgUser4Local().then((user)=>{
		tx_id = client.newTransactionID();	
		var request = {

			chaincodeId: chaincodeid,
			fcn: func,
			args: chaincode_args,
			chainId: channelid,
			txId: tx_id
		};
		console.log(request);
		return channel.sendTransactionProposal(request);
	},(err)=>{
		console.log('error',e);
	}).then((chaincodeinvokresult)=>{
		var proposalResponses = chaincodeinvokresult[0];
		var proposal = chaincodeinvokresult[1];
		var header = chaincodeinvokresult[2];
		var all_good = true;

		for(var i in proposalResponses) {
			let one_good = false;
			if(proposalResponses && proposalResponses[0].response&&proposalResponses[0].response.status === 200){
				one_good = true;
				console.info('transaction proposal was good');

			}else{
				console.error('transaction proposal was bad');
			}
			all_good = all_good&one_good;
		}
		if(all_good){
			console.info(util.format(
				'Successfully sent Proposal and received ProposalResponse: Status - %s,message - "%s",metadata - "%s",endorsement signature:%s',
				proposalResponses[0].response.status,proposalResponses[0].response.message,
				proposalResponses[0].response.payload,
				proposalResponses[0].endorsement.signature));

			var request = {
				proposalResponses: proposalResponses,
				proposal: proposal,
				header: header
			};
			
			var transactionID = tx_id.getTransactionID();
			return channel.sendTransaction(request);
		}
	},(err)=>{
		console.log('error',e);
	}).then((sendtransresult)=>{
		return sendtransresult;
	},(err)=>{
		console.log('error',e);
	});
}

function getOrgUser4Local(){
	
	var keyPath = "/home/gopath/src/github.com/hyperledger/cow/crypto-config/peerOrganizations/org1.cow.com/users/Admin@org1.cow.com/msp/keystore";
	
	//var keyPEM = Buffer.from(readAllFiles(keyPath)[0]).toString();
	//var keyPEM = "/home/gopath/src/github.com/hyperledger/cow/crypto-config/peerOrganizations/org1.cow.com/users/Admin@org1.cow.com/msp/keystore/priv_sk";
	var keyPEM = "-----BEGIN PRIVATE KEY-----\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgwrZTJ9uoPcU1Gvr3\nteSyPOB0Z5p6xBbnhBTsIUMmcVChRANCAARCTpqoZjAZljiiWOUdxKjbSdulu1I0\nC0Ru83vED+ZVrqnjbrvo1XM5vbf6QtIboCcJXTt1Q0uMmbB/YGtLvZbY\n-----END PRIVATE KEY-----"
	var certPath = "/home/gopath/src/github.com/hyperledger/cow/crypto-config/peerOrganizations/org1.cow.com/users/Admin@org1.cow.com/msp/signcerts";
	//var certPEM = readAllFiles(certPath)[0].toString();
	var certPEM = "/home/gopath/src/github.com/hyperledger/cow/crypto-config/peerOrganizations/org1.cow.com/users/Admin@org1.cow.com/msp/signcerts/Admin@org1.cow.com-cert.pem";
	var certPEM = "-----BEGIN CERTIFICATE-----\nMIICDTCCAbSgAwIBAgIRAPzM6zCN0fPlmgf2NeMgnjYwCgYIKoZIzj0EAwIwazEL\nMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBG\ncmFuY2lzY28xFTATBgNVBAoTDG9yZzEuY293LmNvbTEYMBYGA1UEAxMPY2Eub3Jn\nMS5jb3cuY29tMB4XDTIwMDUxOTEzNDEwMFoXDTMwMDUxNzEzNDEwMFowVzELMAkG\nA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFjAUBgNVBAcTDVNhbiBGcmFu\nY2lzY28xGzAZBgNVBAMMEkFkbWluQG9yZzEuY293LmNvbTBZMBMGByqGSM49AgEG\nCCqGSM49AwEHA0IABEJOmqhmMBmWOKJY5R3EqNtJ26W7UjQLRG7ze8QP5lWuqeNu\nu+jVczm9t/pC0hugJwldO3VDS4yZsH9ga0u9ltijTTBLMA4GA1UdDwEB/wQEAwIH\ngDAMBgNVHRMBAf8EAjAAMCsGA1UdIwQkMCKAICEjqFB5hX+pmGwqJYztB63LI9nx\nk/OPaa71jt9lZz3QMAoGCCqGSM49BAMCA0cAMEQCIAV7w7kNvemcTVQyKeYX4823\nE2BqClcweY29sWtKekS4AiAsXnpA0dfOebXLv1j6/nD6SxQzd0g77tbtBOu9x2PH\nBA==\n-----END CERTIFICATE-----"

	var useropt = {
		username: 'user87',
		mspid: 'Org1MSP',
		cryptoContent: {
			privateKeyPEM: keyPEM,
			signedCertPEM: certPEM
		}
	}
	
	return hfc.newDefaultKeyValueStore({
		path:tempdir
	}).then((store)=>{
		 client.setStateStore(store); 
		//console.log("1111111");
		//client.createUser(useropt);
		//console.log("11111");
		return client.createUser(useropt);

	});
};

function readAllFiles(dir) {
	console.info(keyPath);
	var files = fs.readdirSync(dir);
	var certs = [];
	files.forEach((file_name)=>{
		let file_path = path.join(dir.file_name);
		let data = fs.readFileSync(file_path);
		certs.push(data);
	});
	return certs;
}

exports.sendTransaction = sendTransaction;
exports.queryCc = queryCc;1
