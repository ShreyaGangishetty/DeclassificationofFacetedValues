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
//this.AUCTION_CLOSING_TIME=new Date(2018, 9, 21, 3, 0, 0, 0);
//for now with complete date
//new Date(year, month, day, hours, minutes, seconds, milliseconds);

}

/**
 * @returns {ASTNode} - returns a node of type "FunctionDeclaration" or "FunctionExpression" which spawned this Scope
 */
Declassify.prototype.createLabel = function createLabel(){
    //this.counter= this.counter+1;
    //console.log("Declassify is being called and create new label invokedd......."+this.counter);
   // return this.counter;
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
    let label = new this.createLabel();
    console.log("printing label value in declassifiable   :   "+label);
    var result;
    var mkSecret = function(secret,public) {
        return new FacetedValue(label,secret,public);
    }
    var declassification = function(mkSecret){
            return  new Declassify().defacet(label,mkSecret(secret,public));
    }
    return [mkSecret,declassification];
};

/* 
1) TINI Declassification
2) Declassify with no restrictions
3) Time based Declassification
*/
//1

Declassify.prototype.tiniMkSecret=function tiniMkSecret(private, public) {
	console.log("entered here")
	return new FacetedValue(new this.createLabel(), private, public);
};
//2
Declassify.prototype.declassifyNorestrictions = function declassifyNorestrictions(private, public){
	var l = new this.createLabel();
	var fv = new FacetedValue(l,private, public);
	var defacetedValue = function (fv) {
		return new Declassify().defacet(l,fv);
	}
	return [fv, defacetedValue];
};
//3
Declassify.prototype.timebasedMkSecret=function timebasedMkSecret(private, public){
	var l = new this.createLabel();
	var fv = new FacetedValue(l,private,public);
	var declassify = function () {//var declassify = function (fv) {
		AUCTION_CLOSING_TIME = new Date(2018, 9, 21, 3, 0, 0, 0);
        currentDate = new Date();
        var value=currentDate.getTime()-AUCTION_CLOSING_TIME.getTime();
        console.log("date difference"+value);
		if(value>=0){
			return new Declassify().defacet(l, fv);
		}
		else {
			return fv;
		}
	}
	return declassify;//[fv,declassify];
};

