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
 * @param {Array<String>} currentView -- A list of string labels by which the two facets will be differentiated
 * @param {*} leftValue -- This is the value that corresponds to all the labels in currentView being met; nominally, the "true" or "private" value.
 * @param {*} [rightValue] -- Optional. This is the value that corresponds to any of the labels in currentView not being met; nominally, the "false" or "public" value. If a rightValue is not provided, then one will be generated based on the typeof leftValue
 * @param {String} [additionalLabel] -- Optional. This is a convenience argument for adding one-off labels to the list of currentView.
 * @constructor
 */
function FacetedValue(currentView, leftValue, rightValue, additionalLabel) {
    this.view = currentView.slice();
    this.leftValue = leftValue;
    this.rightValue = rightValue || produceGarbageSimilarTo(leftValue);
    if (typeof additionalLabel === 'string')
        this.view.push(additionalLabel);
    this.valuesAreThemselvesFaceted = this.leftValue instanceof FacetedValue && this.rightValue instanceof FacetedValue;
    if ((typeof this.leftValue !== typeof this.rightValue) || (this.leftValue instanceof FacetedValue ^ this.rightValue instanceof FacetedValue))
        throw new Error("Left and right values must be of the same type.");
}

/**
 * This function is used to perform basic operations of two operands, in the line of x+2, or x+y, where x and/or y
 * can be anything on which such operations would normally work, or where x and/or y are FacetedValues. In all cases
 * the original FacetedValue(s) remain unmutated, with the operation producing a new FacetedValue. Examples:
 *
 * @example
 * // x * 42, where x is a FacetedValue, to be multiplied by 42
 * x.binaryOps('*', 42);
 *
 * @example
 * // 'result = ' + x * 42, where x is a FacetedValue to be multiplied by 42 and then concatenated with a string:
 * x.binaryOps('*', 42).binaryOps('+', 'result = ', true);
 *
 * @example
 * // The above, with an arbitrary FacetedValue y instead of 42:
 * x.binaryOps('*', y).binaryOps('+', 'result = ', true);
 *
 * @param {string} operator -- One of the following operations to be performed with this FacetedValue as an operand:
 *       ['+','-','*','/','^','&','|','%','>','<','<=','>=','==','!=','&&','||','!==','===','>>','<<','in','instanceof']
 * @param {*} operand -- The other operand with which to perform the operation
 * @param {boolean} [operandIsOnLeft] -- True to execute the operation as `operand operator this`, falsey to execute
 *                                       as `this operator operand`. In some cases this makes a very large difference
 * @returns {FacetedValue} -- A new FacetedValue that is the product of the parameterized operation
 */
FacetedValue.prototype.binaryOps = function binaryOps(operator, operand, operandIsOnLeft) {
    var newLeft, newRight;

    if (this.valuesAreThemselvesFaceted) {
        newLeft = this.leftValue.binaryOps(operator, operand, operandIsOnLeft);
        newRight = this.rightValue.binaryOps(operator, operand, operandIsOnLeft);
        return new FacetedValue(this.view, newLeft, newRight);
    }

    if (operand instanceof FacetedValue) {
        if (operandIsOnLeft) {
            newLeft = this.binaryOps(operator, operand.leftValue, false);
            newRight = this.binaryOps(operator, operand.rightValue, false);
            return new FacetedValue(operand.view, newLeft, newRight);
        } else {
            newLeft = operand.binaryOps(operator, this.leftValue, true);
            newRight = operand.binaryOps(operator, this.rightValue, true);
            return new FacetedValue(this.view, newLeft, newRight);
        }
    }

    if (operandIsOnLeft)
        return biOpWithLeftsidePrimitive(operator, operand);
    return biOpWithRightsidePrimitive();
};

/**
 * This function is used to perform basic operations of one operand, such as ++x, !x, and so on where x is a
 * FacetedValue. In most cases the original FacetedValue remains unmutated. The exceptions are the increment "++" and
 * decrement "--" operators, which mutate the original FacetedValue so as to remain inline with the behavior of
 * increment and decrement on primitives. Examples:
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

    if (this.valuesAreThemselvesFaceted) {
        newLeft = this.leftValue.unaryOps(operator, operatorIsOnLeft);
        newRight = this.rightValue.unaryOps(operator, operatorIsOnLeft);
    }
    else if (operatorIsOnLeft){
        switch(operator){
            case '++' : ++this.leftValue; ++this.rightValue; return this;
            case '--' : --this.leftValue; --this.rightValue; return this;
            case '+'      : newLeft = +this.leftValue;       newRight =       +this.rightValue; break;
            case '-'      : newLeft = -this.leftValue;       newRight =       -this.rightValue; break;
            case '!'      : newLeft = !this.leftValue;       newRight =       !this.rightValue; break;
            case '~'      : newLeft = ~this.leftValue;       newRight =       ~this.rightValue; break;
            case 'typeof' : newLeft = typeof this.leftValue; newRight = typeof this.rightValue; break;
            case 'void'   : newLeft = void this.leftValue;   newRight =   void this.rightValue; break;
            default : throw new Error("Unrecognized binary left-side operator ``" + operator + "``.");
        }
    }
    else {
        switch(operator){
            case '++' : newLeft = this.leftValue++; newRight = this.rightValue++; break;
            case '--' : newLeft = this.leftValue--; newRight = this.rightValue--; break;
            default : throw new Error("Unrecognized binary right-side operator ``" + operator + "``.");
        }
    }
    return new FacetedValue(this.view, newLeft, newRight);
};

/**
 * TODO: Write description
 *
 * @param facetList
 * @returns {*|{}}
 */
FacetedValue.prototype.getFacetVisibleVersus = function getFacetVisibleVersus(facetList){
    var v = this.rightValue;
    if (leftSetContainsRightSet(facetList, this.view))
        v = this.leftValue;
    return (v instanceof FacetedValue) ? v.getFacetVisibleVersus(facetList) : v;
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
    if (this.valuesAreThemselvesFaceted !== value.valuesAreThemselvesFaceted)
        return false;
    if (this.valuesAreThemselvesFaceted || equalsMethodsAreFoundIn(this.leftValue, this.rightValue))
        return this.leftValue.equals(value.leftValue) && this.rightValue.equals(value.rightValue);
    return this.leftValue === this.rightValue;
};

/**
 * This method is intended to mirror {@see Function#apply}. It can be used when the facets within this FacetedValue are
 * function values, in order to invoke those functions. It is inadvisable for these functions to return values of
 * different types.
 *
 * There is another version of this function for minor convenience
 *
 * @example
 * var foo1 = function(x, y){ return x + y; };
 * var foo2 = function(x, y){ return x * y; };
 * var facetedFunction = new FacetedValue('bleagh', foo1, foo2);
 * var facetedResult = facetedFunction.apply(this, [3, 5]);
 * console.log('result: ' + facetedResult.toString());  // result: <bleagh ? 8 : 15>
 *
 * @param {object} [context] -- an object that will be reference by the "this" keyword
 * @param {Array<*>} [args] -- a list of arguments that will be passed to the functions
 * @returns {FacetedValue}
 */
FacetedValue.prototype.apply = function apply(context, args){
    if (this.valuesAreThemselvesFaceted || typeof this.leftValue === "function")
        return new FacetedValue(this.view, this.leftValue.apply(context, args), this.rightValue.apply(context, args));
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
 * @param [context]
 * @param [args]
 * @returns {FacetedValue}
 */
FacetedValue.prototype.apply_helper = function apply_helper(context, moreArgs){
    return this.apply(context, arguments.slice(1));
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
 * @param {string} operation
 * @param {*} operand
 * @returns {FacetedValue}
 */
function biOpWithLeftsidePrimitive(operation, operand){
    var newLeft, newRight;
    switch(operation) {
        case '+'          : newLeft = operand +          this.leftValue; newRight = operand +          this.rightValue; break;
        case '-'          : newLeft = operand -          this.leftValue; newRight = operand -          this.rightValue; break;
        case '*'          : newLeft = operand *          this.leftValue; newRight = operand *          this.rightValue; break;
        case '/'          : newLeft = operand /          this.leftValue; newRight = operand /          this.rightValue; break;
        case '^'          : newLeft = operand ^          this.leftValue; newRight = operand ^          this.rightValue; break;
        case '&'          : newLeft = operand &          this.leftValue; newRight = operand &          this.rightValue; break;
        case '|'          : newLeft = operand |          this.leftValue; newRight = operand |          this.rightValue; break;
        case '%'          : newLeft = operand %          this.leftValue; newRight = operand %          this.rightValue; break;
        case '>'          : newLeft = operand >          this.leftValue; newRight = operand >          this.rightValue; break;
        case '<'          : newLeft = operand <          this.leftValue; newRight = operand <          this.rightValue; break;
        case '<='         : newLeft = operand <=         this.leftValue; newRight = operand <=         this.rightValue; break;
        case '>='         : newLeft = operand >=         this.leftValue; newRight = operand >=         this.rightValue; break;
        case '=='         : newLeft = operand ==         this.leftValue; newRight = operand ==         this.rightValue; break;
        case '!='         : newLeft = operand !=         this.leftValue; newRight = operand !=         this.rightValue; break;
        case '&&'         : newLeft = operand &&         this.leftValue; newRight = operand &&         this.rightValue; break;
        case '||'         : newLeft = operand ||         this.leftValue; newRight = operand ||         this.rightValue; break;
        case '!=='        : newLeft = operand !==        this.leftValue; newRight = operand !==        this.rightValue; break;
        case '==='        : newLeft = operand ===        this.leftValue; newRight = operand ===        this.rightValue; break;
        case '>>'         : newLeft = operand >>         this.leftValue; newRight = operand >>         this.rightValue; break;
        case '<<'         : newLeft = operand <<         this.leftValue; newRight = operand <<         this.rightValue; break;
        case 'in'         : newLeft = operand in         this.leftValue; newRight = operand in         this.rightValue; break;
        case 'instanceof' : newLeft = operand instanceof this.leftValue; newRight = operand instanceof this.rightValue; break;
    }
    return new FacetedValue(this.view, newLeft, newRight);
}

/**
 * Helper function for binaryOps method; separates a massive switch statement for readability
 *
 * @param {string} operation
 * @param {*} operand
 * @returns {FacetedValue}
 */
function biOpWithRightsidePrimitive(operation, operand){
    var newLeft, newRight;
    switch(operation) {
        case '+'          : newLeft = this.leftValue +          operand; newRight = this.rightValue +          operand; break;
        case '-'          : newLeft = this.leftValue +          operand; newRight = this.rightValue +          operand; break;
        case '*'          : newLeft = this.leftValue +          operand; newRight = this.rightValue +          operand; break;
        case '/'          : newLeft = this.leftValue +          operand; newRight = this.rightValue +          operand; break;
        case '^'          : newLeft = this.leftValue +          operand; newRight = this.rightValue +          operand; break;
        case '&'          : newLeft = this.leftValue &          operand; newRight = this.rightValue &          operand; break;
        case '|'          : newLeft = this.leftValue |          operand; newRight = this.rightValue |          operand; break;
        case '%'          : newLeft = this.leftValue %          operand; newRight = this.rightValue %          operand; break;
        case '>'          : newLeft = this.leftValue >          operand; newRight = this.rightValue >          operand; break;
        case '<'          : newLeft = this.leftValue <          operand; newRight = this.rightValue <          operand; break;
        case '<='         : newLeft = this.leftValue <=         operand; newRight = this.rightValue <=         operand; break;
        case '>='         : newLeft = this.leftValue >=         operand; newRight = this.rightValue >=         operand; break;
        case '=='         : newLeft = this.leftValue ==         operand; newRight = this.rightValue ==         operand; break;
        case '!='         : newLeft = this.leftValue !=         operand; newRight = this.rightValue !=         operand; break;
        case '&&'         : newLeft = this.leftValue &&         operand; newRight = this.rightValue &&         operand; break;
        case '||'         : newLeft = this.leftValue ||         operand; newRight = this.rightValue ||         operand; break;
        case '!=='        : newLeft = this.leftValue !==        operand; newRight = this.rightValue !==        operand; break;
        case '==='        : newLeft = this.leftValue ===        operand; newRight = this.rightValue ===        operand; break;
        case '>>'         : newLeft = this.leftValue >>         operand; newRight = this.rightValue >>         operand; break;
        case '<<'         : newLeft = this.leftValue <<         operand; newRight = this.rightValue <<         operand; break;
        case 'in'         : newLeft = this.leftValue in         operand; newRight = this.rightValue in         operand; break;
        case 'instanceof' : newLeft = this.leftValue instanceof operand; newRight = this.rightValue instanceof operand; break;
    }
    return new FacetedValue(this.view, newLeft, newRight);
}

/**
 * Determines if all of the values listed in rightSet are found somewhere in leftSet.
 *
 * @param {Array<*>} leftSet
 * @param {Array<*>} rightSet
 * @returns {boolean}
 */
function leftSetContainsRightSet(leftSet, rightSet){
    return leftSet.filter(function(val) { return rightSet.indexOf(val) != -1;}).length === rightSet.length;
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

/**
 * Checks to see if the two values are both objects that have an equals method
 *
 * @param {*} val1
 * @param {*} val2
 * @returns {boolean}
 */
function equalsMethodsAreFoundIn(val1, val2){
    return val1.equals && typeof val1.equals == 'function'
        && val2.equals && typeof val2.equals == 'function';
}