exports.bin = cloak;
var FacetedValue = require('../src/FacetedValue.js').bin;

/**
 *
 * @param {FacetedValue} facetedValue
 * @param {Array<String>} associatedView
 */
function cloak(facetedValue, associatedView) {

    /**
     *
     */
    var handler = {
        /**
         *
         * @param ignored
         * @param attribute
         * @returns {*}
         */
        get: function (ignored, attribute) {
            var val = getVal(attribute);
            if (val instanceof FacetedValue)
                return cloak(val, associatedView);
            return val;
        }
    };

    /**
     *
     * @param attribute
     * @returns {*}
     */
    function getVal(attribute){
        if (isSymbolForConversionToPrimitive(attribute))
            return toPrimitive;
        if (typeof attribute == 'string' && attribute.charAt(0) == '$'){
            var extractedAttr = attribute.slice(1);
            if (dataIsNotExposedBy(extractedAttr))
                return facetedValue[extractedAttr];
        }
        return facetedValue.getFacetVisibleVersus(associatedView)[attribute];
    }

    /**
     *
     * @param val
     * @returns {boolean}
     */
    function isSymbolForConversionToPrimitive(val) {
        if ((typeof val == 'symbol') && (val.valueOf().toString() == 'Symbol(Symbol.toPrimitive)'))
            return true;
        // On console.log:
        return val == 'inspect';

    }

    /**
     *
     * @returns {*}
     */
    function toPrimitive() {
        return facetedValue.getFacetVisibleVersus(associatedView);
    }

    /**
     *
     * @param attribute
     */
    function dataIsNotExposedBy(attribute){
        switch(attribute){
            case 'binaryOperation':
            case 'unaryOperation':
            case 'apply':
        }
    }

    //noinspection JSUnresolvedFunction
    return new Proxy(facetedValue, handler);
}

(function() {
    var v = ["A"];
    //noinspection JSUnresolvedFunction
    var p = cloak(new FacetedValue("A", 1, 2), v);
    var x = p;
    var y = p + 1;
    console.log(y);
    v.pop();
    y = p + 1;
    console.log(y);
})();