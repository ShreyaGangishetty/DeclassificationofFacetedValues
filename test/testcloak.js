process.env.NODE_ENV = 'test';
var cloak = require('../src/cloak.js').bin;
var FacetedValue = require('../src/FacetedValue.js').bin;

exports.testcloak = {

    /**
     * @param {NodeUnit} test
     */
    correctFacetsShowing: function correctFacetsShowing(test){
        test.expect(4);
        var view = [];
        var fv = new FacetedValue("A", 1, 2);
        var x = cloak(fv, view);
        test.equal(x, 2);
        test.equal(x + 1, 3);
        view.push("A");
        test.equal(x, 1);
        test.equal(x + 1, 2);
        test.done();
    },

    /**
     * @param {NodeUnit} test
     */
    methodsAccessible: function methodsAccessible(test){

        test.done();
    },

    /**
     * @param {NodeUnit} test
     */
    methodsInaccessible: function methodsInaccessible(test){

        test.done();
    },

    /**
     * @param {NodeUnit} test
     */
    dataInaccessible: function dataInaccessible(test){
        var x = cloak(new FacetedValue("A", 1, 2), []);
        test.equal(x.leftValue, undefined);
        test.equal(x.rightValue, undefined);
        test.done();
    },

    /**
     * @param {NodeUnit} test
     */
    productsAlsoCloaked: function productsAlsoCloaked(test){
        test.expect(4);
        var x = cloak(new FacetedValue("A", 1, 2), []);
        var y = x.$binaryOps('+', 5);
        test.equal(typeof x, 'object');
        test.equal(typeof y, 'object');
        test.equal(x + 0, 2);
        test.equal(y + 0, 7);
        test.done();
    }
};
