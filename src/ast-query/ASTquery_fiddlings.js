/*

 */



/* ****************** IMPORT ****************************************************************/
var astq = require("ast-query");
var fs = require('fs');
var FacetedValue = require('../FacetedValue.js')

var inputfile = fs.readFileSync('ast-query/inputFile.js');
var tree = astq(inputfile);

/* **************** PROCESS ******************************************************************/
var functionDeclarations = [];
var callExpressions = [];
tree.body.node.forEach(searchAndSubstitute);
postProcessCallExpressions();

/**
 * Note that the code here operates on the assumption that the regex is a complete (e.g. /^$/) match from beginning
 * to end, and if that changes so must this code
 *
 * @param {ASTNode} node
 */
function processAssignmentExpression(node) {
    /* TODO this is where a substitution can happen, e.g.
        x = '<a ? b : c>'
        becomes:
        x = new FacetedValue(a, b, c);
    */
    convertLiteral(node.right);
}

function convertLiteral(node) {
    try{
        var match = node.value.match(FacetedValue.REGEX);
        var replacementString = 'new FacetedValue(' + a + ', ' + b + ',' + c + ')';
    } catch(ignored){}
}


function processVariableDeclarator(node) {

}


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
        case 'AssignmentExpression': processAssignmentExpression(node); break;
        case 'CallExpression': processCallExpression(node); break;
        case 'FunctionDeclaration': processFunctionDeclaration(node); break;
        case 'VariableDeclarator': processVariableDeclarator(node); break;
        /* Most do not require modification: */
        case 'BlockStatement':
        case 'ExpressionStatement':
        case 'Identifier':
        case 'IfStatement':
        case 'Literal':
        case 'ReturnStatement':
        case 'UnaryExpression': // TODO double-check
        case 'VariableDeclaration':
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


