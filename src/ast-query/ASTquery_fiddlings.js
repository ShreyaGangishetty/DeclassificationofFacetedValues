/*

 */

/* ****************** IMPORT ****************************************************************/
/**
 * fs is an imported library with various file system functions
 * @type {Object}
 * @property {function} readFileSync
 * @property {function} writeFileSync
 */
var fs = require('fs');
var astq = require("ast-query");
var FacetedValue = require('../FacetedValue.js').bin;
var Scope = require('./Scope.js').bin;

var inputfile = fs.readFileSync('ast-query/inputFile.js');

/**
 * @type {Tree}
 * @property {Array<ASTNode>} body.node
 */
var tree = astq(inputfile);

/* **************** PROCESS ******************************************************************/
var currentScope = new Scope();
performProcessingPhase(tree, checkNodeTypeCoverage);
performProcessingPhase(tree, substituteFacetedValues);
performProcessingPhase(tree, overlayScoping);
performProcessingPhase(tree, prepForInformationFlows);
performProcessingPhase(tree, linkIdentifiers);
performProcessingPhase(tree, overlayInformationFlows);
performProcessingPhase(tree, markFaceting);
performProcessingPhase(tree, refactorOperationsToBeFaceted);

/* ********************* EXPORT **********************************************************/
var outputfile = tree.toString();
console.log(currentScope.toString());
fs.writeFileSync('ast-query/outputFile.js', outputfile); // TODO: Why is this so sloooooowwwww

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
        case 'MemberExpression': // TODO Add to all cases as needed
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
                var miniTree = astq(replacementString);
                var newExpression = miniTree.body.node[0].expression;
                replaceLeftNodeWithRight(node, newExpression);
                node.faceting = [m[1]];
                node.wasReconstructedForFVs = true;
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
        currentScope = currentScope.parent;
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
 * This is the a more extensive and complicated part of the program, because nearly any node type within the abstract
 * syntax tree can have its own unique manner of information flow, and so each must be examined individually. Its
 * functioning also depends on the scope structure being correctly overlaid in the previous path.
 *
 * However, it isn't as bad as it looks. Each case within the switch statement is essentially its own function, and you
 * don't really need to look further than the few lines of a given case when considering its logic.
 *
 * @example a = b + 2;  // describes a flow from b to a
 * @example function f(x){}; f(b);  // describes a flow from b to x
 * @example if (g) h = i; else h = j; k = h; // describes a flow from g to h, g to h, i to h, j to h, and h to k.
 *          // By induction it describes a flow from g to k.
 * @example function f(){return a;}; b = f(); // describes a flow from a to b
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
            node.callee.outgoingFlows.push(node);
            if (node.callee.type === 'Identifier') {
                var t = node.callee.scope.getNodeNamed(node.callee.name);
                for (i = 0; i < node.arguments.length; i++)
                    if (t.params[i])
                        node.arguments[i].outgoingFlows.push(t.params[i]);
            } // TODO: It might be a MemberExpression instead of an Identifier
            break;
        case 'AssignmentExpression':
            node.right.outgoingFlows.push(node.left);
            node.left.outgoingFlows.push(node);
            break;
        case 'ExpressionStatement':
            node.outgoingFlows.push(node.expression);
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

/**
 * This walks the AST and, wherever something isFaceted, it follows the information flows plotted out in the previous
 * pass to mark those nodes as also being faceted.
 *
 * @param {ASTNode} node
 */
function markFaceting(node){
   if (node.faceting) {
       node.outgoingFlows.forEach(propagate, [node.faceting]);
   }
   function propagate(node, faceting){
       if (node.faceting && leftSetContainsRightSet(node.faceting, faceting))
           return; //avoid cycles
       node.faceting = mergeSets([node.faceting, faceting]);
       node.faceting = faceting.slice().push;
       node.outgoingFlows.forEach(propagate);
   }
}

/**
 * @example fv + b ===> fv.binaryOps(b, true)
 * @param {ASTNode}node
 */
function refactorOperationsToBeFaceted(node){
    if (node.faceting){
        var newNode, object, operand, operandIsOnLeft;
        switch (node.type) {
            case 'AssignmentExpression':
                var unfacetedAssignedValue = node.right;
                var label; // TODO
                var replacementString = 'new FacetedValue(' + label + ', placeholder, ' + unfacetedIdentifier + ')';
                var newExpression = astq(replacementString).body.node[0].expression;
                replaceLeftNodeWithRight(node, newExpression);
                node.faceting = [label];
                node.wasReconstructedForFVs = true;
                debugger;
                break;
            case 'BinaryExpression':
                if (node.left.type === 'Identifier' && node.left.faceting){
                    object = node.left;
                    operand = node.right;
                    operandIsOnLeft = false;
                } else if (node.right.type === 'Identifier' && node.right.faceting) {
                    operand = node.left;
                    object = node.right;
                    operandIsOnLeft = true;
                } else {
                    throw new Error('CRIMINY AND CURSES! A binary expression has been marked as faceted, without' +
                        ' either its left or right side being faceted identifiers!');
                }
                newNode = astq('object.binaryOps("' + node.operator + '", operand, ' + operandIsOnLeft + ')').body.node[0].expression;
                newNode.callee.object = object;
                newNode.arguments[1] = operand;
                currentScope = node.scope;
                forEachIn(newNode, overlayScoping);
                forEachIn(newNode, prepForInformationFlows);
                forEachIn(newNode, overlayInformationFlows);
                forEachIn(newNode, markFaceting);
                replaceLeftNodeWithRight(node, newNode);
                debugger;
                break;
            case 'CallExpression':
                debugger;
                break;
            case 'FunctionDeclaration':
                debugger;
                break;
            case 'FunctionExpression':
                debugger;
                break;
            case 'Literal':
                debugger;
                break;
            case 'BlockStatement':
                debugger;
                break;
            case 'ReturnStatement':
                debugger;
                break;
            case 'UnaryExpression':
                debugger;
                break;
            case 'VariableDeclaration':
                debugger;
                break;
        }
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
        // The following reference(s), if followed, may turn the AST into a circular graph, and must be ignored
        if (property === 'outgoingFlows')
            continue;

        /**
         * @type {*|ASTNode|Array<ASTNode>}
         */
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
 * @param {*|ASTNode} value
 * @returns {boolean}
 */
function isAnASTNode(value){
    /**
     * @typedef {string} value.__proto__.constructor.name
     */
    return value !== null && typeof value === 'object' && value.__proto__.constructor.name === 'Node';
}

/**
 *
 * @param {*|Array<*>} value
 * @returns {boolean}
 */
function isArray(value) {
    /**
     * @typedef {function} Object.prototype.toString.call
     */
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
 * @param {ASTNode|Array<ASTNode>|Tree} container
 * @param {Function} functor
 */
function performProcessingPhase(container, functor){
    /**
     * @type {Array<ASTNode>}
     */
    var iterationTarget = isArray(container) ? container : container.body.node;
    iterationTarget.forEach(function (node) {
        forEachIn(node, functor);
    });
}

function leftSetContainsRightSet(leftSet, rightSet){
    if (leftSet instanceof Array)
        return leftSet.filter(function(val) { return rightSet.indexOf(val) !== -1;}).length === rightSet.length;
    return leftSet === rightSet;
}

/**
 * @param {Array<Array>} listOfSets
 * @returns {Array}
 */
function mergeSets(listOfSets){
    var mergedSet = {};
    var uniqueMergedSet = [];
    listOfSets.forEach(function addAllIn(set){
        set.forEach(function add(element){
            mergedSet[element] = element;
        })
    })
    for (var i in mergedSet)
        if (mergedSet.hasOwnProperty(i))
            uniqueMergedSet.push(i);
    return uniqueMergedSet;
}

