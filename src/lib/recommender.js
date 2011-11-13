var itemStorage,
	logger = require(__dirname + '/log.js').getLogger('recommender');

logger.setLevel('debug');

/**
 * required
 * @param o item storage instance
 */
exports.setItemStorage = function (o) {
	itemStorage = o;
};

exports.getRecommendations = function (user, ctxItem, count, fn) {
	var
		items = itemStorage.getLatest(count * 4, function (err, items) {
            var tmp;

            items.sort(function (a, b) {
                return user.hasSeen(a.id) - user.hasSeen(b.id);
            });

            if (ctxItem) {
                tmp  = items.indexOf(ctxItem);
                if (tmp !== -1) {
                    items.splice(tmp, 1);
                }
            }

            logger.debug('i could recommend ' + items.length + ' items, and i could send ' + count);

            return fn(err, items.slice(0, count));
        });
};


