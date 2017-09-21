process.env.NODE_ENV = 'test';
var FacetedValuesJS = require('../src/FacetedValuesJS');
var fs = require('fs');

exports.testFacetedValuesJS = {};
[
    't00_basic',
    't01_snippet1.6.4',
    't02_snippet3.3.1.1',
    't03_snippet3.4.3.1',
    't04_snippet4.1.1',
    't05_snippet4.1.3'
].forEach(function testBattery(testName){
    /**
     * @param {NodeUnit} test
     */
    exports.testFacetedValuesJS[testName] = function(test){
        test.expect(1);
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
