const clear = require('clear');
const figlet = require('figlet');

module.exports = function() {
	clear();

	console.log(figlet.textSync('Dynago', {
		horizontalLayout: 'center',
		verticalLayout: 'center'
	}));

	const signature = '{} with ♥ by Alan Berdinelli ';

	console.log(new Array(process.stdout.columns - signature.length).fill(' ').join('') + signature);
	console.log(new Array(process.stdout.columns).fill('-').join('') + '\n');
}