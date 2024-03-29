
InputRange[min_, max_, step_:1, opts___] := Module[{view, script, id = CreateUUID[]},
    EventObject[<|"id"->id, "initial"->(If[NumberQ[First[List[opts]]], First[List[opts]], Round[(min+max)/2//N, step]]), "view"->RangeView[{min, max, step, If[NumberQ[First[List[opts]]], First[List[opts]], Round[(min+max)/2//N, step]]}, "Event"->id, opts]|>]
];

InputSelect[list_List, opts___] := Module[{id = CreateUUID[], processed = Function[x, {x,x}] /@ list},
	EventObject[<|"id"->id, "initial"->list[[1]], "view"->SelectView[processed, "Event"->id, opts]|>]
]

InputButton[label_String:"Click"] := Module[{view, script, id = CreateUUID[]},
    EventObject[<|"id"->id, "initial"->False, "view"->ButtonView["Label"->label, "Event"->id]|>]
];

InputToggle[initial_:False, opts___] := Module[{view, script, id = CreateUUID[]},
    EventObject[<|"id"->id, "initial"->initial, "view"->ToggleView[initial, "Event"->id, opts]|>]
];

InputText[initial_:"", opts___] := Module[{view, script, id = CreateUUID[]},
    EventObject[<|"id"->id, "initial"->initial, "view"->TextView[initial, "Event"->id, opts]|>]
];

InputFile[label_String:"Drop a File"] := Module[{view, script, id = CreateUUID[]},
    EventObject[<|"id"->id, "initial"->Null, "view"->FileUploadView["Label"->label, "Event"->id]|>]
];

InputSpoiler[EventObject[assoc_], opts___] := With[{fe = CreateFrontEndObject[assoc["view"]]},
	EventObject[Join[assoc, <|"view"->SpoilerView[fe, opts]|>]]
]

InputSpoiler[expr_, opts___] := With[{fe = CreateFrontEndObject[expr]},
	CreateFrontEndObject[SpoilerView[fe, opts]]
]

InputGroup[in_List] := Module[{view}, With[{evid = CreateUUID[]},
	InputGroup[evid] = #[[1]]["initial"] &/@ in;
	
	MapIndexed[With[{n = #2[[1]]},
		EventBind[#1, Function[data, 
			InputGroup[evid] = ReplacePart[InputGroup[evid], n->data];
			EmittedEvent[evid, InputGroup[evid]];
		]]
	]&, in]; 

	view = (Table[CreateFrontEndObject[i, "igroup-"<>CreateUUID[]], {i, in}] // Column);
	EventObject[<|"id"->evid, "initial"->InputGroup[evid], "view"->view|>]
]];

InputGroup[in_Association] := Module[{view}, With[{evid = CreateUUID[]},
	InputGroup[evid] = #[[1]]["initial"] &/@ in;
	
	Map[With[{},
		EventBind[in[#], Function[data, 
			InputGroup[evid] = Join[InputGroup[evid], <|# -> data|>];
			EmittedEvent[evid, InputGroup[evid]];
		]]
	]&, Keys[in]]; 

	view = (Table[CreateFrontEndObject[i, "igroup-"<>CreateUUID[]], {i, in}] // Column);
	EventObject[<|"id"->evid, "initial"->InputGroup[evid], "view"->view|>]
]];

InputTable[list_, opts___] := LeakyModule[{loader}, With[{evid = CreateUUID[]},
	If[Depth[list] < 3, Return[Module, Style["Must be a list of lists!", Background->Red]]];
	loader[offset_, window_] := If[offset > Length[list],
		"EOF",
		list[[offset ;; Min[offset + window, Length[list]]]]
	];
	
	EventObject[<|"id"->evid, "view"->HandsontableView[Take[list, Min[150, Length[list]]], "Event"->evid, "Loader"->ToString[loader], opts]|>]
]]

SetAttributes[InputTable, HoldFirst]

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

(* old alias *)
HTMLSlider = InputsRange

CM6Form[EventObject[assoc_]] ^:= If[KeyExistsQ[assoc, "view"], CreateFrontEndObject[assoc["view"]],  EventObject[assoc]];

CreateFrontEndObject[EventObject[assoc_]] ^:= CreateFrontEndObject[assoc["view"]];
CreateFrontEndObject[EventObject[assoc_], uid_] ^:= CreateFrontEndObject[assoc["view"], uid];


Unprotect[Manipulate]
ClearAll[Manipulate]
