process.env.NODE_ENV = 'test';
var FacetedValuesJS = require('../src/FacetedValuesJS');
var Declassify = FacetedValuesJS.Declassify;

// noinspection JSUnusedGlobalSymbols
exports.testdeclassify = {

    /**
     * @param {NodeUnit} test
     */
    createLabel: function createLabel(test){
        test.expect(1);
        var x = Declassify.createLabel;
        test.equal(x, 1);
        console.log("inside Declassify test ");
        test.done();
    }
    
};
