var
	app = require(__dirname + '/../../../src/lib/itemstorage.js'),
    redis = require('redis-node');

app.setRedis(redis);
app.setLog({
    getLogger: function () {
        return {
            trace: function () {},
            debug: function () {},
            info: function () {},
            warn: function () {},
            error: function () {},
            fatal: function () {}
        };
    }
});

describe('item storage', function () {
	it('stores items', function () {
        var t;
		app.addItem({id: 123, text: 'moo'}, function () {
            app.getItem(123, function (err, d) {
                t = d.text;
                expect(t).toBe('moo');
            });
        });



	});
});
