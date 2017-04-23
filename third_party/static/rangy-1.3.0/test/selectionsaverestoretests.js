xn.test.suite("Selection save/restore module tests", function(s) {
    s.tearDown = function() {
        document.getElementById("test").innerHTML = "";
    };

    s.test("Issue 140 (saveSelection reverses backward selection)", function(t) {
        var testEl = document.getElementById("test");
        testEl.innerHTML = "test";
        var range = rangy.createRange();
        range.setStartAndEnd(testEl.firstChild, 1, 3);
        var sel = rangy.getSelection();
        sel.addRange(range, "backward");

        t.assert(sel.isBackward());
        t.assertEquals(sel.rangeCount, 1);
        t.assert(sel.getRangeAt(0).equals(range));

        rangy.saveSelection();

        t.assert(sel.isBackward());
        t.assertEquals(sel.rangeCount, 1);
    });
}, false);
