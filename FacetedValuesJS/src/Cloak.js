if (typeof module !== 'undefined') {
    module.exports = Cloak;
}
var FacetedValue = require('./FacetedValue.js');

/**
 *
 * @param {Array<String>} associatedView
 * @param {*} value
 * @property {Function} $binaryOps - {@link FacetedValue#binaryOps}
 * @property {Function} $unaryOps - {@link FacetedValue#unaryOps}
 * @property {Function} $apply - {@link FacetedValue#apply}
 */
function Cloak(associatedView, value) {

    var facetedValue = (value instanceof FacetedValue) ? value : new FacetedValue(associatedView, value);

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
            if (typeof val === 'function') {
                return function () {
                    var newVal = val.apply(facetedValue, arguments);
                    if (newVal instanceof FacetedValue)
                        return Cloak(associatedView, newVal);
                    return newVal;
                };
            }
            if (val instanceof FacetedValue)
                return Cloak(associatedView, val);
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
        if (typeof attribute === 'string' && attribute.charAt(0) === '$'){
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
        if ((typeof val === 'symbol') && (val.valueOf().toString() === 'Symbol(Symbol.toPrimitive)'))
            return true;
        // On console.log:
        return val === 'inspect';
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
            case 'binaryOps':
            case 'unaryOps':
            case 'apply':
                return true;
        }
        return false;
    }

    //noinspection JSUnresolvedFunction
    return new Proxy(facetedValue, handler);
}
