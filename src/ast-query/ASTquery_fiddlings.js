/*

 */



/* ****************** IMPORT ****************************************************************/
var astq = require("ast-query");
var fs = require('fs');
var FacetedValue = require('../FacetedValue.js').bin;

var inputfile = fs.readFileSync('ast-query/inputFile.js');
var tree = astq(inputfile);

/* **************** PROCESS ******************************************************************/
var functionDeclarations = [];
var callExpressions = [];
tree.body.node.forEach(searchAndSubstitute);
postProcessCallExpressions();

function processFunctionDeclaration(node) {
    // TODO figure out a way to deal with shadowed names
    functionDeclarations.push(node);
}


function processCallExpression(node) {
    // TODO: figure out a way to deal with shadowed names
    callExpressions.push(node);
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

function processLiteral(node) {
    if (typeof node.value === 'string'){
        try{
            var match = node.value.match(FacetedValue.REGEX);
            var a = match[1];
            var b = match[2];
            var c = match[3];
            var replacementString = 'new FacetedValue(' + a + ', ' + b + ', ' + c + ')';
            // Note that in the following, body.node[0] is an ExpressionStatement.
            // E.g. it is a complete statement containing an expression, closed with a semicolon.
            // Therefore it is necessary to extract the `new` expression contained therein, to avoid the semicolon.
            var newExpression = astq(replacementString).body.node[0].expression;
            replaceLeftNodeWithRight(node, newExpression);
        } catch(ignored){}
    }
}

/**
 *
 * @param {ASTNode} node
 */
function searchAndSubstitute(node){
    for (var property in node) {
        var value = node[property];
        if (isAnASTNode(value))
            searchAndSubstitute(value);
        if (isArray(value)) {
            value.forEach(function (element) {
                if (isAnASTNode(element))
                    searchAndSubstitute(element);
            });
        }
    }

    switch (node.type){
        case 'CallExpression': processCallExpression(node); break;
        case 'FunctionDeclaration': processFunctionDeclaration(node); break;
        case 'Literal': processLiteral(node); break;
        /* Most do not require modification: */
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
        default: throw new Error('searchAndSubstitute does not yet accommodate Node.type="' + node.type + '"');
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


