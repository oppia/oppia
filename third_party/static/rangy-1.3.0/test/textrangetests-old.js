xn.test.suite("Text Range module tests", function(s) {
    var DomPosition = rangy.dom.DomPosition;
    var textRange = rangy.textRange;

    var el = document.createElement("div");
    el.innerHTML = "1  2";
    var textNodeSpacesCollapsed = (el.firstChild.length == 3);

    function testRangeBoundaries(t, range, startNode, startOffset, endNode, endOffset) {
        t.assertEquals(range.startContainer, startNode);
        t.assertEquals(range.startOffset, startOffset);
        t.assertEquals(range.endContainer, endNode);
        t.assertEquals(range.endOffset, endOffset);
    }

    function testCollapsedRangeBoundaries(t, range, startNode, startOffset) {
        t.assertEquals(range.startContainer, startNode);
        t.assertEquals(range.startOffset, startOffset);
        t.assert(range.collapsed);
    }

    s.setUp = function(t) {
        t.el = document.getElementById("test");
    };

    s.tearDown = function(t) {
        t.el.innerHTML = "";
    };

    s.test("Next/previous node tests", function(t) {
        var div0 = document.createElement("div");
        var text1_1 = div0.appendChild(document.createTextNode("1"));
        var b1 = div0.appendChild(document.createElement("b"));
        var text2 = b1.appendChild(document.createTextNode("2"));
        var i2 = b1.appendChild(document.createElement("i"));
        var text3 = i2.appendChild(document.createTextNode("3"));
        var text1_2 = div0.appendChild(document.createTextNode("1"));

        var nexts = [], next = div0;
        while ( (next = rangy.dom.nextNode(next)) ) {
            nexts.push(next);
        }

        t.assertArraysEquivalent(nexts, [text1_1, b1, text2, i2, text3, text1_2]);

        var previouses = [], previous = text1_2;
        while ( (previous = rangy.dom.previousNode(previous)) ) {
            previouses.push(previous);
        }

        t.assertArraysEquivalent(previouses.slice(0, 6), [text3, i2, text2, b1, text1_1, div0]);
    });

    s.test("nextPosition and previousPosition", function(t) {
        t.el.innerHTML = "<div>1<b>2<br><span></span>33</b>4</div>";

        var div = t.el.getElementsByTagName("div")[0];
        var text1 = div.firstChild;
        var b = text1.nextSibling;
        var t2 = b.firstChild;
        var br = t2.nextSibling;
        var span = br.nextSibling;
        var t3 = b.lastChild;
        var t4 = div.lastChild;

        var positions = [
            [div, 0],
            [text1, 0],
            [text1, 1],
            [div, 1],
            [b, 0],
            [t2, 0],
            [t2, 1],
            [b, 1],
            [b, 2],
            [span, 0],
            [b, 3],
            [t3, 0],
            [t3, 1],
            [t3, 2],
            [b, 4],
            [div, 2],
            [t4, 0],
            [t4, 1],
            [div, 3],
            [t.el, 1]
        ];

        var pos = new DomPosition(t.el, 0);

        // First forwards...
        for (var i = 0; i < positions.length; ++i) {
            pos = textRange.nextPosition(pos);
            t.assertEquals(pos.node, positions[i][0]);
            t.assertEquals(pos.offset, positions[i][1]);
        }

        // ... now backwards
        for (i = positions.length - 2; i >= 0; --i) {
            pos = textRange.previousPosition(pos);
            t.assertEquals(pos.node, positions[i][0]);
            t.assertEquals(pos.offset, positions[i][1]);
        }
    });

    s.test("isCollapsedWhitespaceNode", function(t) {
        t.el.innerHTML = '<div><span>1</span> </div>';
        if (t.el.firstChild.lastChild) {
            t.assert(rangy.textRange.isCollapsedWhitespaceNode(t.el.firstChild.lastChild));

        } else {
            // IE < 9 case
            //t.assertEquals(t.el.childNodes.length, 2);
        }
    });

    /*
        s.test("isCollapsedWhitespaceNode", function(t) {
            t.el.innerHTML = '<div>1</div> <div>2</div>';
            if (t.el.childNodes[1].nodeType == 3) {
                t.assert(rangy.textRange.isCollapsedWhitespaceNode(t.el.childNodes[1]));
    
            } else {
                // IE < 9 case
                t.assertEquals(t.el.childNodes.length, 2);
            }
        });
    */

    s.test("VisiblePositionIterator", function(t) {
        t.el.innerHTML = '<div>1<b style="display: none">2<br></b><script>var foo = 1</script><span></span><br></div><div>2</div>';

        var div1 = t.el.getElementsByTagName("div")[0];
        var text1 = div1.firstChild;
        var b = text1.nextSibling;
        var br = t.el.getElementsByTagName("br")[0];
        var span = t.el.getElementsByTagName("span")[0];
        var div2 = t.el.getElementsByTagName("div")[1];
        var text2 = div2.firstChild;

        var positions = [
            [div1, 0],
            [text1, 0],
            [text1, 1],
            [div1, 1],
            [div1, 2],
            [div1, 3],
            [span, 0],
            [div1, 4],
            [div1, 5],
            [t.el, 1],
            [div2, 0],
            [text2, 0],
            [text2, 1],
            [div2, 1],
            [t.el, 2]
        ];

        var pos = new DomPosition(t.el, 0);

        // First forwards...
        for (var i = 0; i < positions.length; ++i) {
            pos = textRange.nextVisiblePosition(pos);
            t.assertEquals(pos.node, positions[i][0]);
            t.assertEquals(pos.offset, positions[i][1]);
        }

        // ... now backwards
        for (i = positions.length - 2; i >= 0; --i) {
            pos = textRange.previousVisiblePosition(pos);
            t.assertEquals(pos.node, positions[i][0]);
            t.assertEquals(pos.offset, positions[i][1]);
        }
    });

    s.test("hasInnerText", function(t) {
        t.el.innerHTML = '<div></div><div> </div><div>1</div><div style="display: none">2</div><div class="xn_test_hidden">3</div>';
        var divs = t.el.getElementsByTagName("div");
        t.assertFalse(rangy.dom.hasInnerText(divs[0]));
        t.assertFalse(rangy.dom.hasInnerText(divs[1]));
        t.assertTrue(rangy.dom.hasInnerText(divs[2]));
        t.assertFalse(rangy.dom.hasInnerText(divs[3]));
        t.assertFalse(rangy.dom.hasInnerText(divs[4]));
    });

    s.test("innerText on simple text", function(t) {
        t.el.innerHTML = 'One Two';
        t.assertEquals(rangy.innerText(t.el), "One Two");
    });

    s.test("innerText on simple text with double space", function(t) {
        t.el.innerHTML = 'One  Two';
        t.assertEquals(rangy.innerText(t.el), "One Two");
    });

    s.test("innerText on simple text with triple space", function(t) {
        t.el.innerHTML = 'One   Two';
        t.assertEquals(rangy.innerText(t.el), "One Two");
    });

    s.test("innerText on simple text with non-breaking space", function(t) {
        t.el.innerHTML = 'One &nbsp; Two';
        t.assertEquals(rangy.innerText(t.el), "One \u00a0 Two");
    });

    s.test("innerText on simple text with leading space", function(t) {
        t.el.innerHTML = ' One Two';
        t.assertEquals(rangy.innerText(t.el), "One Two");
    });

    s.test("innerText on simple text with trailing space", function(t) {
        t.el.innerHTML = 'One Two ';
        var expectedText = rangy.features.trailingSpaceInBlockCollapses ? "One Two" : "One Two ";
        t.assertEquals(rangy.innerText(t.el), expectedText);
        t.assertEquals(rangy.innerText(t.el, {
            collapseSpaceBeforeLineBreak: false
        }), "One Two ");
    });

    s.test("innerText on simple text with two trailing spaces", function(t) {
        t.el.innerHTML = '1  ';
        t.assertEquals(rangy.innerText(t.el), "1");
    });

    s.test("innerText on simple text with leading space in span", function(t) {
        t.el.innerHTML = '<span> </span>One Two';
        t.assertEquals(rangy.innerText(t.el), "One Two");
    });

    s.test("innerText on simple text with trailing space in span", function(t) {
        t.el.innerHTML = 'One Two<span> </span>';
        t.assertEquals(rangy.innerText(t.el), "One Two");
    });

    s.test("innerText on simple text with non-breaking space in span", function(t) {
        t.el.innerHTML = '1 <span>&nbsp; </span>2';
        t.assertEquals(rangy.innerText(t.el), "1 \u00a0 2");
    });

    s.test("innerText on simple text with non-breaking space in span 2", function(t) {
        t.el.innerHTML = '1<span> &nbsp; </span>2';
        t.assertEquals(rangy.innerText(t.el), "1 \u00a0 2");
    });

    s.test("innerText on simple text with non-breaking space in span 3", function(t) {
        t.el.innerHTML = '1<span> &nbsp;</span> 2';
        t.assertEquals(rangy.innerText(t.el), "1 \u00a0 2");
    });

    s.test("innerText on one paragraph", function(t) {
        t.el.innerHTML = '<p>1</p>';
        t.assertEquals(rangy.innerText(t.el), "1");
    });

    s.test("innerText on two paragraphs", function(t) {
        t.el.innerHTML = '<p>1</p><p>2</p>';
        t.assertEquals(rangy.innerText(t.el), "1\n2");
    });

    s.test("innerText on two paragraphs separated by spaces", function(t) {
        t.el.innerHTML = '<p>1</p>\n<p>2</p>';
        t.assertEquals(rangy.innerText(t.el), "1\n2");
    });

    s.test("innerText on two paragraphs with container", function(t) {
        t.el.innerHTML = '<div><p>1</p><p>2</p></div>';
        t.assertEquals(rangy.innerText(t.el), "1\n2");
    });

    s.test("innerText on table", function(t) {
        t.el.innerHTML = '<table><tr><td>1</td><td>2</td></tr><tr><td>3</td><td>4</td></tr></table>';
        t.assertEquals(rangy.innerText(t.el), "1\t2\n3\t4");
    });

    s.test("innerText with hidden p element", function(t) {
        t.el.innerHTML = '<p>1</p><p style="display: none">2</p><p>3</p>';
        t.assertEquals(rangy.innerText(t.el), "1\n3");
    });

    s.test("innerText with invisible p", function(t) {
        t.el.innerHTML = '<p>1</p><p style="visibility: hidden">2</p><p>3</p>';
        t.assertEquals(rangy.innerText(t.el), "1\n3");
    });

    s.test("innerText on paragraph with uncollapsed br", function(t) {
        t.el.innerHTML = '<p>1<br>2</p>';
        t.assertEquals(rangy.innerText(t.el), "1\n2");
    });

    s.test("innerText on paragraph with two uncollapsed brs", function(t) {
        t.el.innerHTML = '<p>1<br><br>2</p>';
        t.assertEquals(rangy.innerText(t.el), "1\n\n2");
    });

    s.test("innerText on paragraph with uncollapsed br preceded by space", function(t) {
        t.el.innerHTML = '<p>1 <br>2</p>';
        t.assertEquals(rangy.innerText(t.el), "1\n2");
    });

    s.test("innerText on two paragraphs with collapsed br", function(t) {
        t.el.innerHTML = '<p>1<br></p><p>2</p>';
        t.assertEquals(rangy.innerText(t.el), "1\n2");
    });

    s.test("innerText one paragraph with collapsed br ", function(t) {
        t.el.innerHTML = '<p>1<br></p>';
        t.assertEquals(rangy.innerText(t.el), "1");
    });

    s.test("innerText on empty element", function(t) {
        t.el.innerHTML = '';
        t.assertEquals(rangy.innerText(t.el), "");
    });

    s.test("innerText on text node followed by block element", function(t) {
        t.el.innerHTML = '1<div>2</div>';
        t.assertEquals(rangy.innerText(t.el), "1\n2");
    });

    s.test("innerText on two consecutive block elements", function(t) {
        t.el.innerHTML = '<div>1</div><div>2</div>';
        t.assertEquals(rangy.innerText(t.el), "1\n2");
    });

    s.test("innerText on two block elements separated by a space", function(t) {
        t.el.innerHTML = '<div>1</div> <div>2</div>';
        t.assertEquals(rangy.innerText(t.el), "1\n2");
    });

    s.test("innerText() on block element with leading space", function(t) {
        t.el.innerHTML = '<p contenteditable="true"> One</p>';
        var p = t.el.getElementsByTagName("p")[0];
        t.assertEquals(rangy.innerText(p), "One");
    });

    s.test("innerText() on block element with leading space following block element", function(t) {
        t.el.innerHTML = '<div>1</div><div> 2</div>';
        t.assertEquals(rangy.innerText(t.el), "1\n2");
    });

    s.test("innerText() on block element with leading space following block element and a space", function(t) {
        t.el.innerHTML = '<div>1</div> <div> 2</div>';
        t.assertEquals(rangy.innerText(t.el), "1\n2");
    });

    s.test("innerText() on block element with leading space and preceding text", function(t) {
        t.el.innerHTML = '1<p contenteditable="true"> One</p>';
        var p = t.el.getElementsByTagName("p")[0];
        t.assertEquals(rangy.innerText(p), "One");
    });

    s.test("range text() on collapsed range", function(t) {
        t.el.innerHTML = '12345';
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.collapseToPoint(textNode, 1);
        t.assertEquals(range.text(), "");
    });

    s.test("range text() on empty range", function(t) {
        t.el.innerHTML = '<span style="display: none">one</span>';
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.selectNodeContents(t.el);
        t.assertEquals(range.text(), "");
    });

    s.test("range text() on simple text", function(t) {
        t.el.innerHTML = '12345';
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.selectNodeContents(t.el);
        t.assertEquals(range.text(), "12345");

        range.setStart(textNode, 1);
        range.setEnd(textNode, 4);
        t.assertEquals(range.text(), "234");
    });

    if (!textNodeSpacesCollapsed) {
        s.test("range text() on simple text with double space", function(t) {
            t.el.innerHTML = '12  34';
            var textNode = t.el.firstChild;
            var range = rangy.createRange();
            range.setStart(textNode, 1);
            range.setEnd(textNode, 5);
            t.assertEquals(range.text(), "2 3");
        });
    }

    s.test("range move() on block inside block (issue 114)", function(t) {
        t.el.innerHTML = '<div>1<div>2</div></div>';
        var firstTextNode = t.el.firstChild.firstChild;
        var innerDiv = firstTextNode.nextSibling;
        var secondTextNode = innerDiv.firstChild;
        var range = rangy.createRange();
        range.collapseToPoint(firstTextNode, 1);
        range.move("character", 1);
        var newRange = range.cloneRange();
        newRange.move("character", 1);

        t.assertEquals(range.startContainer, secondTextNode);
        t.assertEquals(range.startOffset, 0);
    });

    s.test("range move() on block inside block inside block (issue 114)", function(t) {
        t.el.innerHTML = '<div>1<div><div>2</div></div></div>';
        var firstTextNode = t.el.firstChild.firstChild;
        var innerDiv = firstTextNode.nextSibling;
        var secondTextNode = innerDiv.firstChild.firstChild;
        var range = rangy.createRange();
        range.collapseToPoint(firstTextNode, 1);
        range.move("character", 1);
        var newRange = range.cloneRange();
        newRange.move("character", 1);

        t.assertEquals(range.startContainer, secondTextNode);
        t.assertEquals(range.startOffset, 0);
    });

/*
    s.test("selection move() on block inside block (issue 114)", function(t) {
        t.el.innerHTML = '<div>1<div>2</div></div>';
        var firstTextNode = t.el.firstChild.firstChild;
        var range = rangy.createRange();
        range.collapseToPoint(firstTextNode, 1);
        var selRange = range.cloneRange();

        var sel = rangy.getSelection();
        sel.addRange(range);
        sel.move("character", 1);
        selRange.setEnd(sel.focusNode, sel.focusOffset);
        t.assertEquals(selRange.text(), "\n");

        sel.move("character", 1);
        selRange.setEnd(sel.focusNode, sel.focusOffset);
        t.assertEquals(selRange.text(), "\n2");
    });
*/

    s.test("selectCharacters on text node", function(t) {
        t.el.innerHTML = 'One Two';
        var range = rangy.createRange();
        var textNode = t.el.firstChild;

        range.selectCharacters(t.el, 2, 5);
        testRangeBoundaries(t, range, textNode, 2, textNode, 5);
        t.assertEquals(range.text(), "e T");
    });

    if (!textNodeSpacesCollapsed) {
        s.test("selectCharacters on text node with double space", function(t) {
            t.el.innerHTML = 'One  Two';
            var range = rangy.createRange();
            var textNode = t.el.firstChild;

            range.selectCharacters(t.el, 2, 5);
            testRangeBoundaries(t, range, textNode, 2, textNode, 6);
            t.assertEquals(range.text(), "e T");
        });
    }

    if (!textNodeSpacesCollapsed) {
        s.test("toCharacterRange in text node with collapsed spaces", function(t) {
            t.el.innerHTML = ' One  Two';
            var range = rangy.createRange();
            var textNode = t.el.firstChild;

            range.setStart(textNode, 3);
            range.setEnd(textNode, 7);

            var charRange = range.toCharacterRange(t.el);
            t.assertEquals(charRange.start, 2);
            t.assertEquals(charRange.end, 5);
        });
    }

    s.test("moveStart on text node", function(t) {
        t.el.innerHTML = 'One Two';
        var range = rangy.createRange();
        range.selectNodeContents(t.el);

        var charsMoved = range.moveStart("character", 2);
        t.assertEquals(charsMoved, 2);
        t.assertEquals(range.startContainer, t.el.firstChild);
        t.assertEquals(range.startOffset, 2);
        t.assertEquals(range.text(), "e Two");

        charsMoved = range.moveStart("character", 2);
        t.assertEquals(charsMoved, 2);
        t.assertEquals(range.startContainer, t.el.firstChild);
        t.assertEquals(range.startOffset, 4);
        t.assertEquals(range.text(), "Two");
    });

    s.test("moveStart with no unit on text node", function(t) {
        t.el.innerHTML = 'One Two';
        var range = rangy.createRange();
        range.selectNodeContents(t.el);

        var charsMoved = range.moveStart(2);
        t.assertEquals(charsMoved, 2);
        t.assertEquals(range.startContainer, t.el.firstChild);
        t.assertEquals(range.startOffset, 2);
        t.assertEquals(range.text(), "e Two");

        charsMoved = range.moveStart(2);
        t.assertEquals(charsMoved, 2);
        t.assertEquals(range.startContainer, t.el.firstChild);
        t.assertEquals(range.startOffset, 4);
        t.assertEquals(range.text(), "Two");
    });

    s.test("moveStart on text node, negative move", function(t) {
        t.el.innerHTML = 'One Two';
        var range = rangy.createRange();
        var textNode = t.el.firstChild;
        range.collapseToPoint(textNode, 7);

        var charsMoved = range.moveStart("character", -2);
        t.assertEquals(charsMoved, -2);
        t.assertEquals(range.startContainer, textNode);
        t.assertEquals(range.startOffset, 5);
        
        return;
        t.assertEquals(range.text(), "wo");

        charsMoved = range.moveStart("character", -2);
        t.assertEquals(charsMoved, -2);
        t.assertEquals(range.startContainer, textNode);
        t.assertEquals(range.startOffset, 3);
        t.assertEquals(range.text(), " Two");
    });

    s.test("moveEnd on text node", function(t) {
        t.el.innerHTML = 'One Two';
        var range = rangy.createRange();
        var textNode = t.el.firstChild;
        range.selectNodeContents(textNode);

        var charsMoved = range.moveEnd("character", -2);
        t.assertEquals(charsMoved, -2);
        testRangeBoundaries(t, range, textNode, 0, textNode, 5);
        t.assertEquals(range.text(), "One T");

        charsMoved = range.moveEnd("character", -2);
        t.assertEquals(charsMoved, -2);
        testRangeBoundaries(t, range, textNode, 0, textNode, 3);
        t.assertEquals(range.text(), "One");
    });

    s.test("moveEnd with no unit on text node", function(t) {
        t.el.innerHTML = 'One Two';
        var range = rangy.createRange();
        var textNode = t.el.firstChild;
        range.selectNodeContents(textNode);

        var charsMoved = range.moveEnd(-2);
        t.assertEquals(charsMoved, -2);
        testRangeBoundaries(t, range, textNode, 0, textNode, 5);
        t.assertEquals(range.text(), "One T");

        charsMoved = range.moveEnd(-2);
        t.assertEquals(charsMoved, -2);
        testRangeBoundaries(t, range, textNode, 0, textNode, 3);
        t.assertEquals(range.text(), "One");
    });

    s.test("moveStart, moveEnd words on text node", function(t) {
        t.el.innerHTML = 'one two three';
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.setStart(textNode, 5);
        range.setEnd(textNode, 6);

        var wordsMoved = range.moveStart("word", -1);
        t.assertEquals(wordsMoved, -1);
        testRangeBoundaries(t, range, textNode, 4, textNode, 6);
        t.assertEquals(range.text(), "tw");

        wordsMoved = range.moveEnd("word", 1);
        t.assertEquals(wordsMoved, 1);
        testRangeBoundaries(t, range, textNode, 4, textNode, 7);
        t.assertEquals(range.text(), "two");
    });

    s.test("moveStart words with apostrophe on text node", function(t) {
        t.el.innerHTML = "one don't two";
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.setStart(textNode, 5);
        range.setEnd(textNode, 9);

        var wordsMoved = range.moveStart("word", -1);
        t.assertEquals(wordsMoved, -1);
        testRangeBoundaries(t, range, textNode, 4, textNode, 9);
        t.assertEquals(range.text(), "don't");

        wordsMoved = range.moveEnd("word", 1);
        t.assertEquals(wordsMoved, 1);
        testRangeBoundaries(t, range, textNode, 4, textNode, 13);
        t.assertEquals(range.text(), "don't two");
    });

    s.test("moveStart words on text node", function(t) {
        t.el.innerHTML = 'one two three';
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.collapseToPoint(textNode, 1);

        var wordsMoved = range.moveStart("word", 1);

        t.assertEquals(wordsMoved, 1);
        t.assertEquals(range.startContainer, textNode);
        t.assertEquals(range.startOffset, 3);
        t.assert(range.collapsed);
        //t.assertEquals(range.text(), "");

        wordsMoved = range.moveStart("word", 1);
        t.assertEquals(wordsMoved, 1);
        t.assertEquals(range.startContainer, textNode);
        t.assertEquals(range.startOffset, 7);
        //t.assertEquals(range.text(), "");

        wordsMoved = range.moveStart("word", 1);
        t.assertEquals(wordsMoved, 1);
        t.assertEquals(range.startContainer, textNode);
        t.assertEquals(range.startOffset, 13);
        //t.assertEquals(range.text(), "");
    });

    s.test("moveEnd negative words on text node", function(t) {
        t.el.innerHTML = 'one two three';
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.collapseToPoint(textNode, 9);

        var wordsMoved = range.moveEnd("word", -1);

        t.assertEquals(wordsMoved, -1);
        t.assertEquals(range.startContainer, textNode);
        t.assertEquals(range.startOffset, 8);
        t.assert(range.collapsed);

        wordsMoved = range.moveEnd("word", -1);
        t.assertEquals(wordsMoved, -1);
        t.assertEquals(range.startContainer, textNode);
        t.assertEquals(range.startOffset, 4);
        //t.assertEquals(range.text(), "");

        wordsMoved = range.moveEnd("word", -1);
        t.assertEquals(wordsMoved, -1);
        t.assertEquals(range.startContainer, textNode);
        t.assertEquals(range.startOffset, 0);
        //t.assertEquals(range.text(), "");
    });

    s.test("moveStart two words on text node", function(t) {
        t.el.innerHTML = 'one two three';
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.collapseToPoint(textNode, 1);

        var wordsMoved = range.moveStart("word", 2);
        t.assertEquals(wordsMoved, 2);
        testCollapsedRangeBoundaries(t, range, textNode, 7);
        t.assertEquals(range.text(), "");
    });

    s.test("moveEnd including trailing space on text node", function(t) {
        t.el.innerHTML = 'one two. three';
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.collapseToPoint(textNode, 0);

        var wordsMoved = range.moveEnd("word", 1, { includeTrailingSpace: true });
        t.assertEquals(wordsMoved, 1);
        t.assertEquals(range.endContainer, textNode);
        t.assertEquals(range.endOffset, 4);
        t.assertEquals(range.text(), "one ");

        wordsMoved = range.moveEnd("word", 1, { includeTrailingSpace: true });
        t.assertEquals(wordsMoved, 1);
        t.assertEquals(range.endContainer, textNode);
        t.assertEquals(range.endOffset, 7);
        t.assertEquals(range.text(), "one two");

        wordsMoved = range.moveEnd("word", 1, { includeTrailingSpace: true });
        t.assertEquals(wordsMoved, 1);
        t.assertEquals(range.endContainer, textNode);
        t.assertEquals(range.endOffset, 14);
        t.assertEquals(range.text(), "one two. three");
    });

/*
    s.test("moveEnd including trailing punctuation on text node", function(t) {
        t.el.innerHTML = 'one!! two!! three!! four!!';
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.collapseToPoint(textNode, 0);

        var wordsMoved = range.moveEnd("word", 1, { includeTrailingPunctuation: true });
        t.assertEquals(wordsMoved, 1);
        t.assertEquals(range.endContainer, textNode);
        t.assertEquals(range.endOffset, 5);
        t.assertEquals(range.text(), "one!!");

        wordsMoved = range.moveEnd("word", 1, { includeTrailingPunctuation: true, includeTrailingSpace: true });
        t.assertEquals(wordsMoved, 1);
        t.assertEquals(range.endContainer, textNode);
        t.assertEquals(range.endOffset, 12);
        t.assertEquals(range.text(), "one!! two!! ");

        wordsMoved = range.moveEnd("word", 1, { includeTrailingSpace: true });
        t.assertEquals(wordsMoved, 1);
        t.assertEquals(range.endContainer, textNode);
        t.assertEquals(range.endOffset, 17);
        t.assertEquals(range.text(), "one!! two!! three");

        wordsMoved = range.moveEnd("word", 1, { includeTrailingPunctuation: true });
        t.assertEquals(wordsMoved, 1);
        t.assertEquals(range.endContainer, textNode);
        t.assertEquals(range.endOffset, 26);
        t.assertEquals(range.text(), "one!! two!! three!! four!!");
    });
*/

    s.test("moveStart characters with br", function(t) {
        t.el.innerHTML = '1<br>2';
        var textNode1 = t.el.firstChild, textNode2 = t.el.lastChild;
        var range = rangy.createRange();
        range.collapseToPoint(textNode1, 0);

        var charsMoved = range.moveStart("character", 1);
        t.assertEquals(charsMoved, 1);
        testCollapsedRangeBoundaries(t, range, textNode1, 1);

        charsMoved = range.moveStart("character", 1);
        t.assertEquals(charsMoved, 1);
        testCollapsedRangeBoundaries(t, range, t.el, 2);

        charsMoved = range.moveStart("character", 1);
        testCollapsedRangeBoundaries(t, range, textNode2, 1);
    });

    s.test("expand in text node", function(t) {
        t.el.innerHTML = 'One two three';
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.setStart(textNode, 5);
        range.setEnd(textNode, 6);

        t.assert(range.expand("word"));
        testRangeBoundaries(t, range, textNode, 4, textNode, 7);
    });

    s.test("expand in text node, include trailing space", function(t) {
        t.el.innerHTML = 'One two three';
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.collapseToPoint(textNode, 5);

        t.assert(range.expand("word", { includeTrailingSpace: true }));
        testRangeBoundaries(t, range, textNode, 4, textNode, 8);
    });

    s.test("expand in text node, start of word", function(t) {
        t.el.innerHTML = 'One two three';
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.collapseToPoint(textNode, 4);

        t.assert(range.expand("word"));
        testRangeBoundaries(t, range, textNode, 4, textNode, 7);
    });

    s.test("expand in text node, mid-capitalized word", function(t) {
        t.el.innerHTML = 'One Two three';
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.collapseToPoint(textNode, 5);

        t.assert(range.expand("word"));
        testRangeBoundaries(t, range, textNode, 4, textNode, 7);
    });

    s.test("expand in text node, around word", function(t) {
        t.el.innerHTML = 'One two three';
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.setStart(textNode, 4);
        range.setEnd(textNode, 7);

        t.assertFalse(range.expand("word"));
        testRangeBoundaries(t, range, textNode, 4, textNode, 7);
    });

    s.test("expand in text node, non-move test return value", function(t) {
        t.el.innerHTML = 'One Two three';
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.setStart(textNode, 4);
        range.setEnd(textNode, 7);

        t.assertFalse(range.expand("word"));
        testRangeBoundaries(t, range, textNode, 4, textNode, 7);
    });

    s.test("findText simple text", function(t) {
        t.el.innerHTML = 'One Two three';
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.collapseToPoint(textNode, 0);

        var scopeRange = rangy.createRange();
        scopeRange.selectNodeContents(t.el);
        var options = {
            withinRange: scopeRange
        };

        t.assert(range.findText("Two", options));
        testRangeBoundaries(t, range, textNode, 4, textNode, 7);
        range.collapse(false);
        t.assertFalse(range.findText("Two", options));
    });

    s.test("findText simple text no wrap", function(t) {
        t.el.innerHTML = 'Two One Two three';
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.collapseToPoint(textNode, 3);

        var scopeRange = rangy.createRange();
        scopeRange.selectNodeContents(t.el);
        var options = {
            withinRange: scopeRange
        };

        t.assert(range.findText("Two", options));
        testRangeBoundaries(t, range, textNode, 8, textNode, 11);
        range.collapse(false);
        t.assertFalse(range.findText("Two", options));
    });

    s.test("findText simple text wrap", function(t) {
        t.el.innerHTML = 'Two One Two three';
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.collapseToPoint(textNode, 3);

        var scopeRange = rangy.createRange();
        scopeRange.selectNodeContents(t.el);
        var options = {
            withinRange: scopeRange,
            wrap: true
        };

        t.assert(range.findText("Two", options));
        testRangeBoundaries(t, range, textNode, 8, textNode, 11);
        range.collapse(false);

        t.assert(range.findText("Two", options));
        testRangeBoundaries(t, range, textNode, 0, textNode, 3);
        range.collapse(false);
    });

    s.test("findText simple text wrap mid-word", function(t) {
        t.el.innerHTML = 'Two One Two three';
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.collapseToPoint(textNode, 9);

        var scopeRange = rangy.createRange();
        scopeRange.selectNodeContents(t.el);
        var options = {
            withinRange: scopeRange,
            wrap: true
        };

        t.assert(range.findText("Two", options));
        testRangeBoundaries(t, range, textNode, 0, textNode, 3);
        range.collapse(false);

        t.assert(range.findText("Two", options));
        testRangeBoundaries(t, range, textNode, 8, textNode, 11);
        range.collapse(false);
    });

    s.test("findText regex", function(t) {
        t.el.innerHTML = 'One Two three';
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.collapseToPoint(textNode, 0);

        var scopeRange = rangy.createRange();
        scopeRange.selectNodeContents(t.el);
        var options = {
            withinRange: scopeRange
        };

        t.assert(range.findText(/\w+/, options));
        testRangeBoundaries(t, range, textNode, 0, textNode, 3);
        range.collapse(false);

        t.assert(range.findText(/\w+/, options));
        testRangeBoundaries(t, range, textNode, 4, textNode, 7);
        range.collapse(false);

        t.assert(range.findText(/\w+/, options));
        testRangeBoundaries(t, range, textNode, 8, textNode, 13);
        range.collapse(false);

        t.assertFalse(range.findText(/\w+/, options));
    });

    s.test("findText simple text backwards", function(t) {
        t.el.innerHTML = 'One Two three Two';
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.collapseToPoint(textNode, 8);

        var scopeRange = rangy.createRange();
        scopeRange.selectNodeContents(t.el);
        var options = {
            withinRange: scopeRange,
            direction: "backward"
        };

        t.assert(range.findText("Two", options));
        testRangeBoundaries(t, range, textNode, 4, textNode, 7);
        range.collapse(true);

        t.assertFalse(range.findText("Two", options));
    });

    s.test("findText simple text backwards wrapped", function(t) {
        t.el.innerHTML = 'One Two three Two';
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.collapseToPoint(textNode, 8);

        var scopeRange = rangy.createRange();
        scopeRange.selectNodeContents(t.el);
        var options = {
            withinRange: scopeRange,
            direction: "backward",
            wrap: true
        };

        t.assert(range.findText("Two", options));
        testRangeBoundaries(t, range, textNode, 4, textNode, 7);
        range.collapse(true);

        t.assert(range.findText("Two", options));
        testRangeBoundaries(t, range, textNode, 14, textNode, 17);
    });

    s.test("createWordIterator", function(t) {
        t.el.innerHTML = 'One two three; four';

        var iterator = rangy.createWordIterator(t.el.firstChild, 10);

        t.assertEquals(iterator.next().toString(), "three");
        t.assertEquals(iterator.next().toString(), "; ");
        t.assertEquals(iterator.next().toString(), "four");
        iterator.dispose();

        iterator = rangy.createWordIterator(t.el.firstChild, 10, "backward");

        t.assertEquals(iterator.next().toString(), "three");
        t.assertEquals(iterator.next().toString(), " ");
        t.assertEquals(iterator.next().toString(), "two");
        t.assertEquals(iterator.next().toString(), " ");
        t.assertEquals(iterator.next().toString(), "One");
    });

    s.test("moveStart word document start boundary test", function(t) {
        var range = rangy.createRange();
        range.collapseBefore(document.body);

        while (range.moveStart("word", -1)) {}
    });

    s.test("moveEnd word document end boundary test", function(t) {
        var range = rangy.createRange();
        range.collapseAfter(document.body);

        while (range.moveStart("word", 1)) {}
    });

    s.test("trimStart test", function(t) {
        t.el.innerHTML = 'One two three';
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.setStartAndEnd(textNode, 3, 8);
        range.trimStart();
        t.assertEquals(range.startOffset, 4);
        t.assertEquals(range.endOffset, 8);
        range.trimStart();
        t.assertEquals(range.startOffset, 4);
        t.assertEquals(range.endOffset, 8);

        t.el.innerHTML = 'One&nbsp;&nbsp;two three';
        range.selectCharacters(t.el, 3, 8);
        t.assertEquals(range.text(), "\u00a0\u00a0two");

        var charRange = range.toCharacterRange();

        range.trimStart();
        t.assertEquals(range.text(), "two");

        var trimmedCharRange = range.toCharacterRange();
        t.assertEquals(charRange.start, 3);
        t.assertEquals(charRange.end, 8);
        t.assertEquals(trimmedCharRange.start, 5);
        t.assertEquals(trimmedCharRange.end, 8);
    });

    s.test("trimEnd test", function(t) {
        t.el.innerHTML = 'One two three';
        var textNode = t.el.firstChild;
        var range = rangy.createRange();
        range.setStartAndEnd(textNode, 3, 8);
        range.trimEnd();
        t.assertEquals(range.startOffset, 3);
        t.assertEquals(range.endOffset, 7);
        range.trimEnd();
        t.assertEquals(range.startOffset, 3);
        t.assertEquals(range.endOffset, 7);

        t.el.innerHTML = 'One two&nbsp;&nbsp;three';
        range.selectCharacters(t.el, 4, 9);
        t.assertEquals(range.text(), "two\u00a0\u00a0");

        var charRange = range.toCharacterRange();

        range.trimEnd();
        t.assertEquals(range.text(), "two");

        var trimmedCharRange = range.toCharacterRange();
        t.assertEquals(charRange.start, 4);
        t.assertEquals(charRange.end, 9);
        t.assertEquals(trimmedCharRange.start, 4);
        t.assertEquals(trimmedCharRange.end, 7);
    });

    s.test("Speed test", function(t) {
        //t.el.innerHTML = new Array(10000).join("<p>One <b>two <i>three</i></b> four<br> </p>\n<p>four </p>");
        var range = rangy.createRange();
        var text = range.text();
    });

}, false);
