
var
	http = require('http');
/*
	validResponse = {
		"msg":"results",
		"team":{
			"id":< team_id:int >
		},
		"items":[
			{
				"id":< item_id:string >
			},
			...
		],
		"version":< version_string:string >
		}
*/

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
					var body = '';
					response.on('data', function (chunk) {
						body += chunk;
					});
					response.on('end', function () {
						var
							result = JSON.parse(body);

						expect(result.msg).toBe('results');
						expect(result.team.id).toBeDefined();
						expect(result.version).toBeDefined();
						expect(result.items).toBeDefined();
						expect(result.items.length > 0).toBe(true);
						expect(result.items[0].id).toBeDefined();

					});
					expect(response.statusCode).toBe(200);
				}),
				body = JSON.stringify(requestPost);

			r.write(body);
			r.end();
		});

		waits(500);



	});
});
