var
	itemStorage,
	logger = require(__dirname + '/log.js').getLogger('recommender'),
	newRecommender = function () {
		var
			that = {},
			ctxItem,
			count = 0,
			domain,
			user;

		that.setCount = function (i) {
			count = i;
			return that;
		};

		that.setCtxItem = function (o) {
			ctxItem = o;
			return that;
		};
		that.setUser = function (o) {
			user = o;
			return that;
		};
		that.setDomain = function (o) {
			domain = o;
			return that;
		};

		that.getRecommendations = function (fn) {
			itemStorage.getLatestIDs(count * 4, domain.id, function (err, itemIDs) {
				var tmp, recs, level;

				if (err) {
					logger.error('error ' + err);


				}
				// move seen items to the end
				if (user.getID()) {
					itemIDs = itemIDs.sort(function (a, b) {
						return user.hasSeen(a) - user.hasSeen(b);
					});
				}

				if (ctxItem) {
					tmp = itemIDs.indexOf(ctxItem);
					if (tmp !== -1) {
						itemIDs.splice(tmp, 1);
					}
				}

				recs =  itemIDs.slice(0, count).map(function (id) {
					return {
						id: id
					}
				});

				if (count !== recs.length) {
					level = 'warn';
				} else {
					level = 'debug';
				}

				logger[level]('Should be sending ' + count + ' items, can send ' + itemIDs.length + ' items, will send ' + recs.length + ' items');

				fn(err, recs);
			});
		};
	};

logger.setLevel('info');

/**
 * required
 * @param o item storage instance
 */
exports.setItemStorage = function (o) {
	itemStorage = o;
};

exports.recommender = function (user, ctxItem) {
	return newRecommender().setUser(user).setCtxItem(ctxItem);
};


