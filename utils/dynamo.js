const AWS = require('aws-sdk');

module.exports = class Dynamo {
	constructor(config) {
		this.endpoint = config.endpoint || 'http://localhost:8000';
		this.region = config.region || 'us-east-1';
		this.dynamo = new AWS.DynamoDB({ endpoint: this.endpoint, region: this.region });
		this.client = new AWS.DynamoDB.DocumentClient({ endpoint: this.endpoint, region: this.region });
	}

	async createTable(TableName) {
		return new Promise((resolve, reject) => {
			this.dynamo.createTable({
				TableName,
				AttributeDefinitions: [
					{
						AttributeName: "id", 
						AttributeType: "S"
					}
				],
				KeySchema: [
					{
						AttributeName: 'id',
						KeyType: 'HASH'
					}
				],
				ProvisionedThroughput: {
					ReadCapacityUnits: 1, 
					WriteCapacityUnits: 1
				}
			}, (err, data) => {
				if (err) {
					return reject(err);
				}

				return resolve(data);
			});
		});
	}

	async insertDocument(TableName, Item) {
		return new Promise((resolve, reject) => {
			this.client.put({ TableName, Item }, (err, data) => {
				if (err) {
					return reject(err);
				}

				return resolve(data);
			})
		});
	}
}
