"use strict";

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
            localStorage.setItem("precomp", true);
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
        <div id="center" className="center">
				<p>Enter PDB id</p>
        <input type='text'></input>
				<button></button>
        </div>
      </div>
    );
  }
}

class PDBorSeq extends React.Component {
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
            localStorage.setItem("precomp", true);
            ReactDOM.render(<PrePDB />, document.getElementById("root"));
          }}
        >
          <p>Compute fresh evolutionary trace score</p>
        </div>
      </div>
    );
  }
}
ReactDOM.render(<PreFresh />, document.getElementById("root"));
