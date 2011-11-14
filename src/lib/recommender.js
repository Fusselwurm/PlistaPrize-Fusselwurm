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

            itemsIDs.sort(function (a, b) {
                return user.hasSeen(a) - user.hasSeen(b);
            });

            if (ctxItem) {
                tmp  = itemsIDs.indexOf(ctxItem);
                if (tmp !== -1) {
                    itemsIDs.splice(tmp, 1);
                }
            }

            logger.debug('i could recommend ' + itemsIDs.length + ' items, and i could send ' + count);

            return fn(err, itemsIDs.slice(0, count).map(function (id) {
                return {
                    id: id
                }
            }));
        });
};


