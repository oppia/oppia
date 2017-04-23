/**
 * Commands module for Rangy.
 * Provides replacements for many document.execCommand() commands, applicable to Ranges and Selections.
 *
 * Part of Rangy, a cross-browser JavaScript range and selection library
 * https://github.com/timdown/rangy
 *
 * Depends on Rangy core.
 *
 * Algorithm is based on Aryeh Gregor's HTML Editing Commands specification
 * http://aryeh.name/gitweb.cgi?p=editcommands;a=blob_plain;f=editcommands.html;hb=HEAD
 *
 * Parts of this code are based on Aryeh Gregor's implementation of his algorithm
 * http://aryeh.name/spec/editcommands/autoimplementation.html
 *
 * Copyright %%build:year%%, Tim Down
 * Licensed under the MIT license.
 * Version: %%build:version%%
 * Build date: %%build:date%%
 */
rangy.createModule("Commands", ["WrappedSelection"], function(api, module) {
    /*
    http://aryeh.name/spec/editcommands/autoimplementation.html
    https://bitbucket.org/ms2ger/dom-range/src/tip/test/
    http://aryeh.name/gitweb.cgi?p=editcommands;a=blob_plain;f=editcommands.html;hb=HEAD
     */

    var dom = api.dom;
    var log = log4javascript.getLogger("rangy.commands");
    var BOOLEAN = "boolean", UNDEF = "undefined";
    var getRootContainer = dom.getRootContainer;

    var globalOptions = {
        applyToEditableOnly: false
    };

    var getComputedStyleProperty;

    if (typeof window.getComputedStyle != UNDEF) {
        getComputedStyleProperty = function(el, propName) {
            return dom.getWindow(el).getComputedStyle(el, null)[propName];
        };
    } else if (typeof document.documentElement.currentStyle != UNDEF) {
        getComputedStyleProperty = function(el, propName) {
            return el.currentStyle[propName];
        };
    } else {
        module.fail("No means of obtaining computed style properties found");
    }

    function isBefore(nodeA, nodeB) {
        var parentA = nodeA.parentNode, parentB = nodeB.parentNode;
        if (parentA && parentB) {
            return dom.comparePoints(nodeA.parentNode, dom.getNodeIndex(nodeA), nodeB.parentNode, dom.getNodeIndex(nodeB)) == -1;
        } else {
            return !parentA;
        }
    }

    var toArray = util.toArray;

    /**
     * Returns the furthest ancestor of a Node as defined by DOM Range.
     */
    function getFurthestAncestor(node) {
        var root = node;
        while (root.parentNode != null) {
            root = root.parentNode;
        }
        return root;
    }

    function isEditableElement(node) {
        return node && node.nodeType == 1 && node.isContentEditable;
    }

    // The spec says "An editing host is a node that is either an Element with a contenteditable
    // attribute set to the true state, or a Document whose designMode is enabled."
    // Because Safari returns "true" for the contentEditable property of an element that actually inherits its
    // editability from its parent, we use a different definition:

    // "An editing host is a node that is either an Element whose isContentEditable property returns true but whose
    // parent node is not an element or whose isContentEditable property returns false, or a Document whose designMode
    // is enabled."
    function isEditingHost(node) {
        return node &&
            ((node.nodeType == 9 && node.designMode == "on") ||
            (isEditableElement(node) && !isEditableElement(node.parentNode)));
    }

    // The spec says "Something is editable if it is a node which is not an editing host, does
    // not have a contenteditable attribute set to the false state, and whose
    // parent is an editing host or editable."

    // We're not making any distinction, unless the applyToEditableOnly global option is set to true. Rangy commands can
    // run on non-editable content. The revised definition:

    // "A node is editable if it is not an editing host and is or is the child of an Element whose isContentEditable
    // property returns true."
    function isEditable(node, options) {
        // This is slightly a lie, because we're excluding non-HTML elements with
        // contentEditable attributes.
        return !options || !options.applyToEditableOnly
            || ( (isEditableElement(node) || isEditableElement(node.parentNode)) && !isEditingHost(node) );
    }

    /**
     * "contained" as defined by DOM Range: "A Node node is contained in a range
     * range if node's furthest ancestor is the same as range's root, and (node, 0)
     * is after range's start, and (node, length of node) is before range's end."
     */
    function isContained(node, range) {
        var pos1 = dom.comparePoints(node, 0, range.startContainer, range.startOffset);
        var pos2 = dom.comparePoints(node, dom.getNodeLength(node), range.endContainer, range.endOffset);

        return getRootContainer(node) == getRootContainer(range.startContainer)
            && pos1 == 1
            && pos2 == -1;
    }

    /**
     * "A Node is effectively contained in a Range if either it is contained in the
     * Range; or it is the Range's start node, it is a Text node, and its length is
     * different from the Range's start offset; or it is the Range's end node, it
     * is a Text node, and the Range's end offset is not 0; or it has at least one
     * child, and all its children are effectively contained in the Range."
     */
    function isEffectivelyContained(node, range) {
        if (isContained(node, range)) {
            return true;
        }
        var isCharData = dom.isCharacterDataNode(node);
        if (node == range.startContainer && isCharData && dom.getNodeLength(node) != range.startOffset) {
            return true;
        }
        if (node == range.endContainer && isCharData && range.endOffset != 0) {
            return true;
        }
        var children = node.childNodes, childCount = children.length;
        if (childCount != 0) {
            for (var i = 0; i < childCount; ++i) {
                if (!isEffectivelyContained(children[i], range)) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    // Opera 11 puts HTML elements in the null namespace, it seems, and IE 7 has undefined namespaceURI
    function isHtmlNode(node) {
        var ns;
        return typeof (ns = node.namespaceURI) == UNDEF || (ns === null || ns == "http://www.w3.org/1999/xhtml");
    }


    var unwrappableTagNamesRegex = /^(h[1-6]|p|hr|pre|blockquote|ol|ul|li|dl|dt|dd|div|table|caption|colgroup|col|tbody|thead|tfoot|tr|th|td|address)$/i;
    var inlineDisplayRegex = /^inline(-block|-table)?$/i;

    /**
     * "An inline node is either a Text node, or an Element whose 'display'
     * property computes to 'inline', 'inline-block', or 'inline-table'."
     */
    function isInlineNode(node) {
        return dom.isCharacterDataNode(node) ||
                (node.nodeType == 1 && inlineDisplayRegex.test(getComputedStyleProperty(node, "display")));
    }

    function isNullOrInlineNode(node) {
        return !node || isInlineNode(node);
    }

    function isNonBrInlineNode(node) {
        return isInlineNode(node) && node.nodeName.toLowerCase() != "br";
    }

    function isHtmlElement(node, tagNames) {
        if (!node || node.nodeType != 1 || !isHtmlNode(node)) {
            return false;
        }
        switch (typeof tagNames) {
            case "string":
                return node.tagName.toLowerCase() == tagNames.toLowerCase();
            case "object":
                return new RegExp("^(" + tagNames.join(",") + ")$", "i").test(node.tagName);
            default:
                return true;
        }
    }

    /**
     * "An unwrappable node is an HTML element which may not be used where only
     * phrasing content is expected (not counting unknown or obsolete elements,
     * which cannot be used at all); or any Element whose display property computes
     * to something other than 'inline', 'inline-block', or 'inline-table'; or any
     * node whose parent is not editable."
     */
    function isUnwrappable(node, options) {
        if (!isHtmlElement(node)) {
            return false;
        }

        if (!isInlineNode(node)) {
            return true;
        }

        if (!isEditable(node, options)) {
            return true;
        }

/*
        if (node.nodeType == 3 && options.ignoreWhiteSpace && !/[^\r\n\t ]/.test(node.data)
                && (isUnwrappable(node.previousSibling, options) || isUnwrappable(node.nextSibling, options))) {
            return true;
        }
*/

        return unwrappableTagNamesRegex.test(node.tagName);
    }


/*
    function isWhitespaceNode(node) {
        return node.nodeType == 3 && !/[^\r\n\t ]/.test(node.data);
    }
*/

    function isIgnoredNode(node, options) {
        // Ignore comment nodes
        if (node.nodeType == 8) {
            return true;
        } else if (node.nodeType == 3) {
            // Ignore text nodes that are within <script> and <style> elements
            if (node.parentNode && /^(script|style)$/i.test(node.parentNode.tagName)) {
                //log.fatal("IGNORED NODE " + dom.inspectNode(node));
                return true;
            }

            // Ignore whitespace nodes that are next to an unwrappable element
            if (options.ignoreWhiteSpace && !/[^\r\n\t ]/.test(node.data)
                    && (isUnwrappable(node.previousSibling, options) || isUnwrappable(node.nextSibling, options))) {
                return true;
            }
        }
        return false;
    }

    function blockExtend(range) {
        // "Let start node, start offset, end node, and end offset be the start
        // and end nodes and offsets of the range."
        var startNode = range.startContainer,
            startOffset = range.startOffset,
            endNode = range.endContainer,
            endOffset = range.endOffset,
            startChildNode,
            endChildNode;

        // "Repeat the following steps:"
        while (true) {
            // "If start node is a Text or Comment node or start offset is 0,
            // set start offset to the index of start node and then set start
            // node to its parent."
            if (dom.isCharacterDataNode(startNode) || startOffset == 0) {
                startOffset = dom.getNodeIndex(startNode);
                startNode = startNode.parentNode;

            // "Otherwise, if start offset is equal to the length of start
            // node, set start offset to one plus the index of start node and
            // then set start node to its parent."
            } else if (startOffset == dom.getNodeLength(startNode)) {
                startOffset = 1 + dom.getNodeIndex(startNode);
                startNode = startNode.parentNode;

            // "Otherwise, if the child of start node with index start offset and
            // its previousSibling are both inline nodes and neither is a br,
            // subtract one from start offset."
            } else if ( (startChildNode = startNode.childNodes[startOffset])
                    && isNonBrInlineNode(startChildNode)
                    && isNonBrInlineNode(startChildNode.previousSibling)) {

                startOffset--;

            // "Otherwise, break from this loop."
            } else {
                break;
            }
        }

        // "Repeat the following steps:"
        while (true) {
            // "If end offset is 0, set end offset to the index of end node and
            // then set end node to its parent."
            if (endOffset == 0) {
                endOffset = dom.getNodeIndex(endNode);
                endNode = endNode.parentNode;

            // "Otherwise, if end node is a Text or Comment node or end offset
            // is equal to the length of end node, set end offset to one plus
            // the index of end node and then set end node to its parent."
            } else if (dom.isCharacterDataNode(endNode) || endOffset == dom.getNodeLength(endNode)) {
                endOffset = 1 + dom.getNodeIndex(endNode);
                endNode = endNode.parentNode;

            // "Otherwise, if the child of end node with index end offset and its
            // nextSibling are both inline nodes and neither is a br, add one
            // to end offset."
            } else if ( (endChildNode = endNode.childNodes[endOffset])
                    && isNonBrInlineNode(endChildNode)
                    && isNonBrInlineNode(endChildNode.previousSibling)) {

                endOffset++;

            // "Otherwise, break from this loop."
            } else {
                break;
            }
        }

        // "Let new range be a new range whose start and end nodes and offsets
        // are start node, start offset, end node, and end offset."
        var newRange = range.cloneRange();
        newRange.setStart(startNode, startOffset);
        newRange.setEnd(endNode, endOffset);

        // "Return new range."
        return newRange;
    }

    function elementOnlyHasAttributes(el, attrs) {
        log.debug("elementOnlyHasAttributes. attr length: " + el.attributes.length);
        for (var i = 0, len = el.attributes.length, attrName; i < len; ++i) {
            attrName = el.attributes[i].name;
            //log.info("name: " + attrName + ", specified: " + el.attributes[i].specified);
            if (el.attributes[i].specified && (!attrs || !dom.arrayContains(attrs, attrName))) {
                return false;
            }
        }
        return true;
    }

    // "A modifiable element is a b, em, i, s, span, strong, sub, sup, or u element
    // with no attributes except possibly style; or a font element with no
    // attributes except possibly style, color, face, and/or size; or an a element
    // with no attributes except possibly style and/or href."
    var modifiableElements = "b|em|i|s|span|strike|strong|sub|sup|u";
    var modifiableElementRegex = new RegExp("^(" + modifiableElements + ")$");

    function isModifiableElement(node, context) {
        //log.info("isModifiableElement nodeType " + node.nodeType + ", isHtmlNode " + isHtmlNode(node));
        if (!isHtmlElement(node)) {
            return false;
        }
        if (context && context.command.isModifiableElement) {
            return context.command.isModifiableElement(el, context);
        }
        var tagName = node.tagName.toLowerCase(), allowedAttributes;

        if (modifiableElementRegex.test(tagName)) {
            allowedAttributes = ["style", "class"];
        } else if (tagName == "a") {
            allowedAttributes = ["style", "class", "href"];
        } else if (tagName == "font") {
            allowedAttributes = ["style", "class", "color", "face", "size"];
        } else {
            return false;
        }
        return elementOnlyHasAttributes(node, allowedAttributes);
    }

    var simpleModifiableElements = modifiableElements + "|a|font";
    var simpleModifiableElementRegex = new RegExp("^(" + simpleModifiableElements + ")$");

    function isSimpleModifiableElement(el, context) {
        // "A simple modifiable element is an HTML element for which at least one
        // of the following holds:"
        if (!isHtmlElement(el)) {
            return false;
        }

        if (context && context.command.isSimpleModifiableElement) {
            return context.command.isSimpleModifiableElement(el, context);
        }

        // Only these elements can possibly be a simple modifiable element.
        var tagName = el.tagName.toLowerCase();
        if (!simpleModifiableElementRegex.test(tagName)) {
            return false;
        }

        // Extract attributes once and quit if more than one is found
        var attrName, attrValue, hasAnyAttrs = false;
        for (var i = 0, len = el.attributes.length; i < len; ++i) {
            //log.info("attr specified: " + el.attributes[i].specified + ", name " + el.attributes[i].name);
            if (el.attributes[i].specified) {
                // If it's got more than one attribute, everything after this fails.
                if (hasAnyAttrs) {
                    return false;
                } else {
                    attrName = el.attributes[i].name;
                    attrValue = el.getAttribute(attrName);
                    hasAnyAttrs = true;
                }
            }
        }

        // "It is an a, b, em, font, i, s, span, strike, strong, sub, sup, or u
        // element with no attributes."
        if (!hasAnyAttrs) {
            return true;
        }

        // "It is an a, b, em, font, i, s, span, strike, strong, sub, sup, or u
        // element with exactly one attribute, which is style, which sets no CSS
        // properties (including invalid or unrecognized properties)."
        if (attrName == "style" && el.style.cssText.length == 0) {
            return true;
        }

        // "It is an a element with exactly one attribute, which is href."
        if (tagName == "a" && attrName == "href") {
            return true;
        }

        // "It is a font element with exactly one attribute, which is either color,
        // face, or size."
        if (tagName == "font" && /^(color|face|size)$/.test(attrName)) {
            return true;
        }

        // Check style attribute and bail out if it has more than one property
        if ( attrName != "style" || (typeof el.style.length == "number" && el.style.length > 1) ||
                !/^[a-z\-]+:[^;]+;?\s?$/i.test(el.style.cssText)) {
            return false;
        }

        // "It is a b or strong element with exactly one attribute, which is style,
        // and the style attribute sets exactly one CSS property (including invalid
        // or unrecognized properties), which is "font-weight"."

        if ((tagName == "b" || tagName == "strong") && el.style.fontWeight != "") {
            return true;
        }

        // "It is an i or em element with exactly one attribute, which is style,
        // and the style attribute sets exactly one CSS property (including invalid
        // or unrecognized properties), which is "font-style"."
        if ((tagName == "i" || tagName == "em") && el.style.fontStyle != "") {
            return true;
        }

        // "It is a sub or sub element with exactly one attribute, which is style,
        // and the style attribute sets exactly one CSS property (including invalid
        // or unrecognized properties), which is "vertical-align"."
        if ((tagName == "sub" || tagName == "sup") && el.style.verticalAlign != "") {
            return true;
        }

        // "It is an a, font, or span element with exactly one attribute, which is
        // style, and the style attribute sets exactly one CSS property (including
        // invalid or unrecognized properties), and that property is not
        // "text-decoration"."
        if ((tagName == "a" || tagName == "font" || tagName == "span") && el.style.textDecoration == "") {
            return true;
        }

        // "It is an a, font, s, span, strike, or u element with exactly one
        // attribute, which is style, and the style attribute sets exactly one CSS
        // property (including invalid or unrecognized properties), which is
        // "text-decoration", which is set to "line-through" or "underline" or
        // "overline" or "none"."
        if (/^(a|font|s|span|strike|u)$/.test(tagName) && /^(line-through|underline|overline|none)$/.test(el.style.textDecoration)) {
            return true;
        }

        return false;
    }

    function addRangeMove(rangeMoves, range, oldParent, oldIndex, newParent, newIndex) {
        var sc = range.startContainer, so = range.startOffset,
            ec = range.endContainer, eo = range.endOffset;

        var newSc = sc, newSo = so, newEc = ec, newEo = eo;

        // "If a boundary point's node is the same as or a descendant of node,
        // leave it unchanged, so it moves to the new location."
        //
        // No modifications necessary.

        // "If a boundary point's node is new parent and its offset is greater than
        // new index, add one to its offset."
        if (sc == newParent && so > newIndex) {
            newSo++;
        }
        if (ec == newParent && eo > newIndex) {
            newEo++;
        }

        // "If a boundary point's node is old parent and its offset is old index or
        // old index + 1, set its node to new parent and add new index  old index
        // to its offset."
        if (sc == oldParent && (so == oldIndex  || so == oldIndex + 1)) {
            newSc = newParent;
            newSo += newIndex - oldIndex;
        }
        if (ec == oldParent && (eo == oldIndex || eo == oldIndex + 1)) {
            newEc = newParent;
            newEo += newIndex - oldIndex;
        }

        // "If a boundary point's node is old parent and its offset is greater than
        // old index + 1, subtract one from its offset."
        if (sc == oldParent && so > oldIndex + 1) {
            newSo--;
        }
        if (ec == oldParent && eo > oldIndex + 1) {
            newEo--;
        }

        if (newSc == sc && newSo == so && newEc == ec && newEo == eo) {
            rangeMoves.push([range, newSc, newSo, newEc, newEo]);
        }
    }

    function movePreservingRanges(node, newParent, newIndex, rangesToPreserve) {
        // For convenience, allow newIndex to be -1 to mean "insert at the end".
        if (newIndex == -1) {
            newIndex = newParent.childNodes.length;
        }

        // "When the user agent is to move a Node to a new location, preserving
        // ranges, it must remove the Node from its original parent (if any), then insert it
        // in the new location. In doing so, however, it must ignore the regular
        // range mutation rules, and instead follow these rules:"

        // "Let node be the moved Node, old parent and old index be the old parent
        // and index, and new parent and new index be the new parent and index."
        var oldParent = node.parentNode;
        var oldIndex = dom.getNodeIndex(node);

        var rangeMoves = [];

        for (var i = 0, len = rangesToPreserve.length; i < len; ++i) {
            addRangeMove(rangeMoves, rangesToPreserve[i], oldParent, oldIndex, newParent, newIndex);
        }

        // Now actually move the node.
        if (newParent.childNodes.length == newIndex) {
            newParent.appendChild(node);
        } else {
            newParent.insertBefore(node, newParent.childNodes[newIndex]);
        }

        // Set the new range boundaries
        log.debug("Node move: ", dom.inspectNode(node), "to", dom.inspectNode(newParent), newIndex);
        for (var j = 0, rangeMove; rangeMove = rangeMoves[j++]; ) {
            log.debug("Moving " + rangeMove[0].inspect(), dom.inspectNode(rangeMove[1]), rangeMove[2], dom.inspectNode(rangeMove[3]), rangeMove[4]);
            rangeMove[0].setStart(rangeMove[1], rangeMove[2]);
            rangeMove[0].setEnd(rangeMove[3], rangeMove[4]);
        }
    }

    function decomposeSubtree(rangeIterator, nodes) {
        nodes = nodes || [];
        for (var node, subRangeIterator; node = rangeIterator.next(); ) {
            if (rangeIterator.isPartiallySelectedSubtree()) {
                // The node is partially selected by the Range, so we can use a new RangeIterator on the portion of the
                // node selected by the Range.
                subRangeIterator = rangeIterator.getSubtreeIterator();
                decomposeSubtree(subRangeIterator, nodes);
                subRangeIterator.detach();
            } else {
                nodes.push(node);
            }
        }
        return nodes;
    }

    function decomposeRange(range, rangesToPreserve) {
        // "If range's start and end are the same, return an empty list."
        if (range.startContainer == range.endContainer && range.startOffset == range.endOffset) {
            return [];
        }

        range.splitBoundaries(rangesToPreserve);

        // "Let cloned range be the result of calling cloneRange() on range."
        var clonedRange = range.cloneRange();

        // "While the start offset of cloned range is 0, and the parent of cloned
        // range's start node is not null, set the start of cloned range to (parent
        // of start node, index of start node)."
        while (clonedRange.startOffset == 0 && clonedRange.startContainer.parentNode) {
            clonedRange.setStart(clonedRange.startContainer.parentNode, dom.getNodeIndex(clonedRange.startContainer));
        }

        // "While the end offset of cloned range equals the length of its end node,
        // and the parent of clone range's end node is not null, set the end of
        // cloned range to (parent of end node, 1 + index of end node)."
        while (clonedRange.endOffset == dom.getNodeLength(clonedRange.endContainer) && clonedRange.endContainer.parentNode) {
            clonedRange.setEnd(clonedRange.endContainer.parentNode, 1 + dom.getNodeIndex(clonedRange.endContainer));
        }

        // "Return a list consisting of every Node contained in cloned range in
        // tree order, omitting any whose parent is also contained in cloned
        // range."

        var iterator = new rangy.DomRange.RangeIterator(clonedRange, false);
        var nodes = decomposeSubtree(iterator);
        iterator.detach();
        return nodes;
    }

    function moveChildrenPreservingRanges(node, newParent, newIndex, removeNode, rangesToPreserve) {
        var child, children = [];
        while ( (child = node.firstChild) ) {
            movePreservingRanges(child, newParent, newIndex++, rangesToPreserve);
            children.push(child);
        }
        if (removeNode) {
            node.parentNode.removeChild(node);
        }
        return children;
    }

    function replaceWithOwnChildren(element, rangesToPreserve) {
        return moveChildrenPreservingRanges(element, element.parentNode, dom.getNodeIndex(element), true, rangesToPreserve);
    }

    function copyAttributes(fromElement, toElement) {
        var attrs = fromElement.attributes;

        for (var i = 0, len = attrs.length; i < len; ++i) {
            if (attrs[i].specified) {
                // For IE, which doesn't allow copying of the entire style object using get/setAttribute
                if (attrs[i].name == "style") {
                    toElement.style.cssText = toElement.style.cssText;
                } else {
                    toElement.setAttribute(attrs[i].name, attrs[i].value);
                }
            }
        }
    }

    function clearValue(element, context) {
        var command = context.command, rangesToPreserve = context.rangesToPreserve;

        // "If element's specified value for command is null, return the empty
        // list."
        if (command.getSpecifiedValue(element, context) === null) {
            return [];
        }

        // "If element is a simple modifiable element:"
        if (isSimpleModifiableElement(element, context)) {
            var p = element.parentNode;
            return replaceWithOwnChildren(element, rangesToPreserve);
        }

        // Command-specific special cases
        if (command.clearValue) {
            command.clearValue(element, context);
        }

        // "If the relevant CSS property for command is not null, unset the CSS
        // property property of element."
        if (command.relevantCssProperty !== null) {
            element.style[command.relevantCssProperty] = "";
            if (element.style.cssText == "") {
                element.removeAttribute("style");
            }
        }

        // "If element's specified value for command is null, return the empty
        // list."
        if (command.getSpecifiedValue(element, context) === null) {
            return [];
        }

        // "Let new element be a new HTML element with name "span", with the
        // same attributes and ownerDocument as element."
        var newElement = dom.getDocument(element).createElement("span");
        copyAttributes(element, newElement);

        // "Insert new element into the parent of element immediately before it."
        element.parentNode.insertBefore(newElement, element);

        // "While element has children, append its first child as the last child of
        // new element, preserving ranges."
        // "Remove element from its parent."
        moveChildrenPreservingRanges(element, newElement, 0, true, rangesToPreserve);

        // "Return the one-Node list consisting of new element."
        return [newElement];
    }

    // This entire function is a massive hack to work around browser
    // incompatibility.  It wouldn't work in real life, but it's good enough for a
    // test implementation.  It's not clear how all this should actually be specced
    // in practice, since CSS defines no notion of equality, does it?
    function valuesEqual(command, val1, val2) {
        if (val1 === null || val2 === null) {
            return val1 === val2;
        }

        return command.valuesEqual(val1, val2);
    }

    /**
     * "effective value" per edit command spec
     */
    function getEffectiveValue(node, context) {
        var isElement = (node.nodeType == 1);

        // "If neither node nor its parent is an Element, return null."
        if (!isElement && (!node.parentNode || node.parentNode.nodeType != 1)) {
            return null;
        }

        // "If node is not an Element, return the effective value of its parent for
        // command."
        if (!isElement) {
            return getEffectiveValue(node.parentNode, context);
        }

        return context.command.getEffectiveValue(node, context);
    }

    function removeExtraneousLineBreaksBefore(node) {
        // "If node is not an Element, or it is an inline node, do nothing and
        // abort these steps."
        if (!node || node.nodeType != 1 || isInlineNode(node)) {
            return;
        }

        // "If the previousSibling of node is a br, and the previousSibling of the
        // previousSibling of node is an inline node that is not a br, remove the
        // previousSibling of node from its parent."
        var previousSibling = node.previousSibling, previousSiblingPreviousSibling;
        if (isHtmlElement(previousSibling, "br")
                && isInlineNode( (previousSiblingPreviousSibling = node.previousSibling.previousSibling) )
                && !isHtmlElement(previousSiblingPreviousSibling, "br")) {
            node.parentNode.removeChild(previousSibling);
        }
    }

    function removeExtraneousLineBreaksAtTheEndOf(node) {
        // "If node is not an Element, or it is an inline node, do nothing and
        // abort these steps."
        if (!node || node.nodeType != 1 || isInlineNode(node)) {
            return;
        }

        // "If node has at least two children, and its last child is a br, and its
        // second-to-last child is an inline node that is not a br, remove the last
        // child of node from node."
        var lastChild = node.lastChild, lastChildPreviousSibling;
        if (node.childNodes.length >= 2 && isHtmlElement(node.lastChild, "br")
                && isInlineNode( (lastChildPreviousSibling = node.lastChild.previousSibling) )
                && !isHtmlElement(lastChildPreviousSibling, "br")) {
            node.removeChild(lastChild);
        }
    }

    // "To remove extraneous line breaks from a node, first remove extraneous line
    // breaks before it, then remove extraneous line breaks at the end of it."
    function removeExtraneousLineBreaksFrom(node) {
        removeExtraneousLineBreaksBefore(node);
        removeExtraneousLineBreaksAtTheEndOf(node);
    }

    function wrap(nodeList, siblingCriteria, newParentInstructions, context) {
        var firstNode = nodeList[0];
        var options = context.options, rangesToPreserve = context.rangesToPreserve;
        var i, len, range;

        // "If node list is empty, or the first member of node list is not
        // editable, return null and abort these steps."
        if (!nodeList.length || !isEditable(firstNode, options)) {
            return null;
        }

        var lastNode = nodeList[nodeList.length - 1];

        // "If node list's last member is an inline node that's not a br, and node
        // list's last member's nextSibling is a br, append that br to node list."
        if (isInlineNode(lastNode) && !isHtmlElement(lastNode, "br") && isHtmlElement(lastNode.nextSibling, "br")) {
            nodeList.push(lastNode.nextSibling);
        }

        // "If the previousSibling of the first member of node list is editable and
        // meets the sibling criteria, let new parent be the previousSibling of the
        // first member of node list."
        var newParent, nodePriorToFirstNode = firstNode.previousSibling, nodeAfterLastNode = lastNode.nextSibling;

        if (isEditable(nodePriorToFirstNode, options) && siblingCriteria(nodePriorToFirstNode)) {
            newParent = nodePriorToFirstNode;

        // "Otherwise, if the nextSibling of the last member of node list is
        // editable and meets the sibling criteria, let new parent be the
        // nextSibling of the last member of node list."
        } else if (isEditable(nodeAfterLastNode, options) && siblingCriteria(nodeAfterLastNode)) {
            newParent = nodeAfterLastNode;

        // "Otherwise, run the new parent instructions, and let new parent be the
        // result."
        } else {
            newParent = newParentInstructions();
        }

        // "If new parent is null, abort these steps and return null."
        if (!newParent) {
            return null;
        }

        var doc = dom.getDocument(newParent);
        var newParentParent = newParent.parentNode, firstNodeParent = firstNode.parentNode;

        // "If new parent's parent is null:"
        if (!newParentParent) {
            // "Insert new parent into the parent of the first member of node list
            // immediately before the first member of node list."
            firstNodeParent.insertBefore(newParent, firstNode);

            // "If any range has a boundary point with node equal to the parent of
            // new parent and offset equal to the index of new parent, add one to
            // that boundary point's offset."

            // Preserve only the ranges passed in
            for (i = 0; range = rangesToPreserve[i++]; ) {
                if (range.startContainer == newParentParent && range.startOffset == dom.getNodeIndex(newParent)) {
                    range.setStart(range.startContainer, range.startOffset + 1);
                }
                if (range.endContainer == newParentParent && range.endOffset == dom.getNodeIndex(newParent)) {
                    range.setEnd(range.endContainer, range.endOffset + 1);
                }
            }
        }

        // "Let original parent be the parent of the first member of node list."

        // "If new parent is before the first member of node list in tree order:"
        if (isBefore(newParent, firstNode)) {
            // "If new parent is not an inline node, but the last child of new
            // parent and the first member of node list are both inline nodes, and
            // the last child of new parent is not a br, call createElement("br")
            // on the ownerDocument of new parent and append the result as the last
            // child of new parent."
            if (!isInlineNode(newParent) && isInlineNode(newParent.lastChild) && isInlineNode(firstNode) && !isHtmlElement(newParent.lastChild, "br")) {
                newParent.appendChild(doc.createElement("br"));
            }

            // "For each node in node list, append node as the last child of new
            // parent, preserving ranges."
            for (i = 0, len = nodeList.length; i < len; ++i) {
                movePreservingRanges(nodeList[i], newParent, -1, rangesToPreserve);
            }

        // "Otherwise:"
        } else {
            // "If new parent is not an inline node, but the first child of new
            // parent and the last member of node list are both inline nodes, and
            // the last member of node list is not a br, call createElement("br")
            // on the ownerDocument of new parent and insert the result as the
            // first child of new parent."
            if (!isInlineNode(newParent) && isInlineNode(newParent.firstChild) && isInlineNode(lastNode) && !isHtmlElement(lastNode, "br")) {
                newParent.insertBefore(doc.createElement("br"), newParent.firstChild);
            }

            // "For each node in node list, in reverse order, insert node as the
            // first child of new parent, preserving ranges."
            for (i = nodeList.length - 1; i >= 0; i--) {
                movePreservingRanges(nodeList[i], newParent, 0, rangesToPreserve);
            }
        }

        // "If original parent is editable and has no children, remove it from its
        // parent."
        if (isEditable(firstNodeParent, options) && !firstNodeParent.hasChildNodes()) {
            firstNodeParent.parentNode.removeChild(firstNodeParent);
        }

        // "If new parent's nextSibling is editable and meets the sibling
        // criteria:"
        var newParentNextSibling = newParent.nextSibling;
        if (isEditable(newParentNextSibling, options) && siblingCriteria(newParentNextSibling)) {
            // "If new parent is not an inline node, but new parent's last child
            // and new parent's nextSibling's first child are both inline nodes,
            // and new parent's last child is not a br, call createElement("br") on
            // the ownerDocument of new parent and append the result as the last
            // child of new parent."
            if (!isInlineNode(newParent) && isInlineNode(newParent.lastChild) &&
                    isInlineNode(newParentNextSibling.firstChild) && !isHtmlElement(newParent.lastChild, "br")) {
                newParent.appendChild(doc.createElement("br"));
            }

            // "While new parent's nextSibling has children, append its first child
            // as the last child of new parent, preserving ranges."
            while (newParentNextSibling.hasChildNodes()) {
                movePreservingRanges(newParentNextSibling.firstChild, newParent, -1, rangesToPreserve);
            }

            // "Remove new parent's nextSibling from its parent."
            newParent.parentNode.removeChild(newParentNextSibling);
        }

        // "Remove extraneous line breaks from new parent."
        removeExtraneousLineBreaksFrom(newParent);

        // "Return new parent."
        return newParent;
    }

    function reorderModifiableDescendants(node, command, newValue, context, siblingPropName) {
        var candidate = node[siblingPropName], rangesToPreserve = context.rangesToPreserve;

        // "While candidate is a modifiable element, and candidate has exactly one
        // child, and that child is also a modifiable element, and candidate is
        // not a simple modifiable element or candidate's specified value for
        // command is not new value, set candidate to its child."
        while (isModifiableElement(candidate, context)
                && candidate.childNodes.length == 1
                && isModifiableElement(candidate.firstChild, context)
                && (!isSimpleModifiableElement(candidate, context)
                    || !valuesEqual(command, command.getSpecifiedValue(candidate, context), newValue))) {
            candidate = candidate.firstChild;
        }

        // "If candidate is a simple modifiable element whose specified value and
        // effective value for command are both new value, and candidate is
        // not the previousSibling/nextSibling of node:"
        if (isSimpleModifiableElement(candidate, context)
                && valuesEqual(command, command.getSpecifiedValue(candidate, context), newValue)
                && valuesEqual(command, getEffectiveValue(candidate, context), newValue)
                && candidate != node[siblingPropName]) {

            // "While candidate has children, insert the first child of
            // candidate into candidate's parent immediately before candidate,
            // preserving ranges."
            moveChildrenPreservingRanges(candidate, candidate.parentNode, dom.getNodeIndex(candidate), false, rangesToPreserve);

            // "Insert candidate into node's parent before node's
            // previousSibling."
            node.parentNode.insertBefore(candidate, node[siblingPropName]);

            // "Append the nextSibling of candidate as the last child of
            // candidate, preserving ranges."
            movePreservingRanges(candidate.nextSibling, candidate, candidate.childNodes.length, rangesToPreserve);
        }
    }

    function forceValue(node, newValue, context) {
        var child, i, len, children, nodeType = node.nodeType;
        var command = context.command, rangesToPreserve = context.rangesToPreserve, options = context.options;

        // "If node's parent is null, abort this algorithm."
        if (!node.parentNode) {
            return;
        }

        // "If new value is null, abort this algorithm."
        if (newValue === null) {
            return;
        }

        // "If node is an Element, Text, Comment, or ProcessingInstruction node,
        // and is not an unwrappable node:"
        if (/^(1|3|4|7)$/.test("" + nodeType) && !isUnwrappable(node, options)) {
		    // "Reorder modifiable descendants of node's previousSibling."
            reorderModifiableDescendants(node, command, newValue, context, "previousSibling");

    		// "Reorder modifiable descendants of node's nextSibling."
            reorderModifiableDescendants(node, command, newValue, context, "nextSibling");

            // "Wrap the one-node list consisting of node, with sibling criteria
            // matching a simple modifiable element whose specified value and
            // effective value for command are both new value, and with new parent
            // instructions returning null."
            wrap([node],
                function(node) {
                    return isSimpleModifiableElement(node, context)
                        && valuesEqual(command, command.getSpecifiedValue(node, context), newValue)
                        && valuesEqual(command, getEffectiveValue(node, context), newValue);
                },
                function() { return null; },
                context
            );
        }

        // "If the effective value of command is new value on node, abort this
        // algorithm."
        if (valuesEqual(command, getEffectiveValue(node, context), newValue)) {
            return;
        }

        // "If node is an unwrappable node:"
        if (isUnwrappable(node, options)) {
            // "Let children be all children of node, omitting any that are
            // Elements whose specified value for command is neither null nor
            // equal to new value."
            children = [];
            for (i = 0, len = node.childNodes.length, specifiedValue; i < len; ++i) {
                child = node.childNodes[i];
                if (child.nodeType == 1) {
                    specifiedValue = command.getSpecifiedValue(child, context);
                    if (specifiedValue !== null && !valuesEqual(command, newValue, specifiedValue)) {
                        continue;
                    }
                }
                children.push(child);
            }

            // "Force the value of each Node in children, with command and new
            // value as in this invocation of the algorithm."
            for (i = 0; child = children[i++]; ) {
                forceValue(child, newValue, context);
            }

            // "Abort this algorithm."
            return;
        }

        // "If node is a Comment or ProcessingInstruction, abort this algorithm."
        if (nodeType == 4 || nodeType == 7) {
            return;
        }

        // "If the effective value of command is new value on node, abort this
        // algorithm."
        if (valuesEqual(command, getEffectiveValue(node, context), newValue)) {
            return;
        }

        // "Let new parent be null."
        var newParent = null;

        // "If the CSS styling flag is false:"
        if (!options.styleWithCss && command.createNonCssElement) {
            newParent = command.createNonCssElement(node, newValue, context);
        }

        // "If new parent is null, let new parent be the result of calling
        // createElement("span") on the ownerDocument of node."
        if (!newParent) {
            if (command.createCssElement) {
                newParent = command.createCssElement(dom.getDocument(node), context);
            } else {
                newParent = dom.getDocument(node).createElement("span");
            }
        }

        // "Insert new parent in node's parent before node."
        node.parentNode.insertBefore(newParent, node);

        // "If the effective value of command for new parent is not new value, and
        // the relevant CSS property for command is not null, set that CSS property
        // of new parent to new value (if the new value would be valid)."
        var property = command.relevantCssProperty;
        if (property !== null && !valuesEqual(command, getEffectiveValue(newParent, context), newValue)) {
            newParent.style[property] = newValue;
        }

        // Perform additional styling (for commands such as strikethrough and underline)
        if (command.styleCssElement) {
            command.styleCssElement(newParent, newValue);
        }

        // "Append node to new parent as its last child, preserving ranges."
        movePreservingRanges(node, newParent, newParent.childNodes.length, rangesToPreserve);

        // "If node is an Element and the effective value of command for node is
        // not new value:"
        if (nodeType == 1 && !valuesEqual(command, getEffectiveValue(node, context), newValue)) {
            // "Insert node into the parent of new parent before new parent,
            // preserving ranges."
            movePreservingRanges(node, newParent.parentNode, dom.getNodeIndex(newParent), rangesToPreserve);

            // "Remove new parent from its parent."
            newParent.parentNode.removeChild(newParent);

            // "If new parent is a span, and either a) command is "underline" or
            // "strikethrough", or b) command is "fontSize" and new value is not
            // "xxx-large", or c) command is not "fontSize" and the relevant CSS
            // property for command is not null:"
            if (newParent.tagName.toLowerCase() == "span"
                    && ((command.hasSpecialSpanStyling && command.hasSpecialSpanStyling(newValue))
                    || property !== null)) {

                // "If the relevant CSS property for command is not null, set that
                // CSS property of node to new value."
                if (property !== null) {
                    node.style[property] = newValue;
                }

                if (command.styleSpanChildElement) {
                    command.styleSpanChildElement(node, newValue);
                }

            // "Otherwise:"
            } else {
                // "Let children be all children of node, omitting any that are
                // Elements whose specified value for command is neither null nor
                // equal to new value."
                children = [];
                var specifiedValue;
                for (i = 0, len = node.childNodes.length; i < len; ++i) {
                    child = node.childNodes[i];
                    if (child.nodeType == 1) {
                        specifiedValue = command.getSpecifiedValue(child, context);

                        if (specifiedValue !== null && !valuesEqual(command, newValue, specifiedValue)) {
                            continue;
                        }
                    }
                    children.push(child);
                }

                // "Force the value of each Node in children, with command and new
                // value as in this invocation of the algorithm."
                for (i = 0, len = children.length; i < len; ++i) {
                    forceValue(children[i], newValue, context);
                }
            }
        }
    }

    function pushDownValues(node, context) {
        var command = context.command,
            newValue = context.value,
            options = context.options,
            parent = node.parentNode;

        // "If node's parent is not an Element, abort this algorithm."
        if (!parent || parent.nodeType != 1) {
            return;
        }

        // "If the effective value of command is new value on node, abort this
        // algorithm."
        if (valuesEqual(command, getEffectiveValue(node, context), newValue)) {
            return;
        }

        // "Let current ancestor be node's parent."
        var currentAncestor = parent;

        // "Let ancestor list be a list of Nodes, initially empty."
        var ancestorList = [];

        // "While current ancestor is an editable Element and the effective value
        // of command is not new value on it, append current ancestor to ancestor
        // list, then set current ancestor to its parent."
        while (isEditable(currentAncestor, options) && currentAncestor.nodeType == 1
                && !valuesEqual(command, getEffectiveValue(currentAncestor, context), newValue)) {
            ancestorList.push(currentAncestor);
            currentAncestor = currentAncestor.parentNode;
        }

        // "If ancestor list is empty, abort this algorithm."
        if (ancestorList.length == 0) {
            return;
        }

        // "Let propagated value be the specified value of command on the last
        // member of ancestor list."
        var lastAncestor = ancestorList[ancestorList.length - 1],
            propagatedValue = command.getSpecifiedValue(lastAncestor, context);

        // "If propagated value is null and is not equal to new value, abort this
        // algorithm."
        if (propagatedValue === null && propagatedValue != newValue) {
            return;
        }

        // "If the effective value of command is not new value on the parent of
        // the last member of ancestor list, and new value is not null, abort this
        // algorithm."
        if (newValue !== null && !valuesEqual(command, getEffectiveValue(lastAncestor.parentNode, context), newValue)) {
            return;
        }

        // "While ancestor list is not empty:"
        while (ancestorList.length) {
            // "Let current ancestor be the last member of ancestor list."
            // "Remove the last member from ancestor list."
            currentAncestor = ancestorList.pop();

            // "If the specified value of current ancestor for command is not null,
            // set propagated value to that value."
            if (command.getSpecifiedValue(currentAncestor, context) !== null) {
                propagatedValue = command.getSpecifiedValue(currentAncestor, context);
            }

            // "Let children be the children of current ancestor."
            var children = toArray(currentAncestor.childNodes);

            // "If the specified value of current ancestor for command is not null,
            // clear the value of current ancestor."
            if (command.getSpecifiedValue(currentAncestor, context) !== null) {
                clearValue(currentAncestor, context);
            }

            // "For every child in children:"
            for (var i = 0, child; child = children[i++]; ) {
                // "If child is node, continue with the next child."
                if (child == node) {
                    continue;
                }

                // "If child is an Element whose specified value for command
                // is neither null nor equal to propagated value, continue with the
                // next child."
                if (child.nodeType == 1
                        && command.getSpecifiedValue(child, context) !== null
                        && !valuesEqual(command, propagatedValue, command.getSpecifiedValue(child, context))) {
                    continue;
                }

                // "If child is the last member of ancestor list, continue with the
                // next child."
                if (child == lastAncestor) {
                    continue;
                }

                // "Force the value of child, with command as in this algorithm
                // and new value equal to propagated value."
                forceValue(child, propagatedValue, context);
            }
        }
    }

    function setChildrenNodeValue(node, context) {
        var children = toArray(node.childNodes);
        for (var i = 0, len = children.length; i < len; ++i) {
            setNodeValue(children[i], context);
        }
    }

    function outerHtml(node) {
        if (node === null) {
            return "null";
        } else if (node.nodeType == 3) {
            return node.data;
        } else {
            var div = dom.getDocument(node).createElement("div");
            div.appendChild(node.cloneNode(true));
            return div.innerHTML;
        }
    }

    function getRangeContainerHtml(range) {
        return outerHtml(range.commonAncestorContainer);
    }

    function setNodeValue(node, context) {
        var i, len, child, nodeType = node.nodeType;

        // "If node is a Document, set the value of its Element child (if it has
        // one) and abort this algorithm."
        if (nodeType == 9) {
            for (i = 0; i < node.childNodes.length; ++i) {
                child = node.childNodes[i];
                if (child.nodeType == 1) {
                    setNodeValue(child, context);
                    break;
                }
            }
            return;
        }

        // "If node is a DocumentFragment, let children be a list of its children.
        // Set the value of each member of children, then abort this algorithm."
        if (nodeType == 11) {
            setChildrenNodeValue(node, context);
            return;
        }

        // "If node's parent is null, or if node is a DocumentType, abort this
        // algorithm."
        if (!node.parentNode || nodeType == 10) {
            return;
        }

        // If node is a ignorable text node, abort
        if (isIgnoredNode(node, context.options)) {
            return;
        }

        // "If node is not editable, let children be the children of node. Set the value of each member of children.
        // Abort this algorithm."
        if (!isEditable(node, context.options)) {
            setChildrenNodeValue(node, context);
            return;
        }

        // "If node is an Element:"
        if (nodeType == 1) {
            // "Clear the value of node, and let new nodes be the result."
            var newNodes = clearValue(node, context);

            // "For each new node in new nodes, set the value of new node, with the
            // same inputs as this invocation of the algorithm."
            for (i = 0, len = newNodes.length; i < len; ++i) {
                setNodeValue(newNodes[i], context);
            }

            // "If node's parent is null, abort this algorithm."
            if (!node.parentNode) {
                return;
            }
        }

        // "Push down values on node."
        pushDownValues(node, context);

        // "Force the value of node."
        forceValue(node, context.value, context);

        // "Let children be the children of node. Set the value of each member of children."
        setChildrenNodeValue(node, context);
    }

    // TODO: Add something about whitespace text nodes (option?)
    function getEffectiveTextNodes(range, context) {
        return range.getNodes([3], function(node) {
            return isEffectivelyContained(node, range) && !isIgnoredNode(node, context.options);
        });
    }

    function Command() {}

    Command.prototype = {
        relevantCssProperty: null,

        getSpecifiedValue: function() {
            //throw new module.createError("Command '" + this.name + "' does not implement getSpecifiedValue()");
            return null;
        },

        clearValue: function(/*element*/) {},

        getEffectiveValue: function(element, context) {
            return getComputedStyleProperty(element, this.relevantCssProperty);
        },

        createCssElement: null,

        createNonCssElement: null,

        styleCssElement: null,

        hasSpecialSpanStyling: null,

        styleSpanChildElement: null,

        isSimpleModifiableElement: null,

        defaultOptions: null,

        addDefaultOptions: null,

        valuesEqual: function(val1, val2) {
            return val1 === val2;
        },

        createContext: function(value, rangesToPreserve, options) {
            var defaultOptions = this.defaultOptions;
            if (defaultOptions) {
                for (var i in defaultOptions) {
                    if (defaultOptions.hasOwnProperty(i) && !options.hasOwnProperty(i)) {
                        options[i] = defaultOptions[i];
                    }
                }
            }
            return {
                command: this,
                value: value,
                rangesToPreserve: rangesToPreserve || [],
                options: options || {}
            };
        },

        getSelectionValue: function(/*sel, context*/) {
            return null;
        },

        getNewRangeValue: function(/*range, context*/) {
            return null;
        },

        getNewSelectionValue: function(/*sel, context*/) {
            return null;
        },

        applyToRange: function(doc, value, options, range) {
            var context = this.createContext(value, [range], options);
            context.value = this.getNewRangeValue(range, context);
            this.applyValueToRange(range, context);
        },

        applyToSelection: function(doc, value, options) {
            var win = dom.getWindow(doc);
            var sel = api.getSelection(win);
            var selRanges = sel.getAllRanges();
            var context = this.createContext(value, selRanges, options);
            context.value = this.getNewSelectionValue(sel, context);

            for (var i = 0, len = selRanges.length; i < len; ++i) {
                this.applyValueToRange(selRanges[i], context);
            }

            sel.setRanges(selRanges);
        }
    };

    Command.util = {
        getComputedStyleProperty: getComputedStyleProperty,
        getFurthestAncestor: getFurthestAncestor,
        isContained: isContained,
        isEffectivelyContained: isEffectivelyContained,
        isHtmlNode: isHtmlNode,
        isHtmlElement: isHtmlElement,
        isInlineNode: isInlineNode,
        isUnwrappable: isUnwrappable,
        blockExtend: blockExtend,
        isModifiableElement: isModifiableElement,
        isSimpleModifiableElement: isSimpleModifiableElement,
        moveChildrenPreservingRanges: moveChildrenPreservingRanges,
        replaceWithOwnChildren: replaceWithOwnChildren,
        copyAttributes: copyAttributes,
        getEffectiveValue: getEffectiveValue,
        getEffectiveTextNodes: getEffectiveTextNodes,
        setNodeValue: setNodeValue,
        wrap: wrap,
        decomposeRange: decomposeRange,

        setGlobalOption: function(name, value) {
            globalOptions[name] = value;
        }
    };

    Command.create = function(commandConstructor, properties) {
        var proto = new Command();
        commandConstructor.prototype = proto;

        if (typeof properties == "object") {
            for (var i in properties) {
                if (properties.hasOwnProperty(i)) {
                    proto[i] = properties[i];
                }
            }
        }
    };

    var commandsByName = {};

    api.registerCommand = function(name, command) {
        if (!(command instanceof Command)) {
            throw module.createError("registerCommand(): Object supplied is not a Command");
        }
        commandsByName[name.toLowerCase()] = command;
    };

    function getCommand(name) {
        var lowerName = name.toLowerCase();
        if (commandsByName.hasOwnProperty(lowerName)) {
            return commandsByName[lowerName];
        } else {
            throw module.createError("getCommand(): No command registered with the name '" + name + "'");
        }
    }

    api.execCommand = function(name, options, range) {
        options = options || {};
        var doc = options.hasOwnProperty("document") ? options.document : document;
        var value = options.hasOwnProperty("value") ? options.value : null;
        var command = getCommand(name);
        if (range) {
            command.applyToRange(doc, value, options, range);
        } else {
            command.applyToSelection(doc, value, options);
        }
    };

    api.queryCommandValue = function(name, options, range) {
        options = options || {};
        var win = options.hasOwnProperty("document") ? dom.getWindow(options.document) : window;
        var value = options.hasOwnProperty("value") ? options.value : null;
        var command = getCommand(name);
        var sel = api.getSelection(win);
        var context = command.createContext(value, null, options);

        return command.getSelectionValue(sel, context);
    };

    api.getCommand = getCommand;
    api.Command = Command;

});