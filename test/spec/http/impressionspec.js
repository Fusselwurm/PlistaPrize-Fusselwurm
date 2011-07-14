
var http = require('http'),
      serialize = function(obj, prefix) {
                var str = [];
                for(var p in obj) {
                        var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
                        str.push(typeof v == "object" ?
                                serialize(v, k) :
                                encodeURIComponent(k) + "=" + encodeURIComponent(v));
                }
                return str.join("&");
        };

describe('post', function () {
        it('post empty', function () {

			var gotResponse = false,
				gotOk = false;

			runs(function () {
				var r = http.request({
					method: 'POST',
					host: 'localhost',
					path: '/',
					port: 1239
				}, function (response) {
					expect(response.statusCode).toBe(400);
					gotOk = true;
				});

				r.write('');
				r.end();
			});

			waits(500);

			runs(function () {
				expect(gotOk).toBe(true);
			});
		});


	it('post impression', function () {
		var requestPost = {
				"msg":"impression",
				"id": 1,
				"client":{
					"id": 1234
				},
				"domain":{
					"id": 418
				},
				"item":{
					"id": 3423445,
					"title": 'item title. hallo!',
					"url": 'http://www.google.de',
					"created": 23423444,
					"text": 'moo. moo. moo. ich bin ein item! moo. moo. moo. und keine koo!',
					"img": ''
				},
				"context":{
					"category":{
						"id": 123
					}
				},
				"config":{
					"team":{
						"id": 4
					},
					"timeout": 50.0,
					"recommend": true,
					"limit": 2
				},
				"version": '3.4.6'
			};

		runs(function () {
			var r = http.request({
					method: 'POST',
					host: 'localhost',
					path: '/',
					port: 1239
				}, function (response) {
					expect(response.statusCode).toBe(200);
					gotOk = true;
				}),
				body = '?'  + serialize(requestPost);

		console.log(body);
			r.write(body);
			r.end();
		});

		waits(500);

	});
});
