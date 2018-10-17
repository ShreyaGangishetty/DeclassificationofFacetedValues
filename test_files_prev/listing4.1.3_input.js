function f(sec){
    var x = true;
    var leak = true;
    if (sec)
        x = false;
    if (x)
        leak = false;
    return leak;
}

cloak v {
    f(true);
    f(false);
}