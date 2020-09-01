import * as myDb from './myDb';

let db = null;

function beforeEach() {
  db = myDb.createDb('myDatabase');
}

function afterEach() {
  db = null;
  console.log('\n');
}

function test(testName, testFn) {
  beforeEach();
  console.log(`testing => ${testName}`);
  let result;
  let isPassed;
  try {
    ({ result, isPassed } = testFn());
  } catch(e) {
    ({ result, isPassed } = { result: e, isPassed: false });
  }
  console.log(`result => ${result}`);
  console.log(`isPassed => ${isPassed}`);
  afterEach();
}

test('createDb', () => {
  return {
    result: JSON.stringify(db),
    isPassed: !!db && typeof db === 'object' && db._refs && Array.isArray(db._refs) && db._refs.length === 0
  };
});

test('addTable', () => {
  const tName = 'hello';
  myDb.addTable(db, tName);

  return {
    result: JSON.stringify(db),
    isPassed: db?.[tName] && typeof db[tName] === 'object'
  };
});

test('addEntity one field', () => {
  const tName = 'hello';
  myDb.addTable(db, tName);

  const eId = '1';
  const fName = 'name';
  const fVal = 'exampleName';
  myDb.addEntity(db, tName, eId, { [fName]: fVal });
  
  return {
    result: JSON.stringify(db),
    isPassed: db?.[tName]?.[eId]?.[fName] === fVal
  };
});

test('addEntity multi field', () => {
  const tName = 'hello';
  myDb.addTable(db, tName);

  const eId = '1';
  const fNames = ['name1', 'name2'];
  const fVals = ['exampleName1', 'exampleName2'];

  myDb.addEntity(db, tName, eId, { 
    [fNames[0]]: fVals[0], 
    [fNames[1]]: fVals[1]
  });
  
  return {
    result: JSON.stringify(db),
    isPassed: fNames.every((fName, i) => db?.[tName]?.[eId]?.[fName] === fVals[i])
  };
});

test('addEntity multi field w reference', () => {
  const tName = 'employee';
  const refTName = 'company';
  myDb.addTable(db, tName);
  myDb.addTable(db, refTName);

  const eId = '1';
  const fNames = ['name1', 'company'];
  const refEId = '2';
  const refFieldName = 'name';

  const fVals = ['exampleName1', [refTName, refEId, refFieldName]];

  myDb.addEntity(db, tName, eId, { 
    [fNames[0]]: fVals[0], 
    [fNames[1]]: fVals[1]
  });
  
  return {
    result: JSON.stringify(db),
    isPassed: db._refs[0][0] === tName && db._refs[0][1] === eId && db._refs[0][2] === fNames[1] && fNames.every((fName, i) => (db?.[tName]?.[eId]?.[fName] === fVals[i]) || (JSON.stringify(db?.[tName]?.[eId]?.[fName]) === JSON.stringify(fVals[i])))
  };
});

test('addEntity duplicate entity id', () => {
  const tName = 'employee';
  myDb.addTable(db, tName);

  const eId = '1';
  const fName = 'name';
  const fVal = 'exampleName';
  myDb.addEntity(db, tName, eId, { [fName]: fVal });

  let err;
  try {
    myDb.addEntity(db, tName, eId, { [fName]: fVal });
  } catch(e) {
    err = e;
  }

  return {
    result: err,
    isPassed: err === 'Entity already exists'
  };
});

test('resolve reference', () => {
  const tName = 'employee';
  const refTName = 'company';
  myDb.addTable(db, tName);
  myDb.addTable(db, refTName);

  const eId = '1';
  const fNames = ['name1', 'company'];
  
  const refEId = '2';
  const refFieldName = 'name';
  const refFieldVal = 'refName';

  const fVals = ['exampleName1', [refTName, refEId, refFieldName]];

  myDb.addEntity(db, refTName, refEId, { 
    [refFieldName]: refFieldVal
  });

  myDb.addEntity(db, tName, eId, { 
    [fNames[0]]: fVals[0], 
    [fNames[1]]: fVals[1]
  });
  
  return {
    result: JSON.stringify(db),
    isPassed: fNames.every((fName, i) => (db?.[tName]?.[eId]?.[fName] === fVals[i]) || (myDb.resolveReference(db, db?.[tName]?.[eId]?.[fName]) === refFieldVal))
  };
});

test('dump', () => {
  const tName = 'employee';
  const refTName = 'company';
  myDb.addTable(db, tName);
  myDb.addTable(db, refTName);

  const eId = '1';
  const fNames = ['name1', 'company'];
  
  const refEId = '2';
  const refFieldName = 'name';
  const refFieldVal = 'refName';

  const fVals = ['exampleName1', [refTName, refEId, refFieldName]];

  myDb.addEntity(db, refTName, refEId, { 
    [refFieldName]: refFieldVal
  });

  myDb.addEntity(db, tName, eId, { 
    [fNames[0]]: fVals[0], 
    [fNames[1]]: fVals[1]
  });

  const expectedDump = {"_name":"myDatabase","_refs":[["employee","1","company"]],"employee":{"1":{"name1":"exampleName1","company":["company","2","name"]}},"company":{"2":{"name":"refName"}}};
  
  return {
    result: JSON.stringify(db),
    isPassed: JSON.stringify(myDb.dump(db)) === JSON.stringify(expectedDump)
  };
});

test('denormalize', () => {
  const tName = 'employee';
  const refTName = 'company';
  myDb.addTable(db, tName);
  myDb.addTable(db, refTName);

  const eId = '1';
  const fNames = ['name1', 'company'];
  
  const refEId = '2';
  const refFieldName = 'name';
  const refFieldVal = 'refName';

  const fVals = ['exampleName1', [refTName, refEId, refFieldName]];

  myDb.addEntity(db, refTName, refEId, { 
    [refFieldName]: refFieldVal
  });

  myDb.addEntity(db, tName, eId, { 
    [fNames[0]]: fVals[0], 
    [fNames[1]]: fVals[1]
  });

  const expectedDump = {"_name":"myDatabase","_refs":[["employee","1","company"]],"employee":{"1":{"name1":"exampleName1","company":"refName"}},"company":{"2":{"name":"refName"}}};
  
  return {
    result: JSON.stringify(db),
    isPassed: JSON.stringify(myDb.denormalize(db)) === JSON.stringify(expectedDump)
  };
});