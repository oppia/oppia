var rangyTestUtils = (function() {
    function createNodeTree(levels, copiesPerLevel) {
        function createTestNodes(parentNode, limit, copies) {
            if (limit > 0) {
                var n = parentNode.appendChild(document.createElement("div"));
                n.appendChild(document.createTextNode("Before "));
                var p = n.appendChild(document.createElement("div"));
                n.appendChild(document.createTextNode(" after"));
                for (var i = 0; i < copies; i++) {
                    createTestNodes(p, limit - 1, copies);
                }
            }
        }

        var testNode = document.createElement("div");
        createTestNodes(testNode, levels, copiesPerLevel);

        return testNode;
    }

    var nextIterationId = 1;
    var nodeIterationIds = new Hashtable();

    function iterateNodes(node, func, includeSelf, iterationId) {
        if (!iterationId) {
            iterationId = nextIterationId++;
        }
        if (nodeIterationIds.get(node) == iterationId) {
            throw new Error("Node already iterated: " + rangy.dom.inspectNode(node));
        }
        if (includeSelf) {
            func(node);
        }
        nodeIterationIds.put(node, iterationId);
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

    function createRangeInHtml(containerEl, html) {
        containerEl.innerHTML = html;
        var range = rangy.createRange(), foundStart = false;
        var rangeInfo = new RangeInfo();
        iterateNodes(containerEl, function(node) {
            if (node.nodeType == 3) {
                var openBracketIndex = node.data.indexOf("[");
                if (openBracketIndex != -1) {
                    node.data = node.data.slice(0, openBracketIndex) + node.data.slice(openBracketIndex + 1);
                    rangeInfo.setStart(node, openBracketIndex);
                    foundStart = true;
                }

                var pipeIndex = node.data.indexOf("|");
                if (pipeIndex == 0) {
                    node.data = node.data.slice(1);
                    rangeInfo[foundStart ? "setEnd" : "setStart"](node.parentNode, rangy.dom.getNodeIndex(node));
                    foundStart = true;
                } else if (pipeIndex == node.length - 1) {
                    node.data = node.data.slice(0, -1);
                    rangeInfo[foundStart ? "setEnd" : "setStart"](node.parentNode, rangy.dom.getNodeIndex(node) + 1);
                    foundStart = true;
                }

                var closeBracketIndex = node.data.indexOf("]");
                if (closeBracketIndex != -1) {
                    node.data = node.data.slice(0, closeBracketIndex) + node.data.slice(closeBracketIndex + 1);
                    rangeInfo.setEnd(node, closeBracketIndex);
                }

                pipeIndex = node.data.indexOf("|");
                if (pipeIndex == 0) {
                    node.data = node.data.slice(1);
                    rangeInfo.setEnd(node.parentNode, rangy.dom.getNodeIndex(node));
                } else if (pipeIndex == node.length - 1) {
                    node.data = node.data.slice(0, -1);
                    rangeInfo.setEnd(node.parentNode, rangy.dom.getNodeIndex(node) + 1);
                }

                // Clear empty text node
                if (node.data.length == 0) {
                    node.parentNode.removeChild(node);
                }
            }
        }, false);

        range.setStart(rangeInfo.sc, rangeInfo.so);
        range.setEnd(rangeInfo.ec, rangeInfo.eo);

        return range;
    }

    function getSortedClassName(el) {
        return el.className.split(/\s+/).sort().join(" ");
    }

    // Puts ranges in order, last in document first.
    function compareRanges(r1, r2) {
        return r2.compareBoundaryPoints(r1.START_TO_START, r1);
    }

    function htmlAndRangeToString(containerEl, range) {
        function isElementRangeBoundary(el, offset, range, isStart) {
            var prefix = isStart ? "start" : "end";
            return (el == range[prefix + "Container"] && offset == range[prefix + "Offset"]);
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
                    if (node.href) {
                        html += ' href="' + node.href + '"';
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
                    if (isElementRangeBoundary(node, i, range, true)) {
                        html += "|";
                    }
                    if (isElementRangeBoundary(node, i, range, false)) {
                        html += "|";
                    }
                    if (i != len) {
                        html += getHtml(children[i], true);
                    }
                }

                if (includeSelf) {
                    html += "</" + node.tagName.toLowerCase() + ">";
                }
            } else if (includeSelf && node.nodeType == 3) {
                var text = node.data;
                if (node == range.endContainer) {
                    text = text.slice(0, range.endOffset) + "]" + text.slice(range.endOffset);
                }
                if (node == range.startContainer) {
                    text = text.slice(0, range.startOffset) + "[" + text.slice(range.startOffset);
                }

                html += text;
            }
            return html;
        }

        return getHtml(containerEl, false);
    }


    return {
        createNodeTree: createNodeTree,
        RangeInfo: RangeInfo,
        iterateNodes: iterateNodes,
        createRangeInHtml: createRangeInHtml,
        getSortedClassName: getSortedClassName,
        htmlAndRangeToString: htmlAndRangeToString
    }

})();
