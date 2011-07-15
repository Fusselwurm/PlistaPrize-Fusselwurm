var
	users = {},
	addUser = function (id, force) {
		var seens = [];
		if (force || !users[id]) {
			users[id] = {
				getID: function () {
					return id;

				},
				hasSeen: function (itemID) {
					return seens.indexOf(id) !== -1;
				},
				sees: function (itemID) {
					if (!this.hasSeen(itemID)) {
						seens.push(itemID);
					}
				}
			};
		}

		return users[id];
	};

exports.getUser = function (id) {
	return users[id] || addUser(id);
};
