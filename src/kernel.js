

function templateEngine(template, data) {
  return template.replace(/#(\w+)/g, (match, p1) => {
    return data[p1] !== undefined ? data[p1] : match;
  });
}

core.CreateUUID = async () => {
  return uuidv4();
}

core['HTMLView`TemplateProcessor'] = async (args, env) => {
  const obj = await interpretate(args[0], env);
  env.htmlString = templateEngine(env.htmlString, obj);
}

core['HTMLView`InlineJSModule'] = async (args, env) => {
  let str = await interpretate(args[0], env);

  if (str.includes('<script>')) {
    str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  const newScript = document.createElement("script");
  newScript.appendChild(document.createTextNode('{\n'+str+'\n}'));

  env.element.appendChild(newScript);
}

core.HTMLView = async (args, env) => {
  
  let html = await interpretate(args[0], env);
  //env.uiInstanceId = uuidv4();
  const options = await core._getRules(args, {...env, hold:true});

  if (Array.isArray(html)) html = html.join('\n');

  env.htmlString = html;


  

  if ('Prolog' in options) {
    await interpretate(options.Prolog, env);
  }

  //html = replaceContextPlaceholders(html, {env: env});

  const element = await setInnerHTMLAsync(env.element, env.htmlString);

  if ('Epilog' in options) {
    console.log('Epilog');
    await interpretate(options.Epilog, {...env, element: element});
  }
}   


core.Prolog = () => "Prolog"
core.Epilog = () => "Epilog"

core["Notebook`Kernel`Inputs`Private`HandleGroup"] = async (args, env) => {
  const data = await interpretate(args[0], {...env, hold:true});

  const doc = env.element.querySelectorAll('[data-type="group"]')[0];
  for (const fe of data) {
      const el = document.createElement('div');
      doc.appendChild(el);
      await interpretate(fe, {...env, element: el});
  }
}

core["Notebook`Kernel`Inputs`Private`InternalElementUpdate"] = async (args, env) => {
  const data = await interpretate(args[0], env);
  const name = await interpretate(args[1], env);
  const field = await interpretate(args[2], env);

  env.local.element = env.element.querySelectorAll(`[data-type="${name}"]`)[0];
  env.local.field   = field;
  env.local.element[field] = data;
}

core["Notebook`Kernel`Inputs`Private`InternalElementUpdate"].update = async (args, env) => {
  const data = await interpretate(args[0], env);
  env.local.element[env.local.field] = data;
}

core["Notebook`Kernel`Inputs`Private`InternalElementUpdate"].destroy = () => {
  console.log('InternalElementUpdate destroyed!');
}

core["Notebook`Kernel`Inputs`Private`InternalElementUpdate"].virtual = true;

core.InternalWLXDestructor = async (args, env) => {
    const uid = await interpretate(args[0], env);
    env.local.uid = uid;
    console.log('Registered an instance');
}

core.InternalWLXDestructor.destroy = async (args, env) => {
    console.log(env.local.uid);
    if (!core.InternalWLXDestructor[env.local.uid])
    (core.InternalWLXDestructor[env.local.uid])(env);
    console.log('Removed an instance');
}

core.InternalWLXDestructor.virtual = true

core.InternalHandleGroup = async (args, env) => {
    const uid = await interpretate(args[0], env);
    const data = await interpretate(args[1], {...env, hold:true});

    const doc = document.getElementById(uid);
    for (const fe of data) {
        const el = document.createElement('div');
        doc.appendChild(el);
        await interpretate(fe, {...env, element: el});
    }
}

core.InternalHandleTextView = async (args, env) => {
    const data = await interpretate(args[0], env);
    const uid = await interpretate(args[1], env);

    env.local.element = document.getElementById(uid);
    env.local.element.value = data; 
}

core.InternalHandleTextView.update = async (args, env) => {
    const data = await interpretate(args[0], env);
    env.local.element.value = data;
}

core.InternalHandleTextView.destroy = async (args, env) => {
    console.log('InternalHandleTextView destroyed!');
 
}

core.InternalHandleTextView.virtual = true;

core.InternalHandleHTMLView = async (args, env) => {
    const data = await interpretate(args[0], env);
    const uid = await interpretate(args[1], env);

    env.local.element = document.getElementById(uid);
    env.local.element.innerHTML = data; 
}

core.InternalHandleHTMLView.update = async (args, env) => {
    const data = await interpretate(args[0], env);
    env.local.element.innerHTML = data;
}

core.InternalHandleHTMLView.destroy = async (args, env) => {
    console.log('InternalHandleHTMLView destroyed!');
}

core.InternalHandleHTMLView.virtual = true;

window.base64ArrayBuffer = (arrayBuffer) => {
    var base64    = ''
    var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

    var bytes         = new Uint8Array(arrayBuffer)
    var byteLength    = bytes.byteLength
    var byteRemainder = byteLength % 3
    var mainLength    = byteLength - byteRemainder

    var a, b, c, d
    var chunk

    // Main loop deals with bytes in chunks of 3
    for (var i = 0; i < mainLength; i = i + 3) {
      // Combine the three bytes into a single integer
      chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

      // Use bitmasks to extract 6-bit segments from the triplet
      a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
      b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
      c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
      d = chunk & 63               // 63       = 2^6 - 1

      // Convert the raw binary segments to the appropriate ASCII encoding
      base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
    }

    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
      chunk = bytes[mainLength]

      a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

      // Set the 4 least significant bits to zero
      b = (chunk & 3)   << 4 // 3   = 2^2 - 1

      base64 += encodings[a] + encodings[b] + '=='
    } else if (byteRemainder == 2) {
      chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

      a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
      b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4

      // Set the 2 least significant bits to zero
      c = (chunk & 15)    <<  2 // 15    = 2^4 - 1

      base64 += encodings[a] + encodings[b] + encodings[c] + '='
    }

    return base64
}


let Handsontable;
//import "handsontable/dist/handsontable.min.css";
//import "pikaday/css/pikaday.css";

const dataset = {};

dataset['TypeSystem`Vector'] = async (args, env) => {
  const structure = await interpretate(args[0], env);
  const number = await interpretate(args[1], env);

  return {structure: structure, number:number, vector: true};
}

dataset['TypeSystem`AnyLength'] = () => {}

dataset['TypeSystem`Tuple'] = (args, env) => interpretate(args[0], env)


dataset['TypeSystem`Assoc'] = async (args, env) => {
  console.error(args);
  const keys = await interpretate(args[0], env);
  const data = await interpretate(args[1], env);

  console.warn(keys);

  const obj = {};

  if (!Array.isArray(keys)) {
    return data;
  }
  
  if (Array.isArray(data)) {
    keys.forEach((key, index) => {
      obj[key] = data[index];
    });    
  } else {
    keys.forEach((key, index) => {
      obj[key] = data;
    });    
  }

  return obj  
}

dataset['TypeSystem`Struct'] = async (args, env) => {
  const keys = await interpretate(args[0], env);
  const values = await interpretate(args[1], env);

  const obj = {};
  keys.forEach((key, index) => {
    if (Array.isArray(values[index])) {
      //list of options
      console.warn('KEY');
      console.warn(values[index]);
      if (typeof values[index][0] === 'object' || typeof values[index][0] === 'function') {
        obj[key] = values[index];
      } else {
        obj[key] = async function(data, env, element) {
          element.classList.add('font-medium', 'selectable');
          element.innerText = await interpretate(data, env);
        };
      }
      /**/
      
    } else {
      //if this is a function - easy
      obj[key] = values[index];
    }
  });

  return obj
}

const atoms = {};

dataset['TypeSystem`Atom'] = async (args, env) => {
  /*if (!(args[0] in atoms) && args[0] !== 'TypeSystem`Atom') {
    //throw args;
    return await dataset['TypeSystem`AnyType'](args[0].slice(1), {...env, context:atoms}); 
  }*/
  return await interpretate(args[0], {...env, context:atoms}); 
} 

atoms['List'] = core.List 

atoms['TypeSystem`Enumeration'] = async (args, env) => {
  const keys = args.map((key) => interpretate(key, env));
  //constole.log(keys);
  return keys;
}

atoms['Integer'] = async (args, env) => {return (
  async function (data, env, element) {
    //console.warn(data);
    const value = await interpretate(data, env);
    element.classList.add('selectable');
    element.innerText = value;
  }
)};

atoms['Real'] = atoms['Integer'] 

atoms['String'] = async (args, env) => {return (
  async function (data, env, element) {
    const value = await interpretate(data, env);
    element.classList.add('selectable');
    element.innerText = value;
  }
)};

atoms['TypeSystem`Boolean'] = async (args, env) => { return(
  async function (data, env, element) {
    const value = await interpretate(data, env);
    if (value) element.innerText = '✅'; else element.innerText = '❌';
  } 
)}

atoms['DateObject'] = async (args, env) => {return (
  async function (data, env, element) {
    //console.warn(data);
    const value = await interpretate(data[1], env);
    const date = new Date(
      value[0],
      value[1] - 1, // JS months are 0-based
      value[2],
      value[3],
      value[4],
      value[5]
    );

    element.classList.add('text-xs', 'text-center', 'text-gray-800', 'selectable');
    const timeElement = document.createElement('div');
    timeElement.innerText = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    element.appendChild(timeElement);

    const dateElement = document.createElement('span');
    dateElement.innerText = date.toLocaleDateString();
    element.appendChild(dateElement);    
  }
)};


atoms['Graphics'] = () => {return (
  async function (data, contextEnv, element, store) {
    //check by hash if there such object, if not. Ask server to create one with EditorView and store.
    contextEnv.heavyLoad = true;

    let env = {global: {}, element: element}; 
 

    console.log('frontend executable');

      
    const copy = env;
    
    const instance = new ExecutableObject('dataset-stored-'+uuidv4(), copy, data, true);
    instance.assignScope(copy);
      
    instance.execute();
    store.instances.push(instance);
    
    //element.classList.add('frontend-view');
  }
)};

atoms['Graphics3D'] = atoms['Graphics'];
atoms['Image'] =  atoms['Graphics'];

dataset['TypeSystem`AnyType'] = () => {return (
  async function (data, contextEnv, element, store) {
    //check by hash if there such object, if not. Ask server to create one with EditorView and store.
    contextEnv.heavyLoad = true;

    const hash = String(interpretate.hash(data));

    if (!(hash in ObjectHashMap)) {
      console.warn('Creating FE object by id '+hash);
      const command = [
        'Notebook`Kernel`Inputs`DatasetMakeBox',
        data,
        '"'+hash+'"'
      ];

      server.kernel.send(`ImportString["${encodeURIComponent(JSON.stringify(command))}"//URLDecode, "ExpressionJSON"]`);
    }

    let env = {global: {}, element: element}; 
    console.log("Dataset: creating an object");


    console.log('frontend executable');

    let obj;
    console.log('check cache');
    if (ObjectHashMap[hash]) {
        obj = ObjectHashMap[hash];
    } else {
        obj = new ObjectStorage(hash);
        obj.doNotCollect = true;
        store.objects.push(obj);
    }
    
    console.log(obj);
      
    const copy = env;
    const storage = await obj.get();
    const instance = new ExecutableObject('dataset-stored-'+uuidv4(), copy, storage, true);
    instance.assignScope(copy);
    obj.assign(instance);
      
    instance.execute();
    store.instances.push(instance);
    
    //element.classList.add('frontend-view');
  }
)};


core.Dataset = async (args, env) => {
  const options = await core._getRules(args, env);
  console.log(env.options);

  const data = await interpretate(args[0], {...env, hold:true});
  console.log(args[1]);
  let types = await interpretate(args[1], {...env, context: dataset});
  
  //console.log(data);
  console.warn(types);
  
  let headerCols;
  let headerRows;

  let rows = [];
  let rowTypes;

  const rowsReprocess = async (d) => {
    let newRows;
    if (Array.isArray(d)) {
      
      await Promise.all(d.map(async (item, index) => {
        if (item[0] != 'Association' && item[0] != 'List') {
          d[index] = item; //Skip if it is 1D array
        } else {
          d[index] = await interpretate(item, {...env, hold:true});
        }
      }));
  
      if (Array.isArray(d[0])) {
        if(options.TableHeadings) {
          headerCols = options.TableHeadings
        }

        newRows = await Promise.all(d.map(async (row) => {
          return Promise.all(row.map(async (cell) => cell));
        }));
        
      } else {
        if (typeof types.structure === 'function' || Array.isArray(types)) {
          newRows = d.map((e) => [e]);
        } else {
          headerCols = Object.keys(d[0]);

          newRows = await Promise.all(d.map(async (row) => {
            return Promise.all(headerCols.map(async (col) => row[col]));
          }));
        }
      }
    } else {
      headerRows = Object.keys(d);
      newRows = await Promise.all(headerRows.map(async (row) => await interpretate(d[row], {...env, hold:true})));    
  
      if (Array.isArray(newRows[0])) {
        
        
        newRows = await Promise.all(newRows.map(async (row) => {
          return Promise.all(row.map(async (cell) => cell));
        }));
      } else {
        headerCols = Object.keys(newRows[0]);

        newRows = await Promise.all(newRows.map(async (row) => {
          return Promise.all(headerCols.map(async (col) => row[col]));
        }));
      }
    }

    return newRows;
  }

  if (Array.isArray(data)) {
    await Promise.all(data.map(async (item, index) => {
      if (item[0] != 'Association' && item[0] != 'List') {
        data[index] = item; //Skip if it is 1D array
      } else {
        data[index] = await interpretate(item, {...env, hold:true});
      }
    }));

    if (Array.isArray(data[0])) {
      if(options.TableHeadings) {
        headerCols = options.TableHeadings
      }

      rows = await Promise.all(data.map(async (row) => {
        return Promise.all(row.map(async (cell) => cell));
      }));

      rowTypes = (i,j, data, env, element, store) => {
        if (Array.isArray(types.structure)) {
  
          types.structure[j](data, env, element, store);
        } else { 
          types.structure.structure(data, env, element, store);
        }
      }
      
    } else {
      if (typeof types.structure === 'function' || Array.isArray(types)) {
        //prbably 1D array
        if (Array.isArray(types)) {
          rowTypes = (i,j, data, env, element, store) => {
            console.warn(types[j]);
            return types[i](data, env, element, store)
          }
        } else {
          rowTypes = (i,j, data, env, element, store) => {
            return types.structure(data, env, element, store)
          }
        }
        rows = data.map((e) => [e]);
      } else {
        headerCols = Object.keys(data[0]);

        rowTypes = (i,j, data, env, element, store) => types.structure[headerCols[j]](data, env, element, store);
      
        rows = await Promise.all(data.map(async (row) => {
          return Promise.all(headerCols.map(async (col) => row[col]));
        }));
      }
    }
  } else {
    headerRows = Object.keys(data);
    console.error(data);
    let oneDimArrayQ = false;
    rows = await Promise.all(headerRows.map(async (row) => {
      if (data[row][0] != 'Association' && data[row][0] != 'List') {
        console.log(data[row]);
        oneDimArrayQ = true;
        return data[row]; //probably 1D array
      } else {
        return await interpretate(data[row], {...env, hold:true})
      }
      
    })); 

    console.log(oneDimArrayQ);
    
    if (oneDimArrayQ) {
      rows = rows.map((el) => [el]);
    }

    if (Array.isArray(rows[0])) {

      if (oneDimArrayQ) { //fixme!!!
      
        //console.error({types, headerRows});

        if (!Array.isArray(types) && headerRows.length == 1) { //fixme!
          console.warn('Dirty fix applied for single-key items. I hate you Wolfram!');
          const copy = types;
          types = {};
          types[headerRows[0]] = copy;
        }

        
        
        rowTypes = (i,j, data, env, element, store) => {
         // console.warn({types, headerRows});
         let  type = types[headerRows[i]];
         if (!type) type = types;

         if (type.structure) {
          if (Array.isArray(data)) {
            //throw({data, t: types[headerRows[i]]});
            //return types[headerRows[i]].structure(data[j], env, element, store);
            const nestedTable = document.createElement('table');
            const nestedBody = document.createElement('tbody');
            nestedTable.appendChild(nestedBody);

            if (data.length < 5) {
              const nestedRow = document.createElement('tr');

              data.forEach((el) => {
                const nestedCell = document.createElement('td');
                nestedRow.appendChild(nestedCell);
                type.structure(el, env, nestedCell, store);
              });

              nestedBody.appendChild(nestedRow);
              
            } else {
              

              data.forEach((el) => {
                const nestedRow = document.createElement('tr');
                const nestedCell = document.createElement('td');
                nestedRow.appendChild(nestedCell);
                nestedBody.appendChild(nestedRow);
                type.structure(el, env, nestedCell, store);
              });
            }

            element.appendChild(nestedTable);

            return;            
          } else {
            return type.structure(data, env, element, store);
          }
          //return '';
        } else {
          //return 'Fuck';
          if (Array.isArray(type)) {
            //console.warn({data, t: types[headerRows[i]]})
            if (Array.isArray(data)) {
              //throw({data, t: types[headerRows[i]]});
              const nestedTable = document.createElement('table');
              const nestedBody = document.createElement('tbody');
              nestedTable.appendChild(nestedBody);
  
              if (data.length < 5) {
                const nestedRow = document.createElement('tr');
  
                data.forEach((el) => {
                  const nestedCell = document.createElement('td');
                  nestedRow.appendChild(nestedCell);
                  type[j](el, env, nestedCell, store);
                });
  
                nestedBody.appendChild(nestedRow);
                
              } else {
                
  
                data.forEach((el) => {
                  const nestedRow = document.createElement('tr');
                  const nestedCell = document.createElement('td');
                  nestedRow.appendChild(nestedCell);
                  nestedBody.appendChild(nestedRow);
                  type[j](el, env, nestedCell, store);
                });
              }
  
              element.appendChild(nestedTable);
  
              return;
            } else {
              return type[j](data, env, element, store)
            }
          } else {
            //console.warn(types);
            //console.warn(headerRows);
            //throw(types[headerRows[i]]);
            //if (typeof types[headerRows[i]] == 'function') {
              return type(data, env, element, store)
            //} 
            console.warn(types);
            console.warn(headerRows);
            console.warn(typeof types[headerRows[i]]);
            console.error('Unknown structure in data types!');
            return '';
          }

        }};

      } else {

        rowTypes = (i,j, data, env, element, store) => {
          let  type = types[headerRows[i]];
          if (!type) type = types;

        if (type.structure) {
          

          if (Array.isArray(data)) {
            const nestedTable = document.createElement('table');
            const nestedBody = document.createElement('tbody');
            nestedTable.appendChild(nestedBody);

            if (data.length < 5) {
              const nestedRow = document.createElement('tr');

              data.forEach((el) => {
                const nestedCell = document.createElement('td');
                nestedRow.appendChild(nestedCell);
                type.structure(el, env, nestedCell, store);
              });

              nestedBody.appendChild(nestedRow);
              
            } else {
              

              data.forEach((el) => {
                const nestedRow = document.createElement('tr');
                const nestedCell = document.createElement('td');
                nestedRow.appendChild(nestedCell);
                nestedBody.appendChild(nestedRow);
                type.structure(el, env, nestedCell, store);
              });
            }

            element.appendChild(nestedTable);

            return;

            //return types[headerRows[i]].structure(data, env, element, store);
          } else {
            return type.structure(data, env, element, store);
          }
          //return '';
        } else {
          //return 'Fuck';
          if (Array.isArray(type)) {
            return type[j](data, env, element, store)
          } else {
            console.warn(types);
            console.warn(headerRows);
            console.error('Unknown structure in data types!');
            return '';
          }

        }};        
      }

      rows = await Promise.all(rows.map(async (row) => {
        return Promise.all(row.map(async (cell) => cell));
      }));
    } else {
      headerCols = Object.keys(rows[0]);

      if (oneDimArrayQ) {
        console.log('1D');
        /*if (!headerCols.length) {
          headerCols = Object.keys(types);
        }
        rows = rows.map((el, index) => {
          const virtual = {};
          virtual[headerCols[index]] = el;
          return virtual;
        });*/
      }

      console.warn(headerCols);
      console.warn(types);
      rowTypes = (i,j, data, env, element, store) => types[headerCols[j]](data, env, element, store);
      rows = await Promise.all(rows.map(async (row) => {
        return Promise.all(headerCols.map(async (col) => row[col]));
      }));

      console.log(rows);
    }
  }

  const element = env.element;
  element.classList.add(...("sm-controls cursor-default rounded-md 0 py-1 pl-3 bg-gray-100 pr-2 text-left text-gray-500 ring-1 ring-inset ring-gray-400 text-xs".split(' ')));

  const container_1 = document.createElement('div');
  container_1.classList.add(...("-m-1.5 overflow-x-auto".split(' ')));
  
  const container_2 = document.createElement('div');
  container_2.classList.add(...("p-1.5 inline-block align-middle".split(' ')));  

  const container_3 = document.createElement('div');
  container_3.classList.add("overflow-hidden"); 

  const table = document.createElement('table');
  table.classList.add(...("block max-h-60 overflow-y-scroll sc-b pr-2 divide-y divide-gray-200".split(' ')));  

  if (options.ImageSize) {
    if (Array.isArray(options.ImageSize)) {
        if (typeof options.ImageSize[0] === 'number') table.style.width = options.ImageSize[0] + 'px';
        if (typeof options.ImageSize[1] === 'number') table.style.height = options.ImageSize[1] + 'px';
    } else {
        if (typeof options.ImageSize === 'number') table.style.width = options.ImageSize + 'px';
    }
  }

  let thead;

  if (headerCols) {
    thead = document.createElement('thead');
    thead.classList.add(...("sticky top-0 bg-gray-100".split(' ')));
    const tr = document.createElement('tr');
    thead.appendChild(tr);

    if (headerRows) {
      const th = document.createElement('th');
      th.classList.add(...("px-2 py-1 text-start text-xs font-medium text-gray-500 uppercase".split(' '))); 
      tr.appendChild(th);
    }

    headerCols.forEach((c) => {
      const th = document.createElement('th');
      th.classList.add(...("px-2 py-1 text-start text-xs font-medium text-gray-500 uppercase".split(' '))); 
      th.innerText = c;
      tr.appendChild(th);
    });
  }

  const tbody = document.createElement('tbody');
  tbody.classList.add(...("max-h-10 divide-y divide-gray-200".split(' ')));

  let rowsDOM;

  const store = {
    instances: [],
    objects: []
  };

  env.local.store = store;

  let totalLength = 0;
  let totalOffset = 0;
  let currentPart = 0;
  let totalParts = 1;

  let offset = 0;
  let page = 0;
  const windowSize = 50;
  const extendSize = 20;
  const pageSize = 200;
  const threshold = 15;
  
  const viewPort = {};

  let pagination = Math.ceil(rows.length / pageSize);

  viewPort.rebuild = (rows, window = 50) => {    
    store.instances.forEach((el) => el.dispose());
    store.instances = [];
    
    rowsDOM = undefined;
    //offset = offset;
    tbody.replaceChildren();
    
    viewPort.update(rows, window, page)
  };
  
  viewPort.update = (rows, window = 50) => {    
    if (!rowsDOM) {
      rowsDOM = new Array(window).fill(null);
    }

    viewPort.operate(rows, 0, window, page * pageSize, (row, i) => {
      if (rowsDOM[i]) {
        tbody.replaceChild(row, rowsDOM[i]);
      } else {
        tbody.appendChild(row);
      }

      rowsDOM[i] = row;      
    });
    
  }

  viewPort.extend = (rows, number) => {
    offset += number;
    
    viewPort.operate(rows, windowSize + offset - number, windowSize + offset, page * pageSize, (row, i) => {
      tbody.appendChild(row);
      rowsDOM.push(row);      
    });
  }



  viewPort.operate = (rows, initial, window, offset, effect) => {
    for (let i=initial; i<window && (i+offset)<rows.length; ++i) {
      const row = document.createElement('tr');
      row.classList.add("hover:bg-gray-200");

      if (headerRows) {
        const td = document.createElement('td');
        td.classList.add(...("px-2 py-1 whitespace-nowrap text-sm font-medium text-gray-800".split(' ')));
        td.innerText = headerRows[i+offset];
        row.appendChild(td);
      }

      rows[i+offset].forEach((cell, index) => {
        const td = document.createElement('td');
        td.classList.add(...("px-2 py-1 whitespace-nowrap text-sm text-gray-800".split(' ')));
        //console.warn({pos: i+offset, index, cell});
        rowTypes(i+offset, index, cell, env, td, store);
        row.appendChild(td);      
      });   

      effect(row, i)
    }    
  }

  offset = 0;
  viewPort.rebuild(rows, windowSize);

  container_1.appendChild(container_2);
  container_2.appendChild(container_3);
  container_3.appendChild(table);
  if (thead) table.appendChild(thead);
  table.appendChild(tbody);

  if (pagination > 1) {
    const paginator = document.createElement('div');
    paginator.classList.add(...('py-1 border-solid items-center h-6 px-1 mb-1 w-full flex flex-row-reverse gap-x-2'.split(' ')));
    paginator.style.borderTop = "1px solid #999";
    const prevButton = document.createElement('button');
    prevButton.style.transform = "rotate(180deg)";
    prevButton.innerHTML = `<svg class="w-3 h-3 text-gray-500 hover:text-gray-400" viewBox="0 0 24 24" fill="none" >
<path fill-rule="evenodd" clip-rule="evenodd" d="M5.46484 3.92349C4.79896 3.5739 4 4.05683 4 4.80888V19.1911C4 19.9432 4.79896 20.4261 5.46483 20.0765L19.1622 12.8854C19.8758 12.5108 19.8758 11.4892 19.1622 11.1146L5.46484 3.92349ZM2 4.80888C2 2.55271 4.3969 1.10395 6.39451 2.15269L20.0919 9.34382C22.2326 10.4677 22.2325 13.5324 20.0919 14.6562L6.3945 21.8473C4.39689 22.8961 2 21.4473 2 19.1911V4.80888Z" fill="currentColor"/>
</svg>`;

    const toStart = document.createElement('button');
    
    toStart.innerHTML = `<svg class="w-3 h-3 text-gray-500 hover:text-gray-400" viewBox="0 0 24 24" fill="none" >
<path fill-rule="evenodd" clip-rule="evenodd" d="M18.3956 19.7691C19.0541 20.2687 20 19.799 20 18.9724L20 5.02764C20 4.20106 19.0541 3.73137 18.3956 4.23095L9.20476 11.2033C8.67727 11.6035 8.67727 12.3965 9.20476 12.7967L18.3956 19.7691ZM22 18.9724C22 21.4521 19.1624 22.8612 17.1868 21.3625L7.99598 14.3901C6.41353 13.1896 6.41353 10.8104 7.99599 9.60994L17.1868 2.63757C19.1624 1.13885 22 2.5479 22 5.02764L22 18.9724Z" fill="currentColor"/>
<path d="M2 3C2 2.44772 2.44772 2 3 2C3.55228 2 4 2.44772 4 3V21C4 21.5523 3.55228 22 3 22C2.44772 22 2 21.5523 2 21V3Z" fill="currentColor"/>
</svg>`;    

    const toEnd = document.createElement('button');
    toEnd.style.transform = "rotate(180deg)";
    toEnd.innerHTML = toStart.innerHTML;     

    const nextButton = document.createElement('button');
    nextButton.innerHTML = prevButton.innerHTML;   

    const progress = document.createElement('span');
    progress.classList.add('mr-auto');

    totalLength = rows.length;
    totalOffset = 0;

    const updateField = (page) => {
      const current = Math.min((page + 1) * pageSize + totalOffset, totalLength);
      progress.innerText = `${current}/${totalLength}`;
    }

    

    paginator.appendChild(toEnd);
    paginator.appendChild(nextButton);
    paginator.appendChild(prevButton);
    paginator.appendChild(toStart);

    paginator.appendChild(progress);

    if (env.options) if (env.options.Parts) {
      const warning = document.createElement('span');
      warning.innerText = "Data is partially on Kernel";
      paginator.appendChild(warning);
      totalLength = env.options.Total;
      totalParts  = env.options.Parts;

      env.local.callback = () => {};
      env.local.event = env.options.RequestEvent;

      core[env.options.RequestCallback] = async (args) => {
        //console.error(args);
        const t = await interpretate(args[0], {...env, hold:true});
        env.local.callback(t);
      }
    };

    updateField(0);

    let block = false;

    
    toStart.addEventListener('click', ()=>{
      if (block) return;
      page = 0;
      offset = 0;
      viewPort.rebuild(rows, windowSize);
      updateField(page);
      table.scrollTop = 0;
    });

    toEnd.addEventListener('click', ()=>{
      if (block) return;
      page = pagination - 1;
      offset = 0;
      viewPort.rebuild(rows, windowSize);
      updateField(page);
      table.scrollTop = table.scrollHeight - table.clientHeight - 10;
    });

    nextButton.addEventListener('click', ()=>{
      if (block) return;
      if (page === pagination - 1) {

        if (currentPart === totalParts - 1) return;
        currentPart = currentPart + 1;
        totalOffset += rows.length;

        page = 0;
        offset = 0;

        //callback
        env.local.callback = async (data) => {
          //console.error(data);
          rows = await rowsReprocess(data);
          pagination = Math.ceil(rows.length / pageSize);

          viewPort.rebuild(rows, windowSize);
          updateField(page);
          table.scrollTop = 0;
          block = false;
        };

        //request new page
        block = true;
        //console.log();
        server.kernel.emitt(env.local.event, currentPart + 1);

        return;
      }

      page += 1;
      offset = 0;
      viewPort.rebuild(rows, windowSize);
      updateField(page);
      table.scrollTop = 0;
    });

    prevButton.addEventListener('click', ()=>{
      if (block) return;

      if (page === 0) {
        if (currentPart === 0) return;
        currentPart = currentPart - 1;
        totalOffset -= rows.length;

        page = 0;
        offset = 0;

        //callback
        env.local.callback = async (data) => {
          //console.error(data);
          rows = await rowsReprocess(data);
          pagination = Math.ceil(rows.length / pageSize);

          viewPort.rebuild(rows, windowSize);
          updateField(page);
          table.scrollTop = 0;
          block = false;
        };

        //request new page
        block = true;
        //console.log();
        server.kernel.emitt(env.local.event, currentPart + 1);

        return;
      }

      page -= 1;
      offset = 0;
      viewPort.rebuild(rows, windowSize);
      updateField(page);
      table.scrollTop = table.scrollHeight - table.clientHeight - 10;
    });    
    
    
    
    container_1.appendChild(paginator);
  }


  table.addEventListener('scroll', () => {
    //console.log([table.scrollTop + table.clientHeight, table.scrollHeight]);
    if (table.scrollTop + table.clientHeight >= table.scrollHeight - 10.0) {
      if (offset + windowSize >= pageSize) return;
      
      let size = extendSize;
      if (size + offset + windowSize >= rows.length) {
        size = rows.length - windowSize - offset;
      }
      console.log('scroll overflow');

      if (size >= 0)
        viewPort.extend(rows, size);
    }
  });

  element.appendChild(container_1);
}

core.Dataset.destroy = (args, env) => {
  env.local.store.instances.forEach((el) => {
    el.dispose();
  });
  
  env.local.store.objects.forEach((el) => {
    el.doNotCollect = false;
    el.garbageCollect();
  });
}

core.Dataset.virtual = true

core.Missing = () => undefined

core.TableHeadings = () => "TableHeadings"

core.HandsontableView = async (args, env) => {
    if (!Handsontable) Handsontable = (await import("handsontable")).default;
    console.log(Handsontable);

    let loadData = async () => 'EOF';

    const options = await core._getRules(args, env);
    const height = options.Height || 200;

    const width = options.Width || 500;

    if (options.Loader) {
        loadData = async (offset, window) => {
          console.log('ASk server!!!!!111');
          const raw = await server.kernel.ask(options.Loader + "[" + (offset+1) + "," + window + "]");
          console.log(raw);
          const newData = await interpretate(raw, env);
    
          if (typeof newData == 'string') return 'EOF';
          return [newData.length, newData];
        }        
    }    

    const parent = env.element;
    parent.classList.add('font-sm', 'sm-controls');
    parent.style.display = "inline-block";
    //parent.style.height = '100%';
    //parent.style.width = '100%';

    const example = document.createElement('div');
    parent.appendChild(example);

    example.position = "relative";
    example.display = "block";

    const bufferMaxSize = options.Overlay || 150;
    const shift = options.Buffer || 50;

    let initial = await interpretate(args[0], env);

    //fetch fresh data if available
    if (server.kernel) {
        const raw = await server.kernel.ask(options.Loader + "[" + (1) + "," + initial.length + "]");
        console.log(raw);
        if (raw[0] === 'List') {
            initial = await interpretate(raw, env);
        }
    }
    let bufferSize = Math.min(initial.length, bufferMaxSize);

    const cols = [];
    if (options.Heading) {

    } else {
        initial[0].forEach(() => {
            cols.push({type: 'numeric'});
        })
    }

    let offset = 0;

    let changeHandler = console.log; 
    if (options.Event) {
        changeHandler = (type, data) => {
            if (type === 'edit') {
                if (data[3] == null) {
                    //removed
                    server.kernel.emitt(options.Event, `{"Remove",${data[0]+offset+1}, ${data[1]+1}, ${data[2]}}`);
                } else if (data[2] == null) {
                    //added
                    server.kernel.emitt(options.Event, `{"Add",${data[0]+offset+1}, ${data[1]+1}, ${data[3]}}`);
                } else {
                    //changed
                    server.kernel.emitt(options.Event, `{"Replace",${data[0]+offset+1}, ${data[1]+1}, ${data[2]}, ${data[3]}}`);
                }
            }

            if (type === 'afterCreateRow') {
                server.kernel.emitt(options.Event, `{"RowsAdd",${data[0]+offset+1}, ${data[1]}}`);
            }

            if (type === 'afterRemoveRow') {
                server.kernel.emitt(options.Event, `{"RowsRemove",${data[0]+offset+1}, ${data[1]}}`);
            }       
            
            if (type === 'afterCreateCol') {
                server.kernel.emitt(options.Event, `{"ColsAdd",${data[0]+1}, ${data[1]}}`);
            }

            if (type === 'afterRemoveCol') {
                server.kernel.emitt(options.Event, `{"ColsRemove",${data[0]+1}, ${data[1]}}`);
            }            
        };
    }

    console.log(initial.slice(0, bufferSize));
    const hot = new Handsontable(example, {
      data: initial.slice(0, bufferSize),
      width: width,
      height: height,
      rowHeights: 20,
      manualRowResize: true,
      manualColumnResize: true,
      manualColumnMove: true,
      multiColumnSorting: true,
      filters: true,

      rowHeaders: (i) => {
        return String(offset + i + 1)

      },
      colHeaders: options.TableHeadings,
      manualRowMove: true,
      renderAllRows: false,

      contextMenu: true,

      licenseKey: "non-commercial-and-evaluation",
      afterChange: function (change, source) {
        if (source === 'loadData' || source === 'updateData') {
          return; //don't save this change
        }

        console.log(source);
        change.forEach((data) => changeHandler('edit', data));
        //clearTimeout(autosaveNotification);


      }

    });


    hot.addHook("afterScrollVertically", async function() {
      const last = hot.getPlugin('AutoRowSize').getLastVisibleRow();
      const first = hot.getPlugin('AutoRowSize').getFirstVisibleRow();
    
      if (last >= bufferSize - 1) {


        const newData = await loadData(offset + shift, bufferMaxSize);
        if (newData === 'EOF') {
          console.log('EOF');
          return;
        }

        bufferSize = newData[0];

        offset += shift;

        hot.suspendRender();
        hot.updateSettings({
        			data: newData[1]
        		});
        hot.scrollViewportTo(first - shift);
        hot.resumeRender();
            
      }

      if (offset > 0 && first < 1) {
        offset -= shift;

        const newData = await loadData(offset, bufferMaxSize);
        bufferSize = newData[0];

        hot.suspendRender();
        hot.updateSettings({
        			data: newData[1]
        		});
        hot.scrollViewportTo(first + shift);
        hot.resumeRender();    
      }




    });

    hot.addHook('afterCreateRow', (row, amount) => {
        changeHandler('afterCreateRow', [row, amount]);
        console.log(`${amount} row(s) were created, starting at index ${row}`);
    });

    hot.addHook('afterRemoveRow', (row, amount) => {
        changeHandler('afterRemoveRow', [row, amount]);
        console.log(`${amount} row(s) were removed, starting at index ${row}`);
    });    

    hot.addHook('afterCreateCol', (row, amount) => {
        changeHandler('afterCreateCol', [row, amount]);
        console.log(`${amount} Col(s) were created, starting at index ${row}`);
    });

    hot.addHook('afterRemoveCol', (row, amount) => {
        changeHandler('afterRemoveCol', [row, amount]);
        console.log(`${amount} Col(s) were removed, starting at index ${row}`);
    });    

    env.local.hot = hot;
}

core.HandsontableView.virtual = true;

core.HandsontableView.update = () => {
    console.error('HandsontableView updates are still not supported :(');
}

core.HandsontableView.destroy = (args, env) => {
    console.warn('HandsontableView was destoryed');
    if (env.local.hot) env.local.hot.destroy();
}


/*core.EventListener = async (args, env) => {
    const rules = await interpretate(args[1], env);
    const copy = {...env};

    //let object = await interpretate(args[0], copy);
    //if (Array.isArray(object)) object = object[0];

    rules.forEach((rule)=>{
      core.EventListener[rule.lhs](rule.rhs, null, copy);
    });

    return null;
}

const listeners = {};

core.RemoveEventListener = async (args, env) => {
    const uid = await interpretate(args[0], env);
    console.log(uid);
    console.log(listeners);
    if (uid in listeners) {

        listeners[uid].forEach((e) => {
            console.log('Removed!');
            e.element.removeEventListener("keydown", e.f);
        })
    }
}

core.EventListener.keydown = (uid, o, env) => {
    const logKey = (e) => {
        server.kernel.emitt(uid, '"'+e.code+'"', 'keydown');
    };

    if (!listeners[uid]) listeners[uid] = [];
    listeners[uid].push({f: logKey, element: window});

    document.addEventListener("keydown", logKey);
}

core.EventListener.capturekeydown = (uid, o, env) => {
    const logKey = (e) => {
        server.kernel.emitt(uid, '"'+e.code+'"', 'capturekeydown');
        e.preventDefault();
        e.stopPropagation();
        //return false;
    };

    const el = document;

    if (!listeners[uid]) listeners[uid] = [];
    listeners[uid].push({f: logKey, element: el});

    el.addEventListener("keydown", logKey);
}*/
