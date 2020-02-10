#!/usr/bin/env node
const fs = require('fs');
const cli = require('commander');
const clui = require('clui');
const clear = require('clear');
const mongoose = require('mongoose');
const uid = require('uuid/v1');
const log = require('./utils/log');

process.on('uncaughtException', (err) => {
	log('warn', 'An unknown error occured:');
	console.log(err);
	process.exit(-1);
});

process.on('unhandledRejection', (err) => {
	log('warn', 'Unhandled rejection');
	console.log(err);
	process.exit(-1);
});

clear();

cli
	.version(require('./package.json').version)
	.command('clear', 'purge the export database')
	.command('backup', 'creates a copy of the data')
	.command('transfer', 'creates the export database and transfer the data from mongo to dynamo')
	.option('-m, --mongo <mongo-url>', 'pass a mongo connection string', 'mongodb://localhost:27017/khatu')
	.option('-r, --region <region>', 'set a specific region for dynamodb', 'us-east-1')
	.option('-e, --endpoint <url>', 'set a specific endpoint for dynamodb', `https://dynamodb.${cli.region || 'us-east-1'}.amazonaws.com`)
	.option('-p, --prefix <prefix>', 'add a prefix to dynamodb tables', '')
	//.option('-t, --name <collection>', 'change the default export collection name', 'export')
	.action(async cmd => {
		const command = cmd.args.pop().toLowerCase().trim();

		if (!fs.existsSync(`./actions/${command}.js`)) {
			log('err', `Command not found: ${command}`);
		}

		await require(`./actions/${command}.js`)(cli, cmd);
	})
	.parse(process.argv);