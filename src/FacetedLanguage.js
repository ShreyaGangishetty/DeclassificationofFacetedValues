var astq = require("ast-query");
if (typeof module !== 'undefined')
    module.exports = FacetedLanguage;
var FacetedValue = require('./FacetedValue.js');
//var FacetedValuesJS = require('./FacetedValuesJS.js');
var FacetedValuesJS = require('../src/FacetedValuesJS');
var Declassify = require('../src/Declassify.js')
var esprima = require("esprima");



function FacetedLanguage() {
  dictionary_vars=[];
}

// example: var e1 = num.new(3); e1.eval() //: 3


/* supports Integer, Boolean, String, faceted value only for now [need to add Raw]*/
// need to customize and return proper error messages ... for now printing only error messages
/*
-- for values
evaluate (Val v) s = do
  return (v,s)
  */
FacetedLanguage.prototype.value = function(value){
    if(typeof value === "number")
    {
    return value;
    }
    else if(typeof value === "boolean"){
     
        return value;
    }
    else if(typeof value === "string"){
     
        return value;
    }
    else if(value instanceof FacetedValue){
     
      return value;
    }
    else {
      errorMsg = "unsupported data type : Only number, boolean, string and Faceted values are allowed";
        console.log(errorMsg); // throw error
        throw(errorMsg);
        return "undefined";
    }
}

/*
--assignment
evaluate (Assign x e) s = do
   (expVal, s1) <- evaluate e s
   return (expVal,Map.insert x expVal s1)
*/
FacetedLanguage.prototype.assign = function(vari, data, pc){


    vari =vari.trim();
    data = evaluate(data);
    //key words in JS are not variable names abstract    else    instanceof    super  boolean   enum    int   switch
    key_words = ['abstract',  'else', 'instanceof', 'super', 'boolean','enum', 'int','switch'];

    if (key_words.indexOf(vari) >= 0) {
        errorMsg="reserved keywords cannot be used as variable names";
        throw(errorMsg);
    }
    //TO DO check if the regex is correct-- ask nivi
    else if(vari.startsWith("[_\$a-zA-Z]+")){
      //console.log("inside assign funciton....");
      //console.log("variable name:::"+vari);
        errorMsg ="variable should start with a underscore or a letter or a $ symbol";
        throw(errorMsg);
    } 
    //console.log("value...."+data)
    if(typeof this.value(data) === 'undefined' || data === null){
        // for now we cannot assign null to the data
        errorMsg = "cannot assign "+this.value(data)+ "please check the data type";
        //console.log("data error");
        throw(errorMsg);
    }
    else{
        //this.variable(variable);
        dictionary_vars[vari] =  data;
        console.log("in assign......."+dictionary_vars[vari]+".... for variablllee..."+vari)
    /// need to change this and return only the required variable or something
    return dictionary_vars[vari] ;//dictionary_vars; 
    }
}
/*
--for variables
evaluate (Var x) s = do 
    case (Map.lookup x s) of
       Just val -> return (val,s)
       _ -> Left "Error: key not found"
*/
//variable
FacetedLanguage.prototype.variable = function(varname){
    if (!(varname in dictionary_vars)){
        //check if varname exists in dictionary... if not throw an error
       errorMsg ="key not found in dictionary";
       throw(errorMsg);
    }  
    return dictionary_vars[varname];
}
/*
--if e1 then e2 else e3
evaluate (If e1 e2 e3) s = do
   (cond,s1) <- evaluate e1 s
   case cond of
     (BoolVal True) -> evaluate e2 s1
     (BoolVal False) -> evaluate e3 s1
     _ -> Left ("Non-boolean value"++" \'10\'"++ "used as a conditional")
*/
//conditional expressions e1 e2 e3 .... if (e1) then e2 else e3
FacetedLanguage.prototype.conditionalexps = function(exp1, exp2, exp3){
  //tree = astq(exp1);
  //parsedEsprima = esprima.parse(exp1)
  //console.log("exp1:..."+exp1);
  //console.log("parsed code: .....")
  //console.log(parsedEsprima.body);
  //tree.body.foreach()
  //console.log("................treee...."+tree.body+"..............................");
  value = evaluate(exp1);//eval(exp1); 
  /*
  exp1 = fl.binaryops(fl.facetedvalue(),2,+);
  exp1 = 3
  */  
  console.log("the evaluated value shoud be truee......"+ value)
  if(typeof(value) !== "boolean"){
    errorMsg="only boolean is accepted";
    throw(errorMsg);
  }
  if(value) {
    valueate = evaluate(exp2);//eval(exp2);
    return valueate;
  }
  else{

    valueate = evaluate(exp3)//eval(exp3);
    return valueate;
  }
}
/*
evaluate :: Expression -> Store -> Either ErrorMsg (Value, Store)
evaluate (Op o e1 e2) s = do
  (v1,s1) <- evaluate e1 s
  (v2,s') <- evaluate e2 s1
  v <- applyOp o v1 v2
  return (v, s')
*/
//binary operators --- +, -, *, /, >=, <=, <, >
// binaryops(val1,op, val2)
FacetedLanguage.prototype.binaryops = function(exp1, exp2, op){
  console.log("------------------in binary ops---------------")
  console.log("here it come:  "+evaluate(exp1));
  val1 = evaluate(exp1);//exp1;
  console.log("expected value is true for val1"+ val1);

  val2 = evaluate(exp2);//exp2;
  console.log("expected value is true for val2"+ val2);
  //check if its a string.... look up for the variable if exists
  var result;
  if(typeof(this.value(val1)) == "number" && typeof(this.value(val2)) =="number"){
    switch(op){
      case '*': result = val1 * val2; break;
      case '/': result = val1 / val2; break;
      case '+': result = val1 + val2; break;
      case '-': result = val1 - val2; break;
      case '>': result = val1 > val2; break;
      case '<': result = val1 < val2; break;
      case '>=': result = val1 >= val2; break;
      case '<=': result = val1 <= val2; break;
      default : errorMsg = " binary operator not supported"; throw (errorMsg);
    }
  }
  else if(typeof(this.value(val1)) == "boolean" && typeof(this.value(val2)) =="boolean"){
  switch(op){
      case '&&': result = val1 && val2; break;
      case '||': result = val1 || val2; break;
      case '===': result = val1 === val2; break;
      default : errorMsg = " binary operator not supported"; throw (errorMsg);
    }
  }
  else {
    errorMsg = "only boolean or numbers are allowed";
    throw(errorMsg);
    }
    return result;
}
/*
evaluate (Unop e) s = do
      (v1,s') <- evaluate e s
      v      <- applyUnOp Not v1 
      return (v, s')  
*/
//unary operator !, ++, --
FacetedLanguage.prototype.unaryops = function(exp, op){
  val1 = evaluate(exp);//exp;
  var result;
  if(this.value(val1) != "undefined"){  
    switch(op){
      case '!': result = !val1; break;
      case '~': result = ~val1; break;
      case '+': result = +val1; break;
      case '-': result = -val1; break;
      case '++': result = ++val1; break;// conditions only if its a number etc.. needs to be added
      case '--': result = --val1; break;
      //case 'typeof': result = typeof(val1); break;
      //case 'delete': result = delete val1; break;
      default : errorMsg = "unary operator not supported"; throw (errorMsg);
    } 
    return result;
}
}
/*
-- evaluating for new label

evaluate NewLabel s = Right (Label (show (1+ (Map.size s))) , s)--(Map.size s) 
*/
//creates a label
FacetedLanguage.prototype.createlabelFV = function(value){
    var dec = new Declassify();
    value = dec.createLabel();
    return value;
  
}
/*
evaluate (Classify  k e1 e2) s = do
    (Label v, s)    <-  evaluate k s
    (v1, s1)  <- evaluate e1 s
    (v2, s2)  <- evaluate e2 s
    return ((FacetedValue v (Val v1) (Val v2)), s)
*/
//classify(e,e)
FacetedLanguage.prototype.classifyasFV = function(exp1,exp2,exp3){
 var label = exp1;//evaluate(exp1);... here it is an undefined value
 var private = evaluate(exp2);
 var public = evaluate(exp3);
 var fv = new FacetedValue(label, private, public);
 return fv;
}
// need to call recursively
//FacetedLanguage.prototype.evaluate = function(){
    //eval or something
//}
/*
--declassify :: Label -> Value -> Store -> Either String (Value,Store)
declassify :: Label -> Value -> Store -> Either ErrorMsg (Value, Store)
declassify k (Raw v) s =  Right(v,s)
declassify k (FacetedValue l e2 e3) s = --error "hello"
  case (Map.lookup l s) of
   Just (Label val) -> if k==val then evaluate e2 s else evaluate e3 s -- error (show (evaluate e2 s))---evaluate e2 s -- error "12344"

--evaluate (FacetedValue label eifT eifF) s = error "for now"

evaluate (Defacet e1 e2) s = do 
      (Label k,s1)   <- evaluate e1 s
      (v,s2)  <- evaluate e2 s1
      declassify k v s2
*/
//defacet(e,e)
FacetedLanguage.prototype.declassifyFV = function(value){
    var declassify = new Declassify();
    if(value instanceof FacetedValue){
        var leftValue= evaluate(expression.leftValue)
        var rightValue=evaluate(expression.rightValue)
        var defactedValue = declassify.defacet(expression.view,new FacetedValue(expression.view,leftValue,rightValue));
        value = dec.declassify(value.view,);
    }
    return value;
}
//functions
FacetedLanguage.prototype.defineFunctions = function(value){
  
}
function evaluate(expression){
  if(expression instanceof FacetedValue){
    var declassify = new Declassify();
    leftValue= evaluate(expression.leftValue)
    rightValue=evaluate(expression.rightValue)
    var defactedValue = new FacetedLanguage().declassifyFV(declassify.view,new FacetedValue(expression.view,leftValue,rightValue));
    return value;
  }
  else{
  parsedEsprima = esprima.parse(expression)
  }
  console.log("expression:..."+expression);
  console.log("parsed code: .....")
  console.log(parsedEsprima.body);
  /////
  
  //checkNodeTypeCoverage(parsedEsprima);
  //fvj.checkNodeTypeCoverage();
  parsedEsprima.body.forEach(function(element) {
    console.log("calling.......1.22.33")
        //element= substituteFacetedValues(element);
        switch(element.type){
         
            case 'BinaryExpression':
            case 'CallExpression':
            case 'FunctionDeclaration':
            case 'FunctionExpression':
            case 'Literal':
            case 'AssignmentExpression':
            case 'BlockStatement':
            case 'ExpressionStatement':
                    if(element.expression.type === 'Identifier'){
                        if(element.expression.name != null || element.expression.name != undefined ){
                          console.log("hellooo...... found something which might be useful");
                          expression = dictionary_vars[element.expression.name];
                          //console.log("the value of variable "+"....."+element.expression.name+"......=..."+value);
                          //return value;
                        }
                        else{
                          evaluate(element.expression);
                          //need to change and test this case
                          console.log(" hello its undefinedd")
                        }
                        }
                    else if(element.expression.type === 'Literal'){
                      return element.expression.value;
                    }
                        break;
            case 'NewExpression':
            case 'Identifier':
            case 'IfStatement':
            case 'MemberExpression': 
            case 'ReturnStatement':
            case 'UnaryExpression':
            case 'VariableDeclaration':
            case 'VariableDeclarator':
                  break;
            default: throw new Error('substituteFacetedValues does not yet accommodate Node.type="' + node.type + '"');
        }
    }, this);
  console.log("this is coming always here irrespective of above return statements");
  //for each node in ast
        //check if its assignment operator, identifier, function etc and redirect to its corresponding function call of faceted value
  return expression;
}
/*
Facetedlanguage.prototype.num = {
new(n) { return {__proto__: this, n} ;},
eval() { return this.n }
 }

//Example: var e2 = plus.new(num.new(1), num.new(2)); e2.eval() //: 3
Facetedlanguage.prototype.plus = {
new(l, r) { return {__proto__: this, l, r} },
eval() { return this.l.eval() + this.r.eval() } }

//Example: e1.show() //: "3"; e2.show() //: "1+2"; plus.new(num.new(1), num.new(2)).show() //: "1+2"
num.show = function() { return this.n.toString() }
plus.show = function() {
return this.l.show() + ’+’ + this.r.show() }
*/