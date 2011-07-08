/**
 * my plista prize server
 *
 * with the most ridiculous algorithm, I guess
 */

var
	http = require('http');
	version = 0.1,
	config = require(__dirname + '/config.js');

config.port = config.port || 1239;


http.createServer(function (request, response) {

	var items = [], error, i;
	for (i = 0; i < 3; i += 1) {
		items.push({
			id : Math.floor(Math.random() * 1000000)
		});
	}

	if (request.method !== 'GET' && request.method !== 'POST') {
		error = 'm' + new Array(Math.floor(Math.random() * 40)).join('o');
	}

	if (!request.headers.post) {
		error = 'POST me some data, pleeez';
	}

	if (error) {
		response.end(JSON.stringify({
			error: error,
			code: 0,
			version: version
		}));
		return;
	}

	response.end(JSON.stringify({
		msg: "results",
		team: {
			id: 1
		},
		items: items,
		version: 0.1
	}));


}).listen(config.port)




