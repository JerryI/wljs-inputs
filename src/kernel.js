import { deflate } from 'pako';

//as input and output
core.RangeView = async function(args, env) {
    const uid =   uuidv4();

    const type   = core._typeof(args[0][4], env);
    console.log('data typeof');
    console.log(type);

    let range    = await interpretate(args[0], env);

    range[3] = await range[3];

    const options = core._getRules(args, env);

    let label = '';
    if (options.Label) {
        label = options.Label;
    }

    console.log('range');
    console.log(range);

    //env.element.classList.add('web-slider');
    let str = `<form class="oi-range">`;
    if (label.length > 0) str += `<label for="oi-range-${uid}">${label}</label>`;
    str += `<div class="oi-range-input">
            <input type="number" value="${range[3]}" min="${range[0]}" max="${range[1]}" step="${range[2]}" name="number" required="" id="oi-range-${uid}">
            <input type="range" value="${range[3]}" min="${range[0]}" max="${range[1]}" step="${range[2]}" name="range">
        </div>
    </form>`;

    env.element.innerHTML = str;

    let div = env.element.children[0];
    div = div.children[div.children.length - 1];
    const enumber = div.children[0];
    const erange = div.children[1];

    env.local.enumber = enumber;
    env.local.erange = erange;

    enumber.addEventListener('input', (e)=>{
        erange.value = enumber.value;
    });

    erange.addEventListener('input', (e)=>{
        enumber.value = erange.value;
    }); 

    if (options.Event) {
        const evid = options.Event;

        enumber.addEventListener('input', (e)=>{
            server.emitt(evid, enumber.value);
        });

        erange.addEventListener('input', (e)=>{
            server.emitt(evid, erange.value);
        });  
    } 
    
    
    //mutate FE object
    if (type == 'FrontEndRef') {
        console.log('mutable expression');

        const key = interpretate(args[0][4][1], env);
        console.log('key: ');
        console.log(key);

        enumber.addEventListener('input', (e)=>{
            ObjectHashMap[key].update(Number(enumber.value));
        });

        erange.addEventListener('input', (e)=>{
            ObjectHashMap[key].update(Number(erange.value));
        });        

        //prevent from updating itself
        env.local.preventDefault = true;
    }     
}



core.RangeView.update = async (args, env) => {
    if (env.local.preventDefault) return false;

    let range    = await interpretate(args[0], env);
    console.log('newvalue');
    console.log(range);
    
    env.local.enumber.value = await range[3];
    env.local.erange.value = await range[3];
}

core.RangeView.destroy = (args, env) => { /* propagate further */ interpretate(args[0], env)}

//just as input
core.ButtonView = (args, env) => {
    const options = core._getRules(args, env);

    const uid = options.Event;

    let label = `Click me`;
    if (options.Label) label = options.Label;

    env.element.innerHTML = `<form class="oi-button"><button>${label}</button></form>`;

    env.element.children[0].children[0].addEventListener('click', (e)=>{
        e.preventDefault();
        server.emitt(uid, 'True');
    });

}

core.ButtonView.update = () => {}
core.ButtonView.destroy = () => {}

//just as input
core.FileUploadView = (args, env) => {
    const options = core._getRules(args, env);

    const uid = options.Event;

    let label = `Drop a file`;
    if (options.Label) label = options.Label;

    env.element.innerHTML = `<form class="oi-file"><div class="drop-zone"><label>${label}</label></div></form>`;

    env.element.children[0].children[0].addEventListener('dragenter', (ev)=>{
        console.log("File(s) in drop zone");
        
    });

    env.element.children[0].children[0].addEventListener('dragover', (ev)=>{
        console.log("Dragover");
        env.element.children[0].children[0].classList.add('enter');
        ev.preventDefault();
    });    

    env.element.children[0].children[0].addEventListener('dragleave', (ev)=>{
        console.log("File(s) out drop zone");
        env.element.children[0].children[0].classList.remove('enter');
    });    

    env.element.children[0].children[0].addEventListener('drop', (ev)=>{
        console.log("File(s) dropped");

        // Prevent default behavior (Prevent file from being opened)
        ev.preventDefault();
      
        if (ev.dataTransfer.items) {
          // Use DataTransferItemList interface to access the file(s)
          [...ev.dataTransfer.items].forEach((item, i) => {
            // If dropped items aren't files, reject them
            if (item.kind === "file") {
              const file = item.getAsFile();
              console.log(file);
              readFile(file);
              console.log(`… file[${i}].name = ${file.name}`);
            }
          }); 
        } else {
          // Use DataTransfer interface to access the file(s)
          [...ev.dataTransfer.files].forEach((file, i) => {
            readFile(file);
            console.log(`… file[${i}].name = ${file.name}`);
          });
        }
    });    

    const labelEl = env.element.children[0].children[0].children[0];

    function readFile(file) {
        const reader = new FileReader();
        reader.addEventListener('load', (event) => {
          let compressedData = base64ArrayBuffer(event.target.result);
          labelEl.innerText = `Sending via POST...`;
          server.post.emitt(uid, '<|"data"->"'+compressedData+'", "name"->"'+file.name+'"|>').then(()=>{
            labelEl.innerText = `Uploaded`;
            setTimeout(()=>{
                env.element.children[0].children[0].classList.remove('enter');
                labelEl.innerText = label;
            },1000);
          },
          
          () => {
            labelEl.innerText = `Failed`;
            env.element.children[0].children[0].style.backgroundColor = 'red';
            env.element.children[0].children[0].style.opacity = 0.5;
            
            setTimeout(()=>{
                env.element.children[0].children[0].classList.remove('enter');
                labelEl.innerText = label;
            },1000);            
          });
          
          // Do something with result
        });
      
        reader.addEventListener('progress', (event) => {
          if (event.loaded && event.total) {
            const percent = (event.loaded / event.total) * 100;
            labelEl.innerText = `Uploading: ${Math.round(percent)}`;
          }
        });

        reader.readAsArrayBuffer(file);
      }
}

// Function to compress data using zlib
function compressData(data) {
  var compressedData = deflate(data); // Use pako.js library for zlib compression
  return base64ArrayBuffer(compressedData);
}

function base64ArrayBuffer(arrayBuffer) {
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


core.FileUploadView.update = () => {}
core.FileUploadView.destroy = () => {}

//as input and output only
core.ToggleView = async (args, env) => {
    const options = core._getRules(args, env);
    const uid =  uuidv4();
    const initial = await interpretate(args[0], env);

    let checked = '';
    if (initial) checked = 'checked';

    console.log('initial: ');
    console.log(initial);

    let label = '';
    if (options.Label) label = options.Label;

    let str = `<form class="oi-toggle">`;
    if (label.length > 0) str += `<label for="oi-toggle-${uid}">${label}</label>`;
    str += `<input class="oi-toggle-input" type="checkbox" name="input" id="oi-toggle-${uid}" ${checked}></form>`;

    env.element.innerHTML = str;

    const box = env.element.children[0].children[env.element.children[0].length - 1];

    env.local.box = box;

    if (options.Event) {
        const evid = options.Event;

        box.addEventListener('change', (event)=>{
            if (event.currentTarget.checked)
                server.emitt(evid, 'True');
            else
                server.emitt(evid, 'False');
        });
    }   

}

core.ToggleView.update = async (args, env) => {
    const data = await interpretate(args[0], env);
    env.local.box.checked = data;
}

core.ToggleView.destroy = (args, env) => { /* propagate further */ interpretate(args[0], env)}


core.TextView = async (args, env) => {
    const options = core._getRules(args, env);
    const uid =  uuidv4();

    //detect FE
    const type = core._typeof(args[0], env);
    console.log('data typeof');
    console.log(type);

    const text = await interpretate(args[0], env);

    let str = `<form class="oi-text">`;
    if (options.Title) str += `<div style="font: 700 0.9rem sans-serif; margin-bottom: 3px;">${options.Title}</div>`;
    str += `<input name="input" value="${text}" type="text" autocomplete="off"`;
    if (options.Placeholder) str += ` placeholder="${options.Placeholder}"`;
    str += ` style="font-size: 1em;">`;
    if (options.Describtion) str += `<div style="font-size: 0.85rem; font-style: italic; margin-top: 3px;">${options.Describtion}</div>`;
    str += `</form>`;

    env.element.innerHTML = str;

    const input = env.element.getElementsByTagName('input')[0];
    env.local.input = input;

    if (options.Event) {
        const evid = options.Event;
        

        input.addEventListener('input', ()=>{
            server.emitt(evid, `"${input.value}"`);
        });
    }

    //mutate FE object
    if (type == 'FrontEndRef') {
        console.log('mutable expression');



        const key = interpretate(args[0][1], env);

        console.log('key: ');
        console.log(key);        

        input.addEventListener('input', ()=>{
            ObjectHashMap[key].update(input.value);
        });

        //prevent from updating itself
        env.local.preventDefault = true;
    }
}

core.TextView.update = async (args, env) => {
    if (env.local.preventDefault) return false;

    const text = await interpretate(args[0], env);
    env.local.input.value = text;
}

core.TextView.destroy = (args, env) => { interpretate(args[0], env) }

core.Column = function(args, env) {

    const objects = interpretate(args[0], {...env, hold:true});
    console.log(objects);
    console.log(env);

    const wrapper = document.createElement('div');
    wrapper.classList.add('column');
    env.element.appendChild(wrapper);

    objects.forEach((e)=>{
        const child = document.createElement('div');
        child.classList.add('child');

        interpretate(e, {...env, element: child});
        wrapper.appendChild(child);
    });

}

core.Column.update = (args, env) => { /* just go to the inner three */ interpretate(args[0], env) }
core.Column.destroy = (args, env) => { /* just go to the inner three */ interpretate(args[0], env) }

core.Row = function(args, env) {

    const objects = interpretate(args[0], {...env, hold:true});
    console.log(objects);
    console.log(env);

    const wrapper = document.createElement('div');
    wrapper.classList.add('row');
    env.element.appendChild(wrapper);

    objects.forEach((e)=>{
        const child = document.createElement('div');
        child.classList.add('child');

        interpretate(e, {...env, element: child});
        wrapper.appendChild(child);
    });

}

core.Row.update = (args, env) => { /* just go to the inner three */ interpretate(args[0], env) }
core.Row.destroy = (args, env) => { /* just go to the inner three */ interpretate(args[0], env) }

