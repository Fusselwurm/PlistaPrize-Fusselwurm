/**
 * my plista prize server
 *
 * with the most ridiculous algorithm, I guess
 *
 *
 * items are just plain objects right now, as is everything else.
 *
 */

var
	http = require('http');
	version = 0.1,
	config = require(__dirname + '/config.js'),
	app = require(__dirname + '/lib/app.js');

config.port = config.port || 1239;


http.createServer(function (request, response) {

	var error;

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
		items: app.getRecommendations(1, 1, 1),
		version: 0.1
	}));


}).listen(config.port)




