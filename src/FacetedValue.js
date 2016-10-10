exports.bin = FacetedValue;
//noinspection JSUnresolvedVariable,JSUnusedGlobalSymbols
Symbol = Symbol || function noop(){};

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
 * @param {String|Array<String>} currentView -- A list of string labels by which the two facets will be differentiated
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
    this.view = (currentView.slice) ? currentView.slice(0) : currentView;
    this.leftValue = leftValue;
    this.rightValue = rightValue || produceGarbageSimilarTo(leftValue);
    if (typeof additionalLabel === 'string')
        this.view.push(additionalLabel);
}

/**
 * This function is used to perform basic operations of two operands, in the line of x+2, or x+y, where x and/or y
 * can be anything on which such operations would normally work, or where x and/or y are FacetedValues. In all cases
 * the original FacetedValue(s) remain unmutated, with the operation producing a new FacetedValue.
 *
 * For convenience there is also a ':' operator not found by default in Javascript, which concatenates two
 * faceted arrays. There is an example below.
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
    var that = this;

    function calculateBranch(lrValue, operandLrValue) {
        if (lrValue instanceof FacetedValue) {
            if (operand instanceof FacetedValue) {
                if (setsAreTheSame(that.view, operand.view))
                    return lrValue.binaryOps(operator, operandLrValue, operandIsOnLeft);
                return lrValue.binaryOps(operator, operand, operandIsOnLeft);
            }
            return lrValue.binaryOps(operator, operand, operandIsOnLeft);
        }
        if (operand instanceof FacetedValue) {
            if (setsAreTheSame(that.view, operand.view))
                return binaryOpOfPrimitives(lrValue, operator, operandLrValue, operandIsOnLeft);
            return operand.binaryOps(operator, lrValue, !operandIsOnLeft); // note the careful inversion of operandIsOnLeft
        }
        return binaryOpOfPrimitives(lrValue, operator, operand, operandIsOnLeft);
    }

    var newLeft = calculateBranch(this.leftValue, operand.leftValue);
    var newRight = calculateBranch(this.rightValue, operand.rightValue);
    return new FacetedValue(this.view, newLeft, newRight);
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
        if (!operatorIsOnLeft)
            throw new Error("Unrecognized right-side unary operator ``" + operator +
                "``. You may need to set operatorIsOnLeft to true in the arguments.");
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
    if (operator == '++'){
        if (this.leftValue instanceof FacetedValue)
            newLeft = this.leftValue.unaryOps(operator, operatorIsOnLeft);
        else
            newLeft = (operatorIsOnLeft) ? ++this.leftValue : this.leftValue++;
        if (this.rightValue instanceof FacetedValue)
            newRight = this.rightValue.unaryOps(operator, operatorIsOnLeft);
        else
            newRight = (operatorIsOnLeft) ? ++this.rightValue : this.rightValue++;
    } else if (operator == '--'){
        if (this.leftValue instanceof FacetedValue)
            newLeft = this.leftValue.unaryOps(operator, operatorIsOnLeft);
        else
            newLeft = (operatorIsOnLeft) ? --this.leftValue : this.leftValue--;
        if (this.rightValue instanceof FacetedValue)
            newRight = this.rightValue.unaryOps(operator, operatorIsOnLeft);
        else
            newRight = (operatorIsOnLeft) ? --this.rightValue : this.rightValue--;
    } else {
        newLeft  = calculateLRBranch(this.leftValue);
        newRight = calculateLRBranch(this.rightValue);
    }
    return new FacetedValue(this.view, newLeft, newRight);
};

/**
 * TODO: Write description
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
    if (this.leftValue.equals && typeof this.leftValue.equals == 'function' && !this.leftValue.equals(value))
        return false;
    if (this.rightValue.equals && typeof this.rightValue.equals == 'function' && !this.rightValue.equals(value))
        return false;
    return this.leftValue === value.leftValue && this.rightValue === value.rightValue;
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
 * @param {object|FacetedValue} [thisArg] -- an object that will be reference by the `this` keyword
 * @param {Array<*>} [argArray] -- a list of arguments that will be passed to the functions
 * @returns {FacetedValue}
 * @throws {Error} -- If the FacetedValue does not contain functions
 */
FacetedValue.prototype.apply = function apply(thisArg, argArray){
    if (thisArg instanceof FacetedValue) {
        return new FacetedValue(thisArg.view,
            this.apply(this.leftValue, argArray),
            this.apply(this.rightValue, argArray)
        );
    }

    if ((typeof this.leftValue === "function" && typeof this.rightValue === 'function')
        || (this.leftValue instanceof FacetedValue && this.rightValue instanceof FacetedValue)) {
        return new FacetedValue(this.view,
            FacetedValue.invokeFunction(this.leftValue, thisArg, argArray),
            FacetedValue.invokeFunction(this.rightValue, thisArg, argArray)
        );
    }
    throw new Error("This FacetedValue is not one of functions.");
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
 * @param {Object|FacetedValue} thisArg
 * @returns {FacetedValue}
 */
FacetedValue.prototype.apply_helper = function apply_helper(thisArg){
    return this.apply(thisArg, Array.prototype.slice.call(arguments, 1));
};

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
 * @param {function} lambda
 * @param {object|FacetedValue} thisArg
 * @param {Array<*>} argArray
 * @returns {FacetedValue}
 */
FacetedValue.invokeFunction = function invokeFunction(lambda, thisArg, argArray){
    var leadingNonFacetedArgs = [];
    var haveNotYetEncounteredFacetedValue = true;
    var facetedArguments;
    for (var i = 0; i < argArray.length; i++){
        var currentArg = argArray[i];
        if (haveNotYetEncounteredFacetedValue){
            if (currentArg instanceof FacetedValue) {
                haveNotYetEncounteredFacetedValue = false;
                facetedArguments = currentArg.toFacetedArray().binaryOps(':', leadingNonFacetedArgs, true);
            }
            else
                leadingNonFacetedArgs.push(currentArg);
        }
        else {
            //noinspection JSUnusedAssignment
            facetedArguments = facetedArguments.binaryOps(':',
                (currentArg instanceof FacetedValue) ? currentArg.toFacetedArray() : [currentArg]
            );
        }
    }
    if (haveNotYetEncounteredFacetedValue)
        return lambda.apply(thisArg, argArray);
    else {
        return new FacetedValue(facetedArguments.view,
            invokeFunction(lambda, thisArg, facetedArguments.leftValue),
            invokeFunction(lambda, thisArg, facetedArguments.rightValue));
    }
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
 * @returns {FacetedValue}
 */
FacetedValue.prototype.toFacetedArray = function toFacetedArray(){
    var newLeft = (this.leftValue instanceof FacetedValue) ? this.leftValue.toFacetedArray() : [this.leftValue];
    var newRight = (this.rightValue instanceof FacetedValue) ? this.rightValue.toFacetedArray() : [this.rightValue];
    return new FacetedValue(this.view, newLeft, newRight);
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
 * Helper function for binaryOps method; separates a massive switch statement for readability
 *
 * @param {*} lrValue
 * @param {string} operator
 * @param {*} operand
 * @param {boolean} operandIsOnLeft
 * @returns {*}
 */
function binaryOpOfPrimitives(lrValue, operator, operand, operandIsOnLeft){
    if (lrValue instanceof FacetedValue || operand instanceof FacetedValue)
        throw new Error("FacetedValue not unpacking correctly");

    switch(operator) {
        case '+'          : return (operandIsOnLeft) ? operand +          lrValue : lrValue +          operand;
        case '-'          : return (operandIsOnLeft) ? operand -          lrValue : lrValue -          operand;
        case '*'          : return (operandIsOnLeft) ? operand *          lrValue : lrValue *          operand;
        case '/'          : return (operandIsOnLeft) ? operand /          lrValue : lrValue /          operand;
        case '^'          : return (operandIsOnLeft) ? operand ^          lrValue : lrValue ^          operand;
        case '&'          : return (operandIsOnLeft) ? operand &          lrValue : lrValue &          operand;
        case '|'          : return (operandIsOnLeft) ? operand |          lrValue : lrValue |          operand;
        case '%'          : return (operandIsOnLeft) ? operand %          lrValue : lrValue %          operand;
        case '>'          : return (operandIsOnLeft) ? operand >          lrValue : lrValue >          operand;
        case '<'          : return (operandIsOnLeft) ? operand <          lrValue : lrValue <          operand;
        case '<='         : return (operandIsOnLeft) ? operand <=         lrValue : lrValue <=         operand;
        case '>='         : return (operandIsOnLeft) ? operand >=         lrValue : lrValue >=         operand;
        case '=='         : return (operandIsOnLeft) ? operand ==         lrValue : lrValue ==         operand;
        case '!='         : return (operandIsOnLeft) ? operand !=         lrValue : lrValue !=         operand;
        case '&&'         : return (operandIsOnLeft) ? operand &&         lrValue : lrValue &&         operand;
        case '||'         : return (operandIsOnLeft) ? operand ||         lrValue : lrValue ||         operand;
        case '!=='        : return (operandIsOnLeft) ? operand !==        lrValue : lrValue !==        operand;
        case '==='        : return (operandIsOnLeft) ? operand ===        lrValue : lrValue ===        operand;
        case '>>'         : return (operandIsOnLeft) ? operand >>         lrValue : lrValue >>         operand;
        case '<<'         : return (operandIsOnLeft) ? operand <<         lrValue : lrValue <<         operand;
        case 'in'         : return (operandIsOnLeft) ? operand in         lrValue : lrValue in         operand;
        case 'instanceof' : return (operandIsOnLeft) ? operand instanceof lrValue : lrValue instanceof operand;
    }
    if (operator === ':'){
        lrValue = (lrValue instanceof Array) ? lrValue : [lrValue];
        operand = (operand instanceof Array) ? operand : [operand];
        return (operandIsOnLeft) ? operand.concat(lrValue) : lrValue.concat(operand);
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
        return leftSet.filter(function(val) { return rightSet.indexOf(val) != -1;}).length === rightSet.length;
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
    return leftSetContainsRightSet(view, view2) && view.length == view2.length;
}

/**
 * Attempts to create a simpler FacetedValue equivalent to the one given.
 *
 * @param {FacetedValue} facetedValue
 * @returns {FacetedValue}
 */
function simplify(facetedValue){

    // <X ? a : a> ==> a
    if (facetedValue.leftValue === facetedValue.rightValue)
        return facetedValue.leftValue;

    if (facetedValue.valuesAreThemselvesFaceted){

        // <X ? <Y ? a : b> : <Y ? a : b>> ===> <Y ? a : b>
        if(facetedValue.leftValue.equals(facetedValue.rightValue))
            return simplify(facetedValue.leftValue);

        if(facetedValue.leftValue.view.toString() == facetedValue.rightValue.view.toString()) {

            // <X ? <X ? a : b> : <X ? c : d>> ===> <X ? a : d>
            if(facetedValue.leftValue.view.toString() == facetedValue.view.toString())
                return simplify(new FacetedValue(facetedValue.leftValue.view, facetedValue.leftValue.leftValue, facetedValue.rightValue.rightValue));
        }
    }
    return facetedValue;
}