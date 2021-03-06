﻿"use strict";
var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var request = require("request"),
    fs = require("fs");
var sendJSONresponse = function (res, status, content) {
    res.status(status);
    res.json(content);
};


module.exports.register = function(req, res) {
    // console.log("!!!!!");
    // console.log(req.body);
    if (!req.body.name || !req.body.email || !req.body.password || !req.body.authority ||!req.body.module) {
        console.log("name", req.body.name);
        console.log("email", req.body.email);
        console.log("password", req.body.password);
        sendJSONresponse(res, 400, { message: "请完成所有字段" });
        return;
    }

    /*var HasUser=false;
    User.findOne({"email":req.body.email}).exec(function(err,doc){
        HasUser=true;
    });
    if(HasUser){
        sendJSONresponse(res,400,{message:"邮箱已被注册"});
        return;
    }*/

    var user = new User();
    user.name = req.body.name;
    user.email = req.body.email;
    user.authority=req.body.authority;
    for(var i=0;i<req.body.module.length;i++){
        user.module.push(req.body.module[i]);
    }
    //user.module=req.body.module;
    user.lastlogin="";
    user.setPassword(req.body.password);
    user.save(function(err) {
        var token;
        var module;
        if (err) {
            sendJSONresponse(res, 404, err);
        } else {
            token = user.generateJwt();
            module=user.module;
            sendJSONresponse(res, 200, { 'token': token ,'module':module});
        }

    });
};
module.exports.login = function(req, res) {
     console.log(req);
    if (!req.body.username || !req.body.password) {
        console.log(req);
        sendJSONresponse(res, 400, { message: '请输入邮箱和密码啦啦啦!!!' });
        return;
    }

    User.findOneAndUpdate({"email":req.body.username},{"lastlogin":req.body.logintime},function(err){
        console.log("update time!");
        console.log(req.body.logintime);
        if (err){
            throw err;
        }
    });

    passport.authenticate('local', function(err, user, info) {
        var token;
        var authority;
        var module;
        //var lastlogin;
        if (err) {
            sendJSONresponse(err, 404, err);
            return;
        }
        if (user) {
            token = user.generateJwt();
            authority=user.authority;
            module=user.module;
            //lastlogin=user.lastlogin;
          //  lastlogin=user.lastlogin;
            sendJSONresponse(res, 200, { "token": token ,"auth":authority,"module":module});
            console.log("what the hell");
        } else {
            sendJSONresponse(res, 401, info);
        }

    })(req,res);
};

module.exports.transfer = function (req, res) {
    var q;
    console.log("it is in transfer api");
    console.log(req.method);
    if (req.method === "POST") {
        console.log("http method is post!");
        console.log(req.body);
        console.log(typeof req.body);
        q = req.body;
        getTokenAndData(res, q.path, JSON.stringify(q.params), "POST");
        return;
    }
    console.log(req);
    // console.log(req.query);
    q = JSON.parse(req.query.q);
    // console.log(q.path);
    // console.log(q.params);
    // var token = "getToken()";
    // sendJSONresponse(res, 200, { message: token});
    // res.write("success");
    // res.write(getToken());
    getTokenAndData(res, q.path, JSON.stringify(q.params));
};
//var devUser = fs.readFileSync("app_api/data/devUser.json", "utf-8");
//console.log(devUser);
//console.log(process.env);
//console.log(process.env.username);
function getTokenAndData(originRes, path, params, method) {
    var devUser = JSON.parse(fs.readFileSync("app_api/data/devUser.json", "utf-8")),
        form = {
            username: devUser.username,
            password: devUser.password
        };
    console.log(form);
    request({
        headers: {
            "apikey": process.env.devKey
        },
        uri: "http://123.56.247.133:8000/login/",
        body: JSON.stringify(form),
        method: "POST"
    },
        function (err, res, body) {
            var token;
            if (err) {
                console.log(err);
                return;
            }
            console.log(body);
            body = JSON.parse(body);
            token = body.token;
            console.log(token);
            getResData(token, path, params, originRes, method);
            return token;
        }
    );
}
function getResData(token, path, params, originRes, method) {
    var uri;
    if (method === "POST") {
        uri = "http://123.56.247.133:9999" + path;
        console.log(uri);
        console.log(params);
        console.log(JSON.stringify(params));
        request({
            headers: {
                "apikey": process.env.devKey,
                "token": token
            },
            uri: uri,
            body: params,
            method: "POST"
        },
        function (err, res, body) {
            if (err) {
                console.log("error occurred");
                console.log(err);
                return;
            }
            // console.log(res);
            console.log(body);
            sendJSONresponse(originRes, 200, JSON.parse(body));
        });
        return;
    }
    uri = "http://123.56.247.133:8000" + path + "/?q=" + encodeURI(params);
    // console.log(uri);
    // console.log(token);
    request({
        headers: {
            "apikey": process.env.devKey,
            "token": token
        },
        uri: uri,
        method: "GET"
    },
    function (err, res, body) {
        if (err) {
            console.log(err);
            return;
        }
        // console.log(res);
        // console.log(body);
        sendJSONresponse(originRes, 200, JSON.parse(body));
    });
}
