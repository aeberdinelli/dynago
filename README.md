# Dynago
A CLI tool to easily copy MongoDB database to DynamoDB format, generating new ids and keeping relationships.

## Usage
![help](https://raw.githubusercontent.com/aeberdinelli/dynago/master/docs/help.png)

### Examples
```bash
# Transfer data to dynamo
dynago transfer

# Transfer data to tables with prefix
dynago transfer --prefix exported-

# Transfer data to local dynamo and custom region
dynago transfer --endpoint http://localhost --region us-east-1

# Transfer data from custom database to local dynamo and custom region
dynago transfer --mongo mongodb://localhost:27017/custom-database --endpoint http://localhost:8000 --region us-west-2

# Clear all temporal data
dynago clear
```

## Info
The script will copy all the data from a MongoDB database into DynamoDB. It will create the tables automatically, as well as new Ids (based in uuid), and then you can run `dynago relate` to update the old _id to new ones.
It will also rename the _id property to id. 
