var FacetedValuesJS = require('faceted-values-js');
var FacetedValue = FacetedValuesJS.FacetedValue;
var Cloak = FacetedValuesJS.Cloak;
var view = [];
// described step-by-step in TOPLAS
function f(sec){
    var x = true;
    var leak = true;
    FacetedValue.evaluateConditional(sec, function consequentCallback(consequentView){
        x = new FacetedValue(consequentView, false, x);
    }, function alternateCallback(alternateView){
        leak = new FacetedValue(alternateView, false, leak);
    });
    return leak;
}

// These should indistinguishable to unprivileged observers,
// e.g. the faceted values returned by these two function calls
// should have the same public (right-side) data
f(new FacetedValue('v', true, false));
f(new FacetedValue('v', false, false));