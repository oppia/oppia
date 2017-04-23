xn.test.suite("Highlighter module tests", function(s) {
    s.tearDown = function() {
        document.getElementById("test").innerHTML = "";
    };

    s.test("highlightSelection test", function(t) {
        var applier = rangy.createClassApplier("c1");
        var highlighter = rangy.createHighlighter();
        highlighter.addClassApplier(applier);

        var testEl = document.getElementById("test");
        var range = rangyTestUtils.createRangeInHtml(testEl, 'one [two] three four');
        range.select();

        var highlights = highlighter.highlightSelection("c1");
        
        t.assertEquals(highlights.length, 1);
        
        
        //t.assertEquals(highlights.length, 1);


    });

    s.test("Options test (issue 249)", function(t) {
        var applier = rangy.createClassApplier("c1");
        var highlighter = rangy.createHighlighter();
        highlighter.addClassApplier(applier);

        highlighter.highlightSelection("c1", { selection: rangy.getSelection() });
    });

}, false);
