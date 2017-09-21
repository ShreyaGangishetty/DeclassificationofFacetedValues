var FacetedValuesJS = require('faceted-values-js');
var FacetedValue = FacetedValuesJS.FacetedValue;
var Cloak = FacetedValuesJS.Cloak;
var view = [];
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

view.push('v');
f(Cloak(view, true));
f(Cloak(view, false));
view.pop();