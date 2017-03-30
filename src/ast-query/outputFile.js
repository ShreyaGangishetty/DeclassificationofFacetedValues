var a = 'foo';
var b = new FacetedValue('admin', 42, 0);
var c = 7;
// described step-by-step in TOPLAS
function f(sec) {
    var x = true;
    var leak = true;
    if (sec)
        x = false;
    // this should become a faceted value
    if (x)
        leak = false;
    // leak should become faceted if x is faceted
    return leak;
}
// These should be indistinguishable to unprivileged observers
f(new FacetedValue(x, true, false));
f(new FacetedValue(x, false, false));