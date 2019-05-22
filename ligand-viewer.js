const gradient = [
  0xff0932,
  0xfb4309,
  0xf7a209,
  0xe9f408,
  0x88f008,
  0x2aed07,
  0x07e940,
  0x07e599,
  0x06d5e2,
  0x067ade,
  0x001d66
];

let ligand_sele = "";

// set stage for html
const stage = new NGL.Stage("viewport");
NGL.DatasourceRegistry.add("data", new NGL.StaticDatasource("data/"));

// set background to white
stage.setParameters({
  backgroundColor: "white"
});

// add element to stage's viewer container
let leftbar = document.createElement("div");
Object.assign(leftbar, {
  id: 'leftbar'
})
Object.assign(leftbar.style, {
  position: "absolute",
  overflowY: 'auto',
  height: '100%',
  top: "0px",
  left: "12px",
  zIndex: 10
});
document.getElementById('viewport').appendChild(leftbar)
// stage.viewer.container.appendChild(leftbar);
function addElement() {
  for (i = 0; i < arguments.length; i++) {
    leftbar.appendChild(arguments[i]);
  }
  leftbar.appendChild(document.createElement("br"));
}

// Handle window resizing
window.addEventListener(
  "resize",
  function(event) {
    stage.handleResize();
  },
  false
);

// create element
function createElement(name, properties, style) {
  var el = document.createElement(name);
  Object.assign(el, properties);
  Object.assign(el.style, style);
  return el;
}

function createSelect(options, properties, style) {
  var select = createElement("select", properties, style);
  options.forEach(function(d) {
    select.add(
      createElement("option", {
        value: d[0],
        text: d[1]
      })
    );
  });
  return select;
}

function createFileButton(label, properties, style) {
  var input = createElement(
    "input",
    Object.assign(
      {
        type: "file"
      },
      properties
    ),
    { display: "none" }
  );
  addElement(input);
  var button = createElement(
    "input",
    {
      value: label,
      type: "button",
      className: 'butt',
      onclick: function() {
        input.click();
      }
    },
    style
  );
  return button;
}

// create tooltip element and add to document body
var tooltip = document.createElement("div");
Object.assign(tooltip.style, {
  display: "none",
  position: "fixed",
  zIndex: 10,
  pointerEvents: "none",
  backgroundColor: "rgba( 0, 0, 0, 0.6 )",
  color: "lightgrey",
  padding: "8px",
  fontFamily: "sans-serif"
});
document.body.appendChild(tooltip);

// remove default hoverPick mouse action
stage.mouseControls.remove("hoverPick");

// listen to `hovered` signal to move tooltip around and change its text
stage.signals.hovered.add(function(pickingProxy) {
  if (pickingProxy) {
    if (pickingProxy.atom || pickingProxy.bond) {
      var atom = pickingProxy.atom || pickingProxy.closestBondAtom;
      var vm = atom.structure.data["@valenceModel"];
      if (vm && vm.idealValence) {
        tooltip.innerHTML = `${pickingProxy.getLabel()}<br/>
        <hr/>
        Atom: ${atom.qualifiedName()}<br/>
        ideal valence: ${vm.idealValence[atom.index]}<br/>
        ideal geometry: ${vm.idealGeometry[atom.index]}<br/>
        implicit charge: ${vm.implicitCharge[atom.index]}<br/>
        formal charge: ${
          atom.formalCharge === null ? "?" : atom.formalCharge
        }<br/>
        aromatic: ${atom.aromatic ? "true" : "false"}<br/>
        `;
      } else if (vm && vm.charge) {
        tooltip.innerHTML = `${pickingProxy.getLabel()}<br/>
        <hr/>
        Atom: ${atom.qualifiedName()}<br/>
        Index: ${atom.index}<br/>
        vm charge: ${vm.charge[atom.index]}<br/>
        vm implicitH: ${vm.implicitH[atom.index]}<br/>
        vm totalH: ${vm.totalH[atom.index]}<br/>
        vm geom: ${vm.idealGeometry[atom.index]}</br>
        formal charge: ${
          atom.formalCharge === null ? "?" : atom.formalCharge
        }<br/>
        aromatic: ${atom.aromatic ? "true" : "false"}<br/>
        `;
      } else {
        tooltip.innerHTML = `${pickingProxy.getLabel()}`;
      }
    } else {
      tooltip.innerHTML = `${pickingProxy.getLabel()}`;
    }
    var mp = pickingProxy.mouse.position;
    tooltip.style.bottom = window.innerHeight - mp.y + 3 + "px";
    tooltip.style.left = mp.x + 3 + "px";
    tooltip.style.display = "block";
  } else {
    tooltip.style.display = "none";
  }
});

stage.signals.clicked.add(function(pickingProxy) {
  if (pickingProxy && (pickingProxy.atom || pickingProxy.bond)) {
    console.log(pickingProxy.atom || pickingProxy.closestBondAtom);
  }
});

var ligandSele = "(( not polymer or hetero ) and not ( water or ion ))";

var pocketRadius = 0;
var pocketRadiusClipFactor = 1;

var cartoonRepr,
  backboneRepr,
  spacefillRepr,
  neighborRepr,
  ligandRepr,
  contactRepr,
  pocketRepr,
  labelRepr;

var struc;
var neighborSele;

function loadStructure(input) {
  struc = undefined;
  stage.setFocus(0);
  stage.removeAllComponents();
  ligandSelect.innerHTML = "";
  clipNearRange.value = 0;
  clipRadiusRange.value = 100;
  pocketOpacityRange.value = 0;
  cartoonCheckbox.checked = false;
  backboneCheckbox.checked = false;
  hydrophobicCheckbox.checked = false;
  hydrogenBondCheckbox.checked = true;
  weakHydrogenBondCheckbox.checked = false;
  waterHydrogenBondCheckbox.checked = true;
  backboneHydrogenBondCheckbox.checked = true;
  halogenBondCheckbox.checked = true;
  metalInteractionCheckbox.checked = true;
  saltBridgeCheckbox.checked = true;
  cationPiCheckbox.checked = true;
  piStackingCheckbox.checked = true;
  return stage.loadFile(input).then(function(o) {
    struc = o;
    setLigandOptions();
    setChainOptions();
    setResidueOptions();
    o.autoView();
    cartoonRepr = o.addRepresentation("cartoon", {
      visible: false
    });
    backboneRepr = o.addRepresentation("backbone", {
      visible: true,
      colorValue: "lightgrey",
      radiusScale: 2
    });
    spacefillRepr = o.addRepresentation("spacefill", {
      sele: ligandSele,
      visible: true
    });
    neighborRepr = o.addRepresentation("ball+stick", {
      sele: "none",
      aspectRatio: 1.1,
      colorValue: "lightgrey",
      multipleBond: "symmetric"
    });
    ligandRepr = o.addRepresentation("ball+stick", {
      multipleBond: "symmetric",
      colorValue: "grey",
      sele: "none",
      aspectRatio: 1.2,
      radiusScale: 2.5
    });
    contactRepr = o.addRepresentation("contact", {
      sele: "none",
      radiusSize: 0.07,
      weakHydrogenBond: false,
      waterHydrogenBond: false,
      backboneHydrogenBond: true
    });
    pocketRepr = o.addRepresentation("surface", {
      sele: "none",
      lazy: true,
      visibility: true,
      clipNear: 0,
      opaqueBack: false,
      opacity: 0.0,
      color: "hydrophobicity",
      roughness: 1.0,
      surfaceType: "av"
    });
    ETRepr = o.addRepresentation("hyperball", {
      sele: "none",
      color: 0x00ffffff,
      opacity: 0.5
    });
    labelRepr = o.addRepresentation("label", {
      sele: "none",
      color: "#333333",
      yOffset: 0.2,
      zOffset: 2.0,
      attachment: "bottom-center",
      showBorder: true,
      borderColor: "lightgrey",
      borderWidth: 0.25,
      disablePicking: true,
      radiusType: "size",
      radiusSize: 0.8,
      labelType: "residue",
      labelGrouping: "residue"
    });
  });
}

// get list of ligands
function setLigandOptions() {
  ligandSelect.innerHTML = "";
  var options = [["", "select ligand"]];
  struc.structure.eachResidue(function(rp) {
    if (rp.isWater()) return;
    var sele = "";
    if (rp.resno !== undefined) sele += rp.resno;
    if (rp.inscode) sele += "^" + rp.inscode;
    if (rp.chain) sele += ":" + rp.chainname;
    var name = (rp.resname ? "[" + rp.resname + "]" : "") + sele;
    if (rp.entity.description) name += " (" + rp.entity.description + ")";
    options.push([sele, name]);
  }, new NGL.Selection(ligandSele));
  options.forEach(function(d) {
    ligandSelect.add(
      createElement("option", {
        value: d[0],
        text: d[1]
      })
    );
  });
}

// get list of chains
function setChainOptions() {
  chainSelect.innerHTML = "";
  var options = [["", "select chain"]];
  struc.structure.eachChain(function(cp) {
    var name = cp.chainname;
    if (cp.entity.description) name += " (" + cp.entity.description + ")";
    options.push([cp.chainname, name]);
  }, new NGL.Selection("polymer"));
  options.forEach(function(d) {
    chainSelect.add(
      createElement("option", {
        value: d[0],
        text: d[1]
      })
    );
  });
}

// get list of residues
function setResidueOptions(chain) {
  residueSelect.innerHTML = "";
  var options = [["", "select residue"]];
  if (chain) {
    struc.structure.eachResidue(function(rp) {
      var sele = "";
      if (rp.resno !== undefined) sele += rp.resno;
      if (rp.inscode) sele += "^" + rp.inscode;
      if (rp.chain) sele += ":" + rp.chainname;
      var name = (rp.resname ? "[" + rp.resname + "]" : "") + sele;
      options.push([sele, name]);
    }, new NGL.Selection("polymer and :" + chain));
  }
  options.forEach(function(d) {
    residueSelect.add(
      createElement("option", {
        value: d[0],
        text: d[1]
      })
    );
  });
}

// add load structure button to load custom structure
var loadStructureButton = createFileButton("load structure", {
  accept: ".pdb,.cif,.ent,.gz,.mol2",
  onchange: function(e) {
    if (e.target.files[0]) {
      loadStructure(e.target.files[0]);
    }
  }
});
addElement(loadStructureButton);

// load from PDB code
var loadPdbidText = createElement("span", {
  innerText: "load pdb id"
});

var loadPdbidInput = createElement("input", {
  type: "text",
  title: "press enter to load pdbid",
  onkeypress: function(e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      pdbid = e.target.value.toLowerCase();
      ET = getET(pdbid);
      loadStructure("rcsb://" + e.target.value);
    }
  }
}, {width: '120px'});
addElement(loadPdbidText);
addElement(loadPdbidInput);

// show full structure button
function showFull() {
  ligandSelect.value = "";

  backboneRepr.setParameters({ radiusScale: 2 });
  backboneRepr.setVisibility(true);
  spacefillRepr.setVisibility(true);

  ligandRepr.setVisibility(false);
  neighborRepr.setVisibility(false);
  contactRepr.setVisibility(false);
  pocketRepr.setVisibility(false);
  labelRepr.setVisibility(false);

  struc.autoView();
}
var fullButton = createElement(
  "input",
  {
    value: "full structure",
    className: 'butt',
    type: "button",
    onclick: showFull
  },
  { left: "12px" }
);
addElement(fullButton);

// show ligand based on selection
function showLigand(sele) {
  // sele is ligandSele
  var s = struc.structure; // structureComponenet from ngl
  var withinSele = s.getAtomSetWithinSelection(
    new NGL.Selection(sele),
    LIGAND_RADIUS
  ); // select ligand and get atoms in ligands
  var withinGroup = s.getAtomSetWithinGroup(withinSele);
  var expandedSele = withinGroup.toSeleString(); // expand selection to include neighboring residues?
  // neighborSele = '(' + expandedSele + ') and not (' + sele + ')'
  neighborSele = expandedSele;

  var sview = s.getView(new NGL.Selection(sele)); // get view of ligand
  pocketRadius =
    Math.max(sview.boundingBox.getSize(new NGL.Vector3()).length() / 2, 2) + 5; // get pocket size?
  var withinSele2 = s.getAtomSetWithinSelection(
    new NGL.Selection(sele),
    pocketRadius + 2
  );
  var neighborSele2 =
    "(" + withinSele2.toSeleString() + ") and not (" + sele + ") and polymer";

  backboneRepr.setParameters({ radiusScale: 0.2 });
  backboneRepr.setVisibility(backboneCheckbox.checked);
  spacefillRepr.setVisibility(false);

  ligandRepr.setVisibility(true);
  neighborRepr.setVisibility(true);
  contactRepr.setVisibility(true);
  pocketRepr.setVisibility(true);
  labelRepr.setVisibility(labelCheckbox.checked);

  ligandRepr.setSelection(sele);
  neighborRepr.setSelection(
      "(" + neighborSele + ") and (not water)"
  );
  contactRepr.setSelection("(" + expandedSele + ") and (not water)");
  pocketRepr.setSelection(neighborSele2);
  pocketRepr.setParameters({
    clipRadius: pocketRadius * pocketRadiusClipFactor,
    clipCenter: sview.center
  });
  labelRepr.setSelection("(" + neighborSele + ") and not (water or ion)");
  ETRepr.setVisibility(etCheckbox.checked);
  var s = struc.structure; // structureComponenet from ngl
  neighborSele =
    "(" + expandedSele + ") and not (water or ion) and not (" + sele + ")";
  ETRepr.setSelection(neighborSele);
  ET.then(function(rank) {
    ETRepr.setParameters({
      color: NGL.ColormakerRegistry.addScheme(function() {
        this.atomColor = function(atom) {
          return gradient[rank[atom.resno]];
        };
      })
    });
  });

  struc.autoView(expandedSele);
}

// select ligand
var ligandSelect = createSelect(
  [],
  {
    onchange: function(e) {
      residueSelect.value = "";
      var sele = e.target.value;
      if (!sele) {
        showFull();
      } else {
        ligand_sele = sele;
        showLigand(sele);
      }
    }
  },
  {width: "130px" }
);
addElement(ligandSelect);

// select chain
var chainSelect = createSelect(
  [],
  {
    onchange: function(e) {
      ligandSelect.value = "";
      residueSelect.value = "";
      setResidueOptions(e.target.value);
    }
  },
  {width: "130px" }
);
addElement(chainSelect);

// select residue
var residueSelect = createSelect(
  [],
  {
    onchange: function(e) {
      ligandSelect.value = "";
      var sele = e.target.value;
      if (!sele) {
        showFull();
      } else {
        ligand_sele = sele;
        showLigand(sele);
      }
    }
  },
  {width: "130px" }
);
addElement(residueSelect);
addElement()

// ligand radius slider
addElement(
  createElement(
    "span",
    {
      innerText: "ligand radius"
    },
    {color: "grey" }
  )
);
var ligandRadiusRange = createElement(
  "input",
  {
    type: "range",
    value: 5,
    min: 1,
    max: 30,
    step: 1
  }
);
ligandRadiusRange.oninput = function(e) {
  LIGAND_RADIUS = parseInt(e.target.value);
  showLigand(ligand_sele);
};
addElement(ligandRadiusRange);

// carton checkbox
var cartoonCheckbox = createElement("input", {
  type: "checkbox",
  checked: false,
  onchange: function(e) {
    cartoonRepr.setVisibility(e.target.checked);
  }
});
addElement(
  cartoonCheckbox,
  createElement(
    "span",
    {
      innerText: "cartoon"
    },
    { color: "grey" }
  )
);

// backbone checkbox
var backboneCheckbox = createElement("input", {
  type: "checkbox",
  checked: false,
  onchange: function(e) {
    backboneRepr.setVisibility(e.target.checked);
  }
});
addElement(
  backboneCheckbox,
  createElement(
    "span",
    {
      innerText: "backbone"
    },
    { color: "grey" }
  )
);

// label checkbox
var labelCheckbox = createElement("input", {
  type: "checkbox",
  checked: true,
  onchange: function(e) {
    labelRepr.setVisibility(e.target.checked);
  }
});
addElement(
  labelCheckbox,
  createElement(
    "span",
    {
      innerText: "label"
    },
    { color: "grey" }
  )
);

// ET checkbox
var etCheckbox = createElement("input", {
  type: "checkbox",
  checked: true,
  onchange: function(e) {
    ETRepr.setVisibility(e.target.checked);
  }
});
addElement(
  etCheckbox,
  createElement(
    "span",
    {
      innerText: "ET"
    },
    { color: "grey" }
  )
);

function interactionOptions() {
  var options = document.getElementById('interaction')
  if (this.value == "Interaction options ▼") {
    this.value = "Interaction options ►";
    options.style.display = "none";
  } else {
    this.value = "Interaction options ▼";
    options.style.display = "block";
  }
}

var interactionButton = createElement(
  'input', 
  {
    type: 'button',
    value: 'Interaction options ►',
    className: 'butt',
    onclick: interactionOptions
  }
)
addElement(interactionButton)
// pocket near clipping
var interaction = document.createElement('div');
Object.assign(interaction,
  {
    id: 'interaction',
    className: 'collapsible'
  })
leftbar.appendChild(interaction)
function addElementInter() {
  for (i = 0; i < arguments.length; i++) {
    interaction.appendChild(arguments[i]);
  }
  interaction.appendChild(document.createElement("br"));
}
// hydrophobic interaction checkbox
var hydrophobicCheckbox = createElement(
  "input",
  {
    type: "checkbox",
    checked: false,
    onchange: function(e) {
      contactRepr.setParameters({ hydrophobic: e.target.checked });
    }
  },
  { left: "12px" }
);
addElementInter(
  hydrophobicCheckbox,
  createElement(
    "span",
    {
      innerText: "hydrophobic"
    },
    { color: "grey" }
  )
);

// hydrogen bond checkbox
var hydrogenBondCheckbox = createElement("input", {
  type: "checkbox",
  checked: false,
  onchange: function(e) {
    contactRepr.setParameters({ hydrogenBond: e.target.checked });
  }
});
addElementInter(
  hydrogenBondCheckbox,
  createElement(
    "span",
    {
      innerText: "hbond"
    },
    { color: "grey" }
  )
);

// weak hydrogen bond checkbox
var weakHydrogenBondCheckbox = createElement("input", {
  type: "checkbox",
  checked: false,
  onchange: function(e) {
    contactRepr.setParameters({ weakHydrogenBond: e.target.checked });
  }
});
addElementInter(
  weakHydrogenBondCheckbox,
  createElement(
    "span",
    {
      innerText: "weak hbond"
    },
    { color: "grey" }
  )
);

// water hydrogen bond checkbox
var waterHydrogenBondCheckbox = createElement("input", {
  type: "checkbox",
  checked: false,
  onchange: function(e) {
    contactRepr.setParameters({ waterHydrogenBond: e.target.checked });
  }
});
addElementInter(
  waterHydrogenBondCheckbox,
  createElement(
    "span",
    {
      innerText: "water-water hbond"
    },
    { color: "grey" }
  )
);

// backbone hydrogen bond checkbox
var backboneHydrogenBondCheckbox = createElement("input", {
  type: "checkbox",
  checked: false,
  onchange: function(e) {
    contactRepr.setParameters({ backboneHydrogenBond: e.target.checked });
  }
});
addElementInter(
  backboneHydrogenBondCheckbox,
  createElement(
    "span",
    {
      innerText: "backbone-backbone hbond"
    },
    { color: "grey" }
  )
);

// halogen bond checkbox
var halogenBondCheckbox = createElement("input", {
  type: "checkbox",
  checked: true,
  onchange: function(e) {
    contactRepr.setParameters({ halogenBond: e.target.checked });
  }
});
addElementInter(
  halogenBondCheckbox,
  createElement(
    "span",
    {
      innerText: "halogen bond"
    },
    { color: "grey" }
  )
);

// metal interaction checkbox
var metalInteractionCheckbox = createElement("input", {
  type: "checkbox",
  checked: true,
  onchange: function(e) {
    contactRepr.setParameters({ metalComplex: e.target.checked });
  }
});
addElementInter(
  metalInteractionCheckbox,
  createElement(
    "span",
    {
      innerText: "metal interaction"
    },
    { color: "grey" }
  )
);
// ionic interaction checkbox
var ionicInteractionCheckbox = createElement('input', {
  type: 'checkbox',
  checked: true,
  onchange: function (e) {
    contactRepr.setParameters({ ionicInteraction: e.target.checked })
  }
})
addElementInter(ionicInteractionCheckbox, createElement('span', {
  innerText: 'ionic interaction'
}, { color: 'grey' }))

// metal coordination checkbox
var metalCoordinationCheckbox = createElement('input', {
  type: 'checkbox',
  checked: true,
  onchange: function (e) {
    contactRepr.setParameters({ metalCoordination: e.target.checked })
  }
})
addElementInter(metalCoordinationCheckbox, createElement('span', {
  innerText: 'metal coordination'
}, { color: 'grey' }))

// saltbridge checkbox
var saltBridgeCheckbox = createElement("input", {
  type: "checkbox",
  checked: true,
  onchange: function(e) {
    contactRepr.setParameters({ saltBridge: e.target.checked });
  }
});
addElementInter(
  saltBridgeCheckbox,
  createElement(
    "span",
    {
      innerText: "salt bridge"
    },
    { color: "grey" }
  )
);

//cation-pi checkbox
var cationPiCheckbox = createElement("input", {
  type: "checkbox",
  checked: true,
  onchange: function(e) {
    contactRepr.setParameters({ cationPi: e.target.checked });
  }
});
addElementInter(
  cationPiCheckbox,
  createElement(
    "span",
    {
      innerText: "cation-pi"
    },
    { color: "grey" }
  )
);

// pi-stacking checkbox
var piStackingCheckbox = createElement("input", {
  type: "checkbox",
  checked: true,
  onchange: function(e) {
    contactRepr.setParameters({ piStacking: e.target.checked });
  }
});
addElementInter(
  piStackingCheckbox,
  createElement(
    "span",
    {
      innerText: "pi-stacking"
    },
    { color: "grey" }
  ),
  createElement("br")
);

function pocketOptions() {
  var options = document.getElementById('pocket')
  if (this.value == "show pocket options ▼") {
    this.value = "show pocket options ►"
    options.style.display = "none";
  } else {
    this.value = "show pocket options ▼"
    options.style.display = "block";
  }
}

var pocketButton = createElement(
  'input', 
  {
    type: 'button',
    value: 'show pocket options ►',
    className: 'butt',
    onclick: pocketOptions
  }
)
addElement(pocketButton)
// pocket near clipping
var pocket = document.createElement('div');
Object.assign(pocket,
  {
    id: 'pocket',
    className: 'collapsible'
  })
leftbar.appendChild(pocket)

function addElementPocket() {
    for (i = 0; i < arguments.length; i++) {
      pocket.appendChild(arguments[i]);
    }
    pocket.appendChild(document.createElement("br"));
  }
addElementPocket(
  createElement(
    "span",
    {
      innerText: "pocket near clipping"
    },
    { color: "grey" }
  )
);
var clipNearRange = createElement(
  "input",
  {
    type: "range",
    value: 0,
    min: 0,
    max: 10000,
    step: 1,
    className: 'pocket'
  }
);
clipNearRange.oninput = function(e) {
  var sceneRadius =
    stage.viewer.boundingBox.getSize(new NGL.Vector3()).length() / 2;

  var f = pocketRadius / sceneRadius;
  var v = parseFloat(e.target.value) / 10000; // must be between 0 and 1
  var c = 0.5 - f / 2 + v * f;

  pocketRepr.setParameters({
    clipNear: c * 100 // must be between 0 and 100
  });
};
addElementPocket(clipNearRange);

// pocket radius
addElementPocket(
  createElement(
    "span",
    {
      innerText: "pocket radius clipping",
      className: 'pocket'
    },
    {color: "grey" }
  )
);
var clipRadiusRange = createElement(
  "input",
  {
    type: "range",
    value: 100,
    min: 1,
    max: 100,
    step: 1,
    className: 'pocket'
  },
  { left: "12px" }
);
clipRadiusRange.oninput = function(e) {
  pocketRadiusClipFactor = parseFloat(e.target.value) / 100;
  pocketRepr.setParameters({
    clipRadius: pocketRadius * pocketRadiusClipFactor
  });
};
addElementPocket(clipRadiusRange);

// pocket opacity slider
addElementPocket(
  createElement(
    "span",
    {
      innerText: "pocket opacity",
      className: 'pocket'
    },
    {color: "grey" }
  )
);
var pocketOpacityRange = createElement(
  "input",
  {
    type: "range",
    value: 90,
    min: 0,
    max: 100,
    step: 1,
    className: 'pocket'
  }
);
pocketOpacityRange.oninput = function(e) {
  pocketRepr.setParameters({
    opacity: parseFloat(e.target.value) / 100
  });
};
addElementPocket(pocketOpacityRange);

var mCarton, mBallStick;

function showMutation() {
  // TODO: promise/async
  if (mCarton != undefined) {
    mCarton.setVisibility(false);
    mBallStick.setVisibility(false);
  }
  position = document.getElementById("residuePosition").value;
  aminoacid = document.getElementById("aminoacid").value;
  // alert("position is " + position + "\naminoacid is " + aminoacid)
  seq = struc.structure.getSequence();
  start = struc.structure.residueStore.resno[0];
  for (i = 0; i < seq.length; i++) {
    seq[i] = seq[i].toLowerCase();
  }
  seq[position - start] = aminoacid.toUpperCase();
  seq = seq.join("");

  let req = new XMLHttpRequest();
  req.open(
    "GET",
    "https://gcg84x41k5.execute-api.eu-west-2.amazonaws.com/default/squirrel?pdbid=" +
      pdbid +
      "&seq=" +
      seq,
    false
  );
  req.send(null);
  var result = new Blob([JSON.parse(req.responseText)], { type: "text/plain" });
  stage.loadFile(result, { ext: "pdb" }).then(function(o) {
    mCarton = o.addRepresentation("cartoon", {
      visible: true,
      colorScheme: "residueindex"
    });
    mBallStick = o.addRepresentation("ball+stick", {
      sele: position
    });
    LIGAND_RADIUS = 0;
    showLigand(ligand_sele);
    o.autoView();
  });
}

function addMutation() {
  var mutationText = createElement(
    "span",
    {
      innerText: "residue mutation"
    },
    {color: "black" }
  );
  addElement(mutationText);

  var positionText = createElement(
    "span",
    {
      innerText: "residue position"
    },
    {color: "grey" }
  );
  addElement(positionText);

  var positionInput = createElement(
    "input",
    {
      type: "text",
      title: "Input residue position to mutate",
      id: "residuePosition"
    },
    {width: "120px" }
  );
  addElement(positionInput);

  var aminoacidText = createElement(
    "span",
    {
      innerText: "change to"
    },
    {color: "grey" }
  );
  addElement(aminoacidText);

  var aminoacidInput = createElement(
    "input",
    {
      type: "text",
      title: "amino acid",
      id: "aminoacid"
    },
    {width: "120px" }
  );
  addElement(aminoacidInput);

  var mutationButton = createElement(
    "input",
    {
      value: "Mutate!",
      type: "button",
      className: 'butt',
      onclick: showMutation
    }
  );
  addElement(mutationButton);
}
addMutation()


function colorOptions() {
  var options = document.getElementById('color')
  if (this.value == "show color scale ▼") {
    this.value = "show color scale ►"
    options.style.display = "none";
  } else {
    this.value = "show color scale ▼"
    options.style.display = "block";
  }
}

var colorButton = createElement(
  'input', 
  {
    type: 'button',
    value: 'show color scale ▼',
    className: 'butt',
    title: 'color scale',
    onclick: colorOptions
  }
)
addElement(colorButton)
var color = document.createElement('table');
Object.assign(color,
  {
    id: 'color',
    className: 'collapsible tooltip'
  })
leftbar.appendChild(color)
color.appendChild(createElement('span', {
  className: 'tooltiptext',
  innerText: 'More conserved residues have higher scores (deep blue)'
}))
var row1 = document.createElement('tr')
var row2 = document.createElement('tr')
color.appendChild(row1)
color.appendChild(row2)
for (i = 0; i < 11; i ++) {
  row1.appendChild(createElement('td',
  {
    className: 'color-box'
  },
  {
    backgroundColor: '#' + gradient[i].toString(16).padStart(6, 0)
  }))
  row2.appendChild(createElement('td', {textContent: i}))
}

pdbid = "4kvq";
LIGAND_RADIUS = 5;
ligand_sele = "PLM";
var ET = getET(pdbid);
loadStructure("rcsb://" + pdbid + ".mmtf").then(function() {
  showLigand("PLM");
});
