/*global require, __dirname*/

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
	http = require('http'),
	version = '1.0', // current contest API version ^^
	config = require(__dirname + '/config.js'),
	itemstorage = require(__dirname + '/lib/itemstorage.js'),
	recommender = require(__dirname + '/lib/recommender.js'),
	users = require(__dirname + '/lib/users.js'),
	log = require(__dirname + '/lib/log.js'),
	logger = log.getLogger('main'),
	redis = require('redis');

config.port = config.port || 1239;
itemstorage.setRedis(redis);
itemstorage.setLog(log);


http.createServer(
	function (request, response) {

		var error, status = 200, reqBody = '', responseBody;

		if (request.method !== 'GET' && request.method !== 'POST') {
			error = 'm' + new Array(Math.floor(Math.random() * 40)).join('o');
		}

		request.on("data", function (chunk) {
			reqBody += chunk;
		});

		request.on("end",
			function () {

				var requestObj, responseObj, teamID, user, contentType;

				try {

					if (!reqBody) {
						status = 400;
						error = 'POST data is empty';

					} else {
						try {
							contentType = request.headers["content-type"];
							if (contentType && (contentType.indexOf("application/x-www-form-urlencoded") !== -1)) {
								reqBody = decodeURIComponent(reqBody.trim());
							}

							requestObj = JSON.parse(reqBody);
							status = 200;
						} catch (e) {
							error = 'POST data is not valid JSON: ' + (e.message || e) + ':' + reqBody;
							status = 400;
						}

					}

					if (!error) {
						teamID = requestObj.config && requestObj.config.team ? requestObj.config.team.id : 0;
					}

					if (error) {
						logger.warn('error: ' + error);
						responseBody = JSON.stringify({
							error:error,
							code:0,
							version:version
						}) || '';
						response.writeHead(status, {
							'Content-Type':'application/json',
							'Content-Length':responseBody.length
						});
						response.end(responseBody);
						return;
					}

					// workaround until the contest API has been fixed
					if (requestObj.error) {
						requestObj.msg = 'error';
					}

					switch (requestObj.msg) {
						case 'feedback':
							responseObj = null;
							break;
						case 'impression':

							if (requestObj.item) {
								itemstorage.addItem(requestObj.item);
								itemstorage.addItemVisited(requestObj.item);
							}

							user = users.getUser(requestObj.client.id, function (err, user) {

								if (user) {
									user.visits(requestObj.item);
								}
								if (requestObj.config.recommend) {
									recommender.getRecommendations(
										user,
										requestObj.item ? requestObj.item.id : null,
										requestObj.config.limit, function (err, items) {
											items.map(function (item) {
												return {
													id: item.id
												};
											});
											responseObj = {
												msg: "result",
												team: {
													id: teamID
												},
												items: items,
												version: version
											};

											responseObj.items.forEach(function (i) {
												user.sees(i.id);
											});

											logger.trace('recommending items ' + responseObj.items.map(
												function (i) {
													return i.id;
												}).join(','));

											responseBody = JSON.stringify(responseObj) || '';
											response.writeHead(status, {
												'Content-Type':'application/json',
												'Content-Length':responseBody.length
											});
											response.end(responseBody);

										});
								}
							});
							return;
							break;

						case
						'error' :
							logger.warn('received "error" request, error code: ' + requestObj.code);
							break;
						default:
							logger.warn('strange request: ' + requestObj.msg);
							error = 'Erm... yes. I dont really know what you want with "' + requestObj.msg + '", so Im just going to ignore you';
							status = 400;
					}


				} catch (f) {
					logger.error('exception in request.end: ' + f.message + '\n' + f.stack);
					error = 'internal server error, meh';
					status = 500;
				}

				responseBody = JSON.stringify(responseObj) || '';
				response.writeHead(status, {
					'Content-Type':'application/json',
					'Content-Length':responseBody.length
				});
				response.end(responseBody);


			}
		)
		;

	}).listen(config.port);

logger.info('server listening at port ' + config.port);


recommender.setItemStorage(itemstorage);
logger.info('initial item score calculation...');
itemstorage.calculate();
logger.info('...finished.');
setInterval(itemstorage.calculate, 60000);
