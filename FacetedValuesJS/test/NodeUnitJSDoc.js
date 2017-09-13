/**
 * Included for IDE type-checking.
 *
 * @see https://github.com/caolan/nodeunit
 *
 * @typedef {Object} NodeUnit
 * @property {NodeUnit~UnaryTest}  ok - Tests if value is a true value.
 * @property {NodeUnit~BinaryTest} equal - Tests shallow, coercive equality with the equal comparison operator ( == ).
 * @property {NodeUnit~BinaryTest} notEqual - Tests shallow, coercive non-equality with the not equal comparison operator ( != ).
 * @property {NodeUnit~BinaryTest} deepEqual - Tests for deep equality.
 * @property {NodeUnit~BinaryTest} notDeepEqual - Tests for any deep inequality.
 * @property {NodeUnit~BinaryTest} strictEqual - Tests strict equality, as determined by the strict equality operator ( === )
 * @property {NodeUnit~BinaryTest} notStrictEqual - Tests strict non-equality, as determined by the strict not equal operator ( !== )
 * @property {NodeUnit~BlockTest}  throws - Expects block to throw an error.
 * @property {NodeUnit~BlockTest}  doesNotThrow - Expects block not to throw an error.
 * @property {NodeUnit~UnaryTest}  ifError - Tests if value is not a false value, throws if it is a true value. Useful when testing the first argument, error in callbacks.
 * @property {NodeUnit~UnaryTest}  expect - Specify how many assertions are expected to run within a test. Very useful for ensuring that all your callbacks and assertions are run.
 * @property {function} done - Finish the current test function, and move on to the next. ALL tests should call this!
 */

/**
 * @callback NodeUnit~BinaryTest
 * @param {*} actual
 * @param {*} expected
 * @param {string} [message]
 * @return undefined
 */

/**
 * @callback NodeUnit~UnaryTest
 * @param {*} value
 * @param {string} [message]
 */

/**
 * @callback NodeUnit~BlockTest
 * @param {function} block
 * @param {string} [message]
 */