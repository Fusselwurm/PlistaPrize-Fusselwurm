var
	redis,
	logger,
	redisKeys = {
		allByDomainid: function (domainid) {
			return 'item:' + domainid + ':ids';
		},
		all: function () {
			return 'item:ids';
		},
		recommendables: function () {
			return 'items:recommendables';
		},
		byItemid: function (id) {
			return 'item_' + id;
		},
		mostvisited: function () {
			return 'items:most-visited';
		},
		visitsByID: function (id) {
			return 'item:visited_' + id;
		},
		createdByID: function (id) {
			return 'item:created-at_' + id;
		}
	};

exports.setRedis = function (o) {
	redis = o.createClient();
	redis.select(2);
};

exports.setLog = function (o) {
	logger = o.getLogger('itemstorage');
	logger.setLevel('warn');
};


exports.addItem = function (item, domain, fn) {
	var id = item.id;
	redis.sadd(redisKeys.all, id);
	redis.sadd(redisAllByDomainid(domain.id, id);
	if (item.recommendable) {
		redis.sadd(redisKeys.recommendables(), id);
	}
	redis.set(redisKeys.createdByID(id), item.created || item.created_at || item.date);

	redis.hmset(redisKeys.byItemid(id), item, fn);
};

exports.getItem = function (id, fn) {
	return redis.hgetall('item_' + id, fn);
};


/**
 *
 * @param number
 * @return Array
 */
exports.getLatestIDs = function (number, domainid, fn) {
	redis.zrange(redisKeys.mostvisited(), -20, -1, function (err, data) {
		data = data || [];
		if (err) {
			logger.error('error when getting sorted items: ' + err);
		}
		if (fn) {
			fn(err, data.reverse());
		}
	});
	return null;
};

exports.addItemVisited = function (item) {
	redis.incr(redisKeys.visitsByID(item.id));
};


exports.calculate = (function () {
	var running = false;
	return function () {
		if (running) {
			logger.info('aborting most visited calculation, its still running');
			return;
		}
		logger.info('starting most visited calculation');
		running = true;
		// iteriere die liste der gesehenen items, und ermittele das "visited pro zeiteinheit"
		// d.h. über alle 'item:visited_' und teile durch das entsprechende item:created_ - Alter
		// und speichere in sorted set
		/**
		 *  SMEMBERS('item:ids').forEach
		 *	score = GET('item:created-at_' + itemid) / GET('item:visited_' + itemid);
		 *	ZADD('items:most-visited', score, itemid);
		 *
		 **/
		redis.smembers(redisKeys.recommendables(), function (err, ids) {
			var
				t = Math.floor((new Date()).getTime() / 1000),
				nTodo;

			if (err) {
				logger.error('error when getting item ids: ' + err);
			}

			ids = ids || [];
			nTodo = ids.length;

			logger.debug('found ' + nTodo + ' ids for which to calculate mostvisited');

			ids.forEach(function (id) {

				var
					created_at,
					visitcount,
					trySetScore = function () {
						var score, dAge;


						if (typeof created_at === 'undefined' || typeof visitcount === 'undefined') {
							logger.trace('trySetScore miss (' + created_at + ', ' + visitcount);
							return;
						}

						dAge = (t - created_at) / 86400;
						if (dAge) {
							score = visitcount / (dAge * dAge);
						} else {
							score = 1;
						}


						logger.debug('setting visited score for item ' + id + ' to ' + score);
						redis.zadd(redisKeys.mostvisited(), score, id);
						nTodo -= 1;
						if (!nTodo) {
							logger.trace('finished most-visited calculation round');
							running = false;
						}
					};

				redis.get(redisKeys.createdByID(id), function (err, val) {
					created_at = val;
					trySetScore();
				});
				redis.get(redisKeys.visitsByID(id), function (err, val) {
					visitcount = val;
					trySetScore();
				});
			});

			if (!nTodo) {
				logger.trace('finished most-visited calculation round');
				running = false;
			}
		});

	};
}());
