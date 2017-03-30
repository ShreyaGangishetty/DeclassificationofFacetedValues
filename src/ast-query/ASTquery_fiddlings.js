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
performProcessingPhase(tree, checkNodeTypeCoverage);
performProcessingPhase(tree, substituteFacetedValues);
performProcessingPhase(tree, overlayScoping);
//performProcessingPhase(tree, propagateFaceting);

/* ********************* EXPORT **********************************************************/
var outputfile = tree.toString();
console.log(currentScope.toString());
fs.writeFileSync('ast-query/outputFile.js', outputfile);


/* ************************* CORE FUNCTIONS *******************************************/

/**
 * This pass looks through the AST, making sure that all node types are accounted for.
 * @param {ASTNode} node
 */
function checkNodeTypeCoverage(node){
    switch (node.type){
        case 'CallExpression':
        case 'FunctionDeclaration':
        case 'FunctionExpression':
        case 'Literal':
        case 'AssignmentExpression':
        case 'BlockStatement':
        case 'ExpressionStatement':
        case 'Identifier':
        case 'IfStatement':
        case 'ReturnStatement':
        case 'UnaryExpression':
        case 'VariableDeclaration':
        case 'VariableDeclarator':
            break;
        default: throw new Error('substituteFacetedValues does not yet accommodate Node.type="' + node.type + '"');
    }
}

/**
 * On this pass, it simply finds all string 'Literal" nodes and rewrites the AST to use a new FacetedValue instead.
 * @param {ASTNode} node
 */
function substituteFacetedValues(node){
    if (node.type === 'Literal') {
        if (typeof node.value === 'string') {
            try {
                var m = node.value.match(FacetedValue.REGEX);
                var replacementString = 'new FacetedValue(' + m[1] + ', ' + m[2] + ', ' + m[3] + ')';
                // We use the above string to construct a miniature AST with which we may replace the string literal.
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

/**
 * On this pass, a tree of function scopes is constructed and then attached to the AST so that each node has a
 * reference to the scope that it resides in.
 * @param {ASTNode} node
 */
function overlayScoping(node){
    if (node.scope)
        return; // a little sloppy in terms of program flow, but this may have already been filled by performProcessingPhase a few lines below, and we don't want it overridden
    node.scope = currentScope;
    if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression'){
        if (node.id) // Anonymous functions do not have an identifier
            currentScope.registerSymbol(node.id);
        currentScope = new Scope(node, currentScope);
        node.params.forEach(function(p){currentScope.registerSymbol(p);});
        var functionContents = node.body;
        if (functionContents.type === 'BlockStatement')
            functionContents = functionContents.body;
        performProcessingPhase(functionContents, overlayScoping);
        currentScope = currentScope.getParent();
    }
    else if (node.type === 'VariableDeclarator'){
        currentScope.registerSymbol(node.id);
    }
}

/* **************************** HELPERS *********************************************/

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
 * @param {Array<ASTNode>|Tree} container
 * @param {Function} functor
 */
function performProcessingPhase(container, functor){
    var iterationTarget = isArray(container) ? container : container.body.node;
    iterationTarget.forEach(function(node){
        forEachIn(node, functor);
    });
}
