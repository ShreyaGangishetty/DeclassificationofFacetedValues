// described step-by-step in TOPLAS
function f(sec){
    var x = true;
    var leak = true;
    if (sec)
        x = false;
    if (x)
        leak = false;
    return leak;
}

// These should indistinguishable to unprivileged observers,
// e.g. the faceted values returned by these two function calls
// should have the same public (right-side) data
f('<v ? true: false>');
f('<v ? false: false>');