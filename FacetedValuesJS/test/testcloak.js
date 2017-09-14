process.env.NODE_ENV = 'test';
var cloak = require('../src/Cloak.js');
var FacetedValue = require('../src/FacetedValue.js');

exports.testcloak = {

    /**
     * @param {NodeUnit} test
     */
    correctFacetsShowing: function correctFacetsShowing(test){
        test.expect(2);
        var view = ['a'];
        var x = cloak(view, 11);
        test.equal(x, 11);
        view.pop();
        test.notEqual(x, 11);
        test.done();
    },

    /**
     * Some methods do need to be accessible through the proxy.
     *
     * For example, if we had a FacetedValue x = <A ? 1 : 2> and wanted to multiply by 3 (thus producing <A ? 3 : 6>),
     * we cannot simply say `x * 3` because that would retrieve a single facet to multiply. Until proxies are able
     * to intercept operations such as these, we must instead expose a method that can be accessed through the proxy
     * to perform operations correctly on its contents.
     *
     * @param {NodeUnit} test
     */
    methodsAccessible: function methodsAccessible(test){
        test.expect(3);
        var x = cloak([], 1);
        test.equal(typeof x.$binaryOps, "function");
        test.equal(typeof x.$unaryOps, 'function');
        test.equal(typeof x.$apply, 'function');
        test.done();
    },

    /**
     * @param {NodeUnit} test
     */
    method_binaryOps: function method_binaryOps(test){
        test.expect(2);
        var view = ['a'];
        var x = cloak(view, 11);
        x = x.$binaryOps('*', 3);
        test.equal(x, 33);
        view.pop();
        test.notEqual(x, 33);
        test.done();
    },

    /**
     * @param {NodeUnit} test
     */
    method_unaryOp: function method_unaryOps(test){
        var view = ['A'];
        var x = cloak(view, 77);
        x.$unaryOps('--');
        test.equal(x, 76);
        view.pop();
        test.notEqual(x, 76);
        test.done();
    },

    /**
     * @param {NodeUnit} test
     */
    method_apply: function method_apply(test){
        test.expect(2);
        var view = ['A'];
        var a = cloak(view, function(x, y){ return x + y; });
        var b = a.$apply(this, [3, 5]);
        test.equal(b, 8);
        view.pop();
        test.notEqual(b, 8);
        test.done();
    },

    /**
     * @param {NodeUnit} test
     */
    methodsInaccessible: function methodsInaccessible(test){
        test.expect(7);
        var fv = new FacetedValue("A", 1, 2);
        var fv2 = new FacetedValue("A", function(){}, function(){});
        var v = [];
        var x = cloak(v, fv);
        var x2 = cloak(v, fv2);
        test.throws(function(){x.binaryOps('+', 1);});
        test.throws(function(){x.unaryOps('++');});
        test.throws(function(){x.getFacetVisibleVersus([]);});
        test.throws(function(){x.equals(1);});
        test.throws(function(){x2.apply();});
        test.throws(function(){x2.apply_helper();});
        test.throws(function(){x.toFacetedArray();});
        test.done();
    },

    /**
     * @param {NodeUnit} test
     */
    dataInaccessible: function dataInaccessible(test){
        test.expect(2);
        var x = cloak([], new FacetedValue("A", 1, 2));
        test.equal(x.leftValue, undefined);
        test.equal(x.rightValue, undefined);
        test.done();
    },

    /**
     * @param {NodeUnit} test
     */
    productsAlsoCloaked: function productsAlsoCloaked(test){
        test.expect(4);
        var x = cloak([], new FacetedValue("A", 1, 2));
        var y = x.$binaryOps('+', 5);
        test.equal(typeof x, 'object');
        test.equal(typeof y, 'object');
        test.equal(x + 0, 2);
        test.equal(y + 0, 7);
        test.done();
    }
};
