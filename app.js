'use strict';

/*
* @example
* http://localhost:3000/getAll?url=http://pushkininstitute.ru/assets/rki/config.json&url=http://pushkininstitute.ru/assets/rki/all.json
* */

var util = require('util');
var http = require('http');

var url = require('url');
var querystring = require('querystring');

var Promise = require('promise');

var server = new http.createServer(function (req, res) {
    var parsedUrl = url.parse(req.url);
    var parsedQuery = querystring.parse(parsedUrl.query);

    switch (req.method + ' ' + parsedUrl.pathname) {
        case 'GET /getAll':
            var httpPromises;

            if (!parsedQuery.url) {
                res.statusCode = 500;
                res.end('App requires at least one url');
            }
            else if (util.isArray(parsedQuery.url)) {
                httpPromises = parsedQuery.url.map(function (urlPath) {
                    return loadJSON(urlPath);
                });
            }
            else {
                httpPromises = [loadJSON(parsedQuery.url)];
            }

            Promise
                .all(httpPromises)
                .then(function (results) {
                    var finalJSON = {};

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
                    res.statusCode = 500;
                    res.end(e.toString());
                });
            break;

        default:
            res.statusCode = 404;
            res.end('Not found');
    }
});

function loadJSON(url) {
    return new Promise(function (resolve, reject) {
        http.get(url, function (res) {
            if (res.statusCode != 200) {
                reject(new Error('Wrong status (' + res.statusCode + ') o_O'));
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
        }).on('error', reject);
    });
}

server.listen(3000, function (err) {
    if (err) throw err;
});
