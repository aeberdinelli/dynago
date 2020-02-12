const mongoose = require('mongoose');

const SchemaExport = new mongoose.Schema({
	'collectionName': {
		type: String,
		required: true
	},
	'documentBody': {
		type: Object,
		required: true
	},
	'dynamoBody': {
		type: Object,
		required: true
	},
	'originalId': {
		type: String,
		required: true
	},
	'newId': {
		type: String,
		required: true
	}
});

/**
 * Declares the export collection with a custom name
 */
module.exports = function(name) {
	return mongoose.model(name[0].toUpperCase() + name.slice(1), SchemaExport);
}