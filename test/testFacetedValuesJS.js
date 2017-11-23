process.env.NODE_ENV = 'test';
var FacetedValuesJS = require('../src/FacetedValuesJS');
var fs = require('fs');

exports.testFacetedValuesJS = {};

/*
 * This program searches the test_files
 * directory for files that end with _input.js and
 * trims them to acquire test names. These are
 * then used to create nodeunit tests.
 *
 * E.g. to create a new test called FOO, add FOO_input.js
 * as a new file, and then FOO_output.js. This will result in a new
 * nodeunit test that processes the input file using FacetedValuesJS
 * and compares it to the output file.
 */

/**
 * @type {Array.<String>}
 */
var testBattery = fs.readdirSync('../test_files/')
    .map(function forInputFiles(filename){
        return filename.substring(0, filename.indexOf("_input.js"));
    }).filter(function removeEmpties(str){
        return str.length;
    });

testBattery.forEach(function testBattery(testName){
    /**
     * @param {NodeUnit} test
     */
    exports.testFacetedValuesJS[testName] = function(test){
        test.expect(testBattery.length);
        function readWrite(prefix){
            var expectedOutput = fs.readFileSync(prefix + '_output.js').toString();
            var actualOutput = FacetedValuesJS.fromFile(prefix + '_input.js').toString();
            test.equal(actualOutput, expectedOutput);
        }
        try {
            readWrite('./test_files/' + testName);
        } catch(ignored){
            readWrite('../test_files/' + testName);
        }
        test.done();
    };
});

/**
 * @param {NodeUnit} test
 */
exports.testFacetedValuesJS.testImport_Cloak = function testImport_Cloak(test){
    test.expect(2);
    var Cloak = FacetedValuesJS.Cloak;
    var view = ['a'];
    var x = Cloak(view, 11);
    test.equal(x, 11);
    view.pop();
    test.notEqual(x, 11);
    test.done();
}

/**
 * @param {NodeUnit} test
 */
exports.testFacetedValuesJS.testImport_FacetedValue = function testImport_FacetedValue(test){
    test.expect(1);
    var FacetedValue = FacetedValuesJS.FacetedValue;
    var expected = '<A ? <B ? 1 : 3> : <B ? 5 : 7>>';
    var actual = new FacetedValue("A",
        new FacetedValue("B", 1, 3),
        new FacetedValue("B", 5, 7)
    ).toString();
    test.equal(actual, expected);
    test.done();
}
