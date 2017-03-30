/**
 * Please note that this constructor has a side effect. The parent will be updated to have this constructed
 * Scope as one of its children.
 *
 * @param {ASTNode} [owner] - the FunctionDeclaration node that spawns this new scope
 * @param {Scope} [parent] - the closure in which the current scope resides
 * @constructor
 */
function Scope(owner, parent){

    /**
     * @type {ASTNode}
     * @private
     */
    this._owner = owner;

    /**
     * @type {Object.<string,ASTNode>}
     * @private
     */
    this._functionsDeclared = {};

    /**
     *
     * @type {Object.<string,ASTNode>}
     * @private
     */
    this._facetedValues = {};

    /**
     * @type {Array<ASTNode>}
     * @private
     */
    this._functionCalls = [];

    /**
     * @type {Scope}
     * @private
     */
    this._parent = parent;

    /**
     * @type {Array<Scope>}
     * @private
     */
    this._children = [];

    if (this._parent)
        this._parent._children.push(this);
}

/**
 * @param identifier
 * @returns {ASTNode}
 */
Scope.prototype.getFunctionNamed = function getFunctionNamed(identifier){
    var func = this._functionsDeclared[identifier];
    if (typeof func === 'function')
        return func;
    if (this._parent)
        return this._parent.getFunctionNamed(identifier);
    return undefined;
}

/**
 * @param {ASTNode} node
 */
Scope.prototype.registerFunctionDeclaration = function registerFunctionDeclaration(node){
    this._functionsDeclared[node.name] = node;
}

/**
 * @param {ASTNode} node
 */

/**
 *
 * @param {ASTNode} callExpression
 */
Scope.prototype.addFunctionCall = function addFunctionCall(callExpression){
    this._functionCalls.push(callExpression);
}

/**
 * @callback ScopeFunctor
 * @param {Scope} scope
 */

/**
 * Operates the given functor upon this Scope, as well as on its children, and recursively so on
 * @param {ScopeFunctor} functor
 */
Scope.prototype.forEach = function forEach(functor){
    functor(this);
    this._children.forEach(function(childScope){
        childScope.forEach(functor);
    });
}

exports.bin = Scope;