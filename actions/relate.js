const mongoose = require('mongoose');
const inquirer = require('inquirer');
const clui = require('clui');
const log = require('../utils/log');
const clear = require('../utils/clear');
const sleep = require('../utils/sleep');
const connect = require('../utils/connect');
const Dynamo = require('../utils/dynamo');

async function updateIds(TableName, exportedItems, oldId, dynamoId, column) {
	const exported = exportedItems.find(item => item.originalId == oldId);

	if (!exported) {
		console.log(oldId + ' not found');
		//&process.exit(0);
	} else {
		console.log(exported);
		//process.exit(0);
	}

	return await dynamo.$client().update({
		TableName,
		Key: {
			id: results[i].id
		},
		ReturnValues: 'ALL_NEW',
		UpdateExpression: 'set #column = #newId',
		ExpressionAttributeNames: {
			'#column': column
		},
		ExpressionAttributeValues: {
			'#newId': exported.newId
		}
	}).promise();
}

async function processObject(TableName, exportedItems, item) {
	for (const [column, value] of Object.entries(item)) {
		if (Array.isArray(value)) {
			return await Promise.all(value.map(val => processObject(val)));
		}

		else if (column !== 'id' && typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
			return await updateIds(TableName, exportedItems, value, item.id, column);
		}
	}
}

module.exports = async function(cli, cmd) {
	clear();

	const Export = require('../schema/export.schema')(cli.name);
	const dynamo = new Dynamo({ endpoint: cli.endpoint, region: cli.region });
	const spinner = new clui.Spinner('Looking for collections...');

	await connect(cli.mongo);

	spinner.start();

	const result = await mongoose.connection.db.listCollections();
	const collections = (await result.toArray()).map(collection => collection.name);

	spinner.stop();

	const answer = await inquirer.prompt({
		message: 'Select which collections you want to update relationships',
		type: 'checkbox',
		name: 'collections',
		choices: collections
	});

	const selected = answer.collections;

	spinner.message('Updating relationships... (this may take a while)');
	spinner.start();

	const exported = await Export.find().exec();

	await Promise.all(
		selected.map(collection => {
			return new Promise(async (resolve, reject) => {
				const data = await dynamo.$client().scan({
					TableName: `${cli.prefix}${collection}`
				}).promise();

				const items = data.Items;

				for (var doc in items) {
					await processObject(`${cli.prefix}${collection}`, exported, doc);
				}

				resolve();
			});
		})
	);

	spinner.stop();
	clear();

	log('ok', 'Relationships updated');

	process.exit(0);
}