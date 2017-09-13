function Box(value) {

    var that = this;

    this.binaryOps = {
        '+'          : function(operand, operandIsOnLeft) { return operandIsOnLeft ? operand +   value : value +   operand; },
        '-'          : function(operand, operandIsOnLeft) { return operandIsOnLeft ? operand -   value : value +   operand; },
        '*'          : function(operand, operandIsOnLeft) { return operandIsOnLeft ? operand *   value : value +   operand; },
        '/'          : function(operand, operandIsOnLeft) { return operandIsOnLeft ? operand /   value : value +   operand; },
        '^'          : function(operand, operandIsOnLeft) { return operandIsOnLeft ? operand ^   value : value +   operand; },
        '&'          : function(operand, operandIsOnLeft) { return operandIsOnLeft ? operand &   value : value &   operand; },
        '|'          : function(operand, operandIsOnLeft) { return operandIsOnLeft ? operand |   value : value |   operand; },
        '%'          : function(operand, operandIsOnLeft) { return operandIsOnLeft ? operand %   value : value %   operand; },
        '>'          : function(operand, operandIsOnLeft) { return operandIsOnLeft ? operand >   value : value >   operand; },
        '<'          : function(operand, operandIsOnLeft) { return operandIsOnLeft ? operand <   value : value <   operand; },
        '<='         : function(operand, operandIsOnLeft) { return operandIsOnLeft ? operand <=  value : value <=  operand; },
        '>='         : function(operand, operandIsOnLeft) { return operandIsOnLeft ? operand >=  value : value >=  operand; },
        '=='         : function(operand, operandIsOnLeft) { return operandIsOnLeft ? operand ==  value : value ==  operand; },
        '!='         : function(operand, operandIsOnLeft) { return operandIsOnLeft ? operand !=  value : value !=  operand; },
        '&&'         : function(operand, operandIsOnLeft) { return operandIsOnLeft ? operand &&  value : value &&  operand; },
        '||'         : function(operand, operandIsOnLeft) { return operandIsOnLeft ? operand ||  value : value ||  operand; },
        '!=='        : function(operand, operandIsOnLeft) { return operandIsOnLeft ? operand !== value : value !== operand; },
        '==='        : function(operand, operandIsOnLeft) { return operandIsOnLeft ? operand === value : value === operand; },
        '>>'         : function(operand, operandIsOnLeft) { return operandIsOnLeft ? operand >>  value : value >>  operand; },
        '<<'         : function(operand, operandIsOnLeft) { return operandIsOnLeft ? operand <<  value : value <<  operand; },
        'in'         : function(operand, operandIsOnLeft) { return operandIsOnLeft ? operand in  value : value in  operand; },
        'instanceof' : function(operand, operandIsOnLeft) { return operandIsOnLeft ? operand instanceof value : value instanceof operand; }
    };

    this.unaryOps = {
        '++'     : function(operatorIsOnLeft) { return operatorIsOnLeft ? ++value : value++; },
        '--'     : function(operatorIsOnLeft) { return operatorIsOnLeft ? --value : value--; },
        '+'      : function() { return +value; },
        '-'      : function() { return -value; },
        '!'      : function() { return !value; },
        '~'      : function() { return ~value; },
        'typeof' : function() { return typeof value; },
        'void'   : function() { return void value; }
    };

    this.handler = {
        get: function (ignored, attribute) {
            if (attribute === '$biOps')
                return that.binaryOps;
            if (isSymbolForConversionToPrimitive(attribute))
                return toPrimitive;
            return value[attribute];
        }

    };

    function toPrimitive() {
        return value;
    }

    function isSymbolForConversionToPrimitive(val) {
        return (typeof val == 'symbol') && (val.valueOf().toString() == 'Symbol(Symbol.toPrimitive)');
    }
}

Box.prototype.sealWithinProxy = function sealWithinProxy() {
    return new Proxy(this, this.handler);
};

(function() {
    //noinspection JSUnresolvedFunction
    var p = new Box(42).sealWithinProxy();
    var x = p;
    var y = (p) + 10;
    var z = (p) - 42;
    console.log(x);
})();