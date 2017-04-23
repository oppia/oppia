xn.test.suite("Commands module tests", function(s) {
    s.tearDown = function() {
        document.getElementById("test").innerHTML = "";
    };

    rangy.init();

    function testRangeHtml(testEl, html, t) {
        var range = rangyTestUtils.createRangeInHtml(testEl, html);
        log.info("Range: " + range.inspect());
        var newHtml = rangyTestUtils.htmlAndRangeToString(testEl, range);
        t.assertEquals(html, newHtml);
    }

    function testModifiableElement(name, element, html, isModifiable) {
        s.test("Modifiable element " + name, function(t) {
            t.assertEquals(rangy.Command.util.isModifiableElement(element), isModifiable);
        });

        s.test("Modifiable element " + name + " (HTML)", function(t) {
            var container = rangy.dom.getDocument(element).createElement("div");
            container.innerHTML = html;
            t.assertEquals(rangy.Command.util.isModifiableElement(container.firstChild), isModifiable);
        });
    }

    function testSimpleModifiableElement(name, element, html, isModifiable) {
        s.test("Simple modifiable element " + name, function(t) {
            t.assertEquals(rangy.Command.util.isSimpleModifiableElement(element), isModifiable);
        });

        s.test("Simple modifiable element " + name + " (HTML)", function(t) {
            var container = rangy.dom.getDocument(element).createElement("div");
            container.innerHTML = html;
            t.assertEquals(rangy.Command.util.isSimpleModifiableElement(container.firstChild), isModifiable);
        });
    }

    function testSelectionCommand(commandName, options, initialHtmlAndRange, expectedHtmlRange) {
        s.test("Rangy command '" + commandName + "' on " + initialHtmlAndRange, function(t) {
            var testEl = document.getElementById("test");
            var range = rangyTestUtils.createRangeInHtml(testEl, initialHtmlAndRange);
            var sel = rangy.getSelection();
            sel.setSingleRange(range);

            rangy.execCommand(commandName, options);

            t.assertEquals(rangyTestUtils.htmlAndRangeToString(testEl, sel.getRangeAt(0)), expectedHtmlRange);
        });
    }

    function testRangeClearValue(commandName, options, initialHtmlAndRange, expectedHtmlRange, extraDesc) {
        s.test("Rangy command '" + commandName + "' " + (extraDesc ? " " + extraDesc : "") + " clearValue on " + initialHtmlAndRange, function(t) {
            var testEl = document.getElementById("test");
            var range = rangyTestUtils.createRangeInHtml(testEl, initialHtmlAndRange);
            var command = rangy.getCommand(commandName);
            var context = command.createContext(null, [range], options);

            var elements = rangy.Command.util.getEffectivelyContainedElements(range, context);
            for (var i = 0, len = elements.length; i < len; ++i) {
                rangy.Command.util.clearValue(elements[i], context);
            }

            t.assertEquals(rangyTestUtils.htmlAndRangeToString(testEl, range), expectedHtmlRange);
        });
    }

    function testRangeCommand(commandName, options, initialHtmlAndRange, expectedHtmlRange) {
        s.test("Rangy command '" + commandName + "' on " + initialHtmlAndRange, function(t) {
            var testEl = document.getElementById("test");
            var range = rangyTestUtils.createRangeInHtml(testEl, initialHtmlAndRange);

            rangy.execCommand(commandName, options, range);

            t.assertEquals(rangyTestUtils.htmlAndRangeToString(testEl, range), expectedHtmlRange);
        });
    }

    function testAryehCommand(commandName, options, initialHtmlAndRange, expectedHtmlRange) {
        s.test("Aryeh command '" + commandName + "' on " + initialHtmlAndRange, function(t) {
            var testEl = document.getElementById("test");
            var range = rangyTestUtils.createRangeInHtml(testEl, initialHtmlAndRange);
            var sel = rangy.getSelection();
            sel.setSingleRange(range);

            document.body.contentEditable = true;
            aryeh.execCommand("stylewithcss", false, !!options.styleWithCss);
            aryeh.execCommand(commandName, false, options.value || null, range);
            document.body.contentEditable = false;

            t.assertEquals(rangyTestUtils.htmlAndRangeToString(testEl, sel.getRangeAt(0)), expectedHtmlRange);
        });
    }

    function testAryehRangeCommand(commandName, options, initialHtmlAndRange, expectedHtmlRange) {
        s.test("Aryeh range command '" + commandName + "' on " + initialHtmlAndRange, function(t) {
            var testEl = document.getElementById("test");
            var range = rangyTestUtils.createRangeInHtml(testEl, initialHtmlAndRange);

            document.body.contentEditable = true;
            aryeh.execCommand("stylewithcss", false, !!options.styleWithCss);
            aryeh.execCommand(commandName, false, options.value || null, range);
            document.body.contentEditable = false;

            t.assertEquals(rangyTestUtils.htmlAndRangeToString(testEl, range), expectedHtmlRange);
        });
    }

    function testDocument(doc) {
        var el = doc.createElement("span");
        el.setAttribute("style", "border: solid green 1px; padding: 2px");
        testModifiableElement("span with style", el, '<span style="border: solid green 1px; padding: 2px"></span>', true);

        el = doc.createElement("span");
        el.setAttribute("style", "border: solid green 1px; padding: 2px");
        el.className = "test";
        testModifiableElement("span with style and class", el, '<span class="test" style="border: solid green 1px; padding: 2px"></span>', false);

        el = doc.createElement("span");
        testSimpleModifiableElement("span with no attributes", el, '<span></span>', true);

        el = doc.createElement("em");
        testSimpleModifiableElement("em with no attributes", el, '<em></em>', true);

        el = doc.createElement("label");
        testSimpleModifiableElement("label with no attributes", el, '<label></label>', false);

        el = doc.createElement("span");
        el.setAttribute("style", "");
        testSimpleModifiableElement("span with empty style attribute", el, '<span></span>', true);

        el = doc.createElement("a");
        el.setAttribute("href", "http://www.timdown.co.uk/");
        testSimpleModifiableElement("a with href attribute", el, '<a href="http://www.timdown.co.uk/"></a>', true);

        el = doc.createElement("a");
        el.href = "http://www.timdown.co.uk/";
        testSimpleModifiableElement("a with href attribute set via property", el, '<a href="http://www.timdown.co.uk/"></a>', true);

        el = doc.createElement("a");
        el.setAttribute("id", "test");
        testSimpleModifiableElement("a with id attribute", el, '<a id="test"></a>', false);

        el = doc.createElement("a");
        el.id = "test";
        testSimpleModifiableElement("a with id attribute set via property", el, '<a id="test"></a>', false);

        el = doc.createElement("font");
        el.setAttribute("face", "Serif");
        testSimpleModifiableElement("font with face attribute", el, '<font face="Serif"></font>', true);

        el = doc.createElement("font");
        el.face = "Serif";
        testSimpleModifiableElement("font with face attribute set via property", el, '<font face="Serif"></font>', true);

        el = doc.createElement("font");
        el.setAttribute("color", "#ff000");
        testSimpleModifiableElement("font with color attribute", el, '<font color="#ff000"></font>', true);

        el = doc.createElement("font");
        el.color = "#ff000";
        testSimpleModifiableElement("font with color attribute set via property", el, '<font color="#ff000"></font>', true);

        el = doc.createElement("font");
        el.setAttribute("size", "5");
        testSimpleModifiableElement("font with size attribute", el, '<font size="5"></font>', true);

        el = doc.createElement("font");
        el.size = "5";
        testSimpleModifiableElement("font with size attribute set via property", el, '<font size="5"></font>', true);

        el = doc.createElement("font");
        el.setAttribute("size", "5");
        el.setAttribute("color", "#ff000");
        testSimpleModifiableElement("font with size and color attributes", el, '<font size="5" color="#ff0000"></font>', false);

        el = doc.createElement("em");
        el.style.fontStyle = "normal";
        testSimpleModifiableElement("em with font-style normal", el, '<em style="font-style: normal"></em>', true);

        el = doc.createElement("em");
        el.style.fontWeight = "normal";
        testSimpleModifiableElement("em with font-weight normal", el, '<em style="font-weight: normal"></em>', false);

        el = doc.createElement("em");
        el.style.fontWeight = "normal";
        el.style.fontStyle = "normal";
        testSimpleModifiableElement("em with font-style and font-weight normal", el, '<em style="font-style: normal; font-weight: normal"></em>', false);

        el = doc.createElement("strike");
        el.style.textDecoration = "underline";
        testSimpleModifiableElement("strike with text-decoration underline", el, '<strike style="text-decoration: underline"></strike>', true);

        el = doc.createElement("strike");
        el.style.fontWeight = "bold";
        testSimpleModifiableElement("strike with font-weight bold", el, '<strike style="font-weight: bold"></strike>', false);

        testRangeClearValue("bold", {}, "[1<b>2</b>3]", "[123]");
        testRangeClearValue("bold", {applyToEditableOnly: true}, "[1<b>2</b>3]", "[1<b>2</b>3]", "applyToEditableOnly");
        testRangeClearValue("bold", {}, '[1<b>2</b><b>3</b>4]', '[1234]');
        testRangeClearValue("bold", {}, '[1<span contenteditable="false"><b>2</b></span><b>3</b>4]', '[1<span>2</span>34]');
        testRangeClearValue("bold", {applyToEditableOnly: true}, '[1<span contenteditable="true"><b>2</b></span><b>3</b>4]', '[1<span>2</span><b>3</b>4]', "applyToEditableOnly");
        testRangeClearValue("bold", {}, "[1<strong>2</strong>3]", "[123]");
        testRangeClearValue("bold", {}, '[1<span style="font-weight: bold">2</span>3]', "[123]");
        testRangeClearValue("bold", {}, '[1<span id="cheese" style="font-weight: bold">2</span>3]', '[1<span id="cheese" style="font-weight: bold;">2</span>3]');
        testRangeClearValue("bold", {}, "1<b>[2]</b>3", "1<b>[2]</b>3");


/*
        testSelectionCommand("bold", { styleWithCss: false }, "1[2]3", "1<b>[2]</b>3");
        testSelectionCommand("bold", { styleWithCss: true }, "1[2]3", '1<span style="font-weight: bold;">[2]</span>3');

        if (rangy.features.selectionSupportsMultipleRanges) {
            testSelectionCommand("bold", { styleWithCss: false }, "[1]2[3]", "<b>[1]</b>2<b>[3]</b>");
            testSelectionCommand("bold", { styleWithCss: true }, "[1]2[3]", '<span style="font-weight: bold;">[1]</span>2<span style="font-weight: bold;">[3]</span>');
        }

        testSelectionCommand("bold", { styleWithCss: false }, "<p><b><i>[2</i> ]</b></p>", "<p><i>[2</i> ]</p>");
        testAryehCommand("bold", { styleWithCss: false }, "<p><b><i>[2</i> ]</b></p>", "<p><i>[2</i> ]</p>");
        testRangeCommand("bold", { styleWithCss: false }, "<span>|foo|</span>", '<span style="font-weight: bold;">|foo|</span>');
        testAryehRangeCommand("bold", { styleWithCss: false }, "<span>|foo|</span>", '<span style="font-weight: bold;">|foo|</span>');
        testRangeCommand("bold", { styleWithCss: true }, "<span>[foo]</span>]", '<span style="font-weight: bold;">[foo]</span>]');
        testRangeCommand("bold", { styleWithCss: false }, "<span>[foo]</span>", "<b>[foo]</b>");
*/
    }

/*
    s.test("Can set single style property via setAttribute", function(t) {
        var el = document.createElement("span");
        el.setAttribute("style", "padding: 1px");
        var styleAttr = el.attributes.getNamedItem("style");
        t.assertEquivalent(styleAttr.specified, true);
    });
*/

    s.test("Test the Range/HTML test functions", function(t) {
        var testEl = document.getElementById("test");
        testRangeHtml(testEl, 'Before <span class="test">[One]</span> after', t);
        testRangeHtml(testEl, 'Before <span class="test">|On]e</span> after', t);
        testRangeHtml(testEl, 'Before <span class="test">|One|</span> after', t);
        testRangeHtml(testEl, 'Bef[ore <span class="test">One</span> af]ter', t);
        testRangeHtml(testEl, 'Bef[ore <span class="test">|One</span> after', t);
        testRangeHtml(testEl, '1[2]3', t);
    });

    s.test("Can set single style property via style property", function(t) {
        var el = document.createElement("span");
        el.style.padding = "1px";
        var styleAttr = el.attributes.getNamedItem("style");
        t.assertEquivalent(styleAttr.specified, true);
    });

    s.test("style property cssText", function(t) {
        var el = document.createElement("span");
        el.style.fontWeight = "bold";
        //t.assertEquivalent(el.style.item(0), "font-weight");
        log.info(el.style.cssText);
        t.assert(/font-weight:\s?(bold|700);?/i.test(el.style.cssText.toLowerCase()));
    });

    s.test("Writable cssText, single style property", function(t) {
        var el = document.createElement("span");
        el.style.cssText = "font-weight: bold;";
        var div = document.createElement("div");
        div.appendChild(el);
        t.assert(/<span style="font-weight:\s?(bold|700);?\s?"><\/span>/i.test(div.innerHTML));
    });

    s.test("Writable cssText, multiple style properties", function(t) {
        var el = document.createElement("span");
        el.style.cssText = "font-weight: bold; font-style: italic";
        var div = document.createElement("div");
        div.appendChild(el);
        t.assert(/<span style="font-weight:\s?(bold|700);\s?font-style:\s?italic;?\s?"><\/span>/i.test(div.innerHTML) ||
                /<span style="font-style:\s?italic;\s?font-weight:\s?(bold|700);?\s?"><\/span>/i.test(div.innerHTML));
    });

    testDocument(document);

}, false);
