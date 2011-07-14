
//var redis = require('redis');

exports.addItem = function (item) {
//	redis.hset('item:' + item.item_id, item);
};

exports.getRecommendations = function (user, ctxItem, count) {
	var i, items = [];
	for (i = 0; i < 3; i += 1) {
		items.push({
			id : Math.floor(Math.random() * 1000000)
		});
	}
	return items;
};

exports.addItemImpression = function (item, user) {

};


exports.addItemRecommendation = function (item, user) {

};
