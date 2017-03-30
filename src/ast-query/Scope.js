/**
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
     * @type {Object.<string,ASTNode>}
     * @private
     */
    this._functionsCalled = {};

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

exports.bin = Scope;