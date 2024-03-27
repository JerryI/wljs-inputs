import { deflate } from 'pako';

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

core.HandsontableView = async (args, env) => {
    if (!Handsontable) Handsontable = (await import("handsontable")).default;
    console.log(Handsontable);

    let loadData = async () => 'EOF';

    const options = await core._getRules(args, env);
    const height = options.Height || 200;

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
    parent.style.width = '100%';

    const example = document.createElement('div');
    parent.appendChild(example);

    example.position = "relative";
    example.display = "block";

    const bufferMaxSize = options.Overlay || 150;
    const shift = options.Buffer || 50;

    const initial = await interpretate(args[0], env);
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
      width: 'auto',
      height: height,
      rowHeights: 20,
      manualRowResize: true,
      multiColumnSorting: true,
      filters: true,
      columns: cols,
      rowHeaders: (i) => {
        return String(offset + i + 1)

      },
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



