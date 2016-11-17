var cloak = require('../src/cloak').bin;
var FacetedValue = require('../src/FacetedValue.js').bin;

var v = ["A"];
var p = cloak(new FacetedValue("A", 3, 4), v);
var x = p + 10;
console.log(x);
v.pop();
console.log(x);

