var Sweet = require('../lib/sweet.js');
var fs = require('fs');

var macroBiOps = fs.readFileSync('../src/macroBiOps.js', 'utf8');
var macroDefinitions = fs.readFileSync('../src/macroDefinitions.sweet', 'utf8');
var macroUsage = fs.readFileSync('../src/macroUsage.js', 'utf8');

var expanded = Sweet.compile(macroDefinitions + macroUsage);
var complete = macroBiOps + "\n\n" + expanded.code;

fs.writeFileSync("../tmp/macroFile.js", complete, 'utf8');
