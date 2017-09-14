process.env.NODE_ENV = 'test';
var pathToFVLib = '../src/FacetedValuesJS.js';
var FacetedValuesJS = (require(pathToFVLib))(pathToFVLib);
var fs = require('fs');

exports.testFacetedValuesJS = {};
[
    't00_basic'
].forEach(function(testName){
    /**
     * @param {NodeUnit} test
     */
    exports.testFacetedValuesJS[testName] = function(test){
        test.expect(1);
        console.log(__dirname);
        var prefix = __dirname + '/files/' + testName;
        var expectedOutput = fs.readFileSync(prefix + '_output.js').toString();
        var actualOutput = FacetedValuesJS.fromFile(prefix + '_input.js').toString();
        test.equal(actualOutput, expectedOutput);
        test.done();
    };
});
