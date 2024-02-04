BeginPackage["Notebook`Kernel`Inputs`", {
	"JerryI`Misc`Events`",
	"JerryI`WLX`",
    "JerryI`WLX`Importer`",
	"JerryI`Misc`WLJS`Transport`"
}]

InputRange::usage = "InputRange[min, max, step:1, initial:(max+min)/2, \"Label\"->\"\", \"Topic\"->\"Default\"] _EventObject."
InputCheckbox::usage = "InputCheckbox[state_Bool, \"Label\"->, \"Description\"->, , \"Topic\"->\"Default\"] _EventObject. A standard checkbox"
InputButton::usage = "InputBotton[label_String, \"Topic\"->\"Default\"] _EventObject. A standard button"


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


End[]
EndPackage[]