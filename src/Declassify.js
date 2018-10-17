if (typeof module !== 'undefined')
    module.exports = Declassify;
var FacetedValue = require('./FacetedValue.js');
/**
 * 
 * 
 *
 * 
 * 
 * 
 */
function Declassify(){


    /**
     * @public
     */
    this.counter = 0;
    /*this.createLabel = function(){
        this.counter= this.counter+1;
        console.log("Declassify is being called and create new label invokedd......."+this.counter);
        return this.counter;
    };*/
}

/**
 * @returns {ASTNode} - returns a node of type "FunctionDeclaration" or "FunctionExpression" which spawned this Scope
 */
Declassify.prototype.createLabel = function createLabel(){
    this.counter= this.counter+1;
    //console.log("Declassify is being called and create new label invokedd......."+this.counter);
    return this.counter;
};

Declassify.prototype.defacet = function defacet(label, fvalue){
    console.log("--------------------Invoking DEFACET--------------------");
    console.log("........label............"+label+"   ....");
    console.log("........faceted Value............"+fvalue+"   ....");
    var result;
    if(fvalue instanceof FacetedValue) {
        var fview = fvalue.view;
        console.log("...................VIEW or label of FV........"+fview);
        if(fview===label){
            console.log("another step closer");
            console.log("...................VIEW or label of FV........"+fvalue);
            result = fvalue.leftValue;
        }
        else {
            result = fvalue.rightValue;
        } 
    }
    else {
        result = fvalue;
    }
    return result;
};

Declassify.prototype.mkDeclassifiable= function mkDeclassifiable(secret, public){
    let label = this.createLabel();
    console.log("printing label value in declassifieblee   :   "+label);
    var result;
    var mkSecret = function(secret,public) {
        return new FacetedValue(label,secret,public);
    }
    var declassification = function(mkSecret){
            return  new Declassify().defacet(label,mkSecret(secret,public));
    }
    return [mkSecret,declassification];
};