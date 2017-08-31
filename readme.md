# FacetedValuesJS

* auto-gen TOC:
{:toc}

This is a NodeJS module that rewrites JavaScript programs intended
for cybersecurity purposes. The motivation for its use is to 
mitigate the damage done by, for example, cross-site scripting 
attacks through the use of "faceted values."

## Getting Started

Although our example commands demonstrate the process in Ubuntu, any
operating system (Linux, Windows, OS X) will work.

### Installation

Make sure [NodeJS](https://nodejs.org/) 
and [NPM](https://github.com/npm/npm) are installed:

    $ nodejs -v
    v4.2.6
     
    $ npm -v
    3.5.2

Our module currently depends on the NPM module
[AST-Query](https://github.com/SBoudrias/AST-query):

    $ npm install ast-query
     
    $ npm ls ast-query
    ast-query@2.0.0
    
Although not strictly necessary for an end-user, the NPM module
[nodeunit](https://github.com/caolan/nodeunit)
is recommended so as to run our unit tests:

    $ npm install nodeunit
     
    $ npm ls nodeunit
    nodeunit@0.11.1
    
[FacetedValuesJS](https://github.com/akalenda/FacetedValuesJS.git) 
is not yet an NPM module. Pull it from the repository to the
directory of your choice, i.e.:

    $ mkdir ~/workspace
    $ cd $!
    $ git clone https://github.com/akalenda/FacetedValuesJS.git
    
### Using the library

The unit tests, in putting the library through its paces, include
many examples of how it may be used. Here we demonstrate creating
a new program from scratch and having FacetedValuesJS process it,
using the most basic unit test as an example:

    $ nodejs
    > var fvjs = require('~/workspace/FacetedValuesJS/src/FacetedValuesJS.js');
    > var inputProgram = 'var x = "<A ? 1 : 2>";
    > var expectedOutputProgram = "var x = new FacetedValue('A', 1, 2);"
    > var actualOutputProgram = fvjs.fromString(inputProgram).process().toString();
    > console.log(actualOutputProgram)
    var x = new FacetedValue('A', 1, 2);
    undefined
    > actualOutputProgram == expectedOutputProgram
    true
    > .exit
    
Typically however the input program would instead be read from and 
written to files:

    $ nodejs
    > var fvjs = require('~/workspace/FacetedValuesJS/src/FacetedValuesJS.js');
    > fvjs.fromFile('~/workspace/FacetedValuesJS/test/t0_basic_input.js').toFile('~/workspace/t0_basic_output.js');
    > .exit
    $ cat ~/workspace/t0_basic_output.js
    var x = new FacetedValue('A', 1, 2);
    
## API Overview


