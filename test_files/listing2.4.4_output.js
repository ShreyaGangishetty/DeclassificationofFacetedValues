var FacetedValuesJS = require('faceted-values-js');
var FacetedValue = FacetedValuesJS.FacetedValue;
var x = new FacetedValue('a', 4, 9);
x.binaryOps('+', 2, false); // evaluates to '<a ? 6 : 11>'
x.binaryOps('+', "George", true); // evaluates to <a ? 'George4' : 'George9'>
FacetedValue.invoke(Math.sqrt, this, [x]); // evaluates to <a ? 2 : 3>

var y = new FacetedValue('a', Math.sqrt, Math.sign);
y.apply(this, [9]); // evaluates to <a ? 3 : 1>