/**
 * getInnerKafkaSchema function takes raw written file as input
 * parse unnecessary trails of the file and return
 * inner data only.
 */

const getInnerKafkaSchema = (fileData) => {
  try {
    //checks if schema is defined within Avro's forSchema function call
    const expAvroRGX = /avro\.Type\.forSchema\(/g;
    if (expAvroRGX.test(fileData)) {
      //find schema object within forSchema call
      fileData
        .match(/(?<=avro\.Type\.forSchema\()[\s\S]*?(?=\);)/)[0]
        .trim();

      //check if the argument is a variable name instead of explicitly defined object
      if (fileData[0] !== '{') {
        //find variable definition
        const varDefRegex = new RegExp(
          '(?<=' + fileData + ' =' + ')[\\s\\S]*(?=};)'
        );
        fileData = fileData.match(varDefRegex).join('') + '}';
      }
    }
    return fileData
  } catch (err) {
    console.log(`Error: while getting inner data of kafka stream - ${err}`)
    return
  }

}

/**
 * ParseKafkaSchema function takes read file of kafkaschema as input
 * recursively collect data that will be used in writing
 * graphql Schema
 */
const parseKafkaSchema = (fileData) => {
  try {
    let res = [];
    function backtrack(newObj) {
      let tmpArr = [];
      //check if the curr obj is an array instance
      if (Array.isArray(newObj)) {
        //iterate and check for object type at each idx
        for (let k = 0; k < newObj.length; k++) {
          if (typeof newObj[k] === 'object') {
            //recursive call
            backtrack(newObj[k]);
            return;
          }
        }
      } else {
        if (newObj.type) {
          if (newObj.type === 'record' || newObj.type === 'enum') {
            if (newObj.name) {
              tmpArr.push(newObj.name);
              if (newObj.fields) {
                for (let j = 0; j < newObj.fields.length; j++) {
                  let tmpFieldEle = newObj.fields[j];
                  if (typeof tmpFieldEle.type === 'object') {
                    backtrack(tmpFieldEle.type);
                  }
                  tmpArr.push(tmpFieldEle);
                }
              } else if (newObj.symbols) {
                tmpArr.push(newObj.symbols);
              } else {
                console.log(
                  'Syntax error with kafka stream producer schema: missing both fields and symbols'
                );
              }
            } else {
              console.log(
                'Syntax error with kafka stream producer schema: missing both name and items'
              );
            }
          } else {
            if (newObj.items) {
              backtrack(newObj.items);
              return;
            }
          }
        }

        res.push(tmpArr);
      }
    }
    backtrack(JSON.parse(fileData));

    return (res);
  } catch (err) {
    console.log(
      'Error: there was an issue finding, reading, or parsing the schema'
    );
    return
  }
};

/**
 * formatGQLSchema takes collected data from 'parseKafkaStream' function
 * and topic names and types from configuration
 * and return reformatted script which will be used to write
 * graphql schema file
 */
const formatGQLSchema = (newData, config) => {
  try {
    // Pull out name of topics and types from config file
    const topic = config.topics[0];
    const type = config.topicTypes[0];

    let result = `const { gql } = require('apollo-server-express');

module.exports = gql\`
type Query {
  exampleQuery: String!
}
type Subscription {
  ${topic}: ${type}
}\n`;

    for (let i = newData.length - 1; i >= 0; i--) {
      let toAppend = '';
      let prefix = 'type';

      if (Array.isArray(newData[i][1])) {
        prefix = 'enum';
      }

      toAppend += `${prefix} ${newData[i][0]} { \n`;

      for (let j = 1; j < newData[i].length; j++) {
        const currProp = newData[i][j];
        if (prefix !== 'enum') {
          const typeDef = String(currProp.type);
          let currType = `${typeDef[0].toUpperCase().concat(typeDef.slice(1))}`;

          if (currType[0] === 'N') {
            //define array of custom types if Null
            currType = `[${currProp.type[1].items[1].name}]`;
            toAppend += `  ${currProp.name}: ${currType} \n`;
          } else if (currType[0] === '[') {
            //define custom type
            currType = `${currProp.type.name}`;
            toAppend += `  ${currProp.name}: ${currType} \n`;
          } else {
            toAppend += `  ${currProp.name}: ${currType} \n`;
          }
        } else {
          //iterate through values in array and add to toAppend
          for (let k = 0; k < newData[i][j].length; k++) {
            toAppend += `  ${newData[i][j][k]}\n`;
          }
        }
      }
      toAppend += '}\n';
      result += toAppend;
    }
    result += '`;';
    return result

  } catch (err) {
    console.log(`Error: while formatting final data for graphQL schema - ${err}`)
    return
  }
};

module.exports = {
  parseKafkaSchema,
  formatGQLSchema,
  getInnerKafkaSchema
}