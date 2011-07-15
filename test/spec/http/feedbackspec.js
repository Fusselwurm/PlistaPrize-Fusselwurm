/*
{
"msg":"feedback",
"client":{
	"id":< user_id:int >
},
"domain":{
	"id":< domain_id:int >
},
"source":{
	"id":< source_id:string >
},
"target":{
	"id":< target_id:string >
},
"context":{
	"category":{
		"id":< category_id:int >
	}
},
"config":{
	"team":{
		"id":< team_id:int >
	}
},
"version":< version_string:string >
}
*/

var http = require('http');

describe('feedback requests', function () {
        it('accepts feedback', function () {

			var gotOk = false;

			runs(function () {
				var r = http.request({
					method: 'POST',
					host: 'localhost',
					path: '/',
					port: 1239
				}, function (response) {
					var body = '';

					expect(response.statusCode).toBe(200);
					gotOk = true;

					response.on('data', function (chunk) {
						body += chunk;
					});
					response.on('end', function () {
						if (body) {
							expect(JSON.parse(body)).toBeFalsy();
						} else {
							expect(body).toBeFalsy();
						}
					});
				});

				r.write(JSON.stringify({
					"msg":"feedback",
					"client":{
						"id": 2343
					},
					"domain":{
						"id": 418
					},
					"source":{
						"id": 232
					},
					"target":{
						"id": 323
					},
					"context":{
						"category":{
							"id": 23423
						}
					},
					"config":{
						"team":{
							"id": 1
						}
					},
					"version": '0.4.4'
				}));
				r.end();
			});

			waits(500);

			runs(function () {
				expect(gotOk).toBe(true);
			});
		});
});
