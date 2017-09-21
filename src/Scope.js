if (typeof module !== 'undefined')
    module.exports = Scope;

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
     *
     * @type {Object.<string,ASTNode>}
     * @private
     */
    this._symbols = {};

    /**
     * If this is null, then this is the program-level scope
     * @type {Scope}
     * @public
     */
    this.parent = parent;

    /**
     * @type {Array<Scope>}
     * @private
     */
    this._children = [];

    if (this.parent)
        this.parent._children.push(this);
}

/**
 * @returns {ASTNode} - returns a node of type "FunctionDeclaration" or "FunctionExpression" which spawned this Scope
 */
Scope.prototype.getOwningFunction = function getOwningFunction(){
    return this._owner;
};

/**
 * @param {string} identifier
 * @returns {ASTNode}
 */
Scope.prototype.getNodeNamed = function getFunctionNamed(identifier){
    var node = this._symbols[identifier];
    if (!!node)
        return node;
    if (this.parent)
        return this.parent.getNodeNamed(identifier);
    return undefined;
};

/**
 * Adds the symbol to the dictionary of symbols (i.e. functions and variables) visible within this scope
 * @param {string} name
 * @param {ASTNode} node
 * @return {boolean} true if this scope already had a symbol with that name
 */
Scope.prototype.registerSymbol = function registerSymbol(name, node){
    var alreadyRegistered = !!this._symbols[name];
    this._symbols[name] = node;
    return alreadyRegistered;
};

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
};

/**
 * @return {string} JSON.stringify'd rendition of {@link Scope#viewSimplifiedVersion}
 */
Scope.prototype.toString = function toString(){
    return JSON.stringify(this.viewSimplifiedVersion(), null, 3);
};

/**
 * @returns {{symbols: string, children: Array}} -- a simplified object simply containing the names of the symbols
 * in this scope, and the scopes that are its children. Recursive descent.
 */
Scope.prototype.viewSimplifiedVersion = function viewSimplifiedVersion(){
    return {
        symbols: Object.keys(this._symbols).join(),
        children: this._children.map(function(c){return c.viewSimplifiedVersion();})
    };
};
