/*

 */



/* ****************** IMPORT ****************************************************************/
var astq = require("ast-query");
var fs = require('fs');
var FacetedValue = require('../FacetedValue.js').bin;
var Scope = require('./Scope.js').bin;

var inputfile = fs.readFileSync('ast-query/inputFile.js');
var tree = astq(inputfile);

/* **************** PROCESS ******************************************************************/
var currentScope = new Scope();
tree.body.node.forEach(function(node){
    forEachIn(node, substituteFacetedValue);
});
postProcessCallExpressions();

function processFunctionDeclaration(node) {
    currentScope = new Scope(node, currentScope);
}

function processCallExpression(node) {
    currentScope.addFunctionCall(node);
}

function postProcessCallExpressions(){
    // TODO
}

/**
 * A bit of a hack. This is intended to entirely replace one node with another.
 * TODO: Check with Dr. Austin, am I missing something on this?
 * @example '<a ? b : c>' node of type 'Literal' becomes a node of type 'ExpressionStatement' that corresponds to
 *      `new FacetedValue(a, b, c)`.
 * @param left
 * @param right
 */
function replaceLeftNodeWithRight(left, right) {
    var i;
    for (i in left)
        if (left.hasOwnProperty(i))
            left[i] = right[i];
    for (i in right)
        if (right.hasOwnProperty(i))
            left[i] = right[i];
}

/**
 *
 * @param {ASTNode} node
 */
function substituteFacetedValue(node){
    if (node.type === 'Literal') {
        if (typeof node.value === 'string') {
            try {
                var m = node.value.match(FacetedValue.REGEX);
                var replacementString = 'new FacetedValue(' + m[1] + ', ' + m[2] + ', ' + m[3] + ')';
                // Note that in the following, body.node[0] is an ExpressionStatement.
                // E.g. it is a complete statement containing an expression, closed with a semicolon.
                // Therefore it is necessary to extract the `new` expression contained therein, to avoid the semicolon.
                var newExpression = astq(replacementString).body.node[0].expression;
                replaceLeftNodeWithRight(node, newExpression);
                node.isFaceted = true;
            } catch (ignored) {
            }
        }
    }
}

//noinspection JSUnusedLocalSymbols
/**
 * @param {ASTNode} node
 */
function template(node){
    switch (node.type){
        case 'CallExpression':
        case 'FunctionDeclaration':
        case 'Literal':
        case 'AssignmentExpression':
        case 'BlockStatement':
        case 'ExpressionStatement':
        case 'Identifier':
        case 'IfStatement':
        case 'ReturnStatement':
        case 'UnaryExpression': // TODO double-check
        case 'VariableDeclaration':
        case 'VariableDeclarator':
            break;
        default: throw new Error('substituteFacetedValues does not yet accommodate Node.type="' + node.type + '"');
    }
}

/**
 * Recursively operates the functor upon the given AST node and all of its children.
 *
 * @param {ASTNode} node
 * @param {ASTNodeFunctor} functor
 */
function forEachIn(node, functor){
    functor(node);
    for (var property in node) {
        //noinspection JSUnfilteredForInLoop
        var value = node[property];
        if (isAnASTNode(value))
            forEachIn(value, functor);
        if (isArray(value)) {
            value.forEach(function (element) {
                if (isAnASTNode(element))
                    forEachIn(element, functor);
            });
        }
    }
}

/**
 *
 * @param {*} value
 * @returns {boolean}
 */
function isAnASTNode(value){
    return value !== null && typeof value === 'object' && value.__proto__.constructor.name === 'Node';
}

/**
 *
 * @param {*} value
 * @returns {boolean}
 */
function isArray(value) {
    return typeof value === 'object' && Object.prototype.toString.call(value) === '[object Array]';
}

/* ********************* EXPORT **********************************************************/
var outputfile = tree.toString();
console.log(outputfile);
fs.writeFileSync('ast-query/outputFile.js', outputfile);


