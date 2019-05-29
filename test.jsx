const e = React.createElement;

class PreFresh extends React.Component {
  render() {
    return (
      <div>
        <div
          className="left"
          onClick={function() {
            localStorage.setItem("precomp", true);
            ReactDOM.render(<PrePDB />, document.getElementById("root"));
          }}
        >
          <p>Use precomputed evolutionary trace data from Lichtarge</p>
        </div>
        <div
          className="right"
          onClick={function() {
            localStorage.setItem("precomp", false);
            ReactDOM.render(<PDBorSeq />, document.getElementById("root"));
          }}
        >
          <p>Compute fresh evolutionary trace score</p>
        </div>
      </div>
    );
  }
}

class PrePDB extends React.Component {
  render() {
    return (
      <div>
        <div className="center">
          <div className="group">
            <p>Enter PDB id</p>
            <input id="pdbid" type="text" />
            <br />
            <button
              onClick={() => {
                localStorage.setItem(
                  "pdbid",
                  document.getElementById("pdbid").value
                );
                pdbid = document.getElementById("pdbid").value;
                document.getElementById("root").style.display = "none";
                ET = getET(pdbid);
                loadStructure("rcsb://" + pdbid + ".mmtf").then(function() {
                  if (ligandSelect.length > 1) {
                    ligandSelect.selectedIndex = 1;
                    ligandSelect.dispatchEvent(new Event("change"));
                  }
                });
              }}
            >
              Enter
            </button>
          </div>
        </div>
      </div>
    );
  }
}
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if (new Date().getTime() - start > milliseconds) {
      break;
    }
  }
}

function inter() {
  ReactDOM.render(<Blast id={blastid} />, document.getElementById("root"));
}

function callWhenDone() {
  console.log("done.");
  checkBlast();
}

class PDBorSeq extends React.Component {
  render() {
    return (
      <div>
        <div className="left">
          <div className="group">
            <p>Enter PDB id</p>
            <input id="pdbid" type="text" />
            <br />
            <button
              onClick={() => {
                ReactDOM.render(<Blast />, document.getElementById("root"));
                localStorage.setItem(
                  "pdbid",
                  document.getElementById("pdbid").value
                );
                pdbid = document.getElementById("pdbid").value;
                localStorage.setItem("blastid", null);
                loadStructure("rcsb://" + pdbid + ".mmtf")
                  .then(() => {
                    const query_sequence = struc.structure
                      .getSequence()
                      .join("");
                    localStorage.setItem("query_sequence", query_sequence);
                    let blastid = submitBlast(query_sequence);
                    // let blastid =
                    //   "ncbiblast-R20190527-010058-0919-44184533-p1m";
                    sleep(1000);
                    return blastid;
                  })
                  .then(id => {
                    localStorage.setItem("blastid", id);
                    ReactDOM.render(
                      <Blast id={localStorage.getItem("blastid")} />,
                      document.getElementById("root")
                    );
                  })
                  .finally(() => {
                    let blastInterval = setInterval(() => {
                      console.log("check");
                      var resp;
                      resp = checkBlast();
                      if (resp.status == 200) {
                        console.log(resp.responseText);
                        localStorage.setItem("blast_result", resp.responseText);
                        clearInterval(blastInterval);
                        ReactDOM.render(
                          <Clustal />,
                          document.getElementById("root")
                        );
                      } else {
                        counter += 1;
                      }
                    }, 10000);
                  });
              }}
            >
              Enter
            </button>
          </div>
        </div>
        <div className="right">
          <div className="group">
            <p>Upload own pdb file</p>
            <input
              id="upload"
              type="file"
              accept=".pdb,.cif,.ent,.gz,.mol2"
              style={{ display: "none" }}
              onChange={function(e) {
                if (e.target.files[0]) {
                  loadStructure(e.target.files[0])
                  .then(() => {
                    const query_sequence = struc.structure
                      .getSequence()
                      .join("");
                    localStorage.setItem("query_sequence", query_sequence);
                    let blastid = submitBlast(query_sequence);
                    // let blastid =
                      // "ncbiblast-R20190527-010058-0919-44184533-p1m";
                    sleep(1000);
                    return blastid;
                  })
                  .then(id => {
                    localStorage.setItem("blastid", id);
                    ReactDOM.render(
                      <Blast id={localStorage.getItem("blastid")} />,
                      document.getElementById("root")
                    );
                  })
                  .finally(() => {
                    counter = 0
                    let blastInterval = setInterval(() => {
                      console.log("check");
                      var resp;
                      resp = checkBlast();
                      counter += 1
                      if (resp.status == 200) {
                        console.log(resp.responseText);
                        localStorage.setItem("blast_result", resp.responseText);
                        clearInterval(blastInterval);
                        ReactDOM.render(
                          <Clustal />,
                          document.getElementById("root")
                        );
                      } else {
                        counter += 1;
                      }
                    }, 10000);
                  });
                }
              }}
            />
            <button
              onClick={() => document.getElementById("upload").click()}
            >upload</button>
          </div>
        </div>
      </div>
    );
  }
}

function submitBlast(seq) {
  let req = new XMLHttpRequest();
  req.open(
    "POST",
    "https://www.ebi.ac.uk/Tools/services/rest/ncbiblast/run",
    false
  );
  req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  req.setRequestHeader("Accept", "text/plain");
  req.send(
    "email=tony@tony.tc" +
      "&title=test" +
      "&program=blastp" +
      "&matrix=BLOSUM62" +
      "&alignments=500" +
      "&scores=500" +
      "&exp=1e-5" +
      "&stype=protein" +
      "&sequence=" +
      seq +
      "&database=uniprotkb"
  );
  console.log(req.responseText);
  return req.responseText;
}

var counter;
function checkBlast() {
  console.log("try " + counter);
  let req = new XMLHttpRequest();
  req.open(
    "GET",
    "https://www.ebi.ac.uk/Tools/services/rest/ncbiblast/result/" +
      localStorage.getItem("blastid") +
      "/accs",
    false
  );
  req.send();
  return req;
}

class Blast extends React.Component {
  render() {
    return (
      <div>
        <div className="center">
          <p>BLAST running</p>
          <p>EBI Webservice identifier is {localStorage.getItem("blastid")}</p>
        </div>
      </div>
    );
  }
}

function prepareClustal() {
  let ids = localStorage
    .getItem("blast_result")
    .trimEnd()
    .split("\n");
  ids.forEach((value, index, arr) => {
    ids[index] = value.split(":")[1];
  });
  var result = [">User\n", localStorage.getItem("query_sequence") + "\n"];
  for (i = 0; i < ids.length; i++) {
    let req = new XMLHttpRequest();
    req.open(
      "GET",
      "https://www.uniprot.org/uniprot/" + ids[i] + ".fasta",
      false
    );
    req.send();
    if (req.status == 200) {
    result.push(req.responseText);}
  }
  return result.join("");
}

function submitClustal() {
  let req = new XMLHttpRequest();
  req.open(
    "POST",
    "https://www.ebi.ac.uk/Tools/services/rest/clustalo/run",
    false
  );
  req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  req.setRequestHeader("Accept", "text/plain");
  req.send("email=tony@tony.tc" + "&sequence=" + prepareClustal());
  console.log(req.responseText);
  localStorage.setItem("clustalid", req.responseText);
  ReactDOM.render(
    <div className="center">
      <p>Clustal running</p>
      <p>EBI webservice identifier is {req.responseText}</p>
    </div>,
    document.getElementById("root")
  );
  return req.responseText;
}

function parseClustal() {
  var result = [];
  var text = localStorage.getItem("clustal_result")
  text = text.split("\n");
  for (i = 0; i < text.length; i++) {
    result.push(text[i].split("\t")[0]);
  }
  localStorage.setItem("ET_input", result.join("\n"));
  return JSON.stringify(result.join("\n"));
}

function checkClustal() {
  counter = 1;
  console.log("try " + counter);
  let req = new XMLHttpRequest();
  req.open(
    "GET",
    "https://www.ebi.ac.uk/Tools/services/rest/clustalo/result/" +
      localStorage.getItem("clustalid") +
      "/aln-clustal_num",
    false
  );
  req.send();
  return req;
}

function submitET() {
  parseClustal()
  var req = new XMLHttpRequest();
  req.open(
    "POST",
    "https://radiant-dawn-80961.herokuapp.com/http://compbio.cs.princeton.edu/conservation/score_conservation.cgi",
    false
  );
  req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  req.send(
    "method_select=js_divergence" +
      "&window_size=3" +
      "&seq_weight=3" +
      "&background_select=blosum62" +
      "&matrix_select=blosum62" +
      "&alignment=" +
      localStorage.getItem("ET_input")
  );
  localStorage.setItem("ET_result", req.responseText);
  console.log(req.responseText);
  if (req.status == 200) {
    parseET();
    ETRepr.setParameters({
      color: NGL.ColormakerRegistry.addScheme(function() {
        this.atomColor = function(atom) {
          return gradient[ET[atom.resno]];
        };
      })
    });
    document.getElementById("root").style.display = "none";
    if (ligandSelect.length > 1) {
      ligandSelect.selectedIndex = 1;
      ligandSelect.dispatchEvent(new Event("change"));}

  }
}

function parseET() {
  var parser = new DOMParser();
  var doc = parser.parseFromString(
    localStorage.getItem("ET_result"),
    "text/html"
  );
  var content = doc.getElementsByTagName("pre")[0].innerHTML;
  content = content
    .trimEnd()
    .split("\n")
    .splice(2);
  ET = {};
  var tmpind = [];
  var tmpvalue = [];
  content.forEach((value, index, arr) => {
    var tmp = value.split("\t");
    if (tmp[2][0] != "-") {
      tmpind.push(index + 1);
      tmpvalue.push(parseFloat(tmp[1]));
    }
  });
  console.log(tmpvalue);
  var max = Math.max(...tmpvalue);
  var min = Math.min(...tmpvalue);
  var range = max - min;
  console.log(max, min);
  var ind = struc.structure.residueStore.resno[0];
  tmpvalue.forEach((value, index, arr) => {
    ET[ind] = Math.round(((tmpvalue[index] - min) / range) * 10);
    ind += 1
  });
  ET = Promise.resolve(ET)
}

class Clustal extends React.Component {
  render() {
    return (
      <div>
        <div className="center">
          <p>BLAST finished</p>
          <p>EBI Webservice identifier is {localStorage.getItem("blastid")}</p>
          <button
            onClick={() => {
              ReactDOM.render(
                <div className="center">
                  <p>Submitting clustal</p>
                </div>,
                document.getElementById("root")
              );
              setTimeout(() => {
                submitClustal();
              }, 1000);
              let clustalInterval = setInterval(() => {
                console.log("check clustal");
                var resp;
                resp = checkClustal();
                if (resp.status == 200) {
                  console.log(resp.responseText);
                  localStorage.setItem("clustal_result", resp.responseText);
                  clearInterval(clustalInterval);
                  ReactDOM.render(
                    <div className="center">
                      <p>Clustal finished</p>
                      <button
                        onClick={() => {
                          submitET();
                        }}
                      >
                        Calculate ET score
                      </button>
                    </div>,
                    document.getElementById("root")
                  );
                } else {
                  counter += 1;
                }
              }, 10000);
            }}
          >
            Submit Clustal
          </button>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<PreFresh />, document.getElementById("root"));
