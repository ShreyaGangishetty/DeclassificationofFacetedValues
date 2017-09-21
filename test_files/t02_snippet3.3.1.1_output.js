var FacetedValuesJS = require('faceted-values-js');
var FacetedValue = FacetedValuesJS.FacetedValue;
var x = new FacetedValue('a', 4, 9);
x.binaryOps('+', 2); // evaluates to '<a ? 4 : 11>'