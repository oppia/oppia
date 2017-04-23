define(function (require) {
    var rangy = require("rangy");
    var stupidMagicAvoidance = require;
    rangy.init();




    //window.rangy = rangy;

    console.log(rangy);

    window.setTimeout(function() {
        stupidMagicAvoidance(["./rangy-classapplier.js"], function() {
            console.log(rangy.modules.ClassApplier);
        });

    }, 500);
});