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


var cloak$1375 = require('../src/cloak').bin;
var FacetedValue$1376 = require('../src/FacetedValue.js').bin;
var v$1377 = ['A'];
var p$1378 = cloak$1375(new FacetedValue$1376('A', 3, 4), v$1377);
var x$1380 = biOps(p$1378, '+', 10);
console.log(x$1380);
v$1377.pop();
console.log(x$1380);