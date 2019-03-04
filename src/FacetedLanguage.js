if (typeof module !== 'undefined')
    module.exports = FacetedLanguage;
var FacetedValue = require('./FacetedValue.js');
var FacetedValuesJS = require('../src/FacetedValuesJS');
/*
type Variable = String
type Label = String

type ErrorMsg = String

type Store = Map Variable Value
type FLabel = String
type Raw = String

data Expression =
    Var Variable                            -- x
  | Val Value                               -- v
  | Assign Variable Expression              -- x := e
  | Sequence Expression Expression          -- e1; e2
  | Op Binop Expression Expression
  | Unop Expression                         
  | NewLabel -- Expression            
  | Defacet Expression Expression
  | If Expression Expression Expression     -- if e1 then e2 else e3 endif
  | Classify Expression Expression Expression  -- facet(label,data1,data2)
 */

/// testing
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
    else {
        console.log("unsupported type"); // trhow error
    }
}

/*
--assignment
evaluate (Assign x e) s = do
   (expVal, s1) <- evaluate e s
   return (expVal,Map.insert x expVal s1)
*/
FacetedLanguage.prototype.assign = function(variable, data){
    //need to add conditions on what variable can be
    console.log(variable)
    //dictionary_vars.push({variable : data})
    /// add more conditions or check ... need to think 
    if(typeof this.value(data) === 'undefined' || this.value(data) === null){
        console.log("data error");
        //trhow exception
    }
    else{
        //this.variable(variable);
        dictionary_vars[variable] =  data;
    /// need to change this and return only the required variable or something
    return dictionary_vars; 
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
        dictionary_vars[varname]=undefined;
        console.log("new variable created");

    }  
    //252 proj we wrote key not found we didnt add the variable to map
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
//conditional expressions if (FV<l?true:false>)
FacetedLanguage.prototype.conditionalexps = function(exp1, exp2, exp3){
  if(exp1 instanceof FacetedValue) {
    var Declassify = FacetedValuesJS.Declassify;
    var declassify = new Declassify();
    // how will i get the label here?
    var defactedValue = declassify.defacet(exp1.view,exp1);
    if(defactedValue){
      //eval (exp2);  
      console.log("working")
    }
    else {
    //eval (exp3);
    console.log("working else....")
  }
  } 
  else if(exp1 instanceof Boolean){//this.value){
    if(exp1){
      eval (exp2);  
    }
    else {
    eval (exp3);
  }
  }
}

/*
--Sequence
evaluate (Sequence e1 e2) s = do
   (v1,s1)   <- evaluate e1 s
   (v2,s2)  <- evaluate e2 s1
   return (v2, s2)
*/
//sequence
FacetedLanguage.prototype.sequence = function(exp1, exp2){
//execute exp1
//execute exp2
//return value of exp2  
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
FacetedLanguage.prototype.binaryops = function(value){
  
}

/*
evaluate (Unop e) s = do
      (v1,s') <- evaluate e s
      v      <- applyUnOp Not v1 
      return (v, s')  
*/
//unary operator !, ++, --
FacetedLanguage.prototype.unaryops = function(value){
  
}

/*
-- evaluating for new label

evaluate NewLabel s = Right (Label (show (1+ (Map.size s))) , s)--(Map.size s) 
*/
//creates a label
FacetedLanguage.prototype.createlabelFV = function(value){
  
}
/*
evaluate (Classify  k e1 e2) s = do
    (Label v, s)    <-  evaluate k s
    (v1, s1)  <- evaluate e1 s
    (v2, s2)  <- evaluate e2 s
    return ((FacetedValue v (Val v1) (Val v2)), s)
*/
//classify(e,e)
FacetedLanguage.prototype.classifyasFV = function(value){
  
}
// need to call recursively
FacetedLanguage.prototype.evaluate = function(){
    //eval or something
}
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
  
}
//functions
FacetedLanguage.prototype.defineFunctions = function(value){
  
}
/*
Facetedlanguage.prototype.num = function(){
new(n) { return {__proto__: this, n} ;},
eval() { return this.n }
 }*/
/*
//Example: var e2 = plus.new(num.new(1), num.new(2)); e2.eval() //: 3
Facetedlanguage.prototype.plus = {
new(l, r) { return {__proto__: this, l, r} },
eval() { return this.l.eval() + this.r.eval() } }

//Example: e1.show() //: "3"; e2.show() //: "1+2"; plus.new(num.new(1), num.new(2)).show() //: "1+2"
num.show = function() { return this.n.toString() }
plus.show = function() {
return this.l.show() + ’+’ + this.r.show() }
*/
 /*FacetedLanguage.prototype.binaryOp = function binaryOp(val1 , val2, operator){
    var result;
    switch (operator){
        case '*':
            //result=val1*val2;// in this recursively check if val1 is FV then go until the raw value is obtained
            result=multiply(val1, val2);
            break;
        case '/':
            result=val1/val2;
            break;
        case '+':
            result=val1+val2;
            break;
        case '-':
            result=val1-val2;
            break;

    }
return (val1+val2);
};

function multiply(val1, val2){

if(!(val1 instanceof(FacetedValue) ) && !(val2 instanceof(FacetedValue))){
    return val1*val2;
}
else if((val1 instanceof(FacetedValue) ) && (val2 instanceof(FacetedValue))){
    multiply(Declassify.defacet(val1.view, val1),Declassify.defacet(val2.view, val2));
}

else if((val1 instanceof(FacetedValue) ) && !(val2 instanceof(FacetedValue))){
    multiply(Declassify.defacet(val1.view, val1),val2);
    //recurisive call until a raw value
}
else if(!(val1 instanceof(FacetedValue) ) && (val2 instanceof(FacetedValue))){
    multiply(val1, Declassify.defacet(val2.view, val2));
}
else{
    console.log("throw errorr")
}
}
// similarly for other binary ops
*/
