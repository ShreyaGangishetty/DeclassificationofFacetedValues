var FacetedValuesJS = require('faceted-values-js');
var FacetedValue = FacetedValuesJS.FacetedValue;
var Cloak = FacetedValuesJS.Cloak;
var view = [];
var x = new FacetedValue('a', 4, 9);
x.binaryOps('+', 2, false);    // evaluates to '<a ? 4 : 11>'
