var
	recommender = require(__dirname + '/../../../src/lib/recommender.js');

describe('recommender', function () {
	it('stores items', function () {

		var items = [
				{id: 123, text: 'moo'},
				{id: 3, text: 'blah'},
				{id: 4, text: 'müüü'},
				{id: 2, text: 'gnii'}
			];

		recommender.setItemStorage({
			items: items,
			getLatestIDs: function (n) {
				return this.items;
			}
		});


		// exclude seen item
		recommender.getRecommendations({hasSeen: function (n) {return n === 4;}}, items[0], 3, function (err, data) {
            expect(data.length.toBe(3));
        });
	});
});
