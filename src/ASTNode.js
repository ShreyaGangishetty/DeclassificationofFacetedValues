/**
 * JSDocs for the Node objects found in ast-query, for convenience.
 *
 * Not comprehensive, just covers those I think will be useful.
 *
 * @class
 * @typedef {Object} ASTNode
 * @property {ASTNode} alternate -- false-expression for if statement
 * @property {ASTNode} argument -- the body of a return statement, perhaps seen elsewhere as well
 * @property {Array<ASTNode>} arguments -- list of nodes passed to function in a CallStatement
 * @property {ASTNode|Array<ASTNode>} body -- the body of a FunctionDeclaration is typically a BlockStatement, while the
 *                                            body of a BlockStatement is an array of nodes.
 * @property {ASTNode} callee -- function being called, which has an ASTNode.name
 * @property {ASTNode} consequent -- true-expression for if statement
 * @property {Array<ASTNode>} declarations
 * @property {number} end -- index of program-as-string on which the current node ceases being written
 * @property {boolean|ASTNode|null} expression -- found in alternate and consequent nodes of if statement
 * @property {Array<String>} faceting -- not built-in to AST-query, this is essentially taint-tracking I do to
 *                                  figure out which parts of the AST to rewrite, as well as what labels (e.g. what
 *                                  facets) contribute to that need to rewrite. For example, if an <A? 1 : 2> and
 *                                  <B? 3 : 4> can reach a node through astNode.outgoingFlows, then it will collect a
 *                                  list ["A", "B"] which can be used in creating new faceted values.
 * @property {boolean} generator
 * @property {ASTNode} id
 * @property {ASTNode} init
 * @property {string} kind
 * @property {ASTNode} left -- left operand in an expression
 * @property {string} name
 * @property {string} operator -- found in binary expression nodes
 * @property {Array<ASTNode>} outgoingFlows -- not built-in to AST-query, this shows direct information flows from one
 *                                             node to another. In total they form a graph over the AST, often cyclic
 * @property {Array<ASTNode>} params
 * @property {ASTNode} right -- right operand in an expression
 * @property {Scope} scope -- not built-in to AST-query, this indicates the scope in which the node resides
 * @property {number} start -- index of program-as-string on which the current node begins being written
 * @property {ASTNode} test -- conditional expression for if statement
 * @property {string} type -- what type of Node in the AST it is
 * @property {*|String} value -- what the node evaluates to, e.g. a node with node.type='Literal' with
 *                        string node.raw="false" would have a boolean node.value=false
 * @property {boolean} wasReconstructedForFVs -- not built-in to AST-queryu, this boolean exists and is true if this is
 *                                              a node which has been reconstructed in order to facilitate operations
 *                                              involving faceted values
 */

/**
 * @callback ASTNodeFunctor
 * @param {ASTNode} node
 */
