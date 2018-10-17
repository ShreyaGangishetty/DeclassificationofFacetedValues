var x = '<a ? 4 : 9>';
x + 2; // evaluates to '<a ? 6 : 11>'
"George" + x; // evaluates to <a ? 'George4' : 'George9'>
Math.sqrt(x); // evaluates to <a ? 2 : 3>

var y = '<a ? Math.sqrt : Math.sign>';
y(9); // evaluates to <a ? 3 : 1>