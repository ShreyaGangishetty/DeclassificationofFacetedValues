var FacetedValuesJS = require('faceted-values-js');
var FacetedValue = FacetedValuesJS.FacetedValue;
var Cloak = FacetedValuesJS.Cloak;
var view = [];
var b = new FacetedValue('admin', 42, 0);
var c = b.binaryOps('+', 3, false);