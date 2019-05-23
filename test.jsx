
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
          <input id='pdbid' type="text" /><br></br>
          <button
		  	onClick={() => {
				localStorage.setItem("pdbid", document.getElementById('pdbid').value);
				pdbid = document.getElementById('pdbid').value
				document.getElementById('root').style.display = 'none'
				ET = getET(pdbid)
				loadStructure("rcsb://" + pdbid + ".mmtf").then(function() {
					if (ligandSelect.length > 1) {
						ligandSelect.selectedIndex = 1;
						ligandSelect.dispatchEvent(new Event('change'))
					}
				})
			  }}>Enter</button>
		</div>
        </div>
      </div>
    );
  }
}

class PDBorSeq extends React.Component {
  render() {
    return (
      <div>
        <div className="left">
		<div className="group">
          <p>Enter PDB id</p>
          <input id='pdbid' type="text" /><br></br>
          <button
		  	onClick={() => {
				localStorage.setItem("pdbid", document.getElementById('pdbid').value);
				pdbid = document.getElementById('pdbid').value
			  }}>Enter</button>
		</div>
        </div>
        <div className="right">
			<div className='group'>
				<p>Upload own pdb file</p>
			</div>
          
      </div>
	  </div>
    );
  }
}

function blast(seq) {
	let req = new XMLHttpRequest();
	req.open(
		'POST',
		'https://www.ebi.ac.uk/Tools/services/rest/ncbiblast/run',
		false
	)
	req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	req.setRequestHeader('Accept', 'text/plain');
	req.send(
		'email=tony@tony.tc' +
		'&title=123' + 
		'&program=blastp' +
		'&matrix=BLOSUM62' +
		'&alignments=50' +
		'&scores=50' +
		'&exp=1e-5' +
		'&stype=protein' +
		'&sequence=' + seq +
		'&database=uniprotkb_swissprot'
	)
	console.log(req.responseText)
	return req
}

function checkBlast(identifier) {
	let req = new XMLHttpRequest();
	req.open(
		'POST',
		'https://www.ebi.ac.uk/Tools/services/rest/ncbiblast/run',
		false
	)
}

class Blast extends React.Component {
	render() {
	  return (
		<div>
		  <div className="center">
		  <div className="group">
			<p>Enter PDB id</p>
			<input id='pdbid' type="text" /><br></br>
			<button
				onClick={() => {
				  localStorage.setItem("pdbid", document.getElementById('pdbid').value);
				  pdbid = document.getElementById('pdbid').value
				  document.getElementById('root').style.display = 'none'
				  ET = getET(pdbid)
				  loadStructure("rcsb://" + pdbid + ".mmtf").then(function() {
					  if (ligandSelect.length > 1) {
						  ligandSelect.selectedIndex = 1;
						  ligandSelect.dispatchEvent(new Event('change'))
					  }
				  })
				}}>Enter</button>
		  </div>
		  </div>
		</div>
	  );
	}
  }
ReactDOM.render(<PreFresh />, document.getElementById("root"));
