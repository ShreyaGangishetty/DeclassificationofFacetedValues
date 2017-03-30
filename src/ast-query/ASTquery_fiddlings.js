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
performProcessingPhase(tree, prepForInformationFlows);
performProcessingPhase(tree, linkIdentifiers);
performProcessingPhase(tree, overlayInformationFlows);
performProcessingPhase(tree, propagateFacetings);

/* ********************* EXPORT **********************************************************/
var outputfile = tree.toString();
console.log(currentScope.toString());
fs.writeFileSync('ast-query/outputFile.js', outputfile);


/* ************************* CORE FUNCTIONS *******************************************/

/**
 * This pass looks through the AST, making sure that all node types are accounted for.
 *
 * @param {ASTNode} node
 */
function checkNodeTypeCoverage(node){
    switch (node.type){
        case 'BinaryExpression':
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
 *
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
 *
 * @param {ASTNode} node
 */
function overlayScoping(node){
    if (node.scope)
        return; // a little sloppy in terms of program flow, but node.scope may have already been set by performProcessingPhase a few lines below, and we don't want it overridden
    node.scope = currentScope;
    if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression'){
        if (node.id) // Anonymous functions do not have an identifier
            currentScope.registerSymbol(node.id.name, node);
        currentScope = new Scope(node, currentScope);
        node.params.forEach(function(p){currentScope.registerSymbol(p.name, p);});
        var functionContents = node.body;
        if (functionContents.type === 'BlockStatement')
            functionContents = functionContents.body;
        performProcessingPhase(functionContents, overlayScoping);
        currentScope = currentScope.getParent();
    }
    else if (node.type === 'VariableDeclarator'){
        currentScope.registerSymbol(node.id.name, node);
    }
}

/**
 * This pass simply puts empty lists in each node so that, in the next pass, we don't have to constantly check to see
 * if the list exists before pushing to it.
 *
 * @param {ASTNode} node
 */
function prepForInformationFlows(node){
    node.outgoingFlows = [];
}

/**
 * The following phase is much simpler if we already have all identifiers' information flows in place
 *
 * @param {ASTNode} node
 */
function linkIdentifiers(node){
    var declaringNode = node.scope.getNodeNamed(node.name);
    if (declaringNode && declaringNode !== node) // this will be null if it is external to our program, i.e. built-in functions
        declaringNode.outgoingFlows.push(node);
}

/**
 * On this pass, we look at the actual operations and use the scopes to create a (hopefully) accurate graph overlay
 * of information flows from symbols to symbols. You can expect this graph to be completely arbitrary, by no means
 * anything so specific as a tree or bipartite graph.
 *
 * This is the most extensive and complicated part of the program, because nearly any node type within the abstract
 * syntax tree can have its own unique manner of information flow, and so each must be examined individually. Its
 * functioning also depends on the scope structure being correctly overlaid in the previous path.
 *
 * However, it isn't as bad as it looks. Each case within the switch statement is essentially its own function, and you
 * don't really need to look further than the few lines of a given case when considering its logic.
 *
 * @example a = b + 2;  // describes a flow from b to a TODO
 * @example function f(x){}; f(b);  // describes a flow from b to x TODO
 * @example if (g) h = i; else h = j; k = h; // describes a flow from g to h, g to h, i to h, j to h, and h to k.
 *          // By induction it describes a flow from g to k. TODO
 * @example function f(){return a;}; b = f(); // describes a flow from a to b TODO
 * @param {ASTNode} node
 */
function overlayInformationFlows(node){
    var i;
    switch (node.type){
        case 'BinaryExpression':
            node.left.outgoingFlows.push(node);
            node.right.outgoingFlows.push(node);
            break;
        case 'CallExpression':
            node.callee.outgoingFlows.push(node); // TODO: Does this need to go the other way too?
            var t = node.callee.scope.getNodeNamed(node.callee.name);
            for (i = 0; i < node.arguments.length; i++)
                if (t.params[i])
                    node.arguments[i].outgoingFlows.push(t.params[i]);
            break;
        case 'AssignmentExpression':
            node.right.outgoingFlows.push(node.left);
            node.left.outgoingFlows.push(node);
            break;
        case 'ExpressionStatement':
            node.expression.outgoingFlows.push(node);
            break;
        case 'FunctionDeclaration':
        case 'FunctionExpression': // TODO: flow from identifier to function, thence to CallExpression
            if (node.id)
                node.id.outgoingFlows.push(node); // TODO: What can expression and generator properties be?
            break;
        case 'IfStatement':
            if (node.alternate)
                node.test.outgoingFlows.push(node.alternate);
            if (node.consequent)
                node.test.outgoingFlows.push(node.consequent);
            node.test.outgoingFlows.push(node);
            break;
        case 'ReturnStatement':
            if (node.argument)
                node.argument.outgoingFlows.push(node);
            node.argument.outgoingFlows.push(node.scope.getOwningFunction()); // TODO: secure flows from function declarations/expressions to CallExpressions
            break;
        case 'UnaryExpression':
            debugger;
            break;
        case 'VariableDeclarator':
            if (node.init)
                node.init.outgoingFlows.push(node);
            break;
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
        switch(property){
            // The following reference(s), if followed, may turn the AST into a circular graph, and must be ignored
            case 'outgoingFlows':
                continue;
        }
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
