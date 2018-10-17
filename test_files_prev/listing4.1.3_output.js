var FacetedValuesJS = require('faceted-values-js');
var FacetedValue = FacetedValuesJS.FacetedValue;
var Cloak = FacetedValuesJS.Cloak;
var view = [];
function f(sec){
    var x = new FacetedValue(true);
    var leak = new FacetedValue(true);
    x = x.on(sec).assign(false);
    leak = leak.on(x).assign(false);
    return leak;
}

view.push('v');
f(Cloak(view, true));
f(Cloak(view, false));
view.pop();

