/**
 * fs is an imported library with various file system functions
 * @type {Object}
 * @property {function} readFileSync
 * @property {function} writeFileSync
 */
var fs = require('fs');
var astq = require("ast-query");
var FacetedValue = require('./FacetedValue.js');
var Cloak = require('./Cloak.js');
var Scope = require('./Scope.js');
var Declassify = require('./Declassify.js');

if (typeof module !== 'undefined') {
    module.exports = {
        FacetedValue: FacetedValue,
        Cloak: Cloak,
        Declassify: Declassify,
        fromString: function fromString(str) {
            return new Builder(str).presentOutputs();
        },
        fromFile: function fromFile(path) {
            console.log("Inside faceted values JS");
            var inputfile = fs.readFileSync(path);
            return new Builder(inputfile).presentOutputs();
        }
    }
}

function Builder(inputProgram) {
    /**
     * @type {Tree}
     * @property {Array<ASTNode>} body.node
     */
    console.log("....................Inside builder(inputprogram function)");
    this.tree = astq(inputProgram);
    //console.log("Tree------------------------------"+this.tree);// error
    this.currentScope = new Scope();
    //console.log("scope variable printing"+this.currentScope);
    this.counter= 0;
    this.declassify = new Declassify();
    console.log("Printing the counter value first:------test-----"+this.counter);
    this.performProcessingPhase(this.tree, checkNodeTypeCoverage);
    this.performProcessingPhase(this.tree, substituteFacetedValues);
    this.performProcessingPhase(this.tree, this.overlayScoping);
    this.performProcessingPhase(this.tree, prepForInformationFlows);
    this.performProcessingPhase(this.tree, linkIdentifiers);
    this.performProcessingPhase(this.tree, overlayInformationFlows);
    console.log("Printing symbols list for overlayInformationFlows")
    this.performProcessingPhase(this.tree, markFaceting);
    this.performProcessingPhase(this.tree, this.refactorOperationsToBeFaceted);
}




Builder.prototype.presentOutputs = function presentOutputs(){
    var that = this;
    return {
        toString: function toString(){
            return that.toString();
        },
        toFile: function toFile(path){
            return that.toFile(path);
        }
    };
};

Builder.prototype.toString = function toString(){
    return "var FacetedValuesJS = require('faceted-values-js');\n"
        + "var FacetedValue = FacetedValuesJS.FacetedValue;\n"
        + "var Cloak = FacetedValuesJS.Cloak;\n"
        + "var view = [];\n"
        + this.tree.toString();
};

Builder.prototype.toFile = function toFile(path){
    var s = this.toString();
    fs.writeFileSync(path, s);
    return s;
};

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
        // this prints as a function expression   here k = newlabel()
        case 'FunctionExpression':
        case 'Literal':
        //k = newlabel() this is like assignment expression so need to make changes in this case
        case 'AssignmentExpression':
        //if that expression contains newlabel() function then just create that function and have a global incrementor or a random string generator
        case 'BlockStatement':
        case 'ExpressionStatement':
        case 'NewExpression':
        case 'Identifier':
        case 'IfStatement':
        case 'MemberExpression': // TODO Add to all cases as needed
        case 'ReturnStatement':
        case 'UnaryExpression':
        case 'VariableDeclaration':
                console.log("Inside variable declarator 1")
        case 'VariableDeclarator':
                console.log("Inside variable declaration 3")
        console.log("node type--------------------"+node.type);
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
                var m = node.value.match(FacetedValue.REGEX).map(function(str){return str.trim();});
                var replacementString = "new FacetedValue('" + m[1] + "', " + m[2] + ", " + m[3] + ")";
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
 //pc
Builder.prototype.overlayScoping = function overlayScoping(node){
    if (node.scope)
        return; // a little sloppy in terms of program flow, but node.scope may have already been set by performProcessingPhase a few lines below, and we don't want it overridden
    node.scope = this.currentScope;
    if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression'){
    	//here new label defacet declassify comes
        if (node.id) // Anonymous functions do not have an identifier
            this.currentScope.registerSymbol(node.id.name, node);
        this.currentScope = new Scope(node, this.currentScope);
        node.params.forEach(function(p){this.currentScope.registerSymbol(p.name, p);}.bind(this));
        var functionContents = node.body;
        if (functionContents.type === 'BlockStatement')
            functionContents = functionContents.body;
        this.performProcessingPhase(functionContents, this.overlayScoping);
        this.currentScope = this.currentScope.parent;
    }
    else if (node.type === 'VariableDeclarator'){
    	// the variable for new label comes here
        console.log("Inside variable declarator 4")
        this.currentScope.registerSymbol(node.id.name, node);
    }
};

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
    var declaringNode = node.scope.getNodeDeclaring(node.name);
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
//here also may be we need to support faceted language
//pc
function overlayInformationFlows(node){
    var i;
    switch (node.type){
        case 'BinaryExpression':
            node.left.outgoingFlows.push(node);
            node.right.outgoingFlows.push(node);
            break;
        case 'CallExpression':
            node.callee.outgoingFlows.push(node);
            for (i = 0; i < node.arguments.length; i++) {
                if (!node.arguments[i].outgoingFlows)
                    debugger;
                node.arguments[i].outgoingFlows.push(node);
                var callDec = node.callee.scope.getNodeDeclaring(node.callee.name);
                if (callDec && callDec.type === 'FunctionDeclaration' && callDec.params[i])
                    node.arguments[i].outgoingFlows.push(callDec.params[i]);
            }
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
            console.log("Inside variable declarator 5")
            if (node.init)
                node.init.outgoingFlows.push(node);
            break;
    }
    console.log("inf over lay information flow :: node::  "+node +" outgoinggg::  "+ node.left.outgoingFlows);
}

/**
 * This walks the AST and, wherever something isFaceted, it follows the information flows plotted out in the previous
 * pass to mark those nodes as also being faceted.
 *
 * @param {ASTNode} node
 */
function markFaceting(node){
    if (node.faceting) {
        node.outgoingFlows.forEach(function(outflowNode){
            propagate(outflowNode, node.faceting);
        });
    }
    /**
     * @param {ASTNode} node
     * @param {Array<string>} faceting
     */
    function propagate(node, faceting){
        if (node.faceting && leftSetContainsRightSet(node.faceting, faceting))
            return; //avoid cycles
        node.faceting = mergeSets([node.faceting, faceting]);
        node.outgoingFlows.forEach(function(outflowNode){
            propagate(outflowNode, node.faceting);
        });
    }
}

/**
 * @example fv + b ===> fv.binaryOps(b, true)
 * @param {ASTNode}node
 */
Builder.prototype.refactorOperationsToBeFaceted = function refactorOperationsToBeFaceted(node){
    if (node.faceting){
        var newNode, object, operand, operandIsOnLeft;
        switch (node.type) {
            case 'AssignmentExpression':
                // with view v, `var a = b;` becomes `var a = <v ? b : a>`
                var viewAsString = (node.faceting.length === 1) ? "'" + node.faceting[0] + "'" : "['" + node.faceting.join("', '") + "']";
                var replacementString = 'new FacetedValue(' + viewAsString + ', bPlaceholder, aPlaceholder)';
                newNode = astq(replacementString).body.node[0].expression;
                newNode.arguments[1] = node.right; // private value b
                newNode.arguments[2] = node.left; // public value a
                newNode.faceting = node.faceting;
                this.currentScope = node.scope;
                this.forEachIn(newNode, this.overlayScoping);
                this.forEachIn(newNode, prepForInformationFlows);
                this.forEachIn(newNode, overlayInformationFlows);
                this.forEachIn(newNode, markFaceting);
                replaceLeftNodeWithRight(node, newNode); // TODO should be node.right instead of node... but then it stack-overflows?
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
                this.currentScope = node.scope;
                this.forEachIn(newNode, this.overlayScoping);
                this.forEachIn(newNode, prepForInformationFlows);
                this.forEachIn(newNode, overlayInformationFlows);
                this.forEachIn(newNode, markFaceting);
                replaceLeftNodeWithRight(node, newNode);
                break;
            case 'CallExpression':
                if (this.currentScope.getNodeDeclaring(node.callee.name)){
                    replacementString = node.callee.name + '.apply(this, [null]);';
                    newNode = astq(replacementString).body.node[0].expression;
                    newNode.arguments[1].elements = node.arguments;
                } else {
                    replacementString = 'FacetedValue.invoke(null, this, []);';
                    newNode = astq(replacementString).body.node[0].expression;
                    newNode.arguments[0] = node.callee;
                    newNode.arguments[2].elements = node.arguments;
                }
                this.currentScope = node.scope;
                this.forEachIn(newNode, this.overlayScoping);
                this.forEachIn(newNode, prepForInformationFlows);
                this.forEachIn(newNode, overlayInformationFlows);
                this.forEachIn(newNode, markFaceting);
                replaceLeftNodeWithRight(node, newNode);
                break;
            case 'FunctionDeclaration':
                debugger;
                break;
            case 'FunctionExpression':
                debugger;
                break;
            case 'IfStatement':
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
            console.log("Inside variable declarator 2")
                debugger;
                break;
        }
    }
};

/* **************************** HELPERS *********************************************/
/**
 * Recursively operates the functor upon the given AST node and all of its children.
 *
 * @param {ASTNode} node
 * @param {ASTNodeFunctor} functor
 */
Builder.prototype.forEachIn = function forEachIn(node, functor){
    functor.bind(this)(node);
    for (var property in node) {
        // The following reference(s), if followed, may turn the AST into a circular graph, and must be ignored
        if (property === 'outgoingFlows')
            continue;

        /**
         * @type {*|ASTNode|Array<ASTNode>}
         */
        var value = node[property];
        if (isAnASTNode(value))
            this.forEachIn(value, functor);
        if (isArray(value)) {
            value.forEach(function (element) {
                if (isAnASTNode(element))
                    this.forEachIn(element, functor);
            }.bind(this));
        }
    }
};

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
Builder.prototype.performProcessingPhase = function performProcessingPhase(container, functor){
    /**
     * @type {Array<ASTNode>}
     */
    var iterationTarget = isArray(container) ? container : container.body.node;
    iterationTarget.forEach(function (node) {
        this.forEachIn(node, functor);
    }.bind(this));
};

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
        set && set.forEach(function add(element){
            mergedSet[element] = element;
        });
    });
    for (var i in mergedSet)
        if (mergedSet.hasOwnProperty(i))
            uniqueMergedSet.push(mergedSet[i]);
    return uniqueMergedSet;
}