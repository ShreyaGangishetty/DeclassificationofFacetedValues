var Sweet = require('../../lib/sweet.js');
var fs = require('fs');

/*
    The preface contains code that is used by the macros -- or rather, by the code into which macros expand -- but
    are kept in a separate file so that they are not themselves seen as macros and compiled by SweetJS.

    The macro usage file, on the other hand, does not strictly need to be in a separate file. I only do that for
    organizational purposes.
 */
var macroPreface = fs.readFileSync('../src/macroPreface.js', 'utf8');
var macroDefinitions = fs.readFileSync('../src/macroDefinitions.sweet', 'utf8');
var macroUsage = fs.readFileSync('../src/macroUsage.js', 'utf8');

var expanded = Sweet.compile(macroDefinitions + macroUsage);
var complete = macroPreface + "\n\n" + expanded.code;

fs.writeFileSync("../tmp/macroFile.js", complete, 'utf8');
