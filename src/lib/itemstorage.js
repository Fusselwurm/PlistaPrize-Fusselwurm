var
	redis,
	logger,
	redisKeys = {
		allByDomainid: function (domainid) {
			return 'item:' + domainid + ':ids';
		},
		itemids: function () {
			return 'item:ids';
		},
		domainids: function () {
			return 'domainids';
		},
		recommendablesByDomainid: function (domainids) {
			return 'items:recommendables:domainid_' + domainids;
		},
		byItemid: function (id) {
			return 'item_' + id;
		},
		mostvisitedByDomainid: function (domainid) {
			return 'items:mostvisited:domainid_' + domainid;
		},
		visitsByID: function (id) {
			return 'item:visited_' + id;
		},
		createdByID: function (id) {
			return 'item:created-at_' + id;
		}
	},
	getAllDomainids = function (fn) {
		redis.smembers(redisKeys.domainids(), function (err, data) {
			if (err) {
				throw new Error(err);
			}
			if (Array.isArray(data)) {
				fn(data);
			}
		});
	};

exports.setRedis = function (o) {
	redis = o.createClient();
	redis.select(2);
};

exports.setLog = function (o) {
	logger = o.getLogger('itemstorage');
	logger.setLevel('debug');
};


exports.addItem = function (item, domain) {
	var
		itemid = item.id,
		domainid = domain.id;

	redis.sadd(redisKeys.itemids(), itemid, redis.print);
	redis.sadd(redisKeys.domainids(), domainid, redis.print);
	redis.sadd(redisKeys.allByDomainid(domain.id), itemid, redis.print);
	if (item.recommendable) {
		redis.sadd(redisKeys.recommendablesByDomainid(domainid), itemid, redis.print);
	}
	redis.set(redisKeys.createdByID(itemid), item.created || item.created_at || item.date, , redis.print);
	redis.set(redisKeys.byItemid(itemid), JSON.stringify(item), redis.print);
};

exports.getItem = function (id, fn) {
	return redis.get('item_' + id, function (data) {
		fn(data ? JSON.parse(data) : null);
	});
};


/**
 *
 * @param number
 * @return Array
 */
exports.getLatestIDs = function (number, domainid, fn) {
	redis.zrange(redisKeys.mostvisitedByDomainid(domainid), -20, -1, function (err, data) {
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
	var running = 0,
		dec = function () {
			running -= 1;
			if (running < 1) {
				logger.info('finished most-visited calculation round');
			}
		},
		incrBy = function (cnt) {
			running += cnt;
		};
	return function () {
		if (running > 0) {
			logger.info('not starting most visited calculation, its still running');
			return;
		}
		logger.info('starting most visited calculation');


		// iteriere die liste der gesehenen items, und ermittele das "visited pro zeiteinheit"
		// d.h. über alle 'item:visited_' und teile durch das entsprechende item:created_ - Alter
		// und speichere in sorted set
		/**
		 *  SMEMBERS('item:ids').forEach
		 *	score = GET('item:created-at_' + itemid) / GET('item:visited_' + itemid);
		 *	ZADD('items:most-visited', score, itemid);
		 *
		 **/
		incrBy(1);
		getAllDomainids(function (domainids) {
			logger.debug('most visited calculation for ' + domainids.length + ' domains');
			incrBy(domainids.length);
			domainids.forEach(function (domainid) {
				logger.debug('triggering most visited calculation for domain ' + domainid + '…');

				incrBy(1);
				redis.smembers(redisKeys.recommendablesByDomainid(domainid), function (err, ids) {
					var
						t = Math.floor((new Date()).getTime() / 1000),
						nTodo;

					if (err) {
						logger.error('error when getting item ids: ' + err);
						return;
					}

					ids = ids || [];
					nTodo = ids.length;

					logger.debug('found ' + nTodo + ' ids in domain ' + domainid + ' for which to calculate mostvisited');

					incrBy(nTodo);
					dec();
					ids.forEach(function (id) {

						var
							both = 0,
							created_at,
							visitcount,
							trySetScore = function () {
								var score, dAge;

								if (both < 2) {
									return;
								}

								if (typeof created_at === 'undefined' || typeof visitcount === 'undefined') {
									logger.warn('trySetScore miss (' + created_at + ', ' + visitcount);
									dec();
									return;
								}

								dAge = (t - created_at) / 86400;
								if (dAge) {
									score = visitcount / (dAge * dAge);
								} else {
									score = 1;
								}


								logger.trace('setting visited score for item ' + id + ' to ' + score);
								redis.zadd(redisKeys.mostvisitedByDomainid(domainid), score, id);
								dec();
							};

						redis.get(redisKeys.createdByID(id), function (err, val) {
							created_at = val;
							both += 1;
							trySetScore();
						});
						redis.get(redisKeys.visitsByID(id), function (err, val) {
							visitcount = val;
							both += 1;
							trySetScore();
						});
					});
				});
				dec();
			});
			dec();
		});
	};
}());
