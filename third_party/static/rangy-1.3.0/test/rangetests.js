var hasNativeDomRange = "createRange" in document;

function createRangyRange(doc) {
    return new rangy.DomRange(doc);
}

function createNativeDomRange(doc) {
    return doc.createRange();
}

function createWrappedNativeDomRange(doc) {
    return rangy.createRange(doc);
}

function getOtherDocument() {
    var iframe = document.getElementById("selectors");
    return iframe.contentDocument || iframe.contentWindow.document;
}

function testExceptionCode(t, func, code) {
    try {
        func();
        t.fail("No error thrown");
    } catch (ex) {
        t.assertEquals(ex.code, code);
    }
}

function testRangeCreator(docs, docName, rangeCreator, rangeCreatorName) {
    xn.test.suite(rangeCreatorName + " in " + docName + " document", function(s) {
        var doc;
        var DOMException = rangy.DOMException;
        var testRange = rangeCreator(document);

        s.setUp = function(t) {
            doc = docs[0];
            var div = doc.createElement("div");
            var plainText = div.appendChild(doc.createTextNode("plain"));
            var b = div.appendChild(doc.createElement("b"));
            var boldText = b.appendChild(doc.createTextNode("bold"));
            var i = b.appendChild(doc.createElement("i"));
            var boldAndItalicText = i.appendChild(doc.createTextNode("bold and italic"));
            doc.body.appendChild(div);
            var div2 = doc.createElement("div");
            var div2Text = div2.appendChild(doc.createTextNode("Second div"));
            doc.body.appendChild(div2);

            t.nodes = {
                div: div,
                plainText: plainText,
                b: b,
                boldText: boldText,
                i: i,
                boldAndItalicText: boldAndItalicText,
                div2: div2,
                div2Text: div2Text
            };
        };

        s.tearDown = function(t) {
            doc.body.removeChild(t.nodes.div);
            doc.body.removeChild(t.nodes.div2);
            t.nodes = null;
        };

        s.test("Initial Range values", function(t) {
            var range = rangeCreator(doc);
            t.assertEquivalent(range.startContainer, doc);
            t.assertEquivalent(range.startOffset, 0);
            t.assertEquivalent(range.endContainer, doc);
            t.assertEquivalent(range.endOffset, 0);
        });

        if (testRange.isValid) {
            s.test("isValid: remove common container node", function(t) {
                var range = rangeCreator(doc);
                range.selectNodeContents(t.nodes.plainText);
                t.assert(range.isValid());
                t.nodes.plainText.parentNode.removeChild(t.nodes.plainText);
                t.assert(range.isValid());
            });

            s.test("isValid: remove start container node", function(t) {
                var range = rangeCreator(doc);
                range.setStart(t.nodes.plainText, 0);
                range.setEnd(t.nodes.boldAndItalicText, 1);
                t.assert(range.isValid());
                t.nodes.plainText.parentNode.removeChild(t.nodes.plainText);
                t.assertFalse(range.isValid());
            });

            s.test("isValid: remove end container node", function(t) {
                var range = rangeCreator(doc);
                range.setStart(t.nodes.plainText, 0);
                range.setEnd(t.nodes.boldAndItalicText, 1);
                t.assert(range.isValid());
                t.nodes.boldAndItalicText.parentNode.removeChild(t.nodes.boldAndItalicText);
                t.assertFalse(range.isValid());
            });

            s.test("isValid: truncate start container node", function(t) {
                var range = rangeCreator(doc);
                range.setStart(t.nodes.plainText, 2);
                range.setEnd(t.nodes.boldAndItalicText, 1);
                t.assert(range.isValid());
                t.nodes.plainText.data = "1";
                t.assertFalse(range.isValid());
            });

            s.test("isValid: truncate end container node", function(t) {
                var range = rangeCreator(doc);
                range.setStart(t.nodes.plainText, 2);
                range.setEnd(t.nodes.boldAndItalicText, 2);
                t.assert(range.isValid());
                t.nodes.boldAndItalicText.data = "1";
                t.assertFalse(range.isValid());
            });
        }

        s.test("setStart after end test", function(t) {
            var range = rangeCreator(doc);
            //log.info(range);
            range.setEnd(t.nodes.plainText, 0);
            range.setStart(t.nodes.plainText, 2);
            t.assert(range.collapsed);
            t.assertEquivalent(range.startContainer, t.nodes.plainText);
            t.assertEquivalent(range.startOffset, 2);
            t.assertEquivalent(range.endContainer, t.nodes.plainText);
            t.assertEquivalent(range.endOffset, 2);
        });

        s.test("setEnd after start test", function(t) {
            var range = rangeCreator(doc);
            range.selectNodeContents(t.nodes.div);
            range.setEnd(t.nodes.b, 1);
            t.assertFalse(range.collapsed);
            t.assertEquivalent(range.startContainer, t.nodes.div);
            t.assertEquivalent(range.startOffset, 0);
            t.assertEquivalent(range.endContainer, t.nodes.b);
            t.assertEquivalent(range.endOffset, 1);
        });

        s.test("setStart after interesting end test", function(t) {
            var range = rangeCreator(doc);
            range.setEnd(t.nodes.b, 1);
            range.setStart(t.nodes.boldAndItalicText, 2);
            t.assert(range.collapsed);
            t.assertEquivalent(range.startContainer, t.nodes.boldAndItalicText);
            t.assertEquivalent(range.startOffset, 2);
            t.assertEquivalent(range.endContainer, t.nodes.boldAndItalicText);
            t.assertEquivalent(range.endOffset, 2);
        });

        s.test("setEndAfter 1", function(t) {
            var range = rangeCreator(doc);
            range.setStart(t.nodes.plainText, 1);
            range.collapse(true);
            range.setEndAfter(t.nodes.plainText);

            t.assertFalse(range.collapsed);
            t.assertEquals(range.toString(), "lain");
        });

        var testSetStartOrEnd = function(methodName) {
            s.test(methodName + " error test", function(t) {
                var range = rangeCreator(doc);

                testExceptionCode(t, function() {
                    range[methodName](t.nodes.plainText, 6);
                }, DOMException.prototype.INDEX_SIZE_ERR);

                testExceptionCode(t, function() {
                    range[methodName](t.nodes.div2, 2);
                }, DOMException.prototype.INDEX_SIZE_ERR);

                testExceptionCode(t, function() {
                    range[methodName](t.nodes.div2, -1);
                }, DOMException.prototype.INDEX_SIZE_ERR);

                range.detach();

                // Detach is now a no-op  according to DOM4. Not according to Chrome 35 though.
                t.assertNoError(function() {
                    range[methodName](t.nodes.div2, 0);
                });
            });

            s.test(methodName + " move to other document test", function(t) {
                var range = rangeCreator(doc);
                var otherDoc = getOtherDocument();
                range[methodName](otherDoc.body, 0);
                t.assertEquivalent(range.startContainer, otherDoc.body);
                t.assertEquivalent(range.startOffset, 0);
                t.assertEquivalent(range.endContainer, otherDoc.body);
                t.assertEquivalent(range.endOffset, 0);
            });
        };

        testSetStartOrEnd("setStart");
        testSetStartOrEnd("setEnd");

        var testSetBeforeOrAfter = function(methodName) {
            s.test(methodName + " error test", function(t) {
                var range = rangeCreator(doc);

                testExceptionCode(t, function() {
                    range[methodName](doc);
                }, DOMException.prototype.INVALID_NODE_TYPE_ERR);

                testExceptionCode(t, function() {
                    range[methodName](doc.createDocumentFragment());
                }, DOMException.prototype.INVALID_NODE_TYPE_ERR);

                range.detach();

                // Detach is now a no-op  according to DOM4. Not according to Chrome 35 though.
                t.assertNoError(function() {
                    range[methodName](t.nodes.div2);
                });
            });
        };

        testSetBeforeOrAfter("setStartBefore");
        testSetBeforeOrAfter("setStartAfter");
        testSetBeforeOrAfter("setEndBefore");
        testSetBeforeOrAfter("setEndAfter");

        if (testRange.setStartAndEnd) {
            s.test("setStartAndEnd with two arguments", function(t) {
                var range = rangeCreator(doc);

                range.setStartAndEnd(t.nodes.plainText, 2);

                t.assertEquivalent(range.startContainer, t.nodes.plainText);
                t.assertEquivalent(range.startOffset, 2);
                t.assertEquivalent(range.endContainer, t.nodes.plainText);
                t.assertEquivalent(range.endOffset, 2);
            });

            s.test("setStartAndEnd with three arguments", function(t) {
                var range = rangeCreator(doc);

                range.setStartAndEnd(t.nodes.plainText, 2, 3);

                t.assertEquivalent(range.startContainer, t.nodes.plainText);
                t.assertEquivalent(range.startOffset, 2);
                t.assertEquivalent(range.endContainer, t.nodes.plainText);
                t.assertEquivalent(range.endOffset, 3);
            });

            s.test("setStartAndEnd with four arguments", function(t) {
                var range = rangeCreator(doc);

                range.setStartAndEnd(t.nodes.plainText, 2, t.nodes.boldAndItalicText, 1);

                t.assertEquivalent(range.startContainer, t.nodes.plainText);
                t.assertEquivalent(range.startOffset, 2);
                t.assertEquivalent(range.endContainer, t.nodes.boldAndItalicText);
                t.assertEquivalent(range.endOffset, 1);
            });
        }

        s.test("compareBoundaryPoints 1", function(t) {
            var range1 = rangeCreator(doc);
            var range2 = rangeCreator(doc);
            range1.setStart(t.nodes.b, 1);
            range1.setEnd(t.nodes.boldAndItalicText, 2);
            range2.setStart(t.nodes.plainText, 1);
            range2.setEnd(t.nodes.b, 1);

            t.assertEquivalent(range1.compareBoundaryPoints(range1.START_TO_START, range2), 1);
            t.assertEquivalent(range1.compareBoundaryPoints(range1.START_TO_END, range2), 1);
            t.assertEquivalent(range1.compareBoundaryPoints(range1.END_TO_START, range2), 0);
            t.assertEquivalent(range1.compareBoundaryPoints(range1.END_TO_END, range2), 1);
        });

        s.test("cloneContents 1", function(t) {
            var range = rangeCreator(doc);
            range.setStart(t.nodes.b, 1);
            range.setEnd(t.nodes.div2Text, 2);
            var frag = range.cloneContents();
            t.assertEquals(frag.childNodes.length, 2);
            t.assertEquals(frag.childNodes[0].nodeName.toLowerCase(), "div");
            t.assertEquals(frag.childNodes[1].nodeName.toLowerCase(), "div");
            var fragRange = rangeCreator(doc);
            fragRange.selectNodeContents(frag);
            t.assertEquals(fragRange.toString(), range.toString());
        });

        s.test("cloneContents 2", function(t) {
            var range = rangeCreator(doc);
            range.setStart(t.nodes.plainText, 1);
            range.setEnd(t.nodes.plainText, 2);
            var frag = range.cloneContents();
            t.assertEquals(frag.nodeType, 11);
            t.assertEquals(frag.childNodes.length, 1);
            t.assertEquals(frag.firstChild.nodeType, 3);
            t.assertEquals(frag.firstChild.data, "l");
            t.assertEquals(t.nodes.plainText.data, "plain");
            t.assertEquals(t.nodes.plainText.nextSibling.nodeType, 1);
        });

        s.test("extractContents in single text node", function(t) {
            var range = rangeCreator(doc);
            t.nodes.div.innerHTML = "<p>1 2 <span>3</span> 4 5</p>";
            var p = t.nodes.div.firstChild;
            range.setStart(p.firstChild, 2);
            range.setEnd(p.lastChild, 2);
            var frag = range.extractContents();
            var container = doc.createElement("div");
            container.appendChild(frag);
            t.assertEquals(container.innerHTML, "2 <span>3</span> 4");
            t.assertEquals(t.nodes.div.innerHTML, "<p>1  5</p>");
        });

        s.test("extractContents inside paragraph (issue 163)", function(t) {
            var range = rangeCreator(doc);
            range.setStart(t.nodes.plainText, 1);
            range.setEnd(t.nodes.plainText, 2);
            var frag = range.extractContents();
            t.assertEquals(frag.nodeType, 11);
            t.assertEquals(frag.childNodes.length, 1);
            t.assertEquals(frag.firstChild.nodeType, 3);
            t.assertEquals(frag.firstChild.data, "l");
            t.assertEquals(t.nodes.plainText.data, "pain");
            t.assertEquals(t.nodes.plainText.nextSibling.nodeType, 1);
        });

        s.test("deleteContents in single text node", function(t) {
            var range = rangeCreator(doc);
            range.setStart(t.nodes.plainText, 1);
            range.setEnd(t.nodes.plainText, 2);
            range.deleteContents();
            t.assertEquals(t.nodes.plainText.data, "pain");
            t.assertEquals(t.nodes.plainText.nextSibling.nodeType, 1);
        });

        s.test("toString 1", function(t) {
            var range = rangeCreator(doc);
            range.setStart(t.nodes.plainText, 2);
            range.setEnd(t.nodes.b, 1);
            t.assertEquals("ainbold", range.toString());
        });

        s.test("createContextualFragment 1", function(t) {
            var range = rangeCreator(doc);
            range.selectNodeContents(t.nodes.plainText);
            var frag = range.createContextualFragment("<div>Test</div>");
            t.assertEquals(frag.childNodes.length, 1);
            t.assertEquals(frag.firstChild.nodeName.toLowerCase(), "div");
            t.assertEquals(frag.firstChild.firstChild.data, "Test");
        });

        s.test("selectNode 1", function(t) {
            var range = rangeCreator(doc);
            range.selectNode(t.nodes.plainText);
            t.assertEquals(range.toString(), t.nodes.plainText.data);
            t.assertEquals(range.startContainer, t.nodes.div);
            t.assertEquals(range.startOffset, 0);
            t.assertEquals(range.endContainer, t.nodes.div);
            t.assertEquals(range.endOffset, 1);
        });

        s.test("selectNode 2", function(t) {
            var range = rangeCreator(doc);
            range.selectNode(t.nodes.b);
            t.assertEquals(range.startContainer, t.nodes.div);
            t.assertEquals(range.startOffset, 1);
            t.assertEquals(range.endContainer, t.nodes.div);
            t.assertEquals(range.endOffset, 2);
        });

        s.test("selectNodeContents 1", function(t) {
            var range = rangeCreator(doc);
            range.selectNodeContents(t.nodes.plainText);
            t.assertEquals(range.startContainer, t.nodes.plainText);
            t.assertEquals(range.startOffset, 0);
            t.assertEquals(range.endContainer, t.nodes.plainText);
            t.assertEquals(range.endOffset, t.nodes.plainText.length);
            t.assertEquals(range.toString(), t.nodes.plainText.data);
        });

        s.test("selectNodeContents 2", function(t) {
            var range = rangeCreator(doc);
            range.selectNodeContents(t.nodes.b);
            t.assertEquals(range.startContainer, t.nodes.b);
            t.assertEquals(range.startOffset, 0);
            t.assertEquals(range.endContainer, t.nodes.b);
            t.assertEquals(range.endOffset, t.nodes.b.childNodes.length);
        });

        s.test("collapse in element", function(t) {
            var range = rangeCreator(doc);
            range.selectNodeContents(t.nodes.b);
            range.collapse(true);
            t.assert(range.collapsed);
            t.assertEquivalent(range.startContainer, t.nodes.b);
            t.assertEquals(range.startOffset, 0);
            t.assertEquivalent(range.endContainer, t.nodes.b);
            t.assertEquals(range.endOffset, 0);

            range.selectNodeContents(t.nodes.b);
            t.assertFalse(range.collapsed);
            range.collapse(false);
            t.assert(range.collapsed);
            t.assertEquivalent(range.startContainer, t.nodes.b);
            t.assertEquals(range.startOffset, t.nodes.b.childNodes.length);
            t.assertEquivalent(range.endContainer, t.nodes.b);
            t.assertEquals(range.endOffset, t.nodes.b.childNodes.length);
        });

        s.test("collapse in text node", function(t) {
            var range = rangeCreator(doc);
            range.setStart(t.nodes.plainText, 1);
            range.setEnd(t.nodes.plainText, 2);
            range.collapse(true);
            t.assert(range.collapsed);
            t.assertEquivalent(range.startContainer, t.nodes.plainText);
            t.assertEquals(range.startOffset, 1);
            t.assertEquivalent(range.endContainer, t.nodes.plainText);
            t.assertEquals(range.endOffset, 1);

            range.setStart(t.nodes.plainText, 1);
            range.setEnd(t.nodes.plainText, 2);
            t.assertFalse(range.collapsed);
            range.collapse(false);
            t.assert(range.collapsed);
            t.assertEquivalent(range.startContainer, t.nodes.plainText);
            t.assertEquals(range.startOffset, 2);
            t.assertEquivalent(range.endContainer, t.nodes.plainText);
            t.assertEquals(range.endOffset, 2);
        });


        if (testRange.containsNode) {
            s.test("containsNode 1", function(t) {
                var range = rangeCreator(doc);
                range.selectNode(t.nodes.plainText);
                t.assert(range.containsNode(t.nodes.plainText));
                t.assertFalse(range.containsNode(t.nodes.b));
                t.assertFalse(range.containsNode(t.nodes.div));
            });

            s.test("containsNode 2", function(t) {
                var range = rangeCreator(doc);
                range.selectNode(t.nodes.b);
                t.assert(range.containsNode(t.nodes.b));
                t.assert(range.containsNode(t.nodes.boldText));
                t.assert(range.containsNode(t.nodes.boldAndItalicText));
                t.assert(range.containsNode(t.nodes.i));
                t.assertFalse(range.containsNode(t.nodes.plainText));
                t.assertFalse(range.containsNode(t.nodes.div));
            });
        }

        if (testRange.containsNodeContents) {
            s.test("containsNodeContents 1", function(t) {
                var range = rangeCreator(doc);
                range.selectNodeContents(t.nodes.plainText);
                t.assert(range.containsNodeContents(t.nodes.plainText));
                t.assertFalse(range.containsNode(t.nodes.b));
                t.assertFalse(range.containsNode(t.nodes.div));
            });

            s.test("containsNodeContents 2", function(t) {
                var range = rangeCreator(doc);
                range.selectNodeContents(t.nodes.plainText);
                range.setStart(t.nodes.plainText, 1);
                t.assertFalse(range.containsNodeContents(t.nodes.plainText));
            });

            s.test("containsNodeContents 3", function(t) {
                var range = rangeCreator(doc);
                range.selectNodeContents(t.nodes.b);
                t.assert(range.containsNodeContents(t.nodes.b));
                t.assert(range.containsNode(t.nodes.boldText));
                t.assert(range.containsNode(t.nodes.boldAndItalicText));
                t.assert(range.containsNode(t.nodes.i));
                t.assertFalse(range.containsNodeContents(t.nodes.plainText));
                t.assertFalse(range.containsNodeContents(t.nodes.div));
            });
        }

        if (testRange.intersectsNode) {
            s.test("intersectsNode 1", function(t) {
                var range = rangeCreator(doc);
                range.selectNodeContents(t.nodes.b);
                t.assert(range.intersectsNode(t.nodes.b));
            });

            s.test("intersectsNode 2", function(t) {
                var range = rangeCreator(doc);
                range.setStartBefore(t.nodes.b);
                range.collapse(true);
                if (range.intersectsNode.length == 2) {
                    t.assert(range.intersectsNode(t.nodes.b, true));
                }
                t.assertFalse(range.intersectsNode(t.nodes.b));
            });

            s.test("intersectsNode 3", function(t) {
                var range = rangeCreator(doc);
                range.setStart(t.nodes.plainText, t.nodes.plainText.length);
                range.collapse(true);
                t.assertFalse(range.intersectsNode(t.nodes.b));
            });

            s.test("intersectsNode 4", function(t) {
                var range = rangeCreator(doc);
                range.setStart(t.nodes.plainText, 1);
                range.setEnd(t.nodes.boldText, 1);
                t.assert(range.intersectsNode(t.nodes.plainText));
                t.assert(range.intersectsNode(t.nodes.boldText));
                t.assertFalse(range.intersectsNode(t.nodes.boldAndItalicText));
            });

            s.test("intersectsNode orphan node", function(t) {
                var range = rangeCreator(doc);
                var node = doc.createElement("div");
                node.appendChild(doc.createTextNode("test"));
                range.selectNodeContents(node);
                t.assert(range.intersectsNode(node));
                t.assertFalse(range.intersectsNode(t.nodes.boldText));
            });

            s.test("intersectsNode test boundary at end of text node", function(t) {
                var range = rangeCreator(doc);
                range.setStart(t.nodes.plainText, t.nodes.plainText.length);
                range.setEnd(t.nodes.boldText, 1);
                t.assert(range.intersectsNode(t.nodes.plainText));
            });

            s.test("intersectsNode test touching is not intersecting", function(t) {
                var range = rangeCreator(doc);
                range.setStartAfter(t.nodes.plainText);
                range.setEnd(t.nodes.boldText, 1);
                t.assertFalse(range.intersectsNode(t.nodes.plainText));
            });

            if (testRange.intersectsNode.length == 2) {
                s.test("intersectsNode touching is intersecting at start", function(t) {
                    var range = rangeCreator(doc);
                    range.setStart(t.nodes.plainText, 0);
                    range.setEndBefore(t.nodes.boldText);
                    t.assertFalse(range.intersectsNode(t.nodes.boldText));
                    t.assertFalse(range.intersectsNode(t.nodes.boldText, false));
                    t.assert(range.intersectsNode(t.nodes.boldText, true));
                });

                s.test("intersectsNode touching is intersecting at end", function(t) {
                    var range = rangeCreator(doc);
                    range.setStartAfter(t.nodes.plainText);
                    range.setEnd(t.nodes.boldText, 1);
                    t.assertFalse(range.intersectsNode(t.nodes.plainText));
                    t.assertFalse(range.intersectsNode(t.nodes.plainText, false));
                    t.assert(range.intersectsNode(t.nodes.plainText, true));
                });
            }
        }

        if (testRange.intersection) {
            s.test("intersection 1", function(t) {
                var range = rangeCreator(doc);
                range.setStart(t.nodes.plainText, 1);
                range.setEnd(t.nodes.boldText, 1);
                var plainTextRange = range.cloneRange();
                plainTextRange.selectNodeContents(t.nodes.plainText);
                var intersectionRange1 = range.intersection(plainTextRange);
                var intersectionRange2 = plainTextRange.intersection(range);

                t.assertNotNull(intersectionRange1);
                t.assertNotNull(intersectionRange2);
                t.assert(rangy.DomRange.rangesEqual(intersectionRange1, intersectionRange2));

                t.assertEquals(intersectionRange1.startContainer, t.nodes.plainText);
                t.assertEquals(intersectionRange1.startOffset, 1);
                t.assertEquals(intersectionRange1.endContainer, t.nodes.plainText);
                t.assertEquals(intersectionRange1.endOffset, t.nodes.plainText.length);
            });
        }

        if (testRange.union) {
            s.test("union of overlapping ranges in text node", function(t) {
                var r1 = rangeCreator(doc);
                r1.setStart(t.nodes.plainText, 1);
                r1.setEnd(t.nodes.plainText, 3);

                var r2 = rangeCreator(doc);
                r2.setStart(t.nodes.plainText, 2);
                r2.setEnd(t.nodes.plainText, 4);

                var r3 = r1.union(r2), r4 = r2.union(r1);

                t.assert(r3.equals(r4));
                t.assertEquivalent(r3.startContainer, t.nodes.plainText);
                t.assertEquivalent(r3.startOffset, 1);
                t.assertEquivalent(r3.endContainer, t.nodes.plainText);
                t.assertEquivalent(r3.endOffset, 4);
            });

            s.test("union of touching ranges in text node", function(t) {
                var r1 = rangeCreator(doc);
                r1.setStart(t.nodes.plainText, 1);
                r1.setEnd(t.nodes.plainText, 3);

                var r2 = rangeCreator(doc);
                r2.setStart(t.nodes.plainText, 3);
                r2.setEnd(t.nodes.plainText, 4);

                var r3 = r1.union(r2), r4 = r2.union(r1);

                t.assert(r3.equals(r4));
                t.assertEquivalent(r3.startContainer, t.nodes.plainText);
                t.assertEquivalent(r3.startOffset, 1);
                t.assertEquivalent(r3.endContainer, t.nodes.plainText);
                t.assertEquivalent(r3.endOffset, 4);
            });


            s.test("union of non-overlapping ranges in text node", function(t) {
                var r1 = rangeCreator(doc);
                r1.setStart(t.nodes.plainText, 1);
                r1.setEnd(t.nodes.plainText, 2);

                var r2 = rangeCreator(doc);
                r2.setStart(t.nodes.plainText, 3);
                r2.setEnd(t.nodes.plainText, 4);

                t.assertError(function() {
                    var r3 = r1.union(r2);
                });
                t.assertError(function() {
                    var r4 = r2.union(r1);
                });
            });
        }

        if (testRange.containsNodeText) {
            s.test("containsNodeText on node with text", function(t) {
                var range = rangeCreator(doc);
                range.setStart(t.nodes.boldAndItalicText, 0);
                range.setEnd(t.nodes.boldAndItalicText, t.nodes.boldAndItalicText.length);

                t.assertFalse(range.containsNode(t.nodes.i));
                t.assertFalse(range.containsNodeContents(t.nodes.i));
                t.assertTrue(range.containsNodeText(t.nodes.i));
                range.setStart(t.nodes.boldAndItalicText, 1);
                t.assertFalse(range.containsNodeText(t.nodes.i));
            });

            s.test("containsNodeText on node without text", function(t) {
                var br = t.nodes.i.appendChild(doc.createElement("br"));
                var range = rangeCreator(doc);
                range.selectNode(t.nodes.i);

                t.assertTrue(range.containsNode(br));
                t.assertTrue(range.containsNodeContents(br));
                t.assertTrue(range.containsNodeText(br));

                range.selectNodeContents(t.nodes.boldAndItalicText);

                t.assertFalse(range.containsNode(br));
                t.assertFalse(range.containsNodeContents(br));
                t.assertFalse(range.containsNodeText(br));
            });
        }

        // TODO: Write tests for all possible exceptions

        if (testRange.splitBoundaries) {
            s.test("splitBoundaries 'on[e]two' element container", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var text2 = b.appendChild( doc.createTextNode("two") );
                range.setStart(text1, 1);
                range.setEnd(b, 1);
                t.assertEquals("ne", range.toString());
                range.splitBoundaries();
                t.assertEquals("ne", range.toString());

                t.assertEquals(b.childNodes[1], range.startContainer);
                t.assertEquals(0, range.startOffset);
                t.assertEquals(b, range.endContainer);
                t.assertEquals(2, range.endOffset);
            });

            s.test("splitBoundaries 'on[e]two' element container 2", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var text2 = b.appendChild( doc.createTextNode("two") );
                range.setStart(text1, 1);
                range.setEnd(b, 2);
                t.assertEquals("netwo", range.toString());
                range.splitBoundaries();
                t.assertEquals("netwo", range.toString());

                t.assertEquals(b.childNodes[1], range.startContainer);
                t.assertEquals(0, range.startOffset);
                t.assertEquals(b, range.endContainer);
                t.assertEquals(3, range.endOffset);
            });

            function concatRangeTextNodes(range) {
                var text = "";
                var nodes = range.getNodes([3]);
                for (var i = 0, len = nodes.length; i < len; ++i) {
                    text += nodes[i].nodeValue;
                }
                return text;
            }

            s.test("Concatenate getNodes([3]) after splitBoundaries same as toString - simple", function(t) {
                var range = rangeCreator(doc);
                range.setStartAndEnd(t.nodes.plainText, 1, t.nodes.boldText, 3);
                t.assertEquals(concatRangeTextNodes(range), "plainbold");
                range.splitBoundaries();
                t.assertEquals(concatRangeTextNodes(range), "lainbol");
                t.assertEquals(range.toString(), "lainbol");
            });

            s.test("Concatenate getNodes([3]) after splitBoundaries same as toString - end at position 0 in text node (issue 190)", function(t) {
                var range = rangeCreator(doc);
                range.setStartAndEnd(t.nodes.plainText, 1, t.nodes.boldText, 0);
                range.splitBoundaries();
                t.assertEquals(concatRangeTextNodes(range), "lain");
                t.assertEquals(range.toString(), "lain");
            });

            s.test("Concatenate getNodes([3]) after splitBoundaries same as toString - start position at end of text node (issue 190)", function(t) {
                var range = rangeCreator(doc);
                range.setStartAndEnd(t.nodes.plainText, 5, t.nodes.boldText, 3);
                range.splitBoundaries();
                t.assertEquals(concatRangeTextNodes(range), "bol");
                t.assertEquals(range.toString(), "bol");
            });

            s.test("Concatenate getNodes([3]) after splitBoundaries same as toString - start position at end of text node and end at position 0 in text node (issue 190)", function(t) {
                var range = rangeCreator(doc);
                range.setStartAndEnd(t.nodes.plainText, 5, t.nodes.boldText, 0);
                range.splitBoundaries();
                t.assertEquals(concatRangeTextNodes(range), "");
                t.assertEquals(range.toString(), "");
            });
        }

        if (testRange.normalizeBoundaries) {
            s.test("normalizeBoundaries 'one|two' element container", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var text2 = b.appendChild( doc.createTextNode("two") );
                range.collapseToPoint(b, 1);
                range.normalizeBoundaries();
                t.assertEquals(1, b.childNodes.length);
                t.assertEquals("onetwo", b.childNodes[0].data);
                t.assertEquals(text1, b.childNodes[0]);
                t.assertEquals(text1, range.startContainer);
                t.assertEquals(text1, range.endContainer);
                t.assertEquals(3, range.startOffset);
                t.assertEquals(3, range.endOffset);
                t.assert(range.collapsed);
            });

            s.test("normalizeBoundaries 'one|two' one", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var text2 = b.appendChild( doc.createTextNode("two") );
                range.collapseToPoint(text1, 3);
                range.normalizeBoundaries();
                t.assertEquals(1, b.childNodes.length);
                t.assertEquals("onetwo", b.childNodes[0].data);
                t.assertEquals(text1, b.childNodes[0]);
                t.assertEquals(text1, range.startContainer);
                t.assertEquals(text1, range.endContainer);
                t.assertEquals(3, range.startOffset);
                t.assertEquals(3, range.endOffset);
                t.assert(range.collapsed);
            });

            s.test("normalizeBoundaries 'one|two' two", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var text2 = b.appendChild( doc.createTextNode("two") );
                range.collapseToPoint(text2, 0);
                range.normalizeBoundaries();
                t.assertEquals(1, b.childNodes.length);
                t.assertEquals("onetwo", b.childNodes[0].data);
                t.assertEquals(text1, b.childNodes[0]);
                t.assertEquals(text1, range.startContainer);
                t.assertEquals(text1, range.endContainer);
                t.assertEquals(3, range.startOffset);
                t.assertEquals(3, range.endOffset);
                t.assert(range.collapsed);
            });

            s.test("normalizeBoundaries 'one|two|three' 1", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var text2 = b.appendChild( doc.createTextNode("two") );
                var text3 = b.appendChild( doc.createTextNode("three") );

                range.setStart(b, 1);
                range.setEnd(b, 2);
                range.normalizeBoundaries();
                t.assertEquals(1, b.childNodes.length);
                t.assertEquals("onetwothree", b.childNodes[0].data);
                t.assertEquals(text2, b.childNodes[0]);
                t.assertEquals(text2, range.startContainer);
                t.assertEquals(text2, range.endContainer);
                t.assertEquals(3, range.startOffset);
                t.assertEquals(6, range.endOffset);
                t.assertEquals("two", range.toString());
                t.assertFalse(range.collapsed);
            });

            s.test("normalizeBoundaries 'one|two|three' 2", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var text2 = b.appendChild( doc.createTextNode("two") );
                var text3 = b.appendChild( doc.createTextNode("three") );

                range.setStart(b, 1);
                range.setEnd(text2, 3);
                range.normalizeBoundaries();
                t.assertEquals(1, b.childNodes.length);
                t.assertEquals("onetwothree", b.childNodes[0].data);
                t.assertEquals(text2, b.childNodes[0]);
                t.assertEquals(text2, range.startContainer);
                t.assertEquals(text2, range.endContainer);
                t.assertEquals(3, range.startOffset);
                t.assertEquals(6, range.endOffset);
                t.assertEquals("two", range.toString());
                t.assertFalse(range.collapsed);
            });

            s.test("normalizeBoundaries 'one|two|three' 3", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var text2 = b.appendChild( doc.createTextNode("two") );
                var text3 = b.appendChild( doc.createTextNode("three") );

                range.setStart(text2, 0);
                range.setEnd(b, 2);
                range.normalizeBoundaries();
                t.assertEquals(1, b.childNodes.length);
                t.assertEquals("onetwothree", b.childNodes[0].data);
                t.assertEquals(text2, b.childNodes[0]);
                t.assertEquals(text2, range.startContainer);
                t.assertEquals(text2, range.endContainer);
                t.assertEquals(3, range.startOffset);
                t.assertEquals(6, range.endOffset);
                t.assertEquals("two", range.toString());
                t.assertFalse(range.collapsed);
            });

            s.test("normalizeBoundaries 'one|two|three' 4", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var text2 = b.appendChild( doc.createTextNode("two") );
                var text3 = b.appendChild( doc.createTextNode("three") );

                range.setStart(text2, 0);
                range.setEnd(text2, 3);
                range.normalizeBoundaries();
                t.assertEquals(1, b.childNodes.length);
                t.assertEquals("onetwothree", b.childNodes[0].data);
                t.assertEquals(text2, b.childNodes[0]);
                t.assertEquals(text2, range.startContainer);
                t.assertEquals(text2, range.endContainer);
                t.assertEquals(3, range.startOffset);
                t.assertEquals(6, range.endOffset);
                t.assertEquals("two", range.toString());
                t.assertFalse(range.collapsed);
            });

            s.test("normalizeBoundaries 'one||three' 1", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var text2 = b.appendChild( doc.createTextNode("") );
                var text3 = b.appendChild( doc.createTextNode("three") );

                range.setStart(text2, 0);
                range.setEnd(text2, 0);
                range.normalizeBoundaries();
                t.assertEquals(1, b.childNodes.length);
                t.assertEquals("onethree", b.childNodes[0].data);
                t.assertEquals(text2, b.childNodes[0]);
                t.assertEquals(text2, range.startContainer);
                t.assertEquals(text2, range.endContainer);
                t.assertEquals(3, range.startOffset);
                t.assertEquals(3, range.endOffset);
                t.assertEquals("", range.toString());
                t.assertTrue(range.collapsed);
            });

            s.test("normalizeBoundaries 'one||three' 2", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var text2 = b.appendChild( doc.createTextNode("") );
                var text3 = b.appendChild( doc.createTextNode("three") );

                range.setStart(b, 1);
                range.setEnd(b, 1);
                range.normalizeBoundaries();
                t.assertEquals(2, b.childNodes.length);
                t.assertEquals("one", b.childNodes[0].data);
                t.assertEquals("three", b.childNodes[1].data);
                t.assertEquals(text1, b.childNodes[0]);
                t.assertEquals(text3, b.childNodes[1]);
                t.assertEquals(text1, range.startContainer);
                t.assertEquals(text1, range.endContainer);
                t.assertEquals(3, range.startOffset);
                t.assertEquals(3, range.endOffset);
                t.assertEquals("", range.toString());
                t.assertTrue(range.collapsed);
            });

            s.test("normalizeBoundaries 'one||three' 3", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var text2 = b.appendChild( doc.createTextNode("") );
                var text3 = b.appendChild( doc.createTextNode("three") );

                range.setStart(b, 2);
                range.setEnd(b, 2);
                range.normalizeBoundaries();
                t.assertEquals(2, b.childNodes.length);
                t.assertEquals("one", b.childNodes[0].data);
                t.assertEquals("three", b.childNodes[1].data);
                t.assertEquals(text1, b.childNodes[0]);
                t.assertEquals(text2, b.childNodes[1]);
                t.assertEquals(text2, range.startContainer);
                t.assertEquals(text2, range.endContainer);
                t.assertEquals(0, range.startOffset);
                t.assertEquals(0, range.endOffset);
                t.assertEquals("", range.toString());
                t.assertTrue(range.collapsed);
            });

            s.test("normalizeBoundaries 'one||three' 4", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var text2 = b.appendChild( doc.createTextNode("") );
                var text3 = b.appendChild( doc.createTextNode("three") );

                range.setStart(b, 1);
                range.setEnd(b, 2);
                range.normalizeBoundaries();
                t.assertEquals(1, b.childNodes.length);
                t.assertEquals("onethree", b.childNodes[0].data);
                t.assertEquals(text2, b.childNodes[0]);
                t.assertEquals(text2, range.startContainer);
                t.assertEquals(text2, range.endContainer);
                t.assertEquals(3, range.startOffset);
                t.assertEquals(3, range.endOffset);
                t.assertEquals("", range.toString());
                t.assertTrue(range.collapsed);
            });

            s.test("normalizeBoundaries collapsed at start of element first child", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;

                range.collapseToPoint(b, 0);
                range.normalizeBoundaries();
                t.assertEquals(b, range.startContainer);
                t.assertEquals(b, range.endContainer);
                t.assertEquals(0, range.startOffset);
                t.assertEquals(0, range.endOffset);
                t.assertEquals("", range.toString());
                t.assertTrue(range.collapsed);
            });

            s.test("normalizeBoundaries collapsed at start of element text node", function(t) {
                var range = rangeCreator(doc);
                var boldText = t.nodes.boldText;

                range.collapseToPoint(boldText, 0);
                range.normalizeBoundaries();
                t.assertEquals(boldText, range.startContainer);
                t.assertEquals(boldText, range.endContainer);
                t.assertEquals(0, range.startOffset);
                t.assertEquals(0, range.endOffset);
                t.assertEquals("", range.toString());
                t.assertTrue(range.collapsed);
            });

            s.test("normalizeBoundaries collapsed at end of element last child", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var i = b.appendChild( doc.createElement("i") );
                var text2 = i.appendChild( doc.createTextNode("two") );
                var text3 = b.appendChild( doc.createTextNode("three") );

                range.collapseToPoint(i, 1);
                range.normalizeBoundaries();
                t.assertEquals(i, range.startContainer);
                t.assertEquals(i, range.endContainer);
                t.assertEquals(1, range.startOffset);
                t.assertEquals(1, range.endOffset);
                t.assertEquals("", range.toString());
                t.assertTrue(range.collapsed);
            });

            s.test("normalizeBoundaries collapsed at end of element text node", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var i = b.appendChild( doc.createElement("i") );
                var text2 = i.appendChild( doc.createTextNode("two") );
                var text3 = b.appendChild( doc.createTextNode("three") );

                range.collapseToPoint(text2, 3);
                range.normalizeBoundaries();
                t.assertEquals(text2, range.startContainer);
                t.assertEquals(text2, range.endContainer);
                t.assertEquals(3, range.startOffset);
                t.assertEquals(3, range.endOffset);
                t.assertEquals("", range.toString());
                t.assertTrue(range.collapsed);
            });

            s.test("normalizeBoundaries end boundary shift 1 ", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var text2 = b.appendChild( doc.createTextNode("two") );
                var span = b.appendChild( doc.createElement("span") );

                range.setStart(text2, 0);
                range.setEnd(b, 2);
                t.assertEquals(range.toString(), "two");
                range.normalizeBoundaries();
                t.assertEquals(range.toString(), "two");
                t.assertEquals(b.childNodes[0], range.startContainer);
                t.assertEquals(b, range.endContainer);
                t.assertEquals(3, range.startOffset);
                t.assertEquals(1, range.endOffset);
            });

            s.test("normalizeBoundaries end boundary shift 2", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var text2 = b.appendChild( doc.createTextNode("two") );
                var span = b.appendChild( doc.createElement("span") );
                span.innerHTML = "three";

                range.setStart(text2, 0);
                range.setEnd(b, 3);
                t.assertEquals(range.toString(), "twothree");
                range.normalizeBoundaries();
                t.assertEquals(range.toString(), "twothree");
                t.assertEquals(b.childNodes[0], range.startContainer);
                t.assertEquals(b, range.endContainer);
                t.assertEquals(3, range.startOffset);
                t.assertEquals(2, range.endOffset);
            });

            s.test("normalizeBoundaries when collapsed range is at end of text node that is immediately followed by another", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var text2 = b.appendChild( doc.createTextNode("two") );
                range.setStartAndEnd(text1, 3);
                range.normalizeBoundaries();
                t.assertEquals(text1.data, "onetwo");
                t.assertEquals(range.startContainer, text1);
                t.assertEquals(range.startOffset, 3);
                t.assertEquals(range.endContainer, text1);
                t.assertEquals(range.endOffset, 3);
            });

            s.test("normalizeBoundaries when collapsed range is between two text nodes", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var text2 = b.appendChild( doc.createTextNode("two") );
                range.setStartAndEnd(b, 1);
                range.normalizeBoundaries();
                t.assertEquals(text1.data, "onetwo");
                t.assertEquals(range.startContainer, text1);
                t.assertEquals(range.startOffset, 3);
                t.assertEquals(range.endContainer, text1);
                t.assertEquals(range.endOffset, 3);
            });


            s.test("normalizeBoundaries when the end of an uncollapsed range is at end of text node that is immediately followed by another", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var text2 = b.appendChild( doc.createTextNode("two") );
                range.setStartAndEnd(text1, 2, text1, 3);
                range.normalizeBoundaries();
                t.assertEquals(text1.data, "onetwo");
                t.assertEquals(range.startContainer, text1);
                t.assertEquals(range.startOffset, 2);
                t.assertEquals(range.endContainer, text1);
                t.assertEquals(range.endOffset, 3);
            });

            s.test("normalizeBoundaries when the end of an uncollapsed range is between two text nodes", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var text2 = b.appendChild( doc.createTextNode("two") );
                range.setStartAndEnd(text1, 2, b, 1);
                range.normalizeBoundaries();
                t.assertEquals(text1.data, "onetwo");
                t.assertEquals(range.startContainer, text1);
                t.assertEquals(range.startOffset, 2);
                t.assertEquals(range.endContainer, text1);
                t.assertEquals(range.endOffset, 3);
            });

            s.test("normalizeBoundaries when the start of an uncollapsed range is between two text nodes", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var text2 = b.appendChild( doc.createTextNode("two") );
                range.setStartAndEnd(b, 1, text2, 1);
                range.normalizeBoundaries();
                t.assertEquals(text2.data, "onetwo");
                t.assertEquals(range.startContainer, text2);
                t.assertEquals(range.startOffset, 3);
                t.assertEquals(range.endContainer, text2);
                t.assertEquals(range.endOffset, 4);
            });

            s.test("normalizeBoundaries when the start of an uncollapsed range is at start of text node that is immediately preceded by another", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var text2 = b.appendChild( doc.createTextNode("two") );
                range.setStartAndEnd(b, 1, text2, 1);
                range.normalizeBoundaries();
                t.assertEquals(text2.data, "onetwo");
                t.assertEquals(range.startContainer, text2);
                t.assertEquals(range.startOffset, 3);
                t.assertEquals(range.endContainer, text2);
                t.assertEquals(range.endOffset, 4);
            });

            s.test("normalizeBoundaries when the start of an uncollapsed range is at end of text node that is immediately followed by another", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var text2 = b.appendChild( doc.createTextNode("two") );
                range.setStartAndEnd(text1, 3, text2, 1);
                range.normalizeBoundaries();
                t.assertEquals(text1.data, "onetwo");
                t.assertEquals(range.startContainer, text1);
                t.assertEquals(range.startOffset, 3);
                t.assertEquals(range.endContainer, text1);
                t.assertEquals(range.endOffset, 4);
            });

            s.test("normalizeBoundaries when the end of an uncollapsed range is at start of text node that is immediately preceded by another", function(t) {
                var range = rangeCreator(doc);
                var b = t.nodes.b;
                b.innerHTML = "";
                var text1 = b.appendChild( doc.createTextNode("one") );
                var text2 = b.appendChild( doc.createTextNode("two") );
                range.setStartAndEnd(text1, 2, text2, 0);
                range.normalizeBoundaries();
                t.assertEquals(text1.data, "onetwo");
                t.assertEquals(range.startContainer, text1);
                t.assertEquals(range.startOffset, 2);
                t.assertEquals(range.endContainer, text1);
                t.assertEquals(range.endOffset, 3);
            });
        }

        if (testRange.createContextualFragment) {
            s.test("createContextualFragment create b fragment in xmp", function(t) {
                var range = rangeCreator(doc);
                var el = doc.createElement("xmp");
                var textNode = doc.createTextNode("foo");
                el.appendChild(textNode);
                doc.body.appendChild(el);

                range.setStart(textNode, 1);
                range.setEnd(textNode, 2);
                var frag = range.createContextualFragment("<b>abc</b>");
                var nodeType = frag.firstChild.nodeType;
                doc.body.removeChild(el);

                t.assertEquals(nodeType, 3);
            });

            s.test("createContextualFragment create b fragment in div", function(t) {
                var range = rangeCreator(doc);
                var el = doc.createElement("div");
                var textNode =  doc.createTextNode("foo");
                el.appendChild(textNode);
                doc.body.appendChild(el);

                range.setStart(textNode, 1);
                range.setEnd(textNode, 2);
                var frag = range.createContextualFragment("<b>abc</b>");
                var nodeType = frag.firstChild.nodeType;
                doc.body.removeChild(el);

                t.assertEquals(nodeType, 1);
            });
        }

        if (testRange.containsRange) {
            s.test("containsRange positive test", function(t) {
                var range1 = rangeCreator(doc);
                range1.selectNode(t.nodes.b);

                var range2 = rangeCreator(doc);
                range2.selectNode(t.nodes.i);

                t.assert(range1.containsRange(range2));
                t.assertFalse(range2.containsRange(range1));
            });

            s.test("containsRange negative test", function(t) {
                var range1 = rangeCreator(doc);
                range1.selectNode(t.nodes.plainText);

                var range2 = rangeCreator(doc);
                range2.selectNode(t.nodes.i);

                t.assertFalse(range1.containsRange(range2));
                t.assertFalse(range2.containsRange(range1));
            });
        }
    }, false);
}

function testAcid3(rangeCreator, rangeCreatorName) {
    xn.test.suite("Acid 3 tests for " + rangeCreatorName, function(s) {
        // Tests adapted from Acid3 Range tests at http://acid3.acidtests.org/

        s.test("Acid3 test 7: basic ranges initial position tests", function(t) {
            var r = rangeCreator(document);
            t.assert(r, "range not created");
            t.assert(r.collapsed, "new range wasn't collapsed");
            t.assertEquals(r.commonAncestorContainer, document, "new range's common ancestor wasn't the document");
            t.assertEquals(r.startContainer, document, "new range's start container wasn't the document");
            t.assertEquals(r.startOffset, 0, "new range's start offset wasn't zero");
            t.assertEquals(r.endContainer, document, "new range's end container wasn't the document");
            t.assertEquals(r.endOffset, 0, "new range's end offset wasn't zero");
            t.assert(r.cloneContents(), "cloneContents() didn't return an object");
            t.assertEquals(r.cloneContents().childNodes.length, 0, "nothing cloned was more than nothing");
            t.assertEquals(r.cloneRange().toString(), "", "nothing cloned stringifed to more than nothing");
            r.collapse(true); // no effect
            t.assertEquals(r.compareBoundaryPoints(r.START_TO_END, r.cloneRange()), 0, "starting boundary point of range wasn't the same as the end boundary point of the clone range");
            r.deleteContents(); // no effect
            t.assertEquals(r.extractContents().childNodes.length, 0, "nothing removed was more than nothing");
            var endOffset = r.endOffset;
            r.insertNode(document.createComment("commented inserted to test ranges"));
            r.setEnd(r.endContainer, endOffset + 1); // added to work around spec bug that smaug is blocking the errata for
            try {
                t.assert(!r.collapsed, "range with inserted comment is collapsed");
                log.info(r);
                t.assertEquals(r.commonAncestorContainer, document, "range with inserted comment has common ancestor that isn't the document");
                t.assertEquals(r.startContainer, document, "range with inserted comment has start container that isn't the document");
                t.assertEquals(r.startOffset, 0, "range with inserted comment has start offset that isn't zero");
                t.assertEquals(r.endContainer, document, "range with inserted comment has end container that isn't the document");
                t.assertEquals(r.endOffset, 1, "range with inserted comment has end offset that isn't after the comment");
            } finally {
                document.removeChild(document.firstChild);
            }
        });

        s.test("Acid3 test 8: moving boundary points", function(t) {
            // test 8: moving boundary points
            var doc;
            if (document.implementation && document.implementation.createDocument) {
                doc = document.implementation.createDocument(null, null, null);
            } else if (window.ActiveXObject) {
                doc = new ActiveXObject("MSXML2.DOMDocument");
            }
            var root = doc.createElement("root");
            doc.appendChild(root);
            var e1 = doc.createElement("e");
            root.appendChild(e1);
            var e2 = doc.createElement("e");
            root.appendChild(e2);
            var e3 = doc.createElement("e");
            root.appendChild(e3);
            var r = rangeCreator(doc);
            r.setStart(e2, 0);
            r.setEnd(e3, 0);
            t.assert(!r.collapsed, "non-empty range claims to be collapsed");
            r.setEnd(e1, 0);
            t.assert(r.collapsed, "setEnd() didn't collapse the range");
            t.assertEquals(r.startContainer, e1, "startContainer is wrong after setEnd()");
            t.assertEquals(r.startOffset, 0, "startOffset is wrong after setEnd()");
            t.assertEquals(r.endContainer, e1, "endContainer is wrong after setEnd()");
            t.assertEquals(r.endOffset, 0, "endOffset is wrong after setEnd()");
            r.setStartBefore(e3);
            t.assert(r.collapsed, "setStartBefore() didn't collapse the range");
            t.assertEquals(r.startContainer, root, "startContainer is wrong after setStartBefore()");
            t.assertEquals(r.startOffset, 2, "startOffset is wrong after setStartBefore()");
            t.assertEquals(r.endContainer, root, "endContainer is wrong after setStartBefore()");
            t.assertEquals(r.endOffset, 2, "endOffset is wrong after setStartBefore()");
            r.setEndAfter(root);
            t.assert(!r.collapsed, "setEndAfter() didn't uncollapse the range");
            t.assertEquals(r.startContainer, root, "startContainer is wrong after setEndAfter()");
            t.assertEquals(r.startOffset, 2, "startOffset is wrong after setEndAfter()");
            t.assertEquals(r.endContainer, doc, "endContainer is wrong after setEndAfter()");
            t.assertEquals(r.endOffset, 1, "endOffset is wrong after setEndAfter()");
            r.setStartAfter(e2);
            t.assert(!r.collapsed, "setStartAfter() collapsed the range");
            t.assertEquals(r.startContainer, root, "startContainer is wrong after setStartAfter()");
            t.assertEquals(r.startOffset, 2, "startOffset is wrong after setStartAfter()");
            t.assertEquals(r.endContainer, doc, "endContainer is wrong after setStartAfter()");
            t.assertEquals(r.endOffset, 1, "endOffset is wrong after setStartAfter()");
            var msg = '';
            try {
                r.setEndBefore(doc);
                msg = "no exception thrown for setEndBefore() the document itself";
            } catch (e) {
                /*
                This section is now commented out in 2011 Acid3 update

                if (e.BAD_BOUNDARYPOINTS_ERR != 1)
                  msg = 'not a RangeException';
                else if (e.INVALID_NODE_TYPE_ERR != 2)
                  msg = 'RangeException has no INVALID_NODE_TYPE_ERR';
                else if ("INVALID_ACCESS_ERR" in e)
                  msg = 'RangeException has DOMException constants';
                else*/ if (e.code != e.INVALID_NODE_TYPE_ERR)
                  msg = 'wrong exception raised from setEndBefore()';
            }
            t.assert(msg == "", msg);
            t.assert(!r.collapsed, "setEndBefore() collapsed the range");
            t.assertEquals(r.startContainer, root, "startContainer is wrong after setEndBefore()");
            t.assertEquals(r.startOffset, 2, "startOffset is wrong after setEndBefore()");
            t.assertEquals(r.endContainer, doc, "endContainer is wrong after setEndBefore()");
            t.assertEquals(r.endOffset, 1, "endOffset is wrong after setEndBefore()");
            r.collapse(false);
            t.assert(r.collapsed, "collapse() collapsed the range");
            t.assertEquals(r.startContainer, doc, "startContainer is wrong after collapse()");
            t.assertEquals(r.startOffset, 1, "startOffset is wrong after collapse()");
            t.assertEquals(r.endContainer, doc, "endContainer is wrong after collapse()");
            t.assertEquals(r.endOffset, 1, "endOffset is wrong after collapse()");
            r.selectNodeContents(root);
            t.assert(!r.collapsed, "collapsed is wrong after selectNodeContents()");
            t.assertEquals(r.startContainer, root, "startContainer is wrong after selectNodeContents()");
            t.assertEquals(r.startOffset, 0, "startOffset is wrong after selectNodeContents()");
            t.assertEquals(r.endContainer, root, "endContainer is wrong after selectNodeContents()");
            t.assertEquals(r.endOffset, 3, "endOffset is wrong after selectNodeContents()");
            r.selectNode(e2);
            t.assert(!r.collapsed, "collapsed is wrong after selectNode()");
            t.assertEquals(r.startContainer, root, "startContainer is wrong after selectNode()");
            t.assertEquals(r.startOffset, 1, "startOffset is wrong after selectNode()");
            t.assertEquals(r.endContainer, root, "endContainer is wrong after selectNode()");
            t.assertEquals(r.endOffset, 2, "endOffset is wrong after selectNode()");
        });

        function getTestDocument() {
            var iframe = document.getElementById("selectors");
            var doc = iframe.contentDocument || iframe.contentWindow.document;
            for (var i = doc.documentElement.childNodes.length-1; i >= 0; i -= 1) {
                doc.documentElement.removeChild(doc.documentElement.childNodes[i]);
            }
            doc.documentElement.appendChild(doc.createElement('head'));
            doc.documentElement.firstChild.appendChild(doc.createElement('title'));
            doc.documentElement.appendChild(doc.createElement('body'));
            return doc;
        }

        s.test("Acid3 test 9: extractContents() in a Document", function(t) {
            var doc = getTestDocument();
            var h1 = doc.createElement('h1');
            var t1 = doc.createTextNode('Hello ');
            h1.appendChild(t1);
            var em = doc.createElement('em');
            var t2 = doc.createTextNode('Wonderful');
            em.appendChild(t2);
            h1.appendChild(em);
            var t3 = doc.createTextNode(' Kitty');
            h1.appendChild(t3);
            doc.body.appendChild(h1);
            var p = doc.createElement('p');
            var t4 = doc.createTextNode('How are you?');
            p.appendChild(t4);
            doc.body.appendChild(p);
            var r = rangeCreator(doc);
            r.selectNodeContents(doc);
            t.assertEquals(r.toString(), "Hello Wonderful KittyHow are you?", "toString() on range selecting Document gave wrong output: " + r.toString());
            r.setStart(t2, 6);
            r.setEnd(p, 0);
            // <body><h1>Hello <em>Wonder ful<\em> Kitty<\h1><p> How are you?<\p><\body>     (the '\'s are to avoid validation errors)
            //                           ^----------------------^
            t.assertEquals(r.toString(), "ful Kitty", "toString() on range crossing text nodes gave wrong output");
            var f = r.extractContents();
            // <h1><em>ful<\em> Kitty<\h1><p><\p>
            // ccccccccccccccccMMMMMMcccccccccccc
            t.assertEquals(f.nodeType, 11, "failure 1");
            t.assert(f.childNodes.length == 2, "expected two children in the result, got " + f.childNodes.length);
            t.assertEquals(f.childNodes[0].tagName, "H1", "failure 3");
            t.assert(f.childNodes[0] != h1, "failure 4");
            t.assertEquals(f.childNodes[0].childNodes.length, 2, "failure 5");
            t.assertEquals(f.childNodes[0].childNodes[0].tagName, "EM", "failure 6");
            t.assert(f.childNodes[0].childNodes[0] != em, "failure 7");
            t.assertEquals(f.childNodes[0].childNodes[0].childNodes.length, 1, "failure 8");
            t.assertEquals(f.childNodes[0].childNodes[0].childNodes[0].data, "ful", "failure 9");
            t.assert(f.childNodes[0].childNodes[0].childNodes[0] != t2, "failure 10");
            t.assertEquals(f.childNodes[0].childNodes[1], t3, "failure 11");
            t.assert(f.childNodes[0].childNodes[1] != em, "failure 12");
            t.assertEquals(f.childNodes[1].tagName, "P", "failure 13");
            t.assertEquals(f.childNodes[1].childNodes.length, 0, "failure 14");
            t.assert(f.childNodes[1] != p, "failure 15");
        });

        s.test("Acid3 test 10: Ranges and Attribute Nodes", function(t) {
            // test 10: Ranges and Attribute Nodes
            // COMMENTED OUT FOR 2011 UPDATE - turns out instead of dropping Attr entirely, as Acid3 originally expected, the API is just being refactored
            /*
            var e = document.getElementById('test');
            if (!e.getAttributeNode) {
                return; // support for attribute nodes is optional in Acid3, because attribute nodes might be removed from DOM Core in the future.
            }
            // however, if they're supported, they'd better work:
            var a = e.getAttributeNode('id');
            var r = rangeCreator(document);
            r.selectNodeContents(a);
            t.assertEquals(r.toString(), "test", "toString() didn't work for attribute node");
            var t2 = a.firstChild;
            var f = r.extractContents();
            t.assertEquals(f.childNodes.length, 1, "extracted contents were the wrong length");
            t.assertEquals(f.childNodes[0], t2, "extracted contents were the wrong node");
            t.assertEquals(t2.textContent, 'test', "extracted contents didn't match old attribute value");
            t.assertEquals(r.toString(), '', "extracting contents didn't empty attribute value; instead equals '" + r.toString() + "'");
            t.assertEquals(e.getAttribute('id'), '', "extracting contents didn't change 'id' attribute to empty string");
            e.id = 'test';
            */
        });

        s.test("Acid3 test 11: Ranges and Comments", function(t) {
            // test 11: Ranges and Comments
            var msg;
            var doc = getTestDocument();
            var c1 = doc.createComment("11111");
            doc.appendChild(c1);
            var r = rangeCreator(doc);
            r.selectNode(c1);
            msg = 'wrong exception raised';
            try {
                r.surroundContents(doc.createElement('a'));
                msg = 'no exception raised';
            } catch (e) {
                if ('code' in e) msg += '; code = ' + e.code;
                if (e.code == 3) msg = '';
            }
            t.assert(msg == '', "when inserting <a> into Document with another child: " + msg);
            var c2 = doc.createComment("22222");
            doc.body.appendChild(c2);
            var c3 = doc.createComment("33333");
            doc.body.appendChild(c3);
            r.setStart(c2, 2);
            r.setEnd(c3, 3);
            msg = 'wrong exception raised';
            try {
                r.surroundContents(doc.createElement('a'));
                msg = 'no exception raised';
            } catch (e) {
                // COMMENTED OUT FOR 2011 UPDATE - DOM Core changes the exception from RangeException.BAD_BOUNDARYPOINTS_ERR (1) to DOMException.INVALID_STATE_ERR (11)
                /*if ('code' in e) msg += '; code = ' + e.code;
                if (e.code == 1) */msg = '';
            }
            t.assert(msg == '', "when trying to surround two halves of comment: " + msg);
            t.assertEquals(r.toString(), "", "comments returned text");
        });

        s.test("Acid3 test 12: Ranges under mutations: insertion into text nodes", function(t) {
            var doc = getTestDocument();
            var p = doc.createElement('p');
            var t1 = doc.createTextNode('12345');
            p.appendChild(t1);
            var t2 = doc.createTextNode('ABCDE');
            p.appendChild(t2);
            doc.body.appendChild(p);
            var r = rangeCreator(doc);
            r.setStart(p.firstChild, 2);
            r.setEnd(p.firstChild, 3);
            t.assert(!r.collapsed, "collapsed is wrong at start");
            t.assertEquals(r.commonAncestorContainer, p.firstChild, "commonAncestorContainer is wrong at start");
            t.assertEquals(r.startContainer, p.firstChild, "startContainer is wrong at start");
            t.assertEquals(r.startOffset, 2, "startOffset is wrong at start");
            t.assertEquals(r.endContainer, p.firstChild, "endContainer is wrong at start");
            t.assertEquals(r.endOffset, 3, "endOffset is wrong at start");
            t.assertEquals(r.toString(), "3", "range in text node stringification failed");
            r.insertNode(p.lastChild);
            t.assertEquals(p.childNodes.length, 3, "insertion of node made wrong number of child nodes");
            t.assertEquals(p.childNodes[0], t1, "unexpected first text node");
            t.assertEquals(p.childNodes[0].data, "12", "unexpected first text node contents");
            t.assertEquals(p.childNodes[1], t2, "unexpected second text node");
            t.assertEquals(p.childNodes[1].data, "ABCDE", "unexpected second text node");
            t.assertEquals(p.childNodes[2].data, "345", "unexpected third text node contents");
            // The spec is very vague about what exactly should be in the range afterwards:
            // the insertion results in a splitText(), which it says is equivalent to a truncation
            // followed by an insertion, but it doesn't say what to do when you have a truncation,
            // so we don't know where either the start or the end boundary points end up.
            // The spec really should be clarified for how to handle splitText() and
            // text node truncation in general
            // The only thing that seems very clear is that the inserted text node should
            // be in the range, and it has to be at the start, since insertion always puts it at
            // the start.

            // Tim's note: I disagree with the conclusions the following tests draw from the spec, so they are removed
/*
            t.assert(!r.collapsed, "collapsed is wrong after insertion");
            t.assert(r.toString().match(/^ABCDE/), "range didn't start with the expected text; range stringified to '" + r.toString() + "'");
*/
        });

        // Mutation handling not yet implemented

/*    s.test("Acid3 test 13: Ranges under mutations: deletion", function(t) {
        var doc = getTestDocument();
        var p = doc.createElement('p');
        p.appendChild(doc.createTextNode("12345"));
        doc.body.appendChild(p);
        var r = rangeCreator(doc);
        r.setEnd(doc.body, 1);
        r.setStart(p.firstChild, 2);
        t.assert(!r.collapsed, "collapsed is wrong at start");
        t.assertEquals(r.commonAncestorContainer, doc.body, "commonAncestorContainer is wrong at start");
        t.assertEquals(r.startContainer, p.firstChild, "startContainer is wrong at start");
        t.assertEquals(r.startOffset, 2, "startOffset is wrong at start");
        t.assertEquals(r.endContainer, doc.body, "endContainer is wrong at start");
        t.assertEquals(r.endOffset, 1, "endOffset is wrong at start");
        doc.body.removeChild(p);
        t.assert(r.collapsed, "collapsed is wrong after deletion");
        t.assertEquals(r.commonAncestorContainer, doc.body, "commonAncestorContainer is wrong after deletion");
        t.assertEquals(r.startContainer, doc.body, "startContainer is wrong after deletion");
        t.assertEquals(r.startOffset, 0, "startOffset is wrong after deletion");
        t.assertEquals(r.endContainer, doc.body, "endContainer is wrong after deletion");
        t.assertEquals(r.endOffset, 0, "endOffset is wrong after deletion");
    });*/

    }, false);
}

testRangeCreator([document], "main", createRangyRange, "Rangy Range");
testRangeCreator([document], "main", createWrappedNativeDomRange, "Wrapped native Range");

if (hasNativeDomRange) {
    testRangeCreator([document], "main", createNativeDomRange, "native Range");
}

var iframeDoc = [];
testRangeCreator(iframeDoc, "iframe", createRangyRange, "Rangy Range");
testRangeCreator(iframeDoc, "iframe", createWrappedNativeDomRange, "Wrapped native Range");

if (hasNativeDomRange) {
    testRangeCreator(iframeDoc, "iframe", createNativeDomRange, "native Range");
}

var iframeEl;

xn.addEventListener(window, "load", function() {
    // Do it in an iframe
    iframeEl = document.body.appendChild(document.createElement("iframe"));
    var doc = iframeEl.contentDocument || iframeEl.contentWindow.document;
    doc.open();
    doc.write("<html><head><title>Rangy Test</title></head><body>Content</body></html>");
    doc.close();
    iframeDoc[0] = doc;
});

testAcid3(createRangyRange, "Rangy Range");
testAcid3(createWrappedNativeDomRange, "Wrapped native Range");

if (hasNativeDomRange) {
    testAcid3(createNativeDomRange, "native Range");
}

var hasRangyRangePrototype = "rangePrototype" in rangy;
rangy.rangePrototype.preInitTest = function() {
    return true;
};


xn.test.suite("Range miscellaneous", function(s) {
    s.test("rangy.rangePrototype existence test", function(t) {
        t.assert(hasRangyRangePrototype);
    });

    s.test("Range prototype pre-init extension", function(t) {
        t.assert(rangy.createRange().preInitTest(), "test");
    });

    s.test("Range prototype extension", function(t) {
        rangy.rangePrototype.fooBar = "test";

        t.assertEquals(rangy.createRange().fooBar, "test");
        t.assertEquals(rangy.createRangyRange().fooBar, "test");
    });

    function testRangeDoc(t, range, doc) {
        t.assertEquals(rangy.dom.getDocument(range.startContainer), doc);
    }

    s.test("createRange() parameter tests", function(t) {
        var range = rangy.createRange();
        testRangeDoc(t, range, document);

        range = rangy.createRange(document);
        testRangeDoc(t, range, document);

        range = rangy.createRange(window);
        testRangeDoc(t, range, document);

        range = rangy.createRange(document.body);
        testRangeDoc(t, range, document);

        range = rangy.createRange(document.firstChild);
        testRangeDoc(t, range, document);

        t.assertError(function() {
            range = rangy.createRange({});
        });
    });

    s.test("iframe createRange() parameter tests", function(t) {
        var doc = rangy.dom.getIframeDocument(iframeEl);

        var range = rangy.createRange(doc);
        testRangeDoc(t, range, doc);

        range = rangy.createRange(rangy.dom.getIframeWindow(iframeEl));
        testRangeDoc(t, range, doc);

        range = rangy.createRange(iframeEl);
        testRangeDoc(t, range, doc);

        range = rangy.createRange(doc.body);
        testRangeDoc(t, range, doc);

        range = rangy.createRange(doc.firstChild);
        testRangeDoc(t, range, doc);

        range = rangy.createRange(iframeEl.parentNode);
        testRangeDoc(t, range, document);
    });
}, false);