const mongoose = require('mongoose');

/**
 * Recursively converts any ObjectId object to string
 * It also renames _id to id
 */
function objectId2string(object) {
	if (Array.isArray(object)) {
		return object.map(element => objectId2string(element, 'array'));
	}

	else if (object !== null && object !== undefined && typeof object !== 'string' && typeof object !== 'number' && typeof object !== 'boolean') {
		if (mongoose.Types.ObjectId.isValid(object)) {
			return '' + object.toString();
		}

		for (var [key, val] of Object.entries(object)) {
			if (key === '_id') {
				delete object._id;
				key = 'id';
			}

			object[key] = objectId2string(val);
		}
	}

	return object;
}

module.exports = objectId2string;