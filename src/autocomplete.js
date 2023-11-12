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
    },
    {
        "label":"InputSpoiler",
        "type":"keyword",
        "info":'InputSpoiler[expr_EventObject, "Label"->"..."] hides the content'
    },

    {
        "label": "InputTable",
        "type": "keyword",
        "info": 'InputTable[expr_List] shown an excel-like table'
    },
    
    {
        "label": "InputTable`EventHelper",
        "type": "keyword",
        "info": 'InputTable`EventHelper[expr_List] helps to update the list by the reference'
    },
    
    
    {
        "label":"RangeView",
        "type":"keyword",
        "info":"Frontend only: RangeView[{min, max, step, initial}] - slider representation, where initial can be a variable or a value"
    },

    {
        'label':'InputSelect',
        'type':'keyword',
        'info': 'InputSelect[list_List, "Label"->"text"] _EventObject - a list of items to be selected'
    }


])

console.log('loaded!');