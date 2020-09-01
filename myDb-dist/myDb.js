"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createDb = createDb;
exports.addTable = addTable;
exports.addEntity = addEntity;
exports.resolveReference = resolveReference;
exports.dump = dump;
exports.denormalize = denormalize;

/**
 * Creates and returns a new myDB database.
 * @param {string} dbName Name of the database
 * @returns {Object} Database object
 */
function createDb(dbName) {
  const db = Object.create(null);
  db._name = dbName;
  db._refs = [];
  return db;
}
/**
 * Creates a new table with the specified tableId and adds it to the database.
 * @param {Object} db Database object
 * @param {string} tableName Table name
 * @returns {Object} Updated database object
 */


function addTable(db, tableName) {
  if (!db) {
    throw 'Invalid database';
  }

  db[tableName] = Object.create(null);
  return db;
}
/**
 * Creates a new entity with the provided entityBody and adds it to the specified table of the database, under an unique entityId.
 * @param {Object} db Database object 
 * @param {string} tableName Table name 
 * @param {string} entityId Entity id 
 * @param {Object} entityBody Entity body
 * @returns {Object} Updated database object
 */


function addEntity(db, tableName, entityId, entityBody) {
  if (!db) {
    throw 'Invalid database';
  }

  if (!db[tableName]) {
    throw 'Invalid table';
  }

  if (db[tableName][entityId]) {
    throw 'Entity already exists';
  }

  const eBody = {};
  Object.keys(entityBody).forEach(k => {
    if (Array.isArray(entityBody[k])) {
      db._refs.push([tableName, entityId, k]);

      eBody[k] = [...entityBody[k]];
    } else {
      eBody[k] = entityBody[k];
    }
  });
  db[tableName][entityId] = eBody;
  return db;
}
/**
 * Resolve the value of a given reference.
 * @param {Object} db Database object
 * @param {string[]} refArr Reference arr [tableName, entityId, fieldName]
 * @returns {Object} Resolved reference object
 */


function resolveReference(db, [tableName, entityId, fieldName] = []) {
  if (!db) {
    throw 'Invalid database';
  }

  if (!tableName || !entityId || !fieldName) {
    throw 'Please specify table name, entity id and attribute name';
  }

  if (!db[tableName]) {
    throw 'Table doesn\'t exist';
  }

  if (!db[tableName][entityId]) {
    throw 'Entity doesn\'t exist';
  }

  if (!db[tableName][entityId][fieldName]) {
    throw 'Field doesn\'t exist';
  }

  return db[tableName][entityId][fieldName];
}
/**
 * Generates a representation of the state of a given database.
 * @param {Object} db Database object
 * @returns {Object} Database object
 */


function dump(db) {
  if (!db) {
    throw 'Invalid database';
  }

  return JSON.parse(JSON.stringify(db));
}
/**
 * Generates a denormalized representation of the state of a given database.
 * @param {Object} db Database object
 * @returns {Object} Database object
 */


function denormalize(db) {
  if (!db) {
    throw 'Invalid database';
  }

  const denormalizedDb = JSON.parse(JSON.stringify(db));

  db._refs.forEach(([tableName, entityId, fieldName]) => {
    denormalizedDb[tableName][entityId][fieldName] = resolveReference(denormalizedDb, denormalizedDb[tableName][entityId][fieldName]);
  });

  return denormalizedDb;
}