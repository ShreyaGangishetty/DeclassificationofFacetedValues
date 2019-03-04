process.env.NODE_ENV = 'test';
var FacetedValuesJS = require('../src/FacetedValuesJS');
var Declassify = require('../src/FacetedValuesJS');//FacetedValuesJS.Declassify;
var FacetedValue = require('../src/FacetedValue');
// noinspection JSUnusedGlobalSymbols
exports.testdeclassify = {

    /**
     * @param {NodeUnit} test
     */
    createLabel: function createLabel(test){
        test.expect(0);
        var dec = new Declassify();
        var x =dec.createLabel();
        //test.equal(x, 1);
        console.log(x+ "from first function" );
        console.log("inside Declassify test ");
        test.done();
    },

   /* defacet: function defacet(test){
        test.expect(0);
        label = Declassify.createLabel;
        fvalue = new FacetedValue(Declassify.createLabel,true,false);
        console.log(fvalue)
        console.log(label+ "from second function" );
        //fvalue = new FacetedValue(label,true,false);
        //var x = Declassify.defacet(label, fvalue);
       // test.equal(x, true);
        console.log("inside Declassify test ");
        test.done();
    }
    */
};
