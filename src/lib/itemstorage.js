var
	// redis = require('redis');
	items = {},
	itemIDs = [];

exports.addItem = function (item) {
	var id = item.id;
	if (!items[id]) {
		items[id] = item;
		itemIDs.push(id);
	}
//	redis.hset('item:' + item.item_id, item);
};

exports.getItem = function (id) {
	return items[id];
};

exports.getLatest = function (number) {
	return itemIDs.slice(- number).map(function (id) {
		return items[id];
	});
};
