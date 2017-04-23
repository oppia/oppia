xn.test.suite("Commands module tests", function(s) {
    /*
    http://aryeh.name/spec/editcommands/autoimplementation.html

     */

    s.tearDown = function() {
        document.getElementById("test").innerHTML = "";
    };

    var nextIterationId = 1;

    function iterateNodes(node, func, includeSelf, iterationId) {
        if (!iterationId) {
            iterationId = nextIterationId++;
        }
        if (node.iterationId == iterationId) {
            throw new Error("Node already iterated: " + rangy.dom.inspectNode(node));
        }
        if (includeSelf) {
            func(node);
        }
        node.iterated = true;
        for (var child = node.firstChild, nextChild; !!child; child = nextChild) {
            nextChild = child.nextSibling;
            iterateNodes(child, func, true, iterationId);
        }
    }

    function RangeInfo() {}

    RangeInfo.prototype = {
        setStart: function(node, offset) {
            this.sc = node;
            this.so = offset;
        },
        setEnd: function(node, offset) {
            this.ec = node;
            this.eo = offset;
        }
    };

    function createRangesInHtml(containerEl, html) {
        containerEl.innerHTML = html;
        var rangeInfo, inRange = false, rangeInfos = [], doc = rangy.dom.getDocument(containerEl);

        function startRange(node, offset) {
            rangeInfo = new RangeInfo();
            rangeInfo.setStart(node, offset);
            rangeInfos.push(rangeInfo);
            inRange = true;
        }

        function endRange(node, offset) {
            rangeInfo.setEnd(node, offset);
            inRange = false;
        }

        function checkForBracket(node, isStart) {
            var bracketIndex = node.data.indexOf(isStart ? "[" : "]");
            if (bracketIndex != -1) {
                //log.debug("bracketIndex: " + bracketIndex + ", data: " + node.data);
                node.data = node.data.slice(0, bracketIndex) + node.data.slice(bracketIndex + 1);

                (isStart ? startRange : endRange)(node, bracketIndex);
                return true;
            }
            return false;
        }

        function checkForPipe(node) {
            if (node.length > 0) {
                var pipeIndex = node.data.indexOf("|");
                if (pipeIndex == 0 || pipeIndex == node.length - 1) {
                    var nodeIndex = rangy.dom.getNodeIndex(node);
                    if (pipeIndex == 0) {
                        node.data = node.data.slice(1);
                    } else {
                        node.data = node.data.slice(0, -1);
                        nodeIndex++;
                    }
                    (inRange ? endRange : startRange)(node.parentNode, nodeIndex);
                    return true;
                }
            }
            return false;
        }

        iterateNodes(containerEl, function(node) {
            if (node.nodeType == 3) {
                var noneFound = false;
                while (!noneFound) {
                    noneFound = true;
                    noneFound = !checkForBracket(node, true) && noneFound;
                    noneFound = !checkForPipe(node) && noneFound;
                    noneFound = !checkForBracket(node, false) && noneFound;
                    noneFound = !checkForPipe(node) && noneFound;
                }

                // Clear empty text node
                if (node.length == 0) {
                    node.parentNode.removeChild(node);
                }
            }
        }, false);

        var ranges = [];
        for (var i = 0, range; rangeInfo = rangeInfos[i++]; ) {
            range = rangy.createRange(doc);
            range.setStart(rangeInfo.sc, rangeInfo.so);
            range.setEnd(rangeInfo.ec, rangeInfo.eo);
            ranges.push(range);
            log.info("Added range " + range.inspect());
        }

        return ranges;
    }

    function getSortedClassName(el) {
        return el.className.split(/\s+/).sort().join(" ");
    }

    // Puts ranges in order, last in document first.
    function compareRanges(r1, r2) {
        return r2.compareBoundaryPoints(r1.START_TO_START, r1);
    }

    function htmlAndRangesToString(containerEl, ranges) {
        ranges = ranges.slice(0);
        ranges.sort(compareRanges);

        var containerClone = containerEl.cloneNode(true);

        function getCloneForNode(node) {
            var indexes = [];
            if (node == containerEl) {
                return containerClone;
            }
            while (node != containerEl) {
                indexes.push(rangy.dom.getNodeIndex(node));
                node = node.parentNode;
            }
            node = containerClone;
            while (indexes.length) {
                node = node.childNodes[indexes.pop()];
            }
            return node;
        }

        function insertRangeBoundaryChar(node, offset, isStart) {
            var clone = getCloneForNode(node);
            if (rangy.dom.isCharacterDataNode(clone)) {
                clone.data = clone.data.slice(0, offset) + (isStart ? "[" : "]") + clone.data.slice(offset);
            } else {
                var textNode = rangy.dom.getDocument(node).createTextNode("|");
                if (offset == clone.childNodes.length) {
                    clone.appendChild(textNode);
                } else {
                    clone.insertBefore(textNode, clone.childNodes[offset]);
                }
            }
        }

        for (var i = 0, range; range = ranges[i++]; ) {
            insertRangeBoundaryChar(range.endContainer, range.endOffset, false);
            insertRangeBoundaryChar(range.startContainer, range.startOffset, true);
        }

        function getHtml(node, includeSelf) {
            var html = "";
            if (node.nodeType == 1) {
                if (includeSelf) {
                    html = "<" + node.tagName.toLowerCase();
                    if (node.id) {
                        html += ' id="' + node.id + '"';
                    }
                    if (node.className) {
                        html += ' class="' + getSortedClassName(node) + '"';
                    }
                    if (node.style.cssText) {
                        var style = node.style.cssText.toLowerCase().replace(/\s+$/, "");
                        if (style.slice(-1) != ";") {
                            style += ";";
                        }
                        html += ' style="' + style + '"';
                    }
                    html += ">";
                }

                for (var i = 0, children = node.childNodes, len = children.length; i <= len; ++i) {
                    if (i != len) {
                        html += getHtml(children[i], true);
                    }
                }

                if (includeSelf) {
                    html += "</" + node.tagName.toLowerCase() + ">";
                }
            } else if (includeSelf && node.nodeType == 3) {
                html += node.data;
            }
            return html;
        }

        return getHtml(containerClone, false);
    }

    function testRangeHtml(testEl, html, t) {
        var range = createRangesInHtml(testEl, html)[0];
        log.info("Range: " + range.inspect());
        var newHtml = htmlAndRangesToString(testEl, [range]);
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
            var ranges = createRangesInHtml(testEl, initialHtmlAndRange);
            var sel = rangy.getSelection();
            sel.setRanges(ranges);

            rangy.execCommand(commandName, options);

            t.assertEquals(htmlAndRangesToString(testEl, sel.getAllRanges()), expectedHtmlRange);
        });
    }

    function testRangeCommand(commandName, options, initialHtmlAndRange, expectedHtmlRange) {
        s.test("Rangy command '" + commandName + "' on " + initialHtmlAndRange, function(t) {
            var testEl = document.getElementById("test");
            var ranges = createRangesInHtml(testEl, initialHtmlAndRange);

            rangy.execCommand(commandName, options, ranges[0]);

            t.assertEquals(htmlAndRangesToString(testEl, ranges), expectedHtmlRange);
        });
    }

    function testAryehCommand(commandName, options, initialHtmlAndRange, expectedHtmlRange) {
        s.test("Aryeh command '" + commandName + "' on " + initialHtmlAndRange, function(t) {
            var testEl = document.getElementById("test");
            var ranges = createRangesInHtml(testEl, initialHtmlAndRange);
            var sel = rangy.getSelection();
            sel.setRanges(ranges);

            document.body.contentEditable = true;
            aryeh.execCommand("stylewithcss", false, !!options.styleWithCss);
            aryeh.execCommand(commandName, false, options.value || null, ranges[0]);
            document.body.contentEditable = false;

            t.assertEquals(htmlAndRangesToString(testEl, sel.getAllRanges()), expectedHtmlRange);
        });
    }

    function testAryehRangeCommand(commandName, options, initialHtmlAndRange, expectedHtmlRange) {
        s.test("Aryeh range command '" + commandName + "' on " + initialHtmlAndRange, function(t) {
            var testEl = document.getElementById("test");
            var ranges = createRangesInHtml(testEl, initialHtmlAndRange);

            document.body.contentEditable = true;
            aryeh.execCommand("stylewithcss", false, !!options.styleWithCss);
            aryeh.execCommand(commandName, false, options.value || null, ranges[0]);
            document.body.contentEditable = false;

            t.assertEquals(htmlAndRangesToString(testEl, ranges), expectedHtmlRange);
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
        el.setAttribute("href", "http://www.timdown.co.uk/")
        testSimpleModifiableElement("a with href attribute", el, '<a href="http://www.timdown.co.uk/"></a>', true);

        el = doc.createElement("a");
        el.href = "http://www.timdown.co.uk/";
        testSimpleModifiableElement("a with href attribute set via property", el, '<a href="http://www.timdown.co.uk/"></a>', true);

/*
        el = doc.createElement("a");
        el.setAttribute("name", "test");
        testSimpleModifiableElement("a with name attribute", el, '<a name="test"></a>', false);

        el = doc.createElement("a");
        el.name = "test";
        testSimpleModifiableElement("a with name attribute set via property", el, '<a name="test"></a>', false);
*/

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
        t.assert(/font-weight:\s?bold;?/i.test(el.style.cssText.toLowerCase()));
    });

    s.test("Writable cssText, single style property", function(t) {
        var el = document.createElement("span");
        el.style.cssText = "font-weight: bold;";
        var div = document.createElement("div");
        div.appendChild(el);
        t.assert(/<span style="font-weight:\s?bold;?\s?"><\/span>/i.test(div.innerHTML));
    });

    s.test("Writable cssText, multiple style properties", function(t) {
        var el = document.createElement("span");
        el.style.cssText = "font-weight: bold; font-style: italic";
        var div = document.createElement("div");
        div.appendChild(el);
        t.assert(/<span style="font-weight:\s?bold;\s?font-style:\s?italic;?\s?"><\/span>/i.test(div.innerHTML) ||
                /<span style="font-style:\s?italic;\s?font-weight:\s?bold;?\s?"><\/span>/i.test(div.innerHTML));
    });

    testDocument(document);

}, false);
