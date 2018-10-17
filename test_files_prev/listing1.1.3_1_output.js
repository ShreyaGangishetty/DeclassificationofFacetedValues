var FacetedValuesJS = require('faceted-values-js');
var FacetedValue = FacetedValuesJS.FacetedValue;
var Cloak = FacetedValuesJS.Cloak;
var view = [];
view.push('k');
{
    var pw = Cloak(view, getPasswordFromUser());
    var hashedPw = Cloak.invokeFunction(ThirdPartyLibrary.calculateHashFor, this, [pw]);
    Cloak.invokeFunction(doStuffWith, this, [hashedPw]);
}
view.pop();