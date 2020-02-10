const clui = require('clui');
const inquirer = require('inquirer');
const mongoose = require('mongoose');
const uuid = require('uuid/v1');
const clear = require('clear');
const connect = require('../utils/connect');
const log = require('../utils/log');
const sleep = require('../utils/sleep');
const objectId2string = require('../utils/objectId2string');

const Export = require('../schema/export.schema.js');
const Dynamo = require('../utils/dynamo');

module.exports = async function(cli, cmd) {
	log('info', `AWS Region: ${cli.region}`);
	log('info', `AWS Endpoint: ${cli.endpoint}`);

	const dynamo = new Dynamo({ endpoint: cli.endpoint, region: cli.region });

	await connect(cli.mongo);

	const spinner = new clui.Spinner('Looking for collections...');

	spinner.start();

	const result = await mongoose.connection.db.listCollections();
	const collections = (await result.toArray()).map(collection => collection.name);

	spinner.stop();

	const answer = await inquirer.prompt({
		message: 'Select which collections you want to transfer to DynamoDB',
		type: 'checkbox',
		name: 'collections',
		choices: collections
	});

	const selected = answer.collections;

	clear();

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

			const backup = new Export({
				'collectionName': option,
				'documentBody': documents[i],
				'originalId': documents[i]._id,
				'newId': uid
			});

			await backup.save();
			await sleep(1);

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
				if (typeof val === 'string' && !val) {
					body[key] = null;
				}

				else {
					body[key] = objectId2string(val);
				}
			}

			try {
				await dynamo.insertDocument(`${cli.prefix || ''}${option}`, body);
				await sleep(1);
			}
			catch (e) {
				log('err', `Could not insert document`);
			}
		}
	}

	spinner.stop();
	log('ok', 'Backup completed\n');

	process.exit(0);
}