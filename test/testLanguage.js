process.env.NODE_ENV = 'test';
var FacetedValuesJS = require('../src/FacetedValuesJS');
var FacetedLanguage = require('../src/FacetedLanguage')
var FacetedValue = require('../src/FacetedValue.js');
var Declassify = require('../src/Declassify.js')
// noinspection JSUnusedGlobalSymbols
exports.testLanguage = {

    /**
     * @param {NodeUnit} test
     *//*
   testVal: function testVal(test){
        test.expect(1);
        //console.log("inside test value");
        var fl = new FacetedLanguage();
        var val= fl.value(10);
        //console.log(e1.eval()) //: 3
        test.equal(val, 10);
        //console.log("inside test language");
        test.done();
    },  */  
/*
    testAssign: function testAssign(test){
        test.expect(2);
        console.log("inside test assignment.......");
        var fl = new FacetedLanguage();
        var variable = 'a';
        var data = "value1";
        var output=fl.assign(variable, data);
        //console.log("output.......",output);
        test.equal(output, 'value1');
        variable= 'b';
        data=10;
        output=fl.assign(variable, data);
        //console.log("output.......",output);
        test.equal(output, 10);*/
        /*variable='c';
        data= new Object(""); // we can assign onlu specific data types 
        output=fl.assign(variable, data);
        console.log("output.......",output);*/
       /* test.done();
    },*//*
     testVar: function testVar(test){
        test.expect(2);
        //console.log("inside test variable.......");
        var fl = new FacetedLanguage();
        var variable ='a';
        outAssign = fl.assign(variable, "'assigned some value now'");
        test.equal(outAssign,"'assigned some value now'");
        outVar = fl.variable(variable);
        //console.log("output of variable when the value exists......", outVar)
        test.equal(outVar,"'assigned some value now'");
        test.done();
    },*/
  /*  testVar: function testVar(test){
        test.expect(1);
        //console.log("inside test variable.......");
        //if variable not exists create a variable 
        var fl = new FacetedLanguage();
        var variable ='a';
        //out= fl.variable(variable);
        //console.log("out put from variable function", out);
        outAssign = fl.assign(variable, "assigned some value now");
        //console.log("output from assign function. ", outAssign);
        outVar = fl.variable(variable);
        //console.log("output of variable when the value exists......", outVar)
        test.equal(outVar,"assigned some value now");
        // get an existing variable and give some value
        var fl = new FacetedLanguage();

        test.done();
    },*/
    testconditionalexps: function testconditionalexps(test){
        test.expect(1);
        console.log("inside test conditional expressions......");
        
        var fl1 = new FacetedLanguage();
        exp1 = true;
        exp2=false;
        exp3 = true;
        var condResult = fl1.conditionalexps(exp1,exp2,exp3);
        console.log("basic output...... expected false....."+condResult);
        test.equal(condResult,false);
        /// this is not working ... need to fix this
        var fl = new FacetedLanguage();
        var vari = 'variable1';
        var data = true;
        fl.assign(vari, true);//new Object()
       //exp1 = "variable1===true";//cannot access label as dict_vars['label'] is present not 'label'
        exp1 = fl.binaryops("variable1",true,"===");
        exp2 = true;
        exp3 = false;
        var condRes = fl.conditionalexps(exp1, exp2, exp3);
        console.log("expected result is true.... output:"+condRes)
        test.done()
    },
    /*
    testbinaryops: function testbinaryops(test){
        test.expect(1);
        var fl = new FacetedLanguage();
        exp1 = 10;
        exp2 = 20;
        op = '+';
        /// this need to evaluate faceted values to a value and then check if the value is a number... if yes then proceed further else throw exception
        var result = fl.binaryops(exp1, exp2, op);
        console.log("result....... "+ result);
        test.equal(result, 30);
        test.done();
    },*/
    /*
    testconditionalexpsASTQ: function testconditionalexpsASTQ(test){
        test.expect(1);
        console.log("inside test conditional expressions");
        var fl = new FacetedLanguage();
        exp11=true;
        var label =fl.createlabelFV();
        console.log("label......"+label)
        exp22= new FacetedValue(label, true, false);// fl.value(true);
        console.log(exp22+".....exp22");
        exp33="+";    
        exp1 = fl.conditionalexps(exp11,exp22,exp33);// fl.value("true");//"label==true";//cannot access label as dict_vars['label'] is present not 'label'
        exp2 = true;
        exp3 = false;
        var condRes = fl.conditionalexps(exp1, exp2, exp3);
        //console.log("expected result is true.... output:"+condRes)
        test.equal(condRes,true);
        test.done();
    },*/
  /*  
    testcreatelabelFV: function testcreatelabelFV(test){
        test.expect(0);
        var fl = new FacetedLanguage();
        var label =  fl.createlabelFV();
        console.log("label....."+label)
        test.done();
    },*/
    
  /*  testclassifyasFV: function testclassifyasFV(test){
        test.expect(0);
        var fl = new FacetedLanguage();
        var label =  fl.createlabelFV();
        var fv = fl.classifyasFV(label,"private","public")
        console.log("fv...."+fv)
        //test.equal(fv, new FacetedValue(label,"private","public"))
        test.done();
    },   */         

};


