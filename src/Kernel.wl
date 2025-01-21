BeginPackage["Notebook`Kernel`Inputs`", {
	"JerryI`Misc`Events`",
	"JerryI`Misc`Events`Promise`",
	"JerryI`WLX`",
    "JerryI`WLX`Importer`",
	"JerryI`Misc`WLJS`Transport`",
	"JerryI`Misc`Language`",
	"Notebook`EditorUtils`",
	"Notebook`Editor`FrontendObject`",
	"Notebook`Editor`Kernel`FrontSubmitService`"
}]

InputRange::usage = "InputRange[min, max, step:1, initial:(max+min)/2, \"Label\"->\"\", \"Topic\"->\"Default\"] _EventObject."
InputCheckbox::usage = "InputCheckbox[state_Bool, \"Label\"->, \"Description\"->, , \"Topic\"->\"Default\"] _EventObject. A standard checkbox"
InputButton::usage = "InputButton[label_String, \"Topic\"->\"Default\"] _EventObject. A standard button"

InputRaster::usage = "InputRaster[opts] _EventObject. A raster input. InputRaster[img_Image, opts] "

InputText::usage = "InputText[initial_String, opts] _EventObject"
InputFile::usage = "InputFile[opts, \"Label\"->, \"Description\"->] _EventObject"
InputTable::usage = ""
InputSelect::usage = "InputSelect[{val1 -> expr1, val2 -> expr2}, defaultval] _EventObject"
InputRadio::usage = "InputRadio[{val1 -> expr1, val2 -> expr2}, defaultval] _EventObject"

InputAutocomplete::usage = "InputAutocomplete[autocompleteFunction_] _EventObject"

InputGroup::usage = "groups event objects"

InputJoystick::usage = "InputJoystick[] _EventObject describes a 2D controller"

TextView::usage = "TextView[symbol_, opts] shows a dynamic text-field. A generalized low-level version of InputText"
HTMLView::usage = "HTMLView[string, opts] will be rendered as DOM. A dynamic component"
TableView::usage = "TableView[data_] A generalized low-level version of InputTable. Shows big chunks of data"


HandsontableView;


InternalWLXDestructor;

Begin["`Private`"]

$troot = FileNameJoin[{$RemotePackageDirectory, "templates"}];

HTMLX = ImportComponent[FileNameJoin[{$troot, "HTML.wlx"}] ];

HTMLView[expr_List, opts: OptionsPattern[] ] := HTMLView[StringRiffle[expr, "\n"], opts]
Options[HTMLView] = {Epilog->Null, Prolog->Identity, "Style"->"", "Class"->""}

HTMLView /: MakeBoxes[w_HTMLView, frmt_] := With[{o = CreateFrontEndObject[w]}, MakeBoxes[o, frmt] ]

HTMLView`TemplateProcessor;
SetAttributes[HTMLView`TemplateProcessor, HoldFirst]

HTMLView`AnonymousJavascript;
SetAttributes[HTMLView`AnonymousJavascript, HoldFirst]

notString[_String] := False
notString[_List] := False
notString[_] := True

HTMLView[value_?notString, opts: OptionsPattern[] ] := With[{},
	HTMLView[ HTMLX[opts], Prolog->HTMLView`TemplateProcessor[<|"instanceId" -> CreateUUID[]|>], Epilog-> InternalElementUpdate[value, "html-string", "innerHTML"] ]
]



RangeX = ImportComponent[FileNameJoin[{$troot, "Range.wlx"}] ];

InputRange[min_?NumberQ, max_?NumberQ, step_?NumberQ, initial_?NumberQ, opts: OptionsPattern[] ] := With[{uid = OptionValue["Event"]},
	EventObject[<|"Id"->uid, "Initial"->initial, "View"->HTMLView[ RangeX["Min"->min, "Max"->max, "Step"->step, "Initial"->initial, "Event"->uid, opts], Prolog->HTMLView`TemplateProcessor[<|"instanceId" -> CreateUUID[]|>] ]|>]
]

InputRange[min_?NumberQ, max_?NumberQ, step_?NumberQ, opts: OptionsPattern[] ] := With[{middle = Round[(max + min) / 2, step]},
	InputRange[min, max, step, middle, opts]
]

InputRange[min_?NumberQ, max_?NumberQ, opts: OptionsPattern[] ] := InputRange[min, max, 1, opts ]

InputRange[EventObject[a_Association], rest__] := InputRange[rest, "Event" -> a["Id"] ]

Options[InputRange] = {"Label"->"", "Event":>CreateUUID[], "Topic"->"Default"}

InputAutocompleteX = ImportComponent[FileNameJoin[{$troot, "Autocomplete.wlx"}] ];

InputAutocomplete[autocomplete_, opts: OptionsPattern[] ] := With[{},
	InputAutocomplete[autocomplete, "", opts]
]

InputAutocomplete[autocomplete_, default_String, opts: OptionsPattern[] ] := With[{},
	With[{uid = OptionValue["Event"], handler = Unique["System`xhxComplete"]},
		handler[data_String][cbk_] := autocomplete[data // URLDecode, cbk];

		EventObject[<|
	     "Id"->uid, 
	     "View"->HTMLView[ 
	       InputAutocompleteX["Event"->uid, "Default"->default, "HandlerSymbol"->handler, opts],
	       Prolog->HTMLView`TemplateProcessor[<|"instanceId" -> CreateUUID[]|>] 
	    ]|>]
	]
]

InputAutocomplete[EventObject[a_Association], rest__] := InputAutocomplete[rest, "Event" -> a["Id"] ]

Options[InputAutocomplete] = {"Label"->"", "Event":>CreateUUID[], "ClearOnSubmit"->True}

RasterX = ImportComponent[FileNameJoin[{$troot, "Raster.wlx"}] ];

InputRaster[opts: OptionsPattern[] ] := With[{id = OptionValue["Event"], topic = OptionValue["Topic"],handler = Unique["handler"], internal = CreateUUID[]},
	EventHandler[internal, {
		_ -> Function[data, 
			EventFire[id, topic, ImportString[data, "Base64"] ]
		]
	}];

	If[MatchQ[OptionValue["OverlayImage"], _Image],
		EventObject[<|"Id"->id, "View"->HTMLView[RasterX["Event"->internal, opts, "Handler"->handler],  Epilog->{OptionValue["OverlayImage"] // CreateFrontEndObject, handler}, Prolog->HTMLView`TemplateProcessor[<|"instanceId" -> CreateUUID[]|>] ]|>]
	,
		EventObject[<|"Id"->id, "View"->HTMLView[RasterX["Event"->internal, opts, "Handler"->handler],  Epilog->{handler}, Prolog->HTMLView`TemplateProcessor[<|"instanceId" -> CreateUUID[]|>] ]|>]
	]
]

InputRaster::err = "`1`";

InputRaster[img_Image, opts: OptionsPattern[] ] := With[{id = OptionValue["Event"], handler = Unique["handler"], topic = OptionValue["Topic"], internal = CreateUUID[]},
	EventHandler[internal, {
		_ -> Function[data, 
			EventFire[id, topic, ImportString[data, "Base64"] ]
		]
	}];
	
	If[MatchQ[OptionValue["OverlayImage"], _Image],
		Message[InputRaster::err, "OverlayImage is not supported if an Image was provided"];
		$Failed
	,
		EventObject[<|"Id"->id, "View"->HTMLView[RasterX["Event"->internal, opts, "Handler"->handler],  Epilog->{img // CreateFrontEndObject, handler}, Prolog->HTMLView`TemplateProcessor[<|"instanceId" -> CreateUUID[]|>] ]|>]
	]
]

InputRaster[EventObject[a_Association], rest__] := InputRaster[rest, "Event" -> a["Id"] ]
InputRaster[EventObject[a_Association], rest_]  := InputRaster[rest, "Event" -> a["Id"] ]
InputRaster[EventObject[a_Association] ]  := InputRaster["Event" -> a["Id"] ]

Options[InputRaster] = {"AllowUpdateWhileDrawing"->False, "Topic"->"Default", "Event":>CreateUUID[], ImageSize->350, Magnification->1, "OverlayImage"->None}

Knob = ImportComponent[FileNameJoin[{$troot, "Button.wlx"}] ];

InputButton[label_String:"Click", opts: OptionsPattern[] ] := With[{id = OptionValue["Event"]},
    EventObject[<|"Id"->id, "Initial"->False, "View"->HTMLView[Knob["Label"->label, "Event"->id, opts], Prolog->HTMLView`TemplateProcessor[<|"instanceId" -> CreateUUID[]|>] ]|>]
];

InputButton[EventObject[a_Association], rest__] := InputButton[rest, "Event" -> a["Id"] ]
InputButton[EventObject[a_Association], rest_]  := InputButton[rest, "Event" -> a["Id"] ]
InputButton[EventObject[a_Association] ]  := InputButton["Event" -> a["Id"] ]

Options[InputButton] = {"Class"->"", "Style"->"", "Topic"->"Default", "Event":>CreateUUID[]}

CheckboxX = ImportComponent[FileNameJoin[{$troot, "Checkbox.wlx"}] ];

InputCheckbox[initial_:False, opts: OptionsPattern[] ] := With[{id = OptionValue["Event"]},
	EventObject[<|"Id"->id, "Initial"->initial, "View"->HTMLView[CheckboxX["Checked"->initial, "Event"->id, opts], Prolog->HTMLView`TemplateProcessor[<|"instanceId" -> CreateUUID[]|>] ]|>]
]

InputCheckbox[EventObject[a_Association], rest_]  := InputCheckbox[rest, "Event" -> a["Id"] ]
InputCheckbox[EventObject[a_Association], rest__] := InputCheckbox[rest, "Event" -> a["Id"] ]
InputCheckbox[EventObject[a_Association] ] := InputCheckbox["Event" -> a["Id"] ]

Options[InputCheckbox] = {"Label"->"", "Description"->"", "Topic"->"Default", "Event":>CreateUUID[]}

TextX = ImportComponent[FileNameJoin[{$troot, "Text.wlx"}] ];

InputText[initial_:"", opts: OptionsPattern[] ] := With[{id = OptionValue["Event"]},
	EventObject[<|"Id"->id, "Initial"->initial, "View"->HTMLView[TextX[initial, "Event"->id, opts], Prolog->HTMLView`TemplateProcessor[<|"instanceId" -> CreateUUID[]|>] ]|>]
]

InputText[EventObject[a_Association], rest_]  := InputText[rest, "Event" -> a["Id"] ]
InputText[EventObject[a_Association], rest__] := InputText[rest, "Event" -> a["Id"] ]
InputText[EventObject[a_Association] ] := InputText["Event" -> a["Id"] ]

Options[InputText] = {"Label"->"", "Description"->"", "Placeholder"->"", "Topic"->"Default", "Event":>CreateUUID[], ImageSize->Automatic}

TextView[value_, opts: OptionsPattern[] ] := With[{id = CreateUUID[]},
	HTMLView[ TextX["Placeholder"->"...", "UId" -> id, opts], Prolog->HTMLView`TemplateProcessor[<|"instanceId" -> CreateUUID[]|>], Epilog-> InternalElementUpdate[value, "text-string", "value"] ]
]

JoystickX = ImportComponent[FileNameJoin[{$troot, "Joystick.wlx"}] ];

InputJoystick[opts: OptionsPattern[] ] := With[{id = OptionValue["Event"]},
	EventObject[<|"Id"->id, "Initial"->{0,0}, "View"->{HTMLView[JoystickX["Event"->id, opts], Prolog->HTMLView`TemplateProcessor[<|"instanceId" -> CreateUUID[]|>] ], InternalWLXDestructor[id]}|>]
]

InputJoystick[EventObject[a_Association], rest_]  := InputJoystick[rest, "Event" -> a["Id"] ]
InputJoystick[EventObject[a_Association], rest__] := InputJoystick[rest, "Event" -> a["Id"] ]
InputJoystick[EventObject[a_Association] ] := InputJoystick["Event" -> a["Id"] ]

Options[InputJoystick] = {"Topic"->"Default", "Event":>CreateUUID[]}

InputJoystick`IntegrationHelper[zero_List:{0,0}][function_] := InputJoystick`IntegrationHelper[zero, 0.01][function]
InputJoystick`IntegrationHelper[zero_List:{0,0}, delta_][function_] := InputJoystick`IntegrationHelper[zero, {delta, delta}][function]
InputJoystick`IntegrationHelper[zero_List:{0,0}, delta_List][function_] := Module[{
	accumulated = zero,
	handler
},
	handler[dxy_] := (
		accumulated = accumulated + (dxy delta);
		function[accumulated]
	);

	handler
]

TextView /: MakeBoxes[t_TextView, frmt_] := With[{o = CreateFrontEndObject[t]},
	MakeBoxes[o, frmt]
]

Options[TextView] = {"Label"->"", "Description"->"", "Placeholder"->"", "Event"->Null, ImageSize->Automatic}





DropX = ImportComponent[FileNameJoin[{$troot, "Drop.wlx"}] ];

filechunks = <||>;
InputFile[opts: OptionsPattern[] ] := With[{id = OptionValue["Event"], internal = CreateUUID[]},
	EventHandler[internal, {
		"Transaction" -> (EventFire[id, "Transaction", #]&), (* forward to the main event *)
		"File" -> (EventFire[id, "File", #]&), (* forward to the main event *)

		"Chunk" -> Function[payload, With[{hash = StringJoin[payload["Name"], payload["Transaction"] ], chunk = payload["Chunk"] },

			If[!KeyExistsQ[filechunks, hash ], filechunks[hash] = <||>];
			filechunks[hash] = Join[filechunks[hash], <|chunk -> payload["Data"]|>];

			If[Length[Keys[filechunks[hash] ] ] === payload["Chunks"],
				With[{merged = StringJoin @@ (KeySort[filechunks[hash] ] // Values)},
					filechunks[hash] = .;
					
					EventFire[id, "File", <|"Transaction" -> payload["Transaction"], "Name" -> payload["Name"], "Data" -> merged|>];
				]
			]
		] ]
	}];

	EventObject[<|"Id"->id, "View"->HTMLView[DropX["Event"->internal, opts], Prolog->HTMLView`TemplateProcessor[<|"instanceId" -> CreateUUID[]|>] ]|>]
]

Options[InputFile] = {"Label"->"Drop file", "Event":>CreateUUID[]}

InputFile[EventObject[a_Association], rest_]  := InputFile[rest, "Event" -> a["Id"] ]
InputFile[EventObject[a_Association], rest__] := InputFile[rest, "Event" -> a["Id"] ]
InputFile[EventObject[a_Association] ] := InputFile["Event" -> a["Id"] ]

RadioX = ImportComponent[FileNameJoin[{$troot, "Radio.wlx"}] ];

InputRadio[apt_List, DefaultItem_:Null, opts: OptionsPattern[] ] := Module[{assoc = <||>}, 
	With[{
		id = CreateUUID[], 
		uid = OptionValue["Event"], 
		Selected = If[DefaultItem === Null,
			ToString @ Hash[apt // First // First]
		,
			ToString @ Hash[DefaultItem]
		]
	},
	Map[Function[item,
		With[{
			keyvaluename = If[MatchQ[item, _Rule],
				{ToString @ Hash[item // First], item // First, item // Last}
			,
				{ToString @ Hash[item], item, ToString[item]}
			]
		},
			assoc[keyvaluename[[1]]] = <|"Value" -> keyvaluename[[2]], "Name" -> keyvaluename[[3]]|>;
		]
	], apt];

	EventHandler[id, {_ -> Function[selected,
		EventFire[uid, OptionValue["Topic"], assoc[[selected, "Value"]] ]
	]}];

	EventObject[<|"Id"->uid, "Initial"->assoc[Selected, "Value"], "View"->HTMLView[RadioX[ "List" -> ({assoc[#, "Name"], #}&/@ Keys[assoc]), "Event"->id, "Selected"->Selected, "Label"->OptionValue["Label"] ], Prolog->HTMLView`TemplateProcessor[<|"instanceId" -> CreateUUID[]|>] ]|>]	
] ]

Options[InputRadio] = {"Label" -> "", "Topic" -> "Default", "Event":>CreateUUID[]}

InputRadio[EventObject[a_Association], rest_]  := InputRadio[rest, "Event" -> a["Id"] ]
InputRadio[EventObject[a_Association], rest__] := InputRadio[rest, "Event" -> a["Id"] ]

SelectX = ImportComponent[FileNameJoin[{$troot, "Select.wlx"}] ];

InputSelect[apt_List, DefaultItem_:Null, opts: OptionsPattern[] ] := Module[{assoc = <||>}, 
	With[{
		id = CreateUUID[], 
		uid = OptionValue["Event"], 
		Selected = If[DefaultItem === Null,
			ToString @ Hash[apt // First // First]
		,
			ToString @ Hash[DefaultItem]
		]
	},
	Map[Function[item,
		With[{
			keyvaluename = If[MatchQ[item, _Rule],
				{ToString @ Hash[item // First], item // First, item // Last}
			,
				{ToString @ Hash[item], item, ToString[item]}
			]
		},
			assoc[keyvaluename[[1]]] = <|"Value" -> keyvaluename[[2]], "Name" -> keyvaluename[[3]]|>;
		]
	], apt];

	EventHandler[id, {_ -> Function[selected,
		EventFire[uid, OptionValue["Topic"], assoc[selected, "Value"] ]
	]}];

	EventObject[<|"Id"->uid, "Initial"->assoc[Selected, "Value"], "View"->HTMLView[SelectX[ #["Name"]&/@ assoc, "Event"->id, "Selected"->Selected, "Label"->OptionValue["Label"] ], Prolog->HTMLView`TemplateProcessor[<|"instanceId" -> CreateUUID[]|>] ]|>]	
] ]

InputSelect[EventObject[a_Association], rest_]  := InputSelect[rest, "Event" -> a["Id"] ]
InputSelect[EventObject[a_Association], rest__] := InputSelect[rest, "Event" -> a["Id"] ]

Options[InputSelect] = {"Label" -> "", "Topic" -> "Default", "Event":>CreateUUID[]}

GroupX = ImportComponent[FileNameJoin[{$troot, "Group.wlx"}] ];

InputGroup[{in__EventObject}, opts: OptionsPattern[] ] := With[{evid = OptionValue["Event"], groupid = CreateUUID[]},
	inputGroup[evid] = #[[1]]["Initial"] &/@ List[in];
	
	MapIndexed[With[{n = #2[[1]]},
		EventHandler[#1, {any_ :> Function[data, 
			inputGroup[evid] = ReplacePart[inputGroup[evid], n->data];
			EventFire[evid, any, inputGroup[evid] ];
		]}] 
	]&, List[in] ]; 

	
	With[{view = HTMLView[ GroupX[opts], Epilog->HandleGroup[Table[CreateFrontEndObject[ i[[1]]["View"] ], {i, List[in]}] ] ]},
		EventObject[<|"Id"->evid, "Initial"->inputGroup[evid], "View"->view|>]
	]
];

Options[InputGroup] = {"Label" -> "", "Description"->"", "Event":>CreateUUID[]}

InputGroup[EventObject[a_Association], rest_]  := InputGroup[rest, "Event" -> a["Id"] ]
InputGroup[EventObject[a_Association], rest__] := InputGroup[rest, "Event" -> a["Id"] ]


AssocEventsListQ[i_] := If[AssociationQ[i],
	MatchQ[Values[i], {__EventObject}]
,
	False
]

InputGroup[in_?AssocEventsListQ, opts: OptionsPattern[] ] := With[{evid = CreateUUID[], groupid = CreateUUID[]},
	inputGroup[evid] = #[[1]]["Initial"] &/@ in;
	
	Map[With[{key = #, val = in[#]},
		EventHandler[val, {any_ :> Function[data, 
			inputGroup[evid] = Join[inputGroup[evid], <|key -> data|>];
			EventFire[evid, any, inputGroup[evid] ];
		]}] 
	]&, Keys[in] ]; 

	
	With[{view = HTMLView[ GroupX[opts], Epilog->HandleGroup[Table[CreateFrontEndObject[ i[[1]]["View"] ], {i, Values[in]}] ] ]},
		EventObject[<|"Id"->evid, "Initial"->inputGroup[evid], "View"->view|>]
	]
];


Unprotect[TableView]
ClearAll[TableView]

InputTable[list_, opts: OptionsPattern[] ] := LeakyModule[{loader}, With[{evid = OptionValue["Event"]},
	If[Depth[list] < 3, Return[Module, Style["Must be a list of lists!", Background->Red] ] ];
	loader[offset_, window_] := If[offset > Length[list],
		"EOF",
		list[[offset ;; Min[offset + window, Length[list] ] ]]
	];
	
	EventObject[<|"Id"->evid, "View"->HandsontableView[Take[list, Min[150, Length[list] ] ], "Event"->evid, "Loader"->ToString[loader], opts]|>]
] ]

Options[InputTable] = {"Height" -> 370, "Event":>CreateUUID[]}

InputTable[EventObject[a_Association], rest_]  := InputTable[rest, "Event" -> a["Id"] ]
InputTable[EventObject[a_Association], rest__] := InputTable[rest, "Event" -> a["Id"] ]


SetAttributes[InputTable, HoldFirst]

(* convert it to Dataset *)
TableView[list_List, opts: OptionsPattern[] ] := If[OptionValue[TableHeadings] =!= Null,
  With[{heading = OptionValue[TableHeadings]},
	Dataset[
       Map[Function[row, 
         MapIndexed[Function[{cell, index}, heading[[index//First]] -> cell], row] // Association
       ], list]
   , opts] // Quiet
  ]
,
	Dataset[list, opts]
]

TableView[data_Association, opts: OptionsPattern[] ] := Dataset[data, opts]

Options[TableView] = {TableHeadings -> Null, ImageSize->Automatic}


Dataset;

System`ProvidedOptions;

System`DatasetWrapperBox;


applyPatch := (
	Dataset;
	Dataset`MakeDatasetBoxes;

	Unprotect[Dataset];

	Unprotect[Dataset`MakeDatasetBoxes];
	ClearAll[Dataset`MakeDatasetBoxes];

	Dataset`MakeDatasetBoxes[d_Dataset ] := If[ByteCount[d] > Internal`Kernel`$FrontEndObjectSizeLimit 1024 1024 / 8.0, 
		DatasetWrapperBox[d // Normal, StandardForm] (*FIXME do not use Normal*)
	,
		With[{o = CreateFrontEndObject[d]},
			MakeBoxes[o, StandardForm]
		]
	];

	Dataset /: Dataset`MakeDatasetBoxes[d_Dataset ] := If[ByteCount[d] > Internal`Kernel`$FrontEndObjectSizeLimit 1024 1024 / 8.0, 
		DatasetWrapperBox[d // Normal, StandardForm] (*FIXME do not use Normal*)
	,
		With[{o = CreateFrontEndObject[d]},
			MakeBoxes[o, StandardForm]
		]
	];

	SetAttributes[Dataset`MakeDatasetBoxes, HoldFirst];
);

applyPatch;

Internal`AddHandler["GetFileEvent",
 If[MatchQ[#, HoldComplete["Dataset`",_,_] ],
    applyPatch;
    (* TODO: remove this handler!!! *)
 ]&
];

Unprotect[Dataset]

System`WLXForm;

Dataset /: MakeBoxes[d_Dataset, WLXForm ] := If[ByteCount[d] > 0.5 1024 1024, 
	DatasetWrapperBox[d // Normal, WLXForm] (*FIXME do not use Normal*)
,
	With[{o = CreateFrontEndObject[d]},
		MakeBoxes[o, WLXForm]
	]
];

Dataset`MakeDatasetWLXBoxes[d_Dataset ] := If[ByteCount[d] > 0.5 1024 1024, 
	DatasetWrapperBox[d // Normal, WLXForm] (*FIXME do not use Normal*)
,
	With[{o = CreateFrontEndObject[d]},
		MakeBoxes[o, WLXForm]
	]
];



splitDataset[test_, threshold_:0.5] := With[{
  length = Length[test],
  piece = ByteCount[test // First],
  size = ByteCount[test]
},
  With[{n = Floor[size / piece], number = Ceiling[size / (threshold 1024 1024)]},
    With[{partLength = If[# === 0, 1, #] &@ Floor[length / number]},
      With[{tail = length - partLength number},
        If[tail === 0, 
			Partition[test, partLength]
        ,
        	Join[Partition[Drop[test, -tail], partLength], {Take[test, tail]}]
        ]
      ]
    ]
  ]
]

garbage = {};

DatasetWrapperBox[ l: List[__List], form_ ] := With[{
	parts = splitDataset[l],
	req = Unique["tableRequest"],
	event = CreateUUID[]
},

	LeakyModule[{store},
		With[{
				o = CreateFrontEndObject[ProvidedOptions[parts // First // Dataset, "RequestEvent" -> event, "RequestCallback" -> ToString[req, InputForm], "Total"->Length[l], "Parts"->Length[parts] ] ]
			},

				EventHandler[event, Function[part,
					WLJSTransportSend[req[store[[part]]], Global`$Client ] 
				] ];

				With[{view = MakeBoxes[o, form]},
					AppendTo[garbage, Hold[store ] ];
					store = parts;
					
					view
				]
		]	
	]
]

DatasetWrapperBox[ l: List[__List], StandardForm] := With[{
	parts = splitDataset[l],
	req = Unique["tableRequest"],
	event = CreateUUID[]
},

	LeakyModule[{store},

		EventHandler[event, Function[part,
			WLJSTransportSend[req[store[[part]]], Global`$Client ] 
		] ];

		With[{
				o = CreateFrontEndObject[ProvidedOptions[parts // First // Dataset, "RequestEvent" -> event, "RequestCallback" -> ToString[req, InputForm], "Total"->Length[l], "Parts"->Length[parts] ] ]
			},
			With[{view = RowBox[{"(*VB[*)(Dataset[Join@@", ToString[store, InputForm], "])(*,*)(*", ToString[Compress[Hold[o] ], InputForm], "*)(*]VB*)"}]},
				AppendTo[garbage, Hold[store ] ];
				store = parts;
				view
			]
		]	
	]
]

DatasetWrapperBox[ l_List , form_ ] := With[{
	parts = splitDataset[l],
	req = Unique["tableRequest"],
	event = CreateUUID[]
},

	LeakyModule[{store},

		EventHandler[event, Function[part,
			WLJSTransportSend[req[store[[part]]], Global`$Client ] 
		] ];

		With[{
				o = CreateFrontEndObject[ProvidedOptions[parts // First // Dataset, "RequestEvent" -> event, "RequestCallback" -> ToString[req, InputForm], "Total"->Length[l], "Parts"->Length[parts] ] ]
			},
				With[{view = MakeBoxes[o, form]},
					AppendTo[garbage, Hold[store ] ];
					store = parts;
					view
				]
		]	
	]
]

DatasetWrapperBox[ l_List , StandardForm] := With[{
	parts = splitDataset[l],
	req = Unique["tableRequest"],
	event = CreateUUID[]
},

	LeakyModule[{store},

		EventHandler[event, Function[part,
			WLJSTransportSend[req[store[[part]]], Global`$Client ] 
		] ];

		With[{
				o = CreateFrontEndObject[ProvidedOptions[parts // First // Dataset, "RequestEvent" -> event, "RequestCallback" -> ToString[req, InputForm], "Total"->Length[l], "Parts"->Length[parts] ] ]
			},
			With[{view = RowBox[{"(*VB[*)(Dataset[Join@@", ToString[store, InputForm],"])(*,*)(*", ToString[Compress[Hold[o] ], InputForm], "*)(*]VB*)"}]},
				AppendTo[garbage, Hold[store ] ];
				store = parts;
				view
			]
		]	
	]
]

DatasetWrapperBox[ a: Association[r: Rule[_, _List]..] , form_ ] := With[{d = Dataset[a]},
	With[{o = CreateFrontEndObject[d]},
		MakeBoxes[o, form]
	]
];

DatasetWrapperBox[ a: Association[r: Rule[_, _Association]..] , form_ ] := With[{d = Dataset[a]},
	With[{o = CreateFrontEndObject[d]},
		MakeBoxes[o, form]
	]
];

DatasetWrapperBox[ l : List[__Association] , form_] := With[{
	parts = splitDataset[l],
	req = Unique["tableRequest"],
	event = CreateUUID[]
},

	LeakyModule[{store},

		EventHandler[event, Function[part,
			WLJSTransportSend[req[store[[part]]], Global`$Client ] 
		] ];

		With[{
				o = CreateFrontEndObject[ProvidedOptions[parts // First // Dataset, "RequestEvent" -> event, "RequestCallback" -> ToString[req, InputForm], "Total"->Length[l], "Parts"->Length[parts] ] ]
			},
				With[{view = MakeBoxes[o, form]},
					AppendTo[garbage, Hold[store ] ];
					store = parts;
					view
				]
		]	
	]
]

DatasetWrapperBox[ l : List[__Association] ,  StandardForm] := With[{
	parts = splitDataset[l],
	req = Unique["tableRequest"],
	event = CreateUUID[]
},

	LeakyModule[{store},

		EventHandler[event, Function[part,
			WLJSTransportSend[req[store[[part]]], Global`$Client ] 
		] ];

		With[{
				o = CreateFrontEndObject[ProvidedOptions[parts // First // Dataset, "RequestEvent" -> event, "RequestCallback" -> ToString[req, InputForm],  "Total"->Length[l], "Parts"->Length[parts] ] ]
			},
			With[{view = RowBox[{"(*VB[*)(Dataset[Join@@", ToString[store, InputForm],"])(*,*)(*", ToString[Compress[Hold[o] ], InputForm], "*)(*]VB*)"}]},
				AppendTo[garbage, Hold[store ] ];
				store = parts;
				view
			]
		]	
	]
]


Notebook`Kernel`Inputs`DatasetMakeBox[expr_String, uid_String] := CreateFrontEndObject[EditorView[ToString[ImportString[ToString[expr // URLDecode, OutputForm, CharacterEncoding -> "UTF8"], "ExpressionJSON"], StandardForm], "ReadOnly"->True, "Selectable"->False], uid]


HandsontableView /: MakeBoxes[v_HandsontableView, StandardForm] := With[{o = CreateFrontEndObject[v]}, MakeBoxes[o, StandardForm] ]

InputTable`EventHelper[list_] := Module[{handler, buffer, placeholder = Table[Null, {i, Length[list//First]}]},
	handler[{"Replace", row_, col_, old_, new_}] := list[[row, col]] = ToExpression[new];
	handler[{"Add", row_, col_, new_}] := list[[row, col]] = ToExpression[new];
	handler[{"Remove", row_, col_, new_}] := list[[row, col]] = Null;

	handler[{"RowsAdd", start_, n_}] := (buffer = list; Do[buffer = Insert[buffer, placeholder, start], {k,n}]; list = buffer);
	handler[{"RowsRemove", start_, n_}] := (buffer = list; Do[buffer = Delete[buffer, start], {k,n}]; list = buffer);

	handler[{"ColsAdd", start_, n_}] := With[{dummy = Table[Null, {i, Length[list]}]},
		buffer = list;
		
			buffer = Transpose[buffer];
			Do[
				buffer = Insert[buffer, dummy, start];
			, {k,n}];
			buffer = Transpose[buffer];
		
		list = buffer;
	];

	handler[{"ColsRemove", start_, n_}] := With[{dummy = Table[Null, {i, Length[list]}]},
		buffer = list;
		
			buffer = Transpose[buffer];
			Do[
				buffer = Delete[buffer, start];
			, {k,n}];
			buffer = Transpose[buffer];
		
		list = buffer;
	];


	handler
]

SetAttributes[InputTable`EventHelper, HoldFirst]


listener[p_, list_, uid_] := With[{}, With[{
    rules = Map[Function[rule, rule[[1]] -> uid ], list]
},
    EventHandler[uid, list];
    EventListener[p, rules]
] ];

eventListener[w_, Rule["Closed", function_] ] := With[{c = EventClone[ w["Socket"] ]},
	EventHandler[c, {"Closed" -> function}]
]

WindowObj /: EventHandler[w_WindowObj, list_List] := With[{
	unique = Unique["WindowObjHandlers"]
},
	With[{handlers = eventListener[w, #] &/@ list},
		unique /: EventRemove[unique] := With[{},
			Print["WindowObj handlers were removed"];
			EventRemove /@ handlers;
		];
	];
	
	unique
] 

WindowObj::clone = "Clonning of WindowObj is not supported for now";

WindowObj /: EventClone[w_WindowObj] := With[{},
	Message[WindowObj::clone]
]

End[]
EndPackage[]