var
    redis,
	itemIDs = [],
    logger;

exports.setRedis = function (o) {
    redis = o.createClient();
    redis.select(2);
};

exports.setLog = function (o) {
    logger = o.getLogger('itemstorage');
};



exports.addItem = function (item, fn) {
	var id = item.id;
    redis.sadd('item:ids', id);
    redis.set('item:created-at_' + id, item.created_at);
    redis.hmset('item_' + id, item);
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

exports.addItemVisited = function (item) {
    redis.incr('item:visited_' + item.id);
};


setInterval((function () {
    var running = false;
    return function () {
        if (running) {
            logger.info('aborting most visited calculation, its still running');
            return;
        }
        logger.info('starting most visited calculation');
        running = true;
        // iteriere die liste der gesehenen items, und ermittele das "visited pro zeiteinheit"
        // d.h. über alle 'item:visited_' und teile durch das entsprechende item:created_ - Alter
        // und speichere in sorted set
        /**
         *  SMEMBERS('item:ids').forEach
         *    score = GET('item:created-at_' + itemid) / GET('item:visited_' + itemid);
         *    ZADD('items:most-visited', score, itemid);
         *
         **/

        redis.smembers('item:ids', function (err, ids) {
            var
                t = Math.floor((new Date()).getTime() / 1000),
                nTodo = ids.length;

            logger.debug('found ' + nTodo + ' ids for which to calculate mostvisited');

            ids.forEach(function (id) {

                var
                    created_at,
                    visitcount,
                    trySetScore = function () {
                        var score, dAge;


                        if (typeof created_at === 'undefined' || typeof visitcount === 'undefined') {
                            logger.trace('trySetScore miss (' + created_at + ', ' + visitcount);
                            return;
                        }

                        dAge = (t - created_at) / 86400;
                        if (dAge) {
                            score = visitcount / (dAge * dAge);
                        } else {
                            score = 1;
                        }


                        logger.debug('setting visited score for item ' + id + ' to ' + score);
                        redis.zadd('items:most-visited', score, id);
                        nTodo -= 1;
                        if (!nTodo) {
                            logger.trace('finished most-visited calculation round');
                            running = false;
                        }
                    };

                redis.get('item:created-at' + id, function (err, val) {
                    created_at = val;
                    trySetScore();
                });
                redis.get('item:created-at' + id, function (err, val) {
                    visitcount = val;
                    trySetScore();
                });
            });

            if (!nTodo) {
                logger.trace('finished most-visited calculation round');
                running = false;
            }
        });

    };
}()), 2000);
