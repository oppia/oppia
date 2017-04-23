xn.test.suite("Class Applier module tests", function(s) {
    s.tearDown = function() {
        document.getElementById("test").innerHTML = "";
    };

    s.test("canDeserializeRange test", function(t) {
        t.assertFalse(rangy.canDeserializeRange("0/9999:1,0/9999:20{a1b2c3d4}"))
    });

}, false);