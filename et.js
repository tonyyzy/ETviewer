function getET(pdbid) {
	console.log("getET called")
	url = "https://radiant-dawn-80961.herokuapp.com/http://mammoth.bcm.tmc.edu/ETserver2/pdbeasytrace/" + pdbid + "A.zip";
	// url = "data/" + pdbid + "A.zip"
	var promise = new JSZip.external.Promise(function (resolve, reject) {
		JSZipUtils.getBinaryContent(url, function (err, data) {
			if (err) {
				reject(err);
			}
			else {
				resolve(data);
			}
		});
	});
	var ETScore = {};
	rankfile = promise.then(JSZip.loadAsync) // 2) chain with the zip promise
		.then(function (zip) {
			return zip.file("ET_" + pdbid + "A.ranks").async("string");
		});
	df = rankfile.then(function (content) {
		console.log("df called")
		list = content.split("\n");
		for (var i = 0; i < list.length; i++) {
			if (list[i][0] != "%" && list[i] != "") {
				const entry = list[i].split(/[ ]+/);
				const pos = parseInt(entry[2]);
				const score = entry[4];
				ETScore[pos] = Math.round((1 - parseFloat(score)) * 10)
			}
		}
		return ETScore;
	});
	return df
}