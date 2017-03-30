function isSymbolForConversionToPrimitive(val) {
    if ((typeof val == 'symbol') && (val.valueOf().toString() == 'Symbol(Symbol.toPrimitive)'))
        return true;
    // On console.log:
    return val == 'inspect';

}

function cloak(val){

    var o = {val: val};

    var handler = {
        get: function get(ignored, attribute){
            if (isSymbolForConversionToPrimitive(attribute))
                return function(){ return o.val; };
            return "bleh";
        }
    };

    //noinspection JSUnresolvedFunction
    return new Proxy(o, handler);
}

var x = cloak(42);
var y = x + 1;
console.log(y);
