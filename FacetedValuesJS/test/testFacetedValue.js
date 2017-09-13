process.env.NODE_ENV = 'test';
var FacetedValue = require('../src/FacetedValue.js').bin;

exports.testFacetedValue = {

    /**
     * @param {NodeUnit} test
     */
    equals: function testEquals(test){
        test.expect(7);
        var x0 = new FacetedValue("A", 1, 2);
        var x1 = new FacetedValue("A", 1, 2);
        var x2 = new FacetedValue("A", 9, 2);
        var x3 = new FacetedValue("A", 1, 9);
        var x4 = new FacetedValue("B", 1, 2);
        var x5 = new FacetedValue("C", '1', '2');
        test.ok(x0.equals(x1));
        test.ok(!x0.equals(x2));
        test.ok(!x0.equals(x3));
        test.ok(!x0.equals(x4));
        test.ok(!x0.equals(x5));
        var y0 = new FacetedValue("A", 1, 2);
        var y1 = new FacetedValue("B", 3, 4);
        var y2 = new FacetedValue("C", y0, y1);
        var z0 = new FacetedValue("A", 1, 2);
        var z1 = new FacetedValue("B", 3, 4);
        var z2 = new FacetedValue("C", z0, z1);
        test.ok(y2.equals(z2));
        z1.leftValue = 99;
        test.ok(!y2.equals(z2));
        test.done();
    },

    /**
     * @param {NodeUnit} test
     */
    toString: function testToString(test){
        var expected = '<A ? <B ? 1 : 3> : <B ? 5 : 7>>';
        var actual = new FacetedValue("A",
            new FacetedValue("B", 1, 3),
            new FacetedValue("B", 5, 7)
        ).toString();
        test.expect(1);
        test.equal(actual, expected);
        test.done();
    },

    /**
     * @param {NodeUnit} test
     */
    unaryOps: function testUnaryOps(test){
        test.expect(24);

        // These operations should mutate the FacetedValue
        var x = new FacetedValue('A', 2, 3);
        test.equal(x.toString(), '<A ? 2 : 3>');
        test.equal(x.unaryOps('++', true).toString(), '<A ? 3 : 4>');
        test.equal(x.unaryOps('--', true).toString(), '<A ? 2 : 3>');
        test.equal(x.toString(), '<A ? 2 : 3>');

        // These operations should mutate the FacetedValue
        x = new FacetedValue('A', 5, 6);
        test.equal(x.toString(), '<A ? 5 : 6>');
        test.equal(x.unaryOps('++', false).toString(), '<A ? 5 : 6>');
        test.equal(x.unaryOps('--', false).toString(), '<A ? 6 : 7>');
        test.equal(x.toString(), '<A ? 5 : 6>');

        // Remaining operations should never mutate the FacetedValue
        x = new FacetedValue('A', 5, -7);
        test.equal(x.unaryOps('+'     , true).toString(), '<A ? 5 : -7>');
        test.equal(x.unaryOps('-'     , true).toString(), '<A ? -5 : 7>');
        test.equal(x.unaryOps('!'     , true).toString(), '<A ? false : false>');
        test.equal(x.unaryOps('~'     , true).toString(), '<A ? -6 : 6>');
        test.equal(x.unaryOps('typeof', true).toString(), '<A ? number : number>');
        test.equal(x.unaryOps('void'  , true).toString(), '<A ? undefined : undefined>');
        test.equal(x.toString(), '<A ? 5 : -7>');

        // None of these are valid right-ride operations, all should throw errors
        test.throws(function(){ x.unaryOps('+'     , false); });
        test.throws(function(){ x.unaryOps('+'     , false); });
        test.throws(function(){ x.unaryOps('-'     , false); });
        test.throws(function(){ x.unaryOps('!'     , false); });
        test.throws(function(){ x.unaryOps('~'     , false); });
        test.throws(function(){ x.unaryOps('typeof', false); });
        test.throws(function(){ x.unaryOps('void'  , false); });

        // Finally, test recursion
        x = new FacetedValue('A', 2, 3);
        var y = new FacetedValue('B', 5, 7);
        var z = new FacetedValue('C', x, y);
        test.equal(z.toString(), '<C ? <A ? 2 : 3> : <B ? 5 : 7>>');
        test.equal(z.unaryOps('++', true).toString(), '<C ? <A ? 3 : 4> : <B ? 6 : 8>>');

        test.done();
    },

    /**
     * @param {NodeUnit} test
     */
    binaryOps : function testBinaryOps(test){
        test.expect(52);
        testBinaryOpsLeft(test);
        testBinaryOpsRight(test);
        testBinaryOpsDoubleFaceted(test);
        test.done();
    },

    /**
     * @param {NodeUnit} test
     */
    getFacetVisibleVersus : function testGetFacetVisibleVersus(test){
        var x = new FacetedValue('A', new FacetedValue('B', 1, 3), new FacetedValue('C', 5, 7));
        test.expect(8);
        test.equal(x.getFacetVisibleVersus([             ]), 7);
        test.equal(x.getFacetVisibleVersus(['A'          ]), 3);
        test.equal(x.getFacetVisibleVersus(['A', 'B'     ]), 1);
        test.equal(x.getFacetVisibleVersus(['A',      'C']), 3);
        test.equal(x.getFacetVisibleVersus(['A', 'B', 'C']), 1);
        test.equal(x.getFacetVisibleVersus([     'B'     ]), 7);
        test.equal(x.getFacetVisibleVersus([     'B', 'C']), 5);
        test.equal(x.getFacetVisibleVersus([          'C']), 5);
        test.done();
    },

    /**
     * @param {NodeUnit} test
     */
    apply : function testApply(test){
        test.expect(2);
        var foo1 = function(x, y){ return x + y; };
        var foo2 = function(x, y){ return x * y; };
        var facetedFunction = new FacetedValue('bleagh', foo1, foo2);
        var facetedResult = facetedFunction.apply(this, [3, 5]);
        test.equal(facetedResult.toString(), '<bleagh ? 8 : 15>');

        var a = function(x){ return x + "A"; };
        var b = function(x){ return x + "B"; };
        var c = function(x){ return x + "C"; };
        var d = function(x){ return x + "D"; };
        var x = new FacetedValue("X", new FacetedValue("Y", a, b), new FacetedValue("Y", c, d));
        test.equal(x.apply(this, ["4"]).toString(), '<X ? <Y ? 4A : 4B> : <Y ? 4C : 4D>>');

        // TODO: faceted thisArg
        // TODO: mix of faceted, nonfaceted arguments
        // TODO: empty arg list
        test.done();
    },

    /**
     * @param {NodeUnit} test
     */
    apply_helper : function testApply_helper(test){
        test.expect(2);
        // TODO optional thisArg
        // TODO empty arg list
        var foo1 = function(x, y){ return x + y; };
        var foo2 = function(x, y){ return x * y; };
        var facetedFunction = new FacetedValue('bleagh', foo1, foo2);
        var facetedResult = facetedFunction.apply_helper(this, 3, 5);
        test.equal(facetedResult.toString(), '<bleagh ? 8 : 15>');

        var a = function(x){ return x + "A"; };
        var b = function(x){ return x + "B"; };
        var c = function(x){ return x + "C"; };
        var d = function(x){ return x + "D"; };
        var x = new FacetedValue("X", new FacetedValue("Y", a, b), new FacetedValue("Y", c, d));
        test.equal(x.apply_helper(this, "4").toString(), '<X ? <Y ? 4A : 4B> : <Y ? 4C : 4D>>');
        test.done();
    },

    /**
     * @param {NodeUnit} test
     */
    invokeFunction : function testInvokeFunction(test){
        var facetedNumber = new FacetedValue("A", 25, 36);
        var facetedSqrt = FacetedValue.invokeFunction(Math.sqrt, this, [facetedNumber]);
        test.equal(facetedSqrt.toString(), '<A ? 5 : 6>');

        // TODO: faceted thisArg
        // TODO: mix of faceted, nonfaceted arguments
        test.done();
    },

    /**
     * @param {NodeUnit} test
     */
    toFacetedArray : function testToFacetedArray(test){
        test.expect(3);
        var actual = new FacetedValue("A",
            new FacetedValue("B", 1, 3),
            new FacetedValue("C", 5, 7)
        ).toFacetedArray().binaryOps('instanceof', Array);
        test.equal(actual.toString(), '<A ? <B ? true : true> : <C ? true : true>>');

        actual = new FacetedValue('A', {}, new FacetedValue("B", 42, 'fgh'));
        test.equal(actual.toString(), '<A ? [object Object] : <B ? 42 : fgh>>');
        actual = actual.toFacetedArray().binaryOps('instanceof', Array);
        test.equal(actual.toString(), '<A ? true : <B ? true : true>>');
        test.done();
    }
};

/**
 * @param {NodeUnit} test
 */
function testBinaryOpsRight(test){
    var x = new FacetedValue("A", 2, 3);
    var y = 5;
    test.equal(x.binaryOps('+', y, false).toString(), '<A ? 7 : 8>');
    test.equal(x.binaryOps('-', y, false).toString(), '<A ? -3 : -2>');
    test.equal(x.binaryOps('*', y, false).toString(), '<A ? 10 : 15>');
    test.equal(x.binaryOps('/', y, false).toString(), '<A ? ' + (2 / 5) + ' : ' + (3 / 5) + '>');
    test.equal(x.binaryOps('^', y, false).toString(), '<A ? 7 : 6>');
    test.equal(x.binaryOps('&', y, false).toString(), '<A ? 0 : 1>');
    test.equal(x.binaryOps('|', y, false).toString(), '<A ? 7 : 7>');

    x = new FacetedValue("A", 2, 9);
    y = 5;
    test.equal(x.binaryOps('%',  y, false).toString(), '<A ? 2 : 4>');
    test.equal(x.binaryOps('>',  y, false).toString(), '<A ? false : true>');
    test.equal(x.binaryOps('<',  y, false).toString(), '<A ? true : false>');
    test.equal(x.binaryOps('<=', y, false).toString(), '<A ? true : false>');
    test.equal(x.binaryOps('>=', y, false).toString(), '<A ? false : true>');
    test.equal(x.binaryOps('>>', y, false).toString(), '<A ? 0 : 0>');
    test.equal(x.binaryOps('<<', y, false).toString(), '<A ? 64 : 288>');

    x = new FacetedValue('A', true, false);
    y = 0;
    test.equal(x.binaryOps('==',  y, false).toString(), '<A ? false : true>');
    test.equal(x.binaryOps('!=',  y, false).toString(), '<A ? true : false>');
    test.equal(x.binaryOps('&&',  y, false).toString(), '<A ? 0 : 0>');
    test.equal(x.binaryOps('||',  y, false).toString(), '<A ? true : false>');
    test.equal(x.binaryOps('!==', y, false).toString(), '<A ? true : true>');
    test.equal(x.binaryOps('===', y, false).toString(), '<A ? false : false>');

    x = new FacetedValue("A", "blue", 'red');
    y = {blue: false};
    test.equal(x.binaryOps('in', y, false).toString(), '<A ? true : false>');

    x = new FacetedValue('A', ['asas'], ['asd']);
    y = Array;
    test.equal(x.binaryOps('instanceof', y, false).toString(), '<A ? true : true>');

    x = new FacetedValue('A', [1, 2], [3, 5]);
    y = 7;
    test.equal(x.binaryOps(':', y, false).toString(), '<A ? 1,2,7 : 3,5,7>');
}

/**
 * @param {NodeUnit} test
 */
function testBinaryOpsLeft(test){
    var y = 5;
    var x = new FacetedValue("A", 2, 3);
    test.equal(x.binaryOps('+', y, true).toString(), '<A ? 7 : 8>');
    test.equal(x.binaryOps('-', y, true).toString(), '<A ? 3 : 2>');
    test.equal(x.binaryOps('*', y, true).toString(), '<A ? 10 : 15>');
    test.equal(x.binaryOps('/', y, true).toString(), '<A ? 2.5 : ' + (5 / 3) + '>');
    test.equal(x.binaryOps('^', y, true).toString(), '<A ? 7 : 6>');
    test.equal(x.binaryOps('&', y, true).toString(), '<A ? 0 : 1>');
    test.equal(x.binaryOps('|', y, true).toString(), '<A ? 7 : 7>');

    y = 5;
    x = new FacetedValue("A", 2, 9);
    test.equal(x.binaryOps('%',  y, true).toString(), '<A ? 1 : 5>');
    test.equal(x.binaryOps('>',  y, true).toString(), '<A ? true : false>');
    test.equal(x.binaryOps('<',  y, true).toString(), '<A ? false : true>');
    test.equal(x.binaryOps('<=', y, true).toString(), '<A ? false : true>');
    test.equal(x.binaryOps('>=', y, true).toString(), '<A ? true : false>');
    test.equal(x.binaryOps('>>', y, true).toString(), '<A ? 1 : 0>');
    test.equal(x.binaryOps('<<', y, true).toString(), '<A ? 20 : 2560>');

    y = 0;
    x = new FacetedValue('A', true, false);
    test.equal(x.binaryOps('==',  y, true).toString(), '<A ? false : true>');
    test.equal(x.binaryOps('!=',  y, true).toString(), '<A ? true : false>');
    test.equal(x.binaryOps('&&',  y, true).toString(), '<A ? 0 : 0>');
    test.equal(x.binaryOps('||',  y, true).toString(), '<A ? true : false>');
    test.equal(x.binaryOps('!==', y, true).toString(), '<A ? true : true>');
    test.equal(x.binaryOps('===', y, true).toString(), '<A ? false : false>');

    y = "blue";
    x = new FacetedValue('A', {blue: false}, {red: true});
    test.equal(x.binaryOps('in', y, true).toString(), '<A ? true : false>');

    y = ['asdasdasd'];
    x = new FacetedValue('A', Array, FacetedValue);
    test.equal(x.binaryOps('instanceof', y, true).toString(), '<A ? true : false>');

    y = [7, 1];
    x = new FacetedValue('A', 3, 5);
    test.equal(x.binaryOps(':', y, true).toString(), '<A ? 7,1,3 : 7,1,5>');
}

/**
 * @param {NodeUnit} test
 */
function testBinaryOpsDoubleFaceted(test){
    var x = new FacetedValue("A", 'a', 'b');
    var y = new FacetedValue('A', 5, 7);
    test.equal(x.binaryOps('+', y, false).toString(), '<A ? a5 : b7>');
    test.equal(x.binaryOps('+', y, true ).toString(), '<A ? 5a : 7b>');

    y = new FacetedValue('B', 5, 7);
    test.equal(x.binaryOps('+', y, false).toString(), '<A ? <B ? a5 : a7> : <B ? b5 : b7>>');
    test.equal(x.binaryOps('+', y, true ).toString(), '<A ? <B ? 5a : 7a> : <B ? 5b : 7b>>');

    x = new FacetedValue('A', new FacetedValue('B', 1, 3), new FacetedValue('C', 5, 7));
    y = new FacetedValue('A', new FacetedValue('B', 'a', 'b'), new FacetedValue('C', 'c', 'd'));
    test.equal(x.binaryOps('+', y).toString(), '<A ? <B ? 1a : 3b> : <C ? 5c : 7d>>');

    x = new FacetedValue('A', 'a', new FacetedValue('B', 'c', 'd'));
    y = new FacetedValue('B', new FacetedValue('C', 1, 2), 3);
    test.equal(x.binaryOps('+', y).toString(), '<A ? <B ? <C ? a1 : a2> : a3> : <B ? <C ? c1 : c2> : d3>>');
}