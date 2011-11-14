var itemStorage,
	logger = require(__dirname + '/log.js').getLogger('recommender');

logger.setLevel('warn');

/**
 * required
 * @param o item storage instance
 */
exports.setItemStorage = function (o) {
	itemStorage = o;
};

exports.getRecommendations = function (user, ctxItem, count, fn) {
	var
		items = itemStorage.getLatestIDs(count * 4, function (err, itemsIDs) {
			var tmp;


			if (err) {
				logger.error('error ' + err);

			}
			if (user.getID()) {
				itemsIDs = itemsIDs.sort(function (a, b) {
					return user.hasSeen(a) - user.hasSeen(b);
				});
			}

			if (ctxItem) {
				tmp = itemsIDs.indexOf(ctxItem);
				if (tmp !== -1) {
					itemsIDs.splice(tmp, 1);
				}
			}

			logger.debug('Should be sending ' + count + ' items, will be sending ' + itemsIDs.length + ' items');

			return fn(err, itemsIDs.slice(0, count).map(function (id) {
				return {
					id:id
				}
			}));
		});
};


