BeginPackage["Notebook`Kernel`Inputs`", {
	"JerryI`Misc`Events`",
	"JerryI`WLX`",
    "JerryI`WLX`Importer`",
	"JerryI`Misc`WLJS`Transport`",
	"JerryI`Misc`Language`",
	"Notebook`EditorUtils`",
	"Notebook`Editor`FrontendObject`"
}]

InputRange::usage = "InputRange[min, max, step:1, initial:(max+min)/2, \"Label\"->\"\", \"Topic\"->\"Default\"] _EventObject."
InputCheckbox::usage = "InputCheckbox[state_Bool, \"Label\"->, \"Description\"->, , \"Topic\"->\"Default\"] _EventObject. A standard checkbox"
InputButton::usage = "InputButton[label_String, \"Topic\"->\"Default\"] _EventObject. A standard button"

InputText::usage = "InputText[initial_String, opts] _EventObject"
InputFile::usage = "InputFile[opts, \"Label\"->, \"Description\"->] _EventObject"
InputTable::usage = ""
InputSelect::usage = "InputSelect[{val1 -> expr1, val2 -> expr2}, defaultval] _EventObject"

InputGroup::usage = "groups event objects"

InputJoystick::usage = "InputJoystick[] _EventObject describes a 2D controller"

TextView::usage = "TextView[symbol_, opts] shows a dynamic text-field. A generalized low-level version of InputText"
HTMLView::usage = "HTMLView[string] will be rendered as DOM. A dynamic component"
TableView::usage = "TableView[data_] A generalized low-level version of InputTable. Shows big chunks of data"

HandsontableView;

InternalWLXDestructor;

Begin["`Private`"]

$troot = FileNameJoin[{$RemotePackageDirectory, "templates"}];

RangeX = ImportComponent[FileNameJoin[{$troot, "Range.wlx"}] ];

InputRange[min_?NumberQ, max_?NumberQ, step_?NumberQ, initial_?NumberQ, opts: OptionsPattern[] ] := With[{uid = CreateUUID[]},
	EventObject[<|"Id"->uid, "Initial"->initial, "View"->WLXEmbed[ RangeX["Min"->min, "Max"->max, "Step"->step, "Initial"->initial, "Event"->uid, opts] ]|>]
]

InputRange[min_?NumberQ, max_?NumberQ, step_?NumberQ, opts: OptionsPattern[] ] := With[{middle = Round[(max + min) / 2, step]},
	InputRange[min, max, step, middle, opts]
]

InputRange[min_?NumberQ, max_?NumberQ, opts: OptionsPattern[] ] := InputRange[min, max, 1, opts ]

Options[InputRange] = {"Label"->""}


Knob = ImportComponent[FileNameJoin[{$troot, "Button.wlx"}] ];

InputButton[label_String:"Click", opts: OptionsPattern[] ] := With[{id = CreateUUID[]},
    EventObject[<|"Id"->id, "Initial"->False, "View"->WLXEmbed[Knob["Label"->label, "Event"->id, opts] ]|>]
];

CheckboxX = ImportComponent[FileNameJoin[{$troot, "Checkbox.wlx"}] ];

InputCheckbox[initial_:False, opts: OptionsPattern[] ] := With[{id = CreateUUID[]},
	EventObject[<|"Id"->id, "Initial"->initial, "View"->WLXEmbed[CheckboxX["Checked"->initial, "Event"->id, opts] ]|>]
]

Options[InputCheckbox] = {"Label"->"", "Description"->""}

TextX = ImportComponent[FileNameJoin[{$troot, "Text.wlx"}] ];

InputText[initial_:"", opts: OptionsPattern[] ] := With[{id = CreateUUID[]},
	EventObject[<|"Id"->id, "Initial"->initial, "View"->WLXEmbed[TextX[initial, "Event"->id, opts] ]|>]
]

Options[InputText] = {"Label"->"", "Description"->"", "Placeholder"->""}

TextView[value_, opts: OptionsPattern[] ] := With[{id = CreateUUID[]},
	WLXEmbed[ TextX["Placeholder"->"Loading...", "UId" -> id, opts], "SideEffect"-> Global`InternalHandleTextView[value, id] ]
]

JoystickX = ImportComponent[FileNameJoin[{$troot, "Joystick.wlx"}] ];

InputJoystick[] := With[{id = CreateUUID[]},
	EventObject[<|"Id"->id, "Initial"->{0,0}, "View"->{WLXEmbed[JoystickX["Event"->id] ], InternalWLXDestructor[id]}|>]
]

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

TextView /: MakeBoxes[t_TextView, StandardForm] := With[{o = CreateFrontEndObject[t]},
	MakeBoxes[o. StandardForm]
]

Options[TextView] = {"Label"->"", "Description"->"", "Placeholder"->"", "Event"->Null}

HTMLX = ImportComponent[FileNameJoin[{$troot, "HTML.wlx"}] ];

HTMLView[value_, opts: OptionsPattern[] ] := With[{id = CreateUUID[]},
	WLXEmbed[ HTMLX["Placeholder"->"Loading...", "UId" -> id, opts], "SideEffect"-> Global`InternalHandleHTMLView[value, id] ]
]

DropX = ImportComponent[FileNameJoin[{$troot, "Drop.wlx"}] ];

InputFile[opts: OptionsPattern[] ] := With[{id = CreateUUID[]},
	EventObject[<|"Id"->id, "View"->WLXEmbed[DropX["Event"->id, opts] ]|>]
]


SelectX = ImportComponent[FileNameJoin[{$troot, "Select.wlx"}] ];

InputSelect[apt_List, DefaultItem_:Null, opts: OptionsPattern[] ] := Module[{assoc = <||>}, 
	With[{
		id = CreateUUID[], 
		uid = CreateUUID[], 
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

	EventObject[<|"Id"->uid, "Initial"->assoc[Selected, "Value"], "View"->WLXEmbed[SelectX[ #["Name"]&/@ assoc, "Event"->id, "Selected"->Selected, "Label"->OptionValue["Label"] ] ]|>]	
] ]

Options[InputSelect] = {"Label" -> "", "Topic" -> "Default"}

GroupX = ImportComponent[FileNameJoin[{$troot, "Group.wlx"}] ];

InputGroup[{in__EventObject}, opts: OptionsPattern[] ] := With[{evid = CreateUUID[], groupid = CreateUUID[]},
	inputGroup[evid] = #[[1]]["Initial"] &/@ List[in];
	
	MapIndexed[With[{n = #2[[1]]},
		EventHandler[#1, {any_ :> Function[data, 
			inputGroup[evid] = ReplacePart[inputGroup[evid], n->data];
			EventFire[evid, any, inputGroup[evid] ];
		]}] 
	]&, List[in] ]; 

	
	With[{view = WLXEmbed[ GroupX["UId"->groupid, opts], "SideEffect"->Global`InternalHandleGroup[groupid, Table[CreateFrontEndObject[ i[[1]]["View"] ], {i, List[in]}] ] ]},
		EventObject[<|"Id"->evid, "Initial"->inputGroup[evid], "View"->view|>]
	]
];

Options[InputGroup] = {"Label" -> "", "Description"->""}

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

	
	With[{view = WLXEmbed[ GroupX["UId"->groupid, opts], "SideEffect"->Global`InternalHandleGroup[groupid, Table[CreateFrontEndObject[ i[[1]]["View"] ], {i, Values[in]}] ] ]},
		EventObject[<|"Id"->evid, "Initial"->inputGroup[evid], "View"->view|>]
	]
];


Unprotect[TableView]
ClearAll[TableView]

InputTable[list_, opts: OptionsPattern[] ] := LeakyModule[{loader}, With[{evid = CreateUUID[]},
	If[Depth[list] < 3, Return[Module, Style["Must be a list of lists!", Background->Red] ] ];
	loader[offset_, window_] := If[offset > Length[list],
		"EOF",
		list[[offset ;; Min[offset + window, Length[list] ] ]]
	];
	
	EventObject[<|"Id"->evid, "View"->HandsontableView[Take[list, Min[150, Length[list] ] ], "Event"->evid, "Loader"->ToString[loader], opts]|>]
] ]

Options[InputTable] = {"Height" -> 370}

SetAttributes[InputTable, HoldFirst]

TableView[list_List, opts: OptionsPattern[] ] := LeakyModule[{loader}, With[{},
	If[Depth[list] < 3, Return[Module, Style["Must be a list of lists!", Background->Red] ] ];
	
	loader[offset_, window_] := If[offset > Length[list],
		"EOF",
		list[[offset ;; Min[offset + window, Length[list] ] ]]
	];
	
	HandsontableView[Take[list, Min[150, Length[list] ] ], "Loader"->ToString[loader], opts]
] ]

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


End[]
EndPackage[]