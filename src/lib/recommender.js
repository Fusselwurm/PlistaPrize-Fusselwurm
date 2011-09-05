var itemStorage, user,
	log = require(__dirname + '/log.js'),
	logger = log.getLogger('recommender');

/**
 * required
 * @param o item storage instance
 */
exports.setItemStorage = function (o) {
	itemStorage = o;
};

exports.getRecommendations = function (user, ctxItem, count) {
	var
		items = itemStorage.getLatest(count * 4),
		tmp;

	items.sort(function (a, b) {
		return user.hasSeen(a.id) - user.hasSeen(b.id);
	});

	if (ctxItem) {
		tmp  = items.indexOf(ctxItem);
		if (tmp !== -1) {
			items.splice(tmp, 1);
		}
	}

	logger.debug('i could recommend ' + items.length + ' items, but i should only send ' + count);
	return items.slice(0, count);
};
