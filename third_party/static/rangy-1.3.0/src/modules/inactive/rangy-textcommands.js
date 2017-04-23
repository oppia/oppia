/**
 * Text Commands module for Rangy.
 * A generic framework for creating text mutation commands for Ranges and Selections
 *
 * Part of Rangy, a cross-browser JavaScript range and selection library
 * https://github.com/timdown/rangy
 *
 * Depends on Rangy core.
 *
 * Copyright %%build:year%%, Tim Down
 * Licensed under the MIT license.
 * Version: %%build:version%%
 * Build date: %%build:date%%
 */
rangy.createModule("TextCommands", ["WrappedSelection"], function(api, module) {
    var dom = api.dom;

    var log = log4javascript.getLogger("rangy.textcommands");

    var tagName = "span", BOOLEAN = "boolean", UNDEF = "undefined";

    function trim(str) {
        return str.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
    }

    function hasClass(el, className) {
        return el.className && new RegExp("(?:^|\\s)" + className + "(?:\\s|$)").test(el.className);
    }

    function addClass(el, className) {
        if (el.className) {
            if (!hasClass(el, className)) {
                el.className += " " + className;
            }
        } else {
            el.className = className;
        }
    }

    var removeClass = (function() {
        function replacer(matched, whitespaceBefore, whitespaceAfter) {
            return (whitespaceBefore && whitespaceAfter) ? " " : "";
        }

        return function(el, className) {
            if (el.className) {
                el.className = el.className.replace(new RegExp("(?:^|\\s)" + className + "(?:\\s|$)"), replacer);
            }
        };
    })();

    function getSortedClassName(el) {
        return el.className.split(/\s+/).sort().join(" ");
    }

    function hasSameClasses(el1, el2) {
        return getSortedClassName(el1) == getSortedClassName(el2);
    }

    function replaceWithOwnChildren(el) {
        var parent = el.parentNode;
        while (el.hasChildNodes()) {
            parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
    }

/*
    function normalize(node) {
        var child = node.firstChild, nextChild;
        while (child) {
            if (child.nodeType == 3) {
                while ((nextChild = child.nextSibling) && nextChild.nodeType == 3) {
                    child.appendData(nextChild.data);
                    node.removeChild(nextChild);
                }
            } else {
                normalize(child);
            }
            child = child.nextSibling;
        }
    }
*/

    function elementsHaveSameNonClassAttributes(el1, el2) {
        if (el1.attributes.length != el2.attributes.length) return false;
        for (var i = 0, len = el1.attributes.length, attr1, attr2, name; i < len; ++i) {
            attr1 = el1.attributes[i];
            name = attr1.name;
            if (name != "class") {
                attr2 = el2.attributes.getNamedItem(name);
                if (attr1.specified != attr2.specified) return false;
                if (attr1.specified && attr1.nodeValue !== attr2.nodeValue) return false;
            }
        }
        return true;
    }

    function elementHasNonClassAttributes(el) {
        for (var i = 0, len = el.attributes.length; i < len; ++i) {
            if (el.attributes[i].specified && el.attributes[i].name != "class") {
                return true;
            }
        }
        return false;
    }

    function isSplitPoint(node, offset) {
        if (dom.isCharacterDataNode(node)) {
            if (offset == 0) {
                return !!node.previousSibling;
            } else if (offset == node.length) {
                return !!node.nextSibling;
            } else {
                return true;
            }
        }

        return offset > 0 && offset < node.childNodes.length;
    }

    function splitNodeAt(node, descendantNode, descendantOffset) {
        log.debug("splitNodeAt", dom.inspectNode(node), dom.inspectNode(descendantNode), descendantOffset);
        var newNode;
        if (dom.isCharacterDataNode(descendantNode)) {
            if (descendantOffset == 0) {
                descendantOffset = dom.getNodeIndex(descendantNode);
                descendantNode = descendantNode.parentNode;
            } else if (descendantOffset == descendantNode.length) {
                descendantOffset = dom.getNodeIndex(descendantNode) + 1;
                descendantNode = descendantNode.parentNode;
            } else {
                newNode = dom.splitDataNode(descendantNode, descendantOffset);
            }
        }
        if (!newNode) {
            newNode = descendantNode.cloneNode(false);
            if (newNode.id) {
                newNode.removeAttribute("id");
            }
            var child;
            while ((child = descendantNode.childNodes[descendantOffset])) {
                log.debug("Moving node " + dom.inspectNode(child) + " into " + dom.inspectNode(newNode));
                newNode.appendChild(child);
            }
            dom.insertAfter(newNode, descendantNode);
        }
        return (descendantNode == node) ? newNode : splitNodeAt(node, newNode.parentNode, dom.getNodeIndex(newNode));
    }

    function areElementsMergeable(el1, el2) {
        return el1.tagName == el2.tagName && hasSameClasses(el1, el2) && elementsHaveSameNonClassAttributes(el1, el2);
    }

    function getAdjacentMergeableTextNode(node, forward) {
        var isTextNode = (node.nodeType == 3);
        var el = isTextNode ? node.parentNode : node;
        var adjacentNode;
        var propName = forward ? "nextSibling" : "previousSibling";
        if (isTextNode) {
            // Can merge if the node's previous/next sibling is a text node
            adjacentNode = node[propName];
            if (adjacentNode && adjacentNode.nodeType == 3) {
                return adjacentNode;
            }
        } else {
            // Compare element with its sibling
            adjacentNode = el[propName];
            if (adjacentNode && areElementsMergeable(node, adjacentNode)) {
                return adjacentNode[forward ? "firstChild" : "lastChild"];
            }
        }
        return null;
    }

    function Merge(firstNode) {
        this.isElementMerge = (firstNode.nodeType == 1);
        this.firstTextNode = this.isElementMerge ? firstNode.lastChild : firstNode;
        if (this.isElementMerge) {
            this.sortedClasses = getSortedClassName(firstNode);
        }
        this.textNodes = [this.firstTextNode];
    }

    Merge.prototype = {
        doMerge: function() {
            var textParts = [], textNode, parent, text;
            for (var i = 0, len = this.textNodes.length; i < len; ++i) {
                textNode = this.textNodes[i];
                parent = textNode.parentNode;
                textParts[i] = textNode.data;
                if (i) {
                    parent.removeChild(textNode);
                    if (!parent.hasChildNodes()) {
                        parent.parentNode.removeChild(parent);
                    }
                }
            }
            this.firstTextNode.data = text = textParts.join("");
            return text;
        },

        getLength: function() {
            var i = this.textNodes.length, len = 0;
            while (i--) {
                len += this.textNodes[i].length;
            }
            return len;
        },

        toString: function() {
            var textParts = [];
            for (var i = 0, len = this.textNodes.length; i < len; ++i) {
                textParts[i] = "'" + this.textNodes[i].data + "'";
            }
            return "[Merge(" + textParts.join(",") + ")]";
        }
    };

    function TextCommand(name, options) {
        this.name = name;
        if (typeof options == "object") {
            for (var i in options) {
                if (options.hasOwnProperty(i)) {
                    this[i] = options[i];
                }
            }
        }
    }

    TextCommand.prototype = {
        type: BOOLEAN,
        normalize: true,
        applyToAnyTagName: true,
        tagNames: ["span"],

        // Normalizes nodes after applying a CSS class to a Range.
        postApply: function(textNodes, range) {
            log.group("postApply");
            var firstNode = textNodes[0], lastNode = textNodes[textNodes.length - 1];

            var merges = [], currentMerge;

            var rangeStartNode = firstNode, rangeEndNode = lastNode;
            var rangeStartOffset = 0, rangeEndOffset = lastNode.length;

            var textNode, precedingTextNode;

            for (var i = 0, len = textNodes.length; i < len; ++i) {
                textNode = textNodes[i];
                precedingTextNode = getAdjacentMergeableTextNode(textNode, false);
                log.debug("Checking for merge. text node: " + textNode.data + ", preceding: " + (precedingTextNode ? precedingTextNode.data : null));
                if (precedingTextNode) {
                    if (!currentMerge) {
                        currentMerge = new Merge(precedingTextNode);
                        merges.push(currentMerge);
                    }
                    currentMerge.textNodes.push(textNode);
                    if (textNode === firstNode) {
                        rangeStartNode = currentMerge.firstTextNode;
                        rangeStartOffset = rangeStartNode.length;
                    }
                    if (textNode === lastNode) {
                        rangeEndNode = currentMerge.firstTextNode;
                        rangeEndOffset = currentMerge.getLength();
                    }
                } else {
                    currentMerge = null;
                }
            }

            // Test whether the first node after the range needs merging
            var nextTextNode = getAdjacentMergeableTextNode(lastNode, true);

            if (nextTextNode) {
                if (!currentMerge) {
                    currentMerge = new Merge(lastNode);
                    merges.push(currentMerge);
                }
                currentMerge.textNodes.push(nextTextNode);
            }

            // Do the merges
            if (merges.length) {
                log.info("Merging. Merges:", merges);
                for (i = 0, len = merges.length; i < len; ++i) {
                    merges[i].doMerge();
                }
                log.info(rangeStartNode.nodeValue, rangeStartOffset, rangeEndNode.nodeValue, rangeEndOffset);

                // Set the range boundaries
                range.setStart(rangeStartNode, rangeStartOffset);
                range.setEnd(rangeEndNode, rangeEndOffset);
            }
            log.groupEnd();
        },

        getAppliedAncestor: function(textNode) {
            var node = textNode.parentNode;
            while (node) {
                if (node.nodeType == 1 && dom.arrayContains(this.tagNames, node.tagName.toLowerCase()) && this.isAppliedToElement(node)) {
                    return node;
                }
                node = node.parentNode;
            }
            return false;
        },

        applyToElement: function(el) {
        },

        unapplyToElement: function(el) {
        },

        createContainer: function(doc) {
            var el = doc.createElement(tagName);
            this.applyToElement(el);
            return el;
        },

        applyToTextNode: function(textNode) {
            var parent = textNode.parentNode;
            if (parent.childNodes.length == 1 && dom.arrayContains(this.tagNames, parent.tagName.toLowerCase())) {
                this.applyToElement(parent);
            } else {
                var el = this.createContainer(dom.getDocument(textNode));
                if (el) {
                    textNode.parentNode.insertBefore(el, textNode);
                    el.appendChild(textNode);
                }
            }
        },

        isRemovable: function(el) {
            return el.tagName.toLowerCase() == tagName && trim(el.className) == this.className && !elementHasNonClassAttributes(el);
        },

        undoToTextNode: function(textNode, range, appliedAncestor) {
            log.info("undoToTextNode", dom.inspectNode(textNode), range.inspect(), dom.inspectNode(appliedAncestor), range.containsNode(appliedAncestor));
            if (!range.containsNode(appliedAncestor)) {
                // Split out the portion of the ancestor from which we can remove the CSS class
                var ancestorRange = range.cloneRange();
                ancestorRange.selectNode(appliedAncestor);
                log.info("range end in ancestor " + ancestorRange.isPointInRange(range.endContainer, range.endOffset) + ", isSplitPoint " + isSplitPoint(range.endContainer, range.endOffset));
                if (ancestorRange.isPointInRange(range.endContainer, range.endOffset) && isSplitPoint(range.endContainer, range.endOffset)) {
                    splitNodeAt(appliedAncestor, range.endContainer, range.endOffset);
                    range.setEndAfter(appliedAncestor);
                }
                if (ancestorRange.isPointInRange(range.startContainer, range.startOffset) && isSplitPoint(range.startContainer, range.startOffset)) {
                    appliedAncestor = splitNodeAt(appliedAncestor, range.startContainer, range.startOffset);
                }
            }
            log.info("isRemovable", this.isRemovable(appliedAncestor), dom.inspectNode(appliedAncestor), appliedAncestor.innerHTML, appliedAncestor.parentNode.innerHTML);
            if (this.isRemovable(appliedAncestor)) {
                replaceWithOwnChildren(appliedAncestor);
            } else {
                this.unapplyToElement(appliedAncestor);
            }
        },

        applyToRange: function(range) {
            range.splitBoundaries();
            log.info("applyToRange split boundaries ");
            var textNodes = range.getNodes([3]);
            log.info("applyToRange got text nodes " + textNodes);

            if (textNodes.length) {
                var textNode;

                for (var i = 0, len = textNodes.length; i < len; ++i) {
                    textNode = textNodes[i];
                    if (!this.getAppliedAncestor(textNode)) {
                        this.applyToTextNode(textNode);
                    }
                }
                range.setStart(textNodes[0], 0);
                textNode = textNodes[textNodes.length - 1];
                range.setEnd(textNode, textNode.length);
                log.info("Apply set range to '" + textNodes[0].data + "', '" + textNode.data + "'");
                if (this.normalize) {
                    this.postApply(textNodes, range);
                }
            }
        },

        applyToSelection: function(win) {
            log.group("applyToSelection");
            win = win || window;
            var sel = api.getSelection(win);
            log.info("applyToSelection " + sel.inspect());
            var range, ranges = sel.getAllRanges();
            sel.removeAllRanges();
            var i = ranges.length;
            while (i--) {
                range = ranges[i];
                this.applyToRange(range);
                sel.addRange(range);
            }
            log.groupEnd();
        },

        undoToRange: function(range) {
            log.info("undoToRange " + range.inspect());
            range.splitBoundaries();
            var textNodes = range.getNodes( [3] ), textNode, appliedAncestor;

            if (textNodes.length) {
                for (var i = 0, len = textNodes.length; i < len; ++i) {
                    textNode = textNodes[i];
                    appliedAncestor = this.getAppliedAncestor(textNode);
                    if (appliedAncestor) {
                        this.undoToTextNode(textNode, range, appliedAncestor);
                    }
                }

                range.setStart(textNodes[0], 0);
                textNode = textNodes[textNodes.length - 1];
                range.setEnd(textNode, textNode.length);
                log.info("Undo set range to '" + textNodes[0].data + "', '" + textNode.data + "'");

                if (this.normalize) {
                    this.postApply(textNodes, range);
                }
            }
        },

        undoToSelection: function(win) {
            win = win || window;
            var sel = api.getSelection(win);
            var ranges = sel.getAllRanges(), range;
            sel.removeAllRanges();
            for (var i = 0, len = ranges.length; i < len; ++i) {
                range = ranges[i];
                this.undoToRange(range);
                sel.addRange(range);
            }
        },

        getTextSelectedByRange: function(textNode, range) {
            var textRange = range.cloneRange();
            textRange.selectNodeContents(textNode);

            var intersectionRange = textRange.intersection(range);
            return intersectionRange ? intersectionRange.toString() : "";
        },

        isAppliedToElement: function(el) {
            return false;
        },

        isAppliedToRange: function(range) {
            var textNodes = range.getNodes( [3] );
            for (var i = 0, len = textNodes.length, selectedText; i < len; ++i) {
                selectedText = this.getTextSelectedByRange(textNodes[i], range);
                log.debug("text node: '" + textNodes[i].data + "', selectedText: '" + selectedText + "'", this.isAppliedToElement(textNodes[i].parentNode));
                if (selectedText != "" && !this.isAppliedToElement(textNodes[i].parentNode)) {
                    return false;
                }
            }
            return true;
        },

        isAppliedToSelection: function(win) {
            win = win || window;
            var sel = api.getSelection(win);
            var ranges = sel.getAllRanges();
            var i = ranges.length;
            while (i--) {
                if (!this.isAppliedToRange(ranges[i])) {
                    return false;
                }
            }
            log.groupEnd();
            return true;
        },

        toggleRange: function(range) {
            if (this.isAppliedToRange(range)) {
                this.undoToRange(range);
            } else {
                this.applyToRange(range);
            }
        },

        toggleSelection: function(win) {
            if (this.isAppliedToSelection(win)) {
                this.undoToSelection(win);
            } else {
                this.applyToSelection(win);
            }
        },

        execSelection: function(win, value, options) {
            if (this.type == BOOLEAN) {
                this.toggleSelection(win);
            }
        },

        querySelectionValue: function(win) {
            if (this.type == BOOLEAN) {
                return this.isAppliedToSelection(win);
            }
        }
    };

    var textCommands = {};

    api.registerTextCommand = function(name, options) {
        var cmd = new TextCommand(name, options);
        textCommands[name.toLowerCase()] = cmd;
        return cmd;
    };

    api.execSelectionCommand = function(name, win, value, options) {
        var cmd = textCommands[name.toLowerCase()];
        if (cmd && cmd instanceof TextCommand) {
            cmd.execSelection(win, value, options);
        }
    };

    api.querySelectionCommandValue = function(name, win) {
        var cmd = textCommands[name.toLowerCase()];
        if (cmd && cmd instanceof TextCommand) {
            return cmd.querySelectionValue(win);
        }
    };

    /*----------------------------------------------------------------------------------------------------------------*/
    // Register core commands

    var getComputedStyleProperty;
    if (typeof window.getComputedStyle != UNDEF) {
        getComputedStyleProperty = function(el, propName) {
            return dom.getWindow(el).getComputedStyle(el, null)[propName];
        };
    } else if (typeof dom.getBody(document).currentStyle != UNDEF) {
        getComputedStyleProperty = function(el, propName) {
            return el.currentStyle[propName];
        };
    } else {
        module.fail("No means of obtaining computed style properties found");
    }

    api.registerTextCommand("bold", {
        type: BOOLEAN,
        tagNames: ["b", "span", "strong"],

        isAppliedToElement: function(el) {
            var fontWeight = getComputedStyleProperty(el, "fontWeight");
            var isBold = false;
            if (fontWeight == "bold" || fontWeight == "bolder") {
                isBold = true;
            } else if (fontWeight == "normal" || fontWeight == "lighter") {
                isBold = false;
            } else {
                var weightNum = parseInt("" + fontWeight);
                if (!isNaN(weightNum)) {
                    isBold = weightNum > 400;
                }
            }
            return isBold;
        },

        applyToElement: function(el) {
            el.style.fontWeight = "bold";
        },

        unapplyToElement: function(el) {
            el.style.fontWeight = "normal";
        }
    });
});


