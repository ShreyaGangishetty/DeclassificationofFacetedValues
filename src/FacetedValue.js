 if (typeof module !== 'undefined')
    module.exports = FacetedValue;
//noinspection JSUnresolvedVariable,JSUnusedGlobalSymbols
Symbol = Symbol || function noop(){}; // no operation?

/**
 * A "faceted value" is an object which can contain an arbitrary number of facets. Each "facet" is a value corresponding
 * to a certain "view", and a view is a list of labels. If an "observer" (a computer program) reads the faceted value
 * through the intended course -- the getFacetVisibleVersus method -- its view will determine which facet it sees. That
 * is, the given views will be compared against the view by which the FacetedValue is constructed, and a suitable
 * facet returned.
 *
 * Faceted values are monadic data types. Operations that involve multiple faceted values will combine them
 * appropriately. This may lead to a value of 2, 4, 8, 16, ..., 2^n facets, as faceted values with different labels
 * are combined.
 *
 * @example
 * var x = new FacetedValue(["A"], 1, 2); // <A ? 1 : 2>
 * x.getFacetVisibleVersus(["A"]);        // 1
 * x.getFacetVisibleVersus(["B"]);        // 2
 *
 * @example
 * var x = new Faceted(['A'], 1, 2); // <A ? 2 : 3>
 * var y = new Faceted(['B'], 3, 5); // <B ? 5 : 7>
 * x.binaryOps('*', y);              // <A ? <B ? 10 : 14> : <B ? 15 : 21>>
 *
 * @param {String|Array<String>|FacetedValue} currentView -- A list of string labels by which the two facets will be
 *          differentiated. If this parameter is instead a FacetedValue then it will copy the view from there.
 * @param {*} leftValue -- This is the value that corresponds to all the labels in currentView being met; nominally, the
 *          "true" or "private" value.
 * @param {*} [rightValue] -- Optional. This is the value that corresponds to any of the labels in currentView not being
 *          met; nominally, the "false" or "public" value. If a rightValue is not provided, then one will be generated
 *          based on the typeof leftValue
 * @param {String} [additionalLabel] -- Optional. This is a convenience argument for adding one-off labels to the list
 *          of currentView.
 * @constructor
 */
function FacetedValue(currentView, leftValue, rightValue, additionalLabel) {
    if (currentView instanceof FacetedValue)
        currentView = currentView.view;
    this.view = (currentView.slice) ? currentView.slice(0) : currentView;
    this.leftValue = leftValue;
    this.rightValue = rightValue || produceGarbageSimilarTo(leftValue);
    if (typeof additionalLabel === 'string')
        this.view.push(additionalLabel);
}

/* ********************************* Member functions ***************************************************/

/**
 * This function is used to perform basic operations of two operands, in the line of x+2, or x+y, where x and/or y
 * can be anything on which such operations would normally work, or where x and/or y are FacetedValues. In all cases
 * the original FacetedValue(s) remain unmutated, with the operation producing a new FacetedValue.
 *
 * For convenience there is also a ':' operator not found by default in Javascript, which concatenates two
 * faceted arrays. There is an example below.
 *
 * An alternative way of formulating these can be found in{@link FacetedValue.binaryOperation}
 *
 * @example
 * var x = new FacetedValue('A', 1, 2);
 * // x * 42
 * var y = x.binaryOps('*', 42);
 * console.log(y); // <A ? 42 : 94>
 *
 * @example
 * // 'result = ' + (x * 42)
 * y = x.binaryOps('*', 42).binaryOps('+', 'result = ', true);
 * console.log(y); // <A ? "result = 42"  : "result = 94">
 *
 * @example
 * // 'result = ' + (x * z)
 * var z = new FacetedValue('B', 3, 5);
 * y = x.binaryOps('*', z).binaryOps('+', 'result = ', true);
 * console.log(y); // <A ? <B ? 3 : 5> : <B ? 6 : 10>>
 *
 * @example
 * // Concatenating two faceted lists
 * var l1 = new FacetedValue('A', [1], [3]);
 * var l2 = new FacetedValue('A', [5], [7]);
 * var l3 = l1.binaryOps(':', l2);
 * console.log(l3); // <'A' ? [1,5] : [3,7]>
 *
 * @param {string} operator -- One of the following operations to be performed with this FacetedValue as an operand:
 *       ['+','-','*','/','^','&','|','%','>','<','<=','>=','==','!=','&&','||','!==','===','>>','<<','in','instanceof',':']
 * @param {*|FacetedValue} operand -- The other operand with which to perform the operation
 * @param {boolean} [operandIsOnLeft] -- True to execute the operation as `operand operator this`, falsey to execute
 *                                       as `this operator operand`. In some cases this makes a very large difference
 * @returns {FacetedValue} -- A new FacetedValue that is the product of the parameterized operation
 */
FacetedValue.prototype.binaryOps = function binaryOps(operator, operand, operandIsOnLeft) {
    return FacetedValue.binaryOperation(this, operator, operand, operandIsOnLeft);
};


/**
 * This function is used to perform basic operations of one operand, such as ++x, !x, and so on where x is a
 * FacetedValue. In most cases the original FacetedValue remains unmutated. The exceptions are the increment "++" and
 * decrement "--" operators, which mutate the original FacetedValue so as to remain inline with the behavior of
 * increment and decrement on primitives.
 *
 * @example
 * // ++x, incrementing all the facets of x and then returning the result:
 * x.unaryOps('++', true);
 *
 * @example
 * // x--, decrementing all facets of x and returning a new FacetedValue with the original facets:
 * x.unaryOps('--');
 *
 * @param {string} operator
 * @param {boolean} [operatorIsOnLeft]
 * @returns {FacetedValue}
 */
FacetedValue.prototype.unaryOps = function unaryOps(operator, operatorIsOnLeft) {
    var newLeft, newRight;

    function calculateLRBranch(lrValue){
        if (lrValue instanceof FacetedValue)
            return lrValue.unaryOps(operator, operatorIsOnLeft);
        switch(operator){
            case '+'      : return +lrValue;
            case '-'      : return -lrValue;
            case '!'      : return !lrValue;
            case '~'      : return ~lrValue;
            case 'typeof' : return typeof lrValue;
            case 'void'   : return void   lrValue;
            default : throw new Error("Unrecognized left-side unary operator ``" + operator + "``.");
        }
    }

    // I apologize, dear reader, for the following snagglefest. It is necessary for the increments and
    // decrements to have the expected ordering of changing-and-returning, returning-and-changing behaviors.
    if (operator === '++'){
        if (this.leftValue instanceof FacetedValue)
            newLeft = this.leftValue.unaryOps(operator, operatorIsOnLeft);
        else
            newLeft = (operatorIsOnLeft) ? ++this.leftValue : this.leftValue++;
        if (this.rightValue instanceof FacetedValue)
            newRight = this.rightValue.unaryOps(operator, operatorIsOnLeft);
        else
            newRight = (operatorIsOnLeft) ? ++this.rightValue : this.rightValue++;
    } else if (operator === '--'){
        if (this.leftValue instanceof FacetedValue)
            newLeft = this.leftValue.unaryOps(operator, operatorIsOnLeft);
        else
            newLeft = (operatorIsOnLeft) ? --this.leftValue : this.leftValue--;
        if (this.rightValue instanceof FacetedValue)
            newRight = this.rightValue.unaryOps(operator, operatorIsOnLeft);
        else
            newRight = (operatorIsOnLeft) ? --this.rightValue : this.rightValue--;
    } else {
        if (!operatorIsOnLeft)
            throw new Error("Unrecognized right-side unary operator ``" + operator +
                "``. You may need to set operatorIsOnLeft to true in the arguments.");
        newLeft  = calculateLRBranch(this.leftValue);
        newRight = calculateLRBranch(this.rightValue);
    }
    return new FacetedValue(this.view, newLeft, newRight);
};

/**
 * The labels of a faceted value describe the classification of the data in its various facets.
 * A view is a list of strings that describe the authorizations of an observer.
 * This function is used to match such a view against the faceted value.
 * Each label is checked for its presence within the view, to see whether the observer is authorized for that
 * classification of data, and an appropriate facet returned.
 *
 * @param {Array<String>} view
 * @returns {*}
 */
FacetedValue.prototype.getFacetVisibleVersus = function getFacetVisibleVersus(view){
    var v = this.rightValue;
    if (leftSetContainsRightSet(view, this.view))
        v = this.leftValue;
    return (v instanceof FacetedValue) ? v.getFacetVisibleVersus(view) : v;
};


/**
 * Produces a human-readable representation of this FacetedValue.
 *
 * @example
 * <"A" ? 42 : 0>
 * <"A,B,C" ? "doctor of cataclysmology" : "master of disaster">
 * <"userLoggedIn" ? <"viewAsOtherUser" ? 1234.56 : 47143.58> : <"viewAsOtherUser" ? 0 : 0>>
 *
 * @returns {string}
 */
FacetedValue.prototype.toString = function toString() {
    return "<" + this.view + " ? " + this.leftValue + " : " + this.rightValue + ">";
};

/**
 * Checks to see if the given value is a FacetedValue exactly equal to this one. If values within the FacetedValues
 * are objects with a method called 'equals
 *
 * @param {*} value
 * @returns {boolean}
 */
FacetedValue.prototype.equals = function equals(value){
    if (!(value instanceof FacetedValue))
        return false;
    if (this.view.toString() !== value.view.toString())
        return false;

    var leftEquals;
    if (this.leftValue && this.leftValue.equals && typeof this.leftValue.equals === 'function')
        leftEquals = this.leftValue.equals(value.leftValue);
    else
        leftEquals = this.leftValue === value.leftValue;

    var rightEquals;
    if (this.rightValue && this.rightValue.equals && typeof this.rightValue.equals === 'function')
        rightEquals = this.rightValue.equals(value.rightValue);
    else
        rightEquals = this.rightValue === value.rightValue;

    return leftEquals && rightEquals;
};

/**
 * This method is intended to mirror {@see Function#apply}. It can be used when the facets within this FacetedValue are
 * function values, in order to invoke those functions. It is inadvisable for these functions to return values of
 * different types.
 *
 * There is another version of this function for minor convenience.
 * @see FacetedValue#apply_helper
 * @see Function#apply
 *
 * @example
 * var foo1 = function(x, y){ return x + y; };
 * var foo2 = function(x, y){ return x * y; };
 * var facetedFunction = new FacetedValue('bleagh', foo1, foo2);
 * var facetedResult = facetedFunction.apply(this, [3, 5]);
 * console.log('result: ' + facetedResult.toString());  // result: <bleagh ? 8 : 15>
 *
 * @param {Object|FacetedValue<Object>} [thisArg] -- an object that will be reference by the `this` keyword
 * @param {Array|FacetedValue<Array>} [argArray] -- a list of arguments that will be passed to the functions
 * @returns {FacetedValue}
 */
FacetedValue.prototype.apply = function apply(thisArg, argArray){
    var newLeft, newRight;

    if (this.leftValue instanceof FacetedValue)
        newLeft = this.leftValue.apply(thisArg, argArray);
    else if (typeof this.leftValue === 'function')
        newLeft = FacetedValue.invokeFunction(this.leftValue, thisArg, argArray);
    else
        throw new Error("This FacetedValue is not one of functions.");

    if (this.rightValue instanceof FacetedValue)
        newRight = this.rightValue.apply(thisArg, argArray);
    else if (typeof this.rightValue === 'function')
        newRight = FacetedValue.invokeFunction(this.rightValue, thisArg, argArray);
    else
        throw new Error("This FacetedValue is not one of functions.");

    return new FacetedValue(this.view, newLeft, newRight);
};

/**
 * A convenience function that invokes the normal apply function, but without having to provide arguments as a list.
 * @see FacetedValue#apply
 *
 * This method can be used when the facets within this FacetedValue are function values, in order to invoke those
 * functions. It is inadvisable for these functions to return values of different types.
 *
 * @example
 * var foo1 = function(x, y){ return x + y; };
 * var foo2 = function(x, y){ return x * y; };
 * var facetedFunction = new FacetedValue('bleagh', foo1, foo2);
 * var facetedResult = facetedFunction.apply_helper(this, 3, 5);
 * console.log('result: ' + facetedResult.toString());  // result: <bleagh ? 8 : 15>
 *
 * @param {Object|FacetedValue<Object>} [thisArg]
 * @returns {FacetedValue}
 */
FacetedValue.prototype.apply_helper = function apply_helper(thisArg){
    return this.apply(thisArg, Array.prototype.slice.call(arguments, 1));
};

/**
 * Returns a new FacetedValue which contain the same facets and the same values, however, each of those values are
 * contained inside an array.
 *
 * @example
 * var x = new FacetedValue('A', 3, 5);
 * var y = x.toFacetedArray();
 * console.log(x); // <A ? 3 : 5>
 * console.log(y); // <A > [3] : [5]>
 *
 * @returns {FacetedValue<Array>}
 */
FacetedValue.prototype.toFacetedArray = function toFacetedArray(){
    var newLeft = (this.leftValue instanceof FacetedValue) ? this.leftValue.toFacetedArray() : [this.leftValue];
    var newRight = (this.rightValue instanceof FacetedValue) ? this.rightValue.toFacetedArray() : [this.rightValue];
    return new FacetedValue(this.view, newLeft, newRight);
};

/* ******************************* "Static" members ***************************************************/

/**
 * A rough regular expression for matching faceted values, e.g. <A ? b : c>
 * Assumes that the string contains nothing but the faceted value.
 *
 * @type {RegExp}
 */
FacetedValue.REGEX = /^<\s*(.+)\s*\?\s*(.+)\s*:\s*(.+)\s*>$/;
//may be i can add some reex for new label functionality.....

/**
 * When one or more FacetedValues are to be given as arguments to a function that is not itself FacetedValues-aware,
 * it is best practice (and sometimes even necessary) to give the function to this method instead so that the facets
 * can be unpacked correctly.
 *
 * This method is directly related to {@link Function#apply}.
 *
 * @example
 * var facetedNumber = new FacetedValue("A", 25, 36);
 * var facetedSqrt = FacetedValue.invokeFunction(Math.sqrt, this, [facetedNumber]);
 * console.log(facetedSqrt); // output: <A ? 5 : 6>
 *
 * @param {Function|FacetedValue<Function>} lambda
 * @param {Object|FacetedValue<Object>} thisArg
 * @param {Array|FacetedValue<Array>} argArray
 * @returns {FacetedValue}
 */
FacetedValue.invokeFunction = function invokeFunction(lambda, thisArg, argArray){
    if (lambda instanceof FacetedValue){
        return new FacetedValue(lambda.view,
            invokeFunction(lambda.leftValue, thisArg, argArray),
            invokeFunction(lambda.rightValue, thisArg, argArray)
        );
    }
    if (thisArg instanceof FacetedValue){
        return new FacetedValue(thisArg.view,
            invokeFunction(lambda, thisArg.leftValue, argArray),
            invokeFunction(lambda, thisArg.rightValue, argArray)
        );
    }
    if (argArray instanceof FacetedValue){
        return new FacetedValue(argArray.view,
            invokeFunction(lambda, thisArg, argArray.leftValue),
            invokeFunction(lambda, thisArg, argArray.rightValue)
        );
    }
    if (facetedValueIsFoundIn(argArray)){
        var facetedArgArray = FacetedValue.getFacetedListOfValuesFrom(argArray);
        return new FacetedValue(facetedArgArray.view,
            invokeFunction(lambda, thisArg, facetedArgArray.leftValue),
            invokeFunction(lambda, thisArg, facetedArgArray.rightValue)
        );
    }
    return lambda.apply(thisArg, argArray);
};

/**
 * We have a list of arguments, some of which may be FacetedValues. We want to extract these facets so that for each
 * possible combination of views we have a list of non-faceted arguments. For example:
 *
 * [1, 2, 3, <A ? 4 : 5>, <B ? 6 : 7> 8]
 *
 * becomes
 *
 * <A ? <B ? [1, 2, 3, 4, 6, 8]
 *         : [1, 2, 3, 4, 7, 8]>
 *    : <B ? [1, 2, 3, 5, 6, 8]
 *         : [1, 2, 3, 5, 7, 8]>>
 *
 * @param {Array} listOfFacetedValues
 * @return {FacetedValue<Array>}
 */
FacetedValue.getFacetedListOfValuesFrom = function getFacetedListOfValuesFrom(listOfFacetedValues){
    var indexOfFirstFacVal = findFirstFacetedValueIn(listOfFacetedValues);
    var leadingNonFacetedValues = listOfFacetedValues.slice(0, indexOfFirstFacVal);
    var facetedList = listOfFacetedValues[indexOfFirstFacVal].toFacetedArray();
    var followingArgs = listOfFacetedValues.slice(indexOfFirstFacVal + 1);
    facetedList.binaryOps(':', leadingNonFacetedValues, true);
    followingArgs.forEach(function(arg){ facetedList.binaryOps(":", arg); });
    return facetedList;
};

/**
 * @param {FacetedValue<Boolean>|Boolean} facetedBoolean
 * @param {Function} e_true
 * @param {Function} e_fals
 * @param {Object} thisArg
 */
FacetedValue.evaluateConditional = function evaluateConditional(facetedBoolean, e_true, e_fals, thisArg) {
    evaluateConditional_helper(facetedBoolean, e_true, e_fals, thisArg, []);
};

/**
 * Alternative formulation for {@link FacetedValue#binaryOps} (which simply translates into this function anyway).
 *
 * @example
 * var x = new FacetedValue('A", 1, 2);
 * var y = 'b';
 * output = FacetedValue.binaryOperation(x, '+', y);
 * console.log(output); // <A ? 1b : 2b>
 *
 * @param {FacetedValue|*} operand1
 * @param {string} operator -- One of the following operations to be performed with this FacetedValue as an operand:
 *       ['+','-','*','/','^','&','|','%','>','<','<=','>=','==','!=','&&','||','!==','===','>>','<<','in','instanceof',':']
 * @param {FacetedValue|*} operand2
 * @param {boolean} [operand2isOnLeft] -- defaults to false
 * @returns {FacetedValue}
 */
FacetedValue.binaryOperation = function binaryOperation(operand1, operator, operand2, operand2isOnLeft) {
    if (operand1 instanceof FacetedValue && operand2 instanceof FacetedValue
        && (setsAreTheSame(operand1.view, operand2.view))){
        return new FacetedValue(operand1.view,
            binaryOperation(operand1.leftValue, operator, operand2.leftValue, operand2isOnLeft),
            binaryOperation(operand1.rightValue, operator, operand2.rightValue, operand2isOnLeft)
        );
    }
    if (operand1 instanceof FacetedValue){
        return new FacetedValue(operand1.view,
            binaryOperation(operand1.leftValue, operator, operand2, operand2isOnLeft),
            binaryOperation(operand1.rightValue, operator, operand2, operand2isOnLeft)
        );
    }
    if (operand2 instanceof FacetedValue){
        return new FacetedValue(operand2.view,
            binaryOperation(operand1, operator, operand2.leftValue, operand2isOnLeft),
            binaryOperation(operand1, operator, operand2.rightValue, operand2isOnLeft)
        );
    }
    return binaryOperationOfPrimitives(operand1, operator, operand2, operand2isOnLeft);
};

/* ************************** Helper functions ******************************************** */

/**
 * Given the value, produces a generic information-empty value of the same type.
 *
 * @param {*} value
 * @returns {*}
 */
function produceGarbageSimilarTo(value){
    switch (typeof value){
        case 'number' : return 0;
        case 'string' : return '';
        case 'object' : return {};
        case 'function' : return function(){};
        case 'boolean' : return false;
        case 'symbol' : return Symbol();
        case 'undefined' : return undefined;
        default : return undefined;
    }
}

/**
 * This function simply sections off a chunk of code from {@link FacetedValue.binaryOperation} for readability.
 * It's the part where the FacetedValue has been descended through to a non-faceted value on which we can perform a
 * standard Javascript operation.
 *
 * @param {*} operand1
 * @param {string} operator -- One of the following operations to be performed with this FacetedValue as an operand:
 *       ['+','-','*','/','^','&','|','%','>','<','<=','>=','==','!=','&&','||','!==','===','>>','<<','in','instanceof',':']
 * @param {*} operand2
 * @param {boolean} [operand2isOnLeft] -- defaults to false
 * @returns {*}
 */
function binaryOperationOfPrimitives(operand1, operator, operand2, operand2isOnLeft){
    operand2isOnLeft = operand2isOnLeft || false;
    if (operand1 instanceof FacetedValue || operand2 instanceof FacetedValue)
        throw new Error("FacetedValue not unpacking correctly");
    switch(operator) {
        case '+'          : return (operand2isOnLeft) ?  operand2 +          operand1 : operand1 +          operand2;
        case '-'          : return (operand2isOnLeft) ?  operand2 -          operand1 : operand1 -          operand2;
        case '*'          : return (operand2isOnLeft) ?  operand2 *          operand1 : operand1 *          operand2;
        case '/'          : return (operand2isOnLeft) ?  operand2 /          operand1 : operand1 /          operand2;
        case '^'          : return (operand2isOnLeft) ?  operand2 ^          operand1 : operand1 ^          operand2;
        case '&'          : return (operand2isOnLeft) ?  operand2 &          operand1 : operand1 &          operand2;
        case '|'          : return (operand2isOnLeft) ?  operand2 |          operand1 : operand1 |          operand2;
        case '%'          : return (operand2isOnLeft) ?  operand2 %          operand1 : operand1 %          operand2;
        case '>'          : return (operand2isOnLeft) ?  operand2 >          operand1 : operand1 >          operand2;
        case '<'          : return (operand2isOnLeft) ?  operand2 <          operand1 : operand1 <          operand2;
        case '<='         : return (operand2isOnLeft) ?  operand2 <=         operand1 : operand1 <=         operand2;
        case '>='         : return (operand2isOnLeft) ?  operand2 >=         operand1 : operand1 >=         operand2;
        case '=='         : //noinspection EqualityComparisonWithCoercionJS
                            return (operand2isOnLeft) ?  operand2 ==         operand1 : operand1 ==         operand2;
        case '!='         : //noinspection EqualityComparisonWithCoercionJS
                            return (operand2isOnLeft) ?  operand2 !=         operand1 : operand1 !=         operand2;
        case '&&'         : return (operand2isOnLeft) ?  operand2 &&         operand1 : operand1 &&         operand2;
        case '||'         : return (operand2isOnLeft) ?  operand2 ||         operand1 : operand1 ||         operand2;
        case '!=='        : return (operand2isOnLeft) ?  operand2 !==        operand1 : operand1 !==        operand2;
        case '==='        : return (operand2isOnLeft) ?  operand2 ===        operand1 : operand1 ===        operand2;
        case '>>'         : return (operand2isOnLeft) ?  operand2 >>         operand1 : operand1 >>         operand2;
        case '<<'         : return (operand2isOnLeft) ?  operand2 <<         operand1 : operand1 <<         operand2;
        case 'in'         : return (operand2isOnLeft) ?  operand2 in         operand1 : operand1 in         operand2;
        case 'instanceof' : return (operand2isOnLeft) ?  operand2 instanceof operand1 : operand1 instanceof operand2;
    }
    if (operator === ':'){
        operand1 = (operand1 instanceof Array) ? operand1 : [operand1];
        operand2 = (operand2 instanceof Array) ? operand2 : [operand2];
        if (operand2isOnLeft)
            return operand2.concat(operand1);
        return operand1.concat(operand2);
    }
    throw new Error("Unknown operator: ``" + operator + "``");
}

/**
 * Determines if all of the values listed in rightSet are found somewhere in leftSet.
 *
 * @param {Array<*>} leftSet
 * @param {Array<*>} rightSet
 * @returns {boolean}
 */
function leftSetContainsRightSet(leftSet, rightSet){
    if (leftSet instanceof Array)
        return leftSet.filter(function(val) { return rightSet.indexOf(val) !== -1;}).length === rightSet.length;
    return leftSet === rightSet;
}

/**
 * Determines if the two given sets contain the same elements
 *
 * @param {Array<*>} view
 * @param {Array<*>} view2
 * @returns {boolean}
 */
function setsAreTheSame(view, view2) {
    return leftSetContainsRightSet(view, view2) && view.length === view2.length;
}

/**
 * Attempts to create a simpler FacetedValue equivalent to the one given.
 *
 * @param {FacetedValue} facetedValue
 * @returns {FacetedValue}
 */
function simplify(facetedValue){

    if (!(facetedValue instanceof FacetedValue))
        return facetedValue;
    facetedValue.leftValue = simplify(facetedValue.leftValue);
    facetedValue.rightValue = simplify(facetedValue.rightValue);

    // <X ? a : a> ==> a
    if (facetedValue.leftValue === facetedValue.rightValue
        || (facetedValue.leftValue.equals && facetedValue.leftValue.equals(facetedValue.rightValue))
        || (facetedValue.rightValue.equals && facetedValue.rightValue.equals(facetedValue.rightValue)))
        return facetedValue.leftValue;

    // <X ? <X ? a : b> : c> ===> <X ? a : c>
    if (facetedValue.leftValue instanceof FacetedValue
        && leftSetContainsRightSet(facetedValue.view, facetedValue.leftValue.view))
        return simplify(new FacetedValue(facetedValue.view, facetedValue.leftValue.leftValue, facetedValue.rightValue));

    // <X ? a : <X ? b : c>> ===> <X ? a : c>
    if (facetedValue.leftValue instanceof FacetedValue
        && leftSetContainsRightSet(facetedValue.view, facetedValue.rightValue.view))
        return simplify(new FacetedValue(facetedValue.view, facetedValue.leftValue, facetedValue.rightValue.rightValue));

    return facetedValue;
}

/**
 * Checks to see if there are one or more FacetedValues in the given array
 *
 * @param {Array} list
 * @returns {boolean}
 */
function facetedValueIsFoundIn(list){
    if (list === undefined)
        return false;
    for (var i = 0; i < list.length; i++)
        if (list[i] instanceof FacetedValue)
            return true;
    return false;
}

/**
 * @param {Array} list
 * @return {Number}
 */
function findFirstFacetedValueIn(list){
    for (var i = 0; i < list.length; i++)
        if (list[i] instanceof FacetedValue)
            return i;
    return NaN;
}

/**
 * @param {FacetedValue<Boolean>|Boolean} facetedBoolean
 * @param {Function} e_true
 * @param {Function} e_fals
 * @param {Object} thisArg
 * @param {Array} view
 */
function evaluateConditional_helper(facetedBoolean, e_true, e_fals, thisArg, view){
    if (facetedBoolean instanceof FacetedValue){
        return new FacetedValue(view,
            evaluateConditional_helper(facetedBoolean.leftValue, e_true, e_fals, thisArg, view),
            evaluateConditional_helper(facetedBoolean.rightValue, e_true, e_fals, thisArg, view)
        );
    }
    if (facetedBoolean)
        return e_true(view);
    else
        return e_fals(view);
}
/**
* @param {New Label}
*/
/*
FacetedValue.prototype.newLabel = function newLabel(label){

counter++;
return counter+""; // global counter or something 

}
*/
/*
function mkDeclassifiable(secret,public){
    let label = newLabel();
    let mkSecret = function(secret,public){
        return FacetedValue(label,secret,public);
    }
    let declassify = function(fv){
        return defacet(label,fv);
    }
    return (mkSecret,declassify);
}
*/
/*
function defacet(label, fv) {
    var result;
    /// evaluate fv based on the label given fv has label1, gave label as input if both are equal show left value else show right value
    if(label) {
        result = fv.left;
    }//label=== label1 left else right
    else {
        result = fv.right;
    }
    return result;
}
*/