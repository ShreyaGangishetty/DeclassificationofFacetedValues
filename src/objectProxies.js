var vvalues = function () {
    /*if (typeof require === 'function') {
     // importing patches Proxy to be in line with the new direct proxies
     require('harmony-reflect');
     }*/

    // hold on to all the proxies we create so that we can retrieve the handlers later
    var unproxyMap = new WeakMap();
    var oldProxy = Proxy;

    // primitive values cannot be used a keys inside of a map so we
    // need to wrap them up in a shell object that returns the original
    // value when needed
    function ValueShell(value) {
        this.value = value;
    }

    ValueShell.prototype.valueOf = function () {
        return this.value;
    };

    // @ (Any, {}, {}) -> VProxy
    function VProxy(value, handler, key) {
        var valueShell = new ValueShell(value);
        var val = function (a0) {
            if (a0 === void 0) {
                return valueShell;
            }
            if (a0 === null) {
                return valueShell;
            }
            if (typeof a0 !== 'object') {
                var x = a0;
                return valueShell;
            }
            return value;
        }.call(this, value);
        var p = new oldProxy(val, handler);
        unproxyMap.set(p, {
            handler: handler,
            key: key,
            target: val
        });
        return p;
    }

    this.Proxy = VProxy;

    // @ (Any) -> Bool
    function isVProxy(value) {
        return value && typeof value === 'object' && unproxyMap.has(value);
    }

    // @ (Str, Any) -> Any
    function unary(operator, operand) {
        if (isVProxy(operand))
            return unproxyMap.get(operand).handler.unary(unproxyMap.get(operand).target, operator, operand);
        switch (operator) {
            case '-':
                return -operand;
            case '+':
                return +operand;
            case '++':
                return ++operand;
            case '--':
                return --operand;
            case '!':
                return !operand;
            case '~':
                return ~operand;
            case 'typeof':
                return typeof operand;
            case 'void':
                return void operand;
        }
        throw new TypeError('No match');
    }

    // @ (Str, Any, Any) -> Any
    function binary(left, operator, right) {
        if (isVProxy(left))
            return unproxyMap.get(left).handler.left(unproxyMap.get(left).target, operator, right);
        if (isVProxy(right))
            return unproxyMap.get(right).handler.right(unproxyMap.get(left).target, operator, left);
        switch (operator) {
            case '+':
                return left + right;
            case '-':
                return left - right;
            case '*':
                return left * right;
            case '/':
                return left / right;
            case '%':
                return left % right;
            case '>>':
                return left >> right;
            case '<<':
                return left << right;
            case '>>>':
                return left >>> right;
            case '<':
                return left < right;
            case '<=':
                return left <= right;
            case '>':
                return left > right;
            case '>=':
                return left >= right;
            case '==':
                return left == right;
            case '!=':
                return left != right;
            case '===':
                return left === right;
            case '!==':
                return left !== right;
            case '&&':
                return left && right;
            case '||':
                return left || right;
            case '&':
                return left & right;
            case '^':
                return left ^ right;
            case '|':
                return left | right;
            case 'in':
                return left in right;
            case 'instanceof':
                return left instanceof right;
            default:
                throw new TypeError('Unrecognized operator');
        }
    }

    // @ (Any) -> {} or null
    this.unproxy = function (value, key) {
        if (isVProxy(value) && unproxyMap.get(value).key === key) {
            return unproxyMap.get(value).handler;
        }
        return null;
    };
    return {
        unary: unary,
        binary: binary
    };
}();






//noinspection JSUnresolvedFunction
var p = new Proxy(4, {
    apply: function (receiver, thisArg, arg) {
        return 'I am the proxy';
    },
    get: function (receiver, name) {
        // This example includes a template string.
        return "Hello, " + name + "!";
    },
    left: function (target$1377, op$1378, right$1379) {
        if (vvalues.binary(op$1378, '===', '*'))
            return vvalues.binary(target$1377, '+', right$1379);
        if (vvalues.binary(op$1378, '===', '+'))
            return vvalues.binary(target$1377, '*', right$1379);
    }
}, {});
console.log(vvalues.binary(p, '*', 10));
console.log(vvalues.binary(p, '+', 10));
console.log(p["world"]);
console.log(p());