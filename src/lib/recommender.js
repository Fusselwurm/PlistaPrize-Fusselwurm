var itemStorage = require(__dirname + '/itemstorage.js');

exports.getRecommendations = function (user, ctxItem, count) {
	var items = itemStorage.latest(count * 4);
	items.sort(function (a, b) {
		return user.hasSeen(a.id) - user.hasSeen(b.id);
	});
	return items.slice(0, count);
};
