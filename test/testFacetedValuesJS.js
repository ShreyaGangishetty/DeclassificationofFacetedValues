process.env.NODE_ENV = 'test';
var FacetedValuesJS = require('../src/FacetedValuesJS');
var fs = require('fs');

exports.testFacetedValuesJS = {};

/*
 * This program searches the test_files
 * directory for files that end with _input.js and
 * trims them to acquire test names. These are
 * then used to create nodeunit tests.
 *
 * E.g. to create a new test called FOO, add FOO_input.js
 * as a new file, and then FOO_output.js. This will result in a new
 * nodeunit test that processes the input file using FacetedValuesJS
 * and compares it to the output file.
 */

/**
 * @type {Array.<String>}
 */
var testBattery = fs.readdirSync("../test_files/")
    .map(function forInputFiles(filename){
        return filename.substring(0, filename.indexOf("_input.js"));
    }).filter(function removeEmpties(str){
        return str.length;
    });

testBattery.forEach(function testBattery(testName){
    /**
     * @param {NodeUnit} test
     */
    exports.testFacetedValuesJS[testName] = function(test){
        test.expect(testBattery.length * 2);
        var prefix = '../test_files/' + testName;
        var expectedOutput = fs.readFileSync(prefix + '_output.js').toString();
	console.log("expectedoutput  "+expectedOutput);
        console.log("actual output about  to print.........................");
	var actualOutput = FacetedValuesJS.fromFile(prefix + '_input.js').toString();
        console.log("actualoutput from File"+actualOutput);
	var fileAsString = fs.readFileSync(prefix + '_input.js');
        test.equal(actualOutput, expectedOutput);
        actualOutput = FacetedValuesJS.fromString(fileAsString).toString();
        console.log("actuallOutput fromString"+actualOutput);
	test.equal(actualOutput, expectedOutput);
        test.done();
    };
});

/**
 * @param {NodeUnit} test
 */
exports.testFacetedValuesJS.testImport_Cloak = function testImport_Cloak(test){
    test.expect(2);
    var Cloak = FacetedValuesJS.Cloak;
    //console.log(Cloak+"0000000000000");
    var view = ['a'];
    var x = Cloak(view, 11);
    test.equal(x, 11);
    view.pop();
    test.notEqual(x, 11);
    test.done();
};

/**
 * @param {NodeUnit} test
 */
exports.testFacetedValuesJS.testImport_FacetedValue = function testImport_FacetedValue(test){
    //console.log("printing test........."+test);
    test.expect(1);
    var FacetedValue = FacetedValuesJS.FacetedValue;
   // console.log(FacetedValue+"0000000000000");
    var expected = '<A ? <B ? 1 : 3> : <B ? 5 : 7>>';
    var actual = new FacetedValue("A",
        new FacetedValue("B", 1, 3),
        new FacetedValue("B", 5, 7)
    ).toString();
    test.equal(actual, expected);
    test.done();
};

/**
 * @param {NodeUnit} test
 */
exports.testFacetedValuesJS.testImport_Declassify = function testImport_Declassify(test){
    //console.log("printing test........."+test);
    test.expect(4);
    var FacetedValue = FacetedValuesJS.FacetedValue;
    var Declassify = FacetedValuesJS.Declassify;
    var declassify = new Declassify();
    console.log(declassify)
    var x = declassify.createLabel();
    console.log("printing the curretn label value :  "+x+"   :");
    var y = declassify.createLabel();
    console.log("printing the curretn label value :  "+y+"   :");
    //test.equal(x, 1);
    //test.equal(y, 2);
    var label=1;
    var fvalue=new FacetedValue(label,"secret","public");
    var defactedValue = declassify.defacet(label,fvalue);
    test.equal(defactedValue,"secret");
    var label=new  declassify.createLabel();
    var fvalue=new FacetedValue(label,"private","public");
    var defactedValue = declassify.defacet(label,fvalue);
    console.log("defacet value should be equal to private   "+defactedValue)
    test.equal(defactedValue,"private");
    var label1=new  declassify.createLabel();

    var fvalue=new FacetedValue(label,"private","public");
    var defactedValue = declassify.defacet(label1,fvalue);
    console.log("defacet value should be equal to public   "+defactedValue)
  
    test.equal(defactedValue,"public");
    secret ="secret";
    private ="private";
    public ="public";
    var result= declassify.mkDeclassifiable(secret,public);
    var mkSecret = result[0];
    var declassification = result[1];   
    console.log("------------mkSecret--------================"+mkSecret(secret,public)); 
    console.log("-----------------declassification---================"+declassification(mkSecret));
    console.log("test for tini");
    fv_tini = declassify.tiniMkSecret(private,public);
    console.log("output is :"+fv_tini.toString())
    incorrectway= declassify.defacet(fv_tini.view,fv_tini); // so better to make defacet a function that cannot be called directly 
    console.log("as defacet is accesible through defacet"+incorrectway);
    console.log("test for declassify no restrictions");
    var result1= declassify.declassifyNorestrictions(private, public);
    console.log("faceted value:  "+ result1[0]);
    console.log("value when labe is correct:  "+result1[1](result1[0]));
    console.log("test for time based declassify");
    var timbased_results = declassify.timebasedMkSecret(private, public);
    console.log("results  "+timbased_results())
    test.equal(timbased_results(),"private");
    test.done();
};
