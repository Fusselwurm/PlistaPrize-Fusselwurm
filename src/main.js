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
	version = 0.15,
	config = require(__dirname + '/config.js'),
	itemstorage = require(__dirname + '/lib/itemstorage.js'),
	recommender = require(__dirname + '/lib/recommender.js'),
	users = require(__dirname + '/lib/users.js'),
	log = require(__dirname + '/lib/log.js'),
	logger = log.getLogger('main');

config.port = config.port || 1239;


http.createServer(function (request, response) {

	var error, status = 200, reqBody = '';

	if (request.method !== 'GET' && request.method !== 'POST') {
		error = 'm' + new Array(Math.floor(Math.random() * 40)).join('o');
	}

	request.on("data", function(chunk) {
		reqBody += chunk;
	});

	request.on("end", function() {

		var requestObj, responseObj, teamID;


		try {

			if (!reqBody) {
				status = 400;
				error = 'POST data is empty';

			} else {
				try {
					requestObj = JSON.parse(reqBody);
					status = 200;
				} catch (e) {
					error = 'POST data is not valid JSON';
					status = 400;
				}

			}

			if (!error) {
				teamID = requestObj.config && requestObj.config.team ? requestObj.config.team.id : 0;
				if (!teamID) {
					logger.info('Hey! Where\'s my Team ID ??? (request was: ' + reqBody + ')');
				}
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

			switch (requestObj.msg) {
				case 'feedback':
					responseObj = null;
					break;
				case 'impression':

					if (requestObj.item) {
						itemstorage.addItem(requestObj.item);
					}


					if (requestObj.config.recommend) {
						responseObj = {
							msg: "results",
							team: {
								id: teamID
							},
							items: recommender.getRecommendations(users.getUser(requestObj.client.id), requestObj.item ? requestObj.item.id : null, requestObj.config.count),
							version: 0.1
						};

						logger.trace('recommending items ' + responseObj.items.map(function (i) {
							return i.id
						}).join(','));

					} else {
						responseObj = null;
					}
					break;

				case 'error':
				default: logger.warn('strange request: ' + requestObj.msg);
			}


		} catch (e) {
			logger.error('exception in request.end: ' + e.message + '\n' + e.stack);
			error = 'internal server error, meh';
			status = 500;
		}


		response.end(JSON.stringify(responseObj));



	});

}).listen(config.port);

logger.info('server listening at port ' + config.port);



recommender.setItemStorage(itemstorage);
