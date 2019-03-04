process.env.NODE_ENV = 'test';
var FacetedValuesJS = require('../src/FacetedValuesJS');
var FacetedLanguage = require('../src/FacetedLanguage')

// noinspection JSUnusedGlobalSymbols
exports.testLanguage = {

    /**
     * @param {NodeUnit} test
     */
    testVal: function testVal(test){
        test.expect(0);
        console.log("inside test value");
        var fl = new FacetedLanguage();
        console.log("value is ", fl.value('1'));
        //console.log(e1.eval()) //: 3
        //test.equal(e1, 1);
        console.log("inside test language");
        test.done();
    },    

    testAssign: function testAssign(test){
        test.expect(0);
        console.log("inside test assignment.......");
        var fl = new FacetedLanguage();
        var variable = 'a';
        var data = "value 1";
        var output=fl.assign(variable, data);
        console.log("output.......",output);
        variable= 'b';
        data=10;
        output=fl.assign(variable, data);
        console.log("output.......",output);
        variable='c';
        data= new Object(""); // we can assign onlu specific data types 
        output=fl.assign(variable, data);
        console.log("output.......",output);
        test.done();
    },
    testVar: function testVar(test){
        test.expect(0);
        console.log("inside test variable.......");
        //if variable not exists create a variable 
        var fl = new FacetedLanguage();
        var variable ='a';
        out= fl.variable(variable);
        console.log("out put from variable function", out);
        outAssign = fl.assign(variable, "assigned some value now");
        console.log("output from assign function. ", outAssign);
        outVar = fl.variable(variable);
        console.log("output of variable when the value exists......", outVar)
        // get an existing variable and give some value
        var fl = new FacetedLanguage();

        test.done();
    },            
};


