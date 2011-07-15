var
	app = require(__dirname + '/../../src/lib/itemstorage.js');

describe('item storage', function () {
	it('stores items', function () {
		app.addItem({id: 123, text: 'moo'});

		expect(app.getItem(123).text).toBe('moo');
	});
});
