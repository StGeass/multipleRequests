'use strict';

var http = require('http');
var Promise = require('promise');

var urlList;
var finalJSON;

var server = new http.createServer(function (req, res) {
    switch (req.method + ' ' + req.url) {
        case 'GET /getAll':
            urlList = [];
            finalJSON = {};

            Promise
                .all([
                    loadJSON('http://localhost:3000/one.json'),
                    loadJSON('http://localhost:3000/two.json')
                ])
                .then(function (results) {
                    res.setHeader('Content-Type', 'text/html; charset=utf-8');

                    results.forEach(function (result) {
                        var object = JSON.parse(result);

                        for (var prop in object) {
                            finalJSON[prop] = object[prop];
                        }
                    });

                    res.end(JSON.stringify(finalJSON));
                })
                .catch(function (e) {
                    console.log(e);
                });

            // Перестанем грузить если соединение оборвётся
            res.on('close', function () {
                urlList.forEach(function (connection) {
                    connection.destroy();
                });
            });
            break;

        case 'GET /one.json':
            res.end('{"paramOne": 1}');
            break;

        case 'GET /two.json':
            res.end('{"paramTwo": 2}');
            break;

        default:
            res.statusCode = 404;
            res.end("Not found");
    }
});

function loadJSON (url, connections) {
    return new Promise(function (resolve, reject) {
        var connection = http
            .get(url, function (res) {
                if (res.statusCode != 200) {
                    reject(new Error('Wrong status o_O'));
                    return;
                }

                var body = '';
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    body += chunk;
                });
                res.on('end', function () {
                    resolve(body);
                });
            })
            .on('error', reject);

        urlList.push(connection)
    });
}

server.listen(3000, function (err) {
    if (err) throw err;
});
 