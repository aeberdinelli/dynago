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
	'originalId': {
		type: String,
		required: true
	},
	'newId': {
		type: String,
		required: true
	}
});

module.exports = mongoose.model('Export', SchemaExport);