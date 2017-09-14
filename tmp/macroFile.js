function biOps(left, op, right, opOnPrimitives){
    if (left.$binaryOps)
        return left.$binaryOps(op, right, true);
    if (right.$binaryOps)
        return right.$binaryOps(op, left, false);
    switch(op){
        case '*'          : return left *          right;
        case '/'          : return left /          right;
        case '%'          : return left %          right;
        case '+'          : return left +          right;
        case '-'          : return left -          right;
        case '>>'         : return left >>         right;
        case '<<'         : return left <<         right;
        case '>>>'        : return left >>>        right;
        case '<'          : return left <          right;
        case '<='         : return left <=         right;
        case '>='         : return left >=         right;
        case '>'          : return left >          right;
        case 'in'         : return left in         right;
        case 'instanceof' : return left instanceof right;
        case '=='         : return left ==         right;
        case '!='         : return left !=         right;
        case '==='        : return left ===        right;
        case '!=='        : return left !==        right;
        case '&'          : return left &          right;
        case '^'          : return left ^          right;
        case '|'          : return left |          right;
        case '&&'         : return left &&         right;
        case '||'         : return left ||         right;
        default:
            throw new Error("Invalid op: " + op);
    }
}

var currentView = [];


var Cloak$1399 = require('../src/Cloak.js').bin;
var FacetedValue$1400 = require('../src/FacetedValue.js').bin;
var x$1401 = cloak(42);
x$1401;