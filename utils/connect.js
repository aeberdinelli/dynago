const mongoose = require('mongoose');
const log = require('./log');

module.exports = async function(mongourl) {
	try {
		await mongoose.connect(mongourl, { useNewUrlParser: true, useUnifiedTopology: true });
	}
	catch (e) { log('err', `Could not connect to MongoDB: ${mongourl}`); }

	log('ok', `Connected to MongoDB: ${mongourl}\n`);
}