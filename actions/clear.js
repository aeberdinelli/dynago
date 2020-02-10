const clui = require('clui');
const inquirer = require('inquirer');
const connect = require('../utils/connect');
const log = require('../utils/log');
const sleep = require('../utils/sleep');
const Export = require('../schema/export.schema.js');

module.exports = async function(cli, cmd) {
	await connect(cli.mongo);

	const answer = await inquirer.prompt({
		message: 'Are you sure you want to clean up the export collection?',
		type: 'confirm',
		name: 'confirm',
		default: false
	});

	if (answer.confirm) {
		const spinner = new clui.Spinner('Cleaning up database...');
		spinner.start();

		await Export.deleteMany({});
		await sleep(1);

		spinner.stop();

		log('ok', 'Export collection is now empty');
	}

	process.exit(0);
}