process.env.NODE_ENV = 'test';
var pathToFVLib = '../src/FacetedValuesJS.js';
var FacetedValuesJS = (require(pathToFVLib).bin)(pathToFVLib);
var fs = require('fs');

exports.testFacetedValuesJS = {

    /**
     * @param {NodeUnit} test
     */
    t00_basic: function t01_basic(test){
        var testBattery = [
            't00_basic'
        ];
        test.expect(testBattery.length);
        testBattery.forEach(function(testName){
            var expectedOutput = fs.readFileSync('./test/files/' + testName + '_output.js').toString();
            var actualOutput = FacetedValuesJS.fromFile('./test/files/' + testName + '_input.js').toString();
            test.equal(actualOutput, expectedOutput);
        });
        test.done();
    }
};
