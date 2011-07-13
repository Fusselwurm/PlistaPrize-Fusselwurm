
var http = require('http'),
	cli = http.createClient(1239);

describe('post', function () {
        it('post', function () {

			var ok = false;

			runs(function () {
				var r = cli.request('POST');

				r.on('response', function (response) {
					response.on('data', function (chunk) {
						ok = true;
					});
					r.end();
				});
			});

			waits(500);

			runs(function () {
				expect(ok).toBe(true);
			});
		});
});
