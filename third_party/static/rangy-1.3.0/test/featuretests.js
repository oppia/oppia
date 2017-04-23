xn.test.suite("Browser feature tests", function(s) {
    rangy.init();

    // Detect browser version roughly. It doesn't matter too much: these are only rough tests designed to test whether
    // Rangy's feature detection is hopelessly wrong


    var browser = jQuery.browser;
    var isIe = !!browser.msie;
    var isMozilla = !!browser.mozilla;
    var isOpera = !!browser.opera;
    var version = parseFloat(browser.version);

    s.test("DOM Range support", function(t) {
        t.assertEquals(rangy.features.implementsDomRange, !isIe || version >= 9);
    });

    s.test("TextRange support", function(t) {
        t.assertEquals(rangy.features.implementsTextRange, isIe && version >= 4);
    });

    s.test("document.selection support", function(t) {
        t.assertEquals(rangy.features.implementsTextRange, isIe && version >= 4);
    });

    s.test("window.getSelection() support", function(t) {
        t.assertEquals(rangy.features.implementsWinGetSelection, !isIe || version >= 9);
    });

    s.test("selection has rangeCount", function(t) {
        t.assertEquals(rangy.features.selectionHasRangeCount, !isIe || version >= 9);
    });

    s.test("selection has anchor and focus support", function(t) {
        t.assertEquals(rangy.features.selectionHasAnchorAndFocus, !isIe || version >= 9);
    });

    s.test("selection has extend() method", function(t) {
        t.assertEquals(rangy.features.selectionHasExtend, !isIe);
    });

    s.test("HTML parsing", function(t) {
        t.assertEquals(rangy.features.htmlParsingConforms, !isIe);
    });

    s.test("Multiple ranges per selection support", function(t) {
        t.assertEquals(rangy.features.selectionSupportsMultipleRanges, isMozilla);
    });

    s.test("Collapsed non-editable selections support", function(t) {
        t.assertEquals(rangy.features.collapsedNonEditableSelectionsSupported, !isOpera);
    });
}, false);
