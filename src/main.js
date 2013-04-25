/*global require, __dirname*/

/**
 * my plista prize server
 *
 * with the most ridiculous algorithm, I guess
 *
 */

var
	contestApiVersion = '1.0',
	config = require(__dirname + '/config.js'),
	http = require('http'),
	redis = require('redis'),
	itemstorage = require(__dirname + '/lib/itemstorage.js'),
	recommenderFactory = require(__dirname + '/lib/recommender.js'),
	users = require(__dirname + '/lib/users.js'),
	log = require(__dirname + '/lib/log.js'),
	logger = log.getLogger('main'),
	halt = function () {
		logger.info('exiting...');
		process.exit(0);
	},
	shutdown = function () {
		var request = http.request({
				method: 'POST',
				hostname: 'contest.plista.com',
				path:'/api/api.php'
			}, function () {});

		logger.info("sending stop request to API server...");

		request.write(JSON.stringify({
			version:"1.0",
			msg:"stop",
			apikey: config.apikey
		}));
		request.end();
		request.on('response', function (resp) {

			var body = '',
				lvl = resp.statusCode > 200 ? 'error' : 'info';

			resp.on("data", function (chunk) {
				body += chunk;
			});
			resp.on('end', function () {
				logger[lvl]('response: ' + resp.statusCode + ': ' + body);
				halt();
			});
		});


	},
	endResponse = function (response, statuscode, reasonphrase, responseObj) {
		var responseBody = JSON.stringify(responseObj || {
				error: reasonphrase,
				code: statuscode,
				version: contestApiVersion
			}),
			lname = 'defalt',
			lvl = 'info';

		if (statuscode >= 500) {
			lname = 'myError';
			lvl = 'error';
		} else if (statuscode >= 400) {
			lname = 'clientError';
			lvl = 'warn';
		} else if (statuscode >= 200) {
			lname = 'success';
			lvl = 'debug';
		}
		log.getLogger('main.' + lname)[lvl](reasonphrase);
		response.writeHead(statuscode, reasonphrase, {
			'Content-Type':'application/json',
			'Content-Length':responseBody.length
		});
		response.end(responseBody);
	};

log.setOutfile(config.logfile || '/tmp/plistaprize.log');
logger.setLevel('debug');

if (!config.apikey) {
	logger.fatal('missing apikey. please set the API key from within config.js (example: exports.apikey = "blah"; )');
	process.exit(1);
}



config.port = config.port || 1239;
itemstorage.setRedis(redis);
itemstorage.setLog(log);


http.createServer(function (request, response) {

		var status = 200, reqBody = '', responseBody, time = new Date();

		if (request.method !== 'GET' && request.method !== 'POST') {
			endResponse(response, 400, 'm' + new Array(Math.floor(Math.random() * 40)).join('o'));
			return;
		}

		request.on("data", function (chunk) {
			reqBody += chunk;
		});

		request.on("end", function () {

				var requestObj, responseObj, contentType, recommender;

				try {

					if (!reqBody) {
						endResponse(response, 400, 'POST data is empty');
						return;
					} else {
						try {
							contentType = request.headers["content-type"];
							if (contentType && (contentType.indexOf("application/x-www-form-urlencoded") !== -1)) {
								reqBody = decodeURIComponent(reqBody.trim());
							}

							requestObj = JSON.parse(reqBody);
							status = 200;
						} catch (e) {
							endResponse(response, 400, 'POST data is not valid JSON: ' + (e.message || e) + ':' + reqBody);
							return;
						}

					}


					// workaround until the contest API has been fixed
					if (requestObj.error) {
						requestObj.msg = 'error';
					}

					switch (requestObj.msg) {
						case 'feedback':
							try {
								if (requestObj.config.team.id) {
									log.getLogger('main.interesting').info('I got a response :) ' + JSON.stringify(requestObj));
								}
							} catch (x) {
								log.getLogger('main.interesting').info('someone else got a response :( ');
							}

							endResponse(response, 200, '');
							return;
						case 'impression':

							if (requestObj.item) {
								itemstorage.addItem(requestObj.item, requestObj.domain);
								itemstorage.addItemVisited(requestObj.item);
							}

							users.getUser(requestObj.client.id, function (err, user) {

								if (user) {
									user.visits(requestObj.item);
								}
								if (requestObj.config.recommend) {
									recommender = recommenderFactory.
										recommender(user, requestObj.item ? requestObj.item.id : null).
										setDomain(requestObj.domain).
										setCount(requestObj.config.limit);

									recommender.getRecommendations(function (err, items) {
											var s;
											items.map(function (item) {
												return {
													id: item.id
												};
											});
											responseObj = {
												msg: "result",
												team: {
													id: requestObj.config && requestObj.config.team ? requestObj.config.team.id : 0
												},
												items: items,
												version: contestApiVersion
											};

											responseObj.items.forEach(function (i) {
												user.sees(i.id);
											});

											s = new Date();
											logger.debug('needed ' + Math.floor(s.getTime() - time.getTime()) + ' ms to recommend items ' + responseObj.items.map(
												function (i) {
													return i.id;
												}).join(','));

											responseBody = JSON.stringify(responseObj) || '';
											response.writeHead(status, {
												'Content-Type': 'application/json',
												'Content-Length': responseBody.length
											});
											response.end(responseBody);

										});
								}
							});
							return;

						case
						'error' :
							endResponse(response, 200, 'received "error" request: ' + requestObj.code + '( ' + requestObj.error + ' )');
							return;
						default:
							endResponse(response, 400, 'Erm... yes. I dont really know what you want with "' + requestObj.msg + '", so Im just going to ignore you');
							return;
					}
				} catch (f) {
					endResponse(500, 'exception in request.end: ' + f.message + '\n' + f.stack);
				}
		});
	}).listen(config.port);

logger.info('server listening at port ' + config.port);


recommenderFactory.setItemStorage(itemstorage);
logger.info('initial item score calculation...');
itemstorage.calculate();
logger.info('...finished.');
setInterval(itemstorage.calculate, 60000);

logger.info("sending start request to API server...");

(function () {
	var request = http.request({
		method: 'POST',
		hostname: 'contest.plista.com',
		path:'/api/api.php'
	}, function () {});
	request.write(JSON.stringify({"version":"1.0", "msg":"start", "apikey": config.apikey}));


	request.end();
	request.on('response', function (resp) {

		var body = '',
			lvl = resp.statusCode > 200 ? 'error' : 'info';

		resp.on("data", function (chunk) {
			body += chunk;
		});
		resp.on('end', function () {
			logger[lvl]('response: ' + resp.statusCode + ': ' + body);
			if (lvl === 'error') {
				process.exit(2);
			}
		});
	});
}());


process.on('SIGINT', shutdown);
process.on('SIGTERM', function () {
	process.exit(1);
});
