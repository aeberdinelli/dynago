module.exports = async function(s) {
	return new Promise((resolve, reject) => {
		setTimeout(resolve, s * 200);
	});
}