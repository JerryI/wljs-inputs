window.EditorAutocomplete.extend([
    {
        "label":"InputRange",
        "type":"keyword",
        "info":"InputRange[min, max, step, \"Label\"->\"label\"] a slider and input box combo. It returns EventObject and fires an event with Number on change"
    },
    {
        "label":"InputButton",
        "type":"keyword",
        "info":"InputButton[\"label\"] a button. It returns EventObject and fires event with True value when pressed."
    },
    
    {
        "label":"InputToggle",
        "type":"keyword",
        "info":"InputToggle[initialState, \"Label\"->\"label\"] a checkbox. It returns EventObject and fires event with a boolean value on change."
    },

    {
        "label":"InputText",
        "type":"keyword",
        "info":"InputText[initialState, \"Label\"->\"label\"] an input text field. It returns EventObject and fires event with a text string on type"
    },

    {
        "label":"InputFile",
        "type":"keyword",
        "info":"InputFile[\"Label\"->\"label\"] a drag and drop window, that sends any files as Base64 encoded string. It returns EventObject when evaluated"
    },

    {
        "label":"InputGroup",
        "type":"keyword",
        "info":"InputGroup[list_Association | List] make a group of EventObjects with visible view and generate a single EventObject, that acts like a harness keeping the order or keys of involved event objects."
    }    


])

console.log('loaded!');