const clui = require('clui');
const inquirer = require('inquirer');
const mongoose = require('mongoose');
const uuid = require('uuid/v1');
const clear = require('../utils/clear');
const connect = require('../utils/connect');
const log = require('../utils/log');
const sleep = require('../utils/sleep');
const objectId2string = require('../utils/objectId2string');
const Dynamo = require('../utils/dynamo');

const perf = require('execution-time')();

function processObject(exportedItems, item) {
	if (item === null) {
		return item;
	}

	else if (Array.isArray(item)) {
		item = item.map(val => processObject(exportedItems, val));
	}

	else if (typeof item === 'string' && mongoose.Types.ObjectId.isValid(item)) {
		const exported = exportedItems.find(exported => exported.originalId == item);

		return (!!exported) ? exported.newId : item;
	}

	else if (typeof item === 'object') {
		for (const [column, value] of Object.entries(item)) {
			item[column] = processObject(exportedItems, value);
		}
	}

	return item;
}

module.exports = async function(cli, cmd) {
	log('info', `AWS Region: ${cli.region}`);
	log('info', `AWS Endpoint: ${cli.endpoint}`);

	const Export = require('../schema/export.schema.js')(cli.name);
	const dynamo = new Dynamo({ endpoint: cli.endpoint, region: cli.region });

	await connect(cli.mongo);

	const spinner = new clui.Spinner('Looking for collections...');

	spinner.start();

	const result = await mongoose.connection.db.listCollections();
	const collections = (await result.toArray()).map(collection => collection.name).filter(name => name !== cli.name && name !== `${cli.name}s`);

	spinner.stop();

	const answer = await inquirer.prompt({
		message: 'Select which collections you want to transfer to DynamoDB',
		type: 'checkbox',
		name: 'collections',
		choices: collections
	});

	const selected = answer.collections;

	clear();

	perf.start();

	for (var option of selected) {
		spinner.message(`Analyzing collection ${option}...`);
		spinner.start();

		try {
			await dynamo.createTable(`${cli.prefix || ''}${option}`);
			await sleep(1);
		}
		catch (e) {
			log('warn', `Could not create table: ${cli.prefix || ''}${option}`);
		}

		const model = mongoose.model(option, new mongoose.Schema({}, {strict: false}));
		const documents = await model.find().exec();

		for (var i = 0;i < documents.length;i++) {
			clear();

			spinner.message(`Analyzing collection ${option}, document ${i + 1} of ${documents.length}...`);

			const uid = uuid();

			let body = { ...documents[i].toJSON() };

			// Replace with new id
			delete body._id;
			delete body.__v;

			body.id = uid;

			// Dynamo does not support boolean indexes
			if (typeof body.deleted !== 'undefined' && body.deleted !== null) {
				body.deleted = (body.deleted) ? 1 : 0;
			}

			for (var [key, val] of Object.entries(body)) {
				// Dynamo does not support emptry strings
				body[key] = (typeof val === 'string' && !val) ? null : objectId2string(val);
			}

			const backup = new Export({
				'collectionName': option,
				'documentBody': documents[i],
				'dynamoBody': body,
				'originalId': documents[i]._id,
				'newId': uid
			});

			await backup.save();
			await sleep(1);
		}
	}

	clear();
	spinner.message('Updating relationships... ');

	const all = (await Export.find().exec()).map(result => result.toJSON());

	for (var i = 0;i < all.length;i++) {
		spinner.message(`Updating relationships... (${i + 1}/${all.length})`);

		var item = processObject(all, all[i].dynamoBody); 

		try {
			await dynamo.insertDocument(`${cli.prefix || ''}${all[i].collectionName}`, item);
			await sleep(1);
		}
		catch (e) {
			log('err', `Could not insert document`);
		}
	}

	const processTime = perf.stop();

	spinner.stop();
	log('ok', `Transfer completed in ${ Math.round(processTime.time / 1024, 2) }s`);

	process.exit(0);
}