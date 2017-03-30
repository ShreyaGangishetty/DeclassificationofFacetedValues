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
