const chalk = require('chalk');

module.exports = function(level, str) {
	if (level === 'err') {
		str = chalk.bgRed(' ERROR ') + ' ' + str;
	}

	if (level === 'warn') {
		str = chalk.bgYellow(' WARNING ') + ' ' + str;
	}

	if (level === 'info') {
		str = chalk.underline('INFO') + ' ' + str;
	}

	if (level === 'ok') {
		str = chalk.bgGreen(' OK ') + ' ' + str;
	}

	console.log(str);

	if (level === 'err') {
		process.exit(-1);
	}
}