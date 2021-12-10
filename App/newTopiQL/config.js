// User Configuration File for Kafka - GraphQL connection using topiQL library
const username = 'JUJA6GJGJCDSUYOP'
const password = '1XIN/fry4johm7kHhZ+n88jeKc11xJR3G07QXzfRmtnKA/f+s7mcbdkdvRIi/ixc'

const sasl =
  username && password ? { username, password, mechanism: 'plain' } : null;
const ssl = !!sasl;

module.exports = {
  topics: ['status'],
  clientId: 'kafQL',
  brokers: ['pkc-lzvrd.us-west4.gcp.confluent.cloud:9092'],
  ssl,
  sasl,
  connectionTimeout: 3000,
  authenticationTimeout: 1000,
  reauthenticationThreshold: 10000,
  schemaFile: '../data/testData/avscSample.avsc',
  destinationFolder: '../server/topiQL'
};
