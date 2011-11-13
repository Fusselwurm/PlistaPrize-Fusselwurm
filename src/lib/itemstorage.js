var
    redis,
	itemIDs = [];

exports.setRedis = function (o) {
    redis = o.createClient();
    redis.select(2);
};



exports.addItem = function (item, fn) {
	var id = item.id;
    redis.sadd('item_ids', id);
    redis.hmset('item_' + item.id, item);
    if (fn) {
        fn('no idea what happened to it ^^');
    }
};

exports.getItem = function (id, fn) {
	return redis.hgetall('item_' + id, fn);
};


/**
 *
 * @param number
 * @return Array
 */
exports.getLatest = function (number, fn) {
    if (fn) {
        fn('moo', []);
    }

};

exports.addItemSeen = function (item) {
    redis.incr('item_seen_' + item.id);
};
