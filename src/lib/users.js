var
	users = {},
	addUser = function (id, force) {
		var seens = [],
			visited = [];
		if (force || !users[id]) {
			users[id] = {
				getID:function () {
					return id;

				},
				hasSeen:function (itemID) {
					return seens.indexOf(id) !== -1;
				},
				hasVisited:function (itemID) {
					return visited.indexOf(id) !== -1
				},
				sees:function (itemID) {
					if (!this.hasSeen(itemID)) {
						seens.push(itemID);
					}
				},
				visits:function (itemID) {
					if (!this.hasVisited(itemID)) {
						visited.push(itemID);
					}
				}
			};
		}

		return users[id];
	};

exports.getUser = function (id, fn) {
	return fn('', users[id] || addUser(id));
};
