var co = require('co');
var fabricservice = require('./fabricservice.js');
var express = require('express');

var app = express();

var cowid = "cow_001";
var machiningid = "machining_002";
var milk_bottle = "milk_bottle_002";

var cow_cc_name = "origin_dairyfarm";
var machining_cc_name = "origin_machining";
var milkbottle_cc_name = "origin_salesterminal";

//var channelid = "milkgen";
//for test 
app.get('/test',function(req,res){

	co(function *(){
		
		//logger.debug("daasdasdasdas");
		console.info("FOR TEST");
		res.send("test res!!!")
	}).catch((err)=>{
		res.send(err);
	})
});

app.get('/init',function(req,res){

	co(function *(){
		//logger.debug("daasdasdasdas");
		console.info("FOR TEST");
		var diaryfarminitresult = yield fabricservice.sendTransaction(cow_cc_name,"invoke",["putvalue",cowid,"food"]);
		var machininginitresult = yield fabricservice.sendTransaction(cow_cc_name,"invoke",["putvalue",machiningid,cowid]);
		var salesterminalinitresult = yield fabricservice.sendTransaction(cow_cc_name,"invoke",["putvalue",milk_bottle,machiningid]);

		for(let i = 0;i<chaincodequeryresult.length;i++) {
			
			res.send(diaryfarminitresult[i].toString('utf8'));
		}
		var jsonstr = JSON.stringify(chaincodequeryresult);
		res.send(jsonstr);
	}).catch((err)=>{
		res.send(err);
	})
});

//牛奶厂相关操作

app.get('/dairyfarm',function(req,res){

	co(function* () {
		var parm = req.query.parms;
		console.info("FOR TEST");
		var chaincodequeryresult = yield fabricservice.sendTransaction(cow_cc_name,"invoke",["putvalue",cowid,parm]);
		//console.info(chaincodequeryresult.length);
		/*for (let i=0;i<chaincodequeryresult.length;i++) {
			console.info("test");
			res.send(chaincodequeryresult[i].toString('utf8'));
		}*/
		
		var jsonstr = JSON.stringify(chaincodequeryresult);
		res.send(jsonstr);
	}).catch((err)=>{
		res.send(err);
	})
});


//加工车间相关操作

app.get('/machining',function(req,res){
	co(function*(){
		
		var parm = req.query.parms;

		var chaincodequeryresult = yield fabricservice.sendTransaction(machining_cc_name,"invoke",["putvalue",machiningid,parm]);

		for(let i=0;i<chaincodequeryresult.length;i++){

			res.send(chaincodequeryresult[i].toString('utf8'));
		}
		var jsonstr = JSON.stringify(chaincodequeryresult);
		res.send(jsonstr);
	}).catch((err)=>{
		res.send(err);
	})
});

//销售终端相关操作

app.get('/salesterminal',function(req,res){
	co(function*(){

		var parm = req.query.parms;

		var chaincodequeryresult = yield fabricservice.sendTransaction(milkbottle_cc_name,"invoke",["putvalue",milk_bottle,parm]);

		for (let i = 0;i<chaincodequeryresult.length;i++){
			res.send(chaincodequeryresult[i].toString('utf8'));
		}

		var jsonstr = JSON.stringify(chaincodequeryresult);
		res.send(jsonstr);
	}).catch((err)=>{
		res.send(err);
	})
});


//客户端查询牛奶的历史


app.get('/getmilkhistory',function(req,res){
	co(function*(){
		
		var chaincodequeryresult = yield fabricservice.queryCc(milkbottle_cc_name,"invoke",["getmilkhistory",milk_bottle,"a"]);

		for (let i = 0;i<chaincodequeryresult.length;i++){
			res.send(chaincodequeryresult[i].toString('utf8'));
		}
		var jsonstr = JSON.stringify(chaincodequeryresult);
		res.send(jsonstr);
	}).catch((err)=>{
		res.send(err);
	})
});

//启动服务
var server = app.listen(3000,function(){
	var host = server.address().address;
	var port = server.address().port;


	console.log('cow app listening at http://%s:%s',host,port);
});


//注册异常处理器

process.on('unhandledRejection',function(err){
	console.error(err.stack);
});

process.on('uncaughtException',console.error);
