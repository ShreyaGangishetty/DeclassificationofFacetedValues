/**
 * JSDocs for the Node objects found in ast-query, for convenience.
 *
 * Not comprehensive, just covers those I think will be useful.
 *
 * @class
 * @typedef {Object} ASTNode
 * @property {ASTNode} alternate -- false-expression for if statement
 * @property {ASTNode|Array<ASTNode>} body -- the body of a FunctionDeclaration is typically a BlockStatement, while the
 *                                            body of a BlockStatement is an array of nodes.
 * @property {ASTNode} callee -- function being called, which has an ASTNode.name
 * @property {ASTNode} consequent -- true-expression for if statement
 * @property {Array<ASTNode>} declarations
 * @property {number} end -- index of program-as-string on which the current node ceases being written
 * @property {boolean|ASTNode|null} expression -- found in alternate and consequent nodes of if statement
 * @property {boolean} generator
 * @property {ASTNode} id
 * @property {ASTNode} init
 * @property {boolean} isFaceted -- not built-in to AST-query, this is essentially taint-tracking I do to
 *                                  figure out which parts of the AST to rewrite
 * @property {string} kind
 * @property {ASTNode} left -- left operand in an expression
 * @property {string} name
 * @property {string} operator -- found in expression nodes
 * @property {Array<ASTNode>} params
 * @property {ASTNode} right -- right operand in an expression
 * @property {Scope} scope -- not built-in to AST-query, this indicates the scope in which the node resides
 * @property {number} start -- index of program-as-string on which the current node begins being written
 * @property {ASTNode} test -- conditional expression for if statement
 * @property {string} type -- what type of Node in the AST it is
 * @property {*} value -- what the node evaluates to, e.g. a node with node.type='Literal' with
 *                        string node.raw="false" would have a boolean node.value=false
 */

/**
 * @callback ASTNodeFunctor
 * @param {ASTNode} node
 */
