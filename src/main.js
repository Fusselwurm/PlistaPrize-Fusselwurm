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
	app = require(__dirname + '/lib/app.js'),
	log = require(__dirname + '/lib/log.js'),
	logger = log.getLogger('main');

config.port = config.port || 1239;


http.createServer(function (request, response) {

	var error, status = 200, req = {
		content: ''
	};

	logger.trace('got request ' + request);

	if (request.method !== 'GET' && request.method !== 'POST') {
		error = 'm' + new Array(Math.floor(Math.random() * 40)).join('o');
	}

	request.on("data", function(chunk) {
		req.content += chunk;
	});

	request.on("end", function() {

		if (!req.content) {
			status = 400;
			error = 'POST me some data, pleeez (sending ' + status + ')';

		} else {
			status = 200;
			console.log(require('querystring').parse(req.content));
		}


		response.writeHead(status, {
			  'Content-Type': 'application/json'
		});

		if (error) {
			logger.warn('error: ' + error);
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

	});


}).listen(config.port);

logger.info('server listening at port ' + config.port);
