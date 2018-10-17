cloak k {
    var pw = getPasswordFromUser();
    var hashedPw = ThirdPartyLibrary.calculateHashFor(pw);
    doStuffWith(hashedPw);
}