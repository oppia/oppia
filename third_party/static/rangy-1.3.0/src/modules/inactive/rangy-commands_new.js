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

    var defaultOptions = {
        applyToEditableOnly: false,
        styleWithCss: false,
        ignoreInvisibleNodes: true
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

    function getAncestors(node) {
        var ancestors = [];
        while ( (node = node.parentNode) ) {
            ancestors.unshift(node);
        }
        return ancestors;
    }

/*
    function getAncestorsAndSelf(node) {
        var ancestors = getAncestors(node);
        ancestors.push(node);
        return ancestors;
    }
*/

    function hasAncestor(node, matcher) {
        while ( (node = node.parentNode) ) {
            if (matcher(node)) {
                return true;
            }
        }
        return false;
    }

    function isOrHasAncestor(node, matcher) {
        return matcher(node) || hasAncestor(node, matcher);
    }

    function nextNodeDescendants(node) {
        while (node && !node.nextSibling) {
            node = node.parentNode;
        }
        if (!node) {
            return null;
        }
        return node.nextSibling;
    }

    function nextNode(node) {
        if (node.hasChildNodes()) {
            return node.firstChild;
        }
        return nextNodeDescendants(node);
    }

    function previousNode(node) {
        var previous = node.previousSibling;
        if (previous) {
            node = previous;
            while (node.hasChildNodes()) {
                node = node.lastChild;
            }
            return node;
        }
        var parent = node.parentNode;
        if (parent && parent.nodeType == 1) {
            return parent;
        }
        return null;
    }

    var isEditableElement;

    (function() {
        var testEl = document.createElement("div");
        if (typeof testEl.isContentEditable == BOOLEAN) {
            isEditableElement = function(node) {
                return node && node.nodeType == 1 && node.isContentEditable;
            };
        } else {
            isEditableElement = function(node) {
                if (!node || node.nodeType != 1 || node.contentEditable == "false") {
                    return false;
                }
                return node.contentEditable == "true" || isEditableElement(node.parentNode);
            };
        }
    })();

    // The spec says "An editing host is a node that is either an Element with a contenteditable
    // attribute set to the true state, or the Element child of a Document whose designMode is enabled."
    //
    // Because Safari returns "true" for the contentEditable property of an element that actually inherits its
    // editability from its parent, we use a different definition:
    //
    // "An editing host is a node that is either an Element with a contenteditable attribute set to the true state but
    // whose parent node is not an element or has a contenteditable attribute set to a value other than the true state,
    // or the Element child of a Document whose designMode is enabled."
    function isEditingHost(node) {
        var parent;
        return node && node.nodeType == 1 &&
            (( (parent = node.parentNode) && parent.nodeType == 9 && parent.designMode == "on") ||
            (isEditableElement(node) && !isEditableElement(node.parentNode)));
    }

    // The spec says "Something is editable if it is a node which is not an editing host, does
    // not have a contenteditable attribute set to the false state, and whose
    // parent is an editing host or editable."
    //
    // We're not making any distinction, unless the applyToEditableOnly global option is set to true. Rangy commands can
    // run on non-editable content. The revised definition:
    //
    // "A node is editable if it is not an editing host and is or is the child of an Element whose isContentEditable
    // property returns true."
    function isEditable(node, options) {
        return node &&
            ((options && !options.applyToEditableOnly)
                || (((isEditableElement(node) || (node.nodeType != 1 && isEditableElement(node.parentNode)))
                     && !isEditingHost(node) ) ));
    }

    // "contained" as defined by DOM Range: "A Node node is contained in a range
    // range if node's furthest ancestor is the same as range's root, and (node, 0)
    // is after range's start, and (node, length of node) is before range's end."
    function isContained(node, range) {
        return getRootContainer(node) == getRootContainer(range.startContainer)
            && dom.comparePoints(node, 0, range.startContainer, range.startOffset) == 1
            && dom.comparePoints(node, dom.getNodeLength(node), range.endContainer, range.endOffset) == -1;
    }


    // "A node node is effectively contained in a range range if at least one of
    // the following holds:"
    function isEffectivelyContained(node, range) {
        if (range.collapsed) {
            return false;
        }

        // "node is contained in range."
        if (isContained(node, range)) {
            return true;
        }

        var sc = range.startContainer, so = range.startOffset;
        var ec = range.endContainer, eo = range.endOffset;

        // "node is range's start node, it is a Text node, its length is different
        // from range's start offset."
        var isCharData = dom.isCharacterDataNode(node);
        if (node == sc && isCharData && dom.getNodeLength(node) != so) {
            return true;
        }

        // "node is range's end node, it is a Text node, range's end offset is not
        // 0."
        if (node == ec && isCharData && eo != 0) {
            return true;
        }

        // "node has at least one child; and all its children are effectively
        // contained in range; and either range's start node is not a descendant of
        // node or is not a Text node or range's start offset is zero or range is
        // collapsed; and either range's end node is not a descendant of node or is
        // not a Text node or range's end offset is its end node's length."
        var children = node.childNodes, childCount = children.length;
        if (childCount != 0) {
            for (var i = 0; i < childCount; ++i) {
                if (!isEffectivelyContained(children[i], range)) {
                    return false;
                }
            }
            if ((!dom.isAncestorOf(node, sc) || sc.nodeType != 3 || so == 0)
                    && (!dom.isAncestorOf(node, ec) || ec.nodeType != 3 || eo == dom.getNodeLength(ec))) {
                return true;
            }
        }
        return false;
    }

    // Opera 11 puts HTML elements in the null namespace, it seems, and IE 7 has undefined namespaceURI
    function isHtmlNode(node) {
        var ns;
        return typeof (ns = node.namespaceURI) == UNDEF || (ns === null || ns == "http://www.w3.org/1999/xhtml");
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

    var unwrappableTagNamesRegex = /^(h[1-6]|p|hr|pre|blockquote|ol|ul|li|dl|dt|dd|div|table|caption|colgroup|col|tbody|thead|tfoot|tr|th|td|address)$/i;
    var inlineDisplayRegex = /^(none|inline(-block|-table)?)$/i;

    // "A block node is either an Element whose "display" property does not have
    // resolved value "inline" or "inline-block" or "inline-table" or "none", or a
    // Document, or a DocumentFragment."
    function isBlockNode(node) {
        if (!node) {
            return false;
        }
        var nodeType = node.nodeType;
        return nodeType == 1 && !inlineDisplayRegex.test(getComputedStyleProperty(node, "display"))
            || nodeType == 9 || nodeType == 11;
    }

    // "An inline node is a node that is not a block node."
    function isInlineNode(node) {
        return node && !isBlockNode(node);
    }

    // "A collapsed line break is a br that begins a line box which has nothing
    // else in it, and therefore has zero height."
    function isCollapsedLineBreak(br) {
        if (!isHtmlElement(br, "br")) {
            return false;
        }

        // Add a zwsp after it and see if that changes the height of the nearest
        // non-inline parent.  Note: this is not actually reliable, because the
        // parent might have a fixed height or something.
        var ref = br.parentNode;
        while (getComputedStyleProperty(ref, "display") == "inline") {
            ref = ref.parentNode;
        }
        var refStyle = ref.hasAttribute("style") ? ref.getAttribute("style") : null;
        ref.style.height = "auto";
        ref.style.maxHeight = "none";
        ref.style.minHeight = "0";
        var space = document.createTextNode("\u200b");
        var origHeight = ref.offsetHeight;
        if (origHeight == 0) {
            throw "isCollapsedLineBreak: original height is zero, bug?";
        }
        br.parentNode.insertBefore(space, br.nextSibling);
        var finalHeight = ref.offsetHeight;
        space.parentNode.removeChild(space);
        if (refStyle === null) {
            // Without the setAttribute() line, removeAttribute() doesn't work in
            // Chrome 14 dev.  I have no idea why.
            ref.setAttribute("style", "");
            ref.removeAttribute("style");
        } else {
            ref.setAttribute("style", refStyle);
        }

        // Allow some leeway in case the zwsp didn't create a whole new line, but
        // only made an existing line slightly higher.  Firefox 6.0a2 shows this
        // behavior when the first line is bold.
        return origHeight < finalHeight - 5;
    }

    // "An extraneous line break is a br that has no visual effect, in that
    // removing it from the DOM would not change layout, except that a br that is
    // the sole child of an li is not extraneous."
    //
    // FIXME: This doesn't work in IE, since IE ignores display: none in
    // contenteditable.
    function isExtraneousLineBreak(br) {
        if (!isHtmlElement(br, "br")) {
            return false;
        }

        if (isHtmlElement(br.parentNode, "li")
        && br.parentNode.childNodes.length == 1) {
            return false;
        }

        // Make the line break disappear and see if that changes the block's
        // height.  Yes, this is an absurd hack.  We have to reset height etc. on
        // the reference node because otherwise its height won't change if it's not
        // auto.
        var ref = br.parentNode;
        while (getComputedStyle(ref).display == "inline") {
            ref = ref.parentNode;
        }
        var refStyle = ref.hasAttribute("style") ? ref.getAttribute("style") : null;
        ref.style.height = "auto";
        ref.style.maxHeight = "none";
        ref.style.minHeight = "0";
        var brStyle = br.hasAttribute("style") ? br.getAttribute("style") : null;
        var origHeight = ref.offsetHeight;
        if (origHeight == 0) {
            throw "isExtraneousLineBreak: original height is zero, bug?";
        }
        br.setAttribute("style", "display:none");
        var finalHeight = ref.offsetHeight;
        if (refStyle === null) {
            // Without the setAttribute() line, removeAttribute() doesn't work in
            // Chrome 14 dev.  I have no idea why.
            ref.setAttribute("style", "");
            ref.removeAttribute("style");
        } else {
            ref.setAttribute("style", refStyle);
        }
        if (brStyle === null) {
            br.removeAttribute("style");
        } else {
            br.setAttribute("style", brStyle);
        }

        return origHeight == finalHeight;
    }

    // "A whitespace node is either a Text node whose data is the empty string; or
    // a Text node whose data consists only of one or more tabs (0x0009), line
    // feeds (0x000A), carriage returns (0x000D), and/or spaces (0x0020), and whose
    // parent is an Element whose resolved value for "white-space" is "normal" or
    // "nowrap"; or a Text node whose data consists only of one or more tabs
    // (0x0009), carriage returns (0x000D), and/or spaces (0x0020), and whose
    // parent is an Element whose resolved value for "white-space" is "pre-line"."
    function isWhitespaceNode(node) {
        if (!node || node.nodeType != 3) {
            return false;
        }
        var text = node.data
        if (text == "") {
            return true;
        }
        var parent = node.parentNode;
        if (!parent || parent.nodeType != 1) {
            return false;
        }
        var computedWhiteSpace = getComputedStyleProperty(node.parentNode, "whiteSpace");

        return (/^[\t\n\r ]+$/.test(text) && /^(normal|nowrap)$/.test(computedWhiteSpace)) ||
            (/^[\t\r ]+$/.test(text) && computedWhiteSpace == "pre-line");
    }

    // "node is a collapsed whitespace node if the following algorithm returns
    // true:"
    function isCollapsedWhitespaceNode(node) {
        // "If node is not a whitespace node, return false."
        if (!isWhitespaceNode(node)) {
            return false;
        }

        // "If node's data is the empty string, return true."
        if (node.data == "") {
            return true;
        }

        // "Let ancestor be node's parent."
        var ancestor = node.parentNode;

        // "If ancestor is null, return true."
        if (!ancestor) {
            return true;
        }

        // "If the "display" property of some ancestor of node has resolved value
        // "none", return true."
        if (hasAncestor(node, function(ancestor) {
            return ancestor.nodeType == 1 && getComputedStyleProperty(ancestor, "display") == "none";
        })) {
            return true;
        }

        // "While ancestor is not a block node and its parent is not null, set
        // ancestor to its parent."
        while (!isBlockNode(ancestor) && (ancestor = ancestor.parentNode) ) {}

        // "Let reference be node."
        var reference = node;

        // "While reference is a descendant of ancestor:"
        while (reference != ancestor) {
            // "Let reference be the node before it in tree order."
            reference = previousNode(reference);

            // "If reference is a block node or a br, return true."
            if (isBlockNode(reference) || isHtmlElement(reference, "br")) {
                return true;
            }

            // "If reference is a Text node that is not a whitespace node, or is an
            // img, break from this loop."
            if ((reference.nodeType == 3 && !isWhitespaceNode(reference)) || isHtmlElement(reference, "img")) {
                break;
            }
        }

        // "Let reference be node."
        reference = node;

        // "While reference is a descendant of ancestor:"
        var stop = nextNodeDescendants(ancestor);
        while (reference != stop) {
            // "Let reference be the node after it in tree order, or null if there
            // is no such node."
            reference = nextNode(reference);

            // "If reference is a block node or a br, return true."
            if (isBlockNode(reference) || isHtmlElement(reference, "br")) {
                return true;
            }

            // "If reference is a Text node that is not a whitespace node, or is an
            // img, break from this loop."
            if ((reference && reference.nodeType == 3 && !isWhitespaceNode(reference))
            || isHtmlElement(reference, "img")) {
                break;
            }
        }

        // "Return false."
        return false;
    }

    // "Something is visible if it is a node that either is a block node, or a Text
    // node that is not a collapsed whitespace node, or an img, or a br that is not
    // an extraneous line break, or any node with a visible descendant; excluding
    // any node with an ancestor container Element whose "display" property has
    // resolved value "none"."
    function isVisible(node) {
        if (!node) {
            return false;
        }

        if (isOrHasAncestor(node, function(node) {
            return node.nodeType == 1 && getComputedStyleProperty(node, "display") == "none";
        })) {
            return false;
        }

        if (isBlockNode(node)
        || (node.nodeType == 3 && !isCollapsedWhitespaceNode(node))
        || isHtmlElement(node, "img")
        || (isHtmlElement(node, "br") && !isExtraneousLineBreak(node))) {
            return true;
        }

        for (var i = 0, childNodes = node.childNodes, len = childNodes.length; i < len; ++i) {
            if (isVisible(childNodes[i])) {
                return true;
            }
        }

        return false;
    }

    // "Something is invisible if it is a node that is not visible."
    function isInvisible(node) {
        return node && !isVisible(node);
    }

    function getEffectiveTextNodes(range, context) {
        return range.getNodes([3], function(node) {
            return isEffectivelyContained(node, range) && (!context.options.ignoreInvisibleNodes || isInvisible(node));
        });
    }

    function getEffectivelyContainedElements(range, context) {
        return range.getNodes([1], function(node) {
            return isEffectivelyContained(node, range) && (!context.options.ignoreInvisibleNodes || isInvisible(node));
        });
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

        // Allow commands to define whether an element is modifiable for its purposes
        if (context && context.command.isModifiableElement) {
            return context.command.isModifiableElement(el, context);
        }
        var tagName = node.tagName.toLowerCase(), allowedAttributes;

        if (modifiableElementRegex.test(tagName)) {
            allowedAttributes = ["style"];
        } else if (tagName == "a") {
            allowedAttributes = ["style", "href"];
        } else if (tagName == "font") {
            allowedAttributes = ["style", "color", "face", "size"];
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

        // Allow commands to define whether an element is simply modifiable for its purposes
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
        if (attrName != "style" || !/^[a-z\-]+:[^;]+;?\s?$/i.test(el.style.cssText)) {
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

/*
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
            if (options.ignoreWhiteSpace && isUnrenderedWhiteSpaceNode(node)) {
                return true;
            }
        }
        return false;
    }
*/

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

    /**
     * "effective value" per edit command spec
     */
    function getEffectiveCommandValue(node, context) {
        var isElement = (node.nodeType == 1);

        // "If neither node nor its parent is an Element, return null."
        if (!isElement && (!node.parentNode || node.parentNode.nodeType != 1)) {
            return null;
        }

        // "If node is not an Element, return the effective command value of its parent for command."
        if (!isElement) {
            return getEffectiveCommandValue(node.parentNode, context);
        }

        return context.command.getEffectiveValue(node, context);
    }

/*
    // "An extraneous line break is a br that has no visual effect, in that
    // removing it from the DOM would not change layout, except that a br that is
    // the sole child of an li is not extraneous."
    function isExtraneousLineBreak(br) {
        if (!isHtmlElement(br, "br")) {
            return false;
        }

        var ref = br.parentNode;
        if (isHtmlElement(ref, "li") && ref.childNodes.length == 1) {
            return false;
        }

        while (isInlineNode(ref)) {
            ref = ref.parentNode;
        }

        var origHeight = ref.offsetHeight;
        if (origHeight == 0) {
            throw "isExtraneousLineBreak: original height is zero, bug?";
        }
        var styleAttr = br.attributes["style"];
        var originalStyle = null;
        if (styleAttr && styleAttr.specified) {
            originalStyle = br.style.cssText;
        }
        br.style.display = "none";
        var finalHeight = ref.offsetHeight;
        if (originalStyle === null) {
            br.style.cssText = "";
            br.removeAttribute("style");
        } else {
            br.style.cssText = originalStyle;
        }

        return origHeight == finalHeight;
    }
*/

    function removeExtraneousLineBreaksBefore(node) {
        var ref;

        // "Let ref be the previousSibling of node. If ref is null, abort these steps."
        if (!node || !(ref = node.previousSibling)) {
            return;
        }

        // "While ref has children, set ref to its lastChild."
        while (ref.hasChildNodes()) {
            ref = ref.lastChild;
        }

        // "While ref is invisible but not an extraneous line break, and ref does
        // not equal node's parent, set ref to the node before it in tree order."
        while (isInvisible(ref)
        && !isExtraneousLineBreak(ref)
        && ref != node.parentNode) {
            ref = previousNode(ref);
        }

        // "If ref is an editable extraneous line break, remove it from its
        // parent."
        if (isEditable(ref)
        && isExtraneousLineBreak(ref)) {
            ref.parentNode.removeChild(ref);
        }

        

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

    function setTagName(element, newName, rangesToPreserve) {
        // "If element is an HTML element with local name equal to new name, return element."
        // "If element's parent is null, return element."
        if (isHtmlElement(element, newName) || !element.parentNode) {
            return element;
        }

        // "Let replacement element be the result of calling createElement(new
        // name) on the ownerDocument of element."
        var replacementElement = dom.getDocument(element).createElement(newName);

        // "Insert replacement element into element's parent immediately before
        // element."
        element.parentNode.insertBefore(replacementElement, element);

        // "Copy all attributes of element to replacement element, in order."
        copyAttributes(element, replacementElement);

        // "While element has children, append the first child of element as the
        // last child of replacement element, preserving ranges."
        // "Remove element from its parent."
        moveChildrenPreservingRanges(element, replacementElement, 0, true, rangesToPreserve);

        // "Return replacement element."
        return replacementElement;
    }

    function clearValue(element, context) {
        var command = context.command, rangesToPreserve = context.rangesToPreserve;

        log.info("clearValue", outerHtml(element), command.getSpecifiedValue(element, context))

        // "If element is not editable, return the empty list."
        if (!isEditable(element, context.options)) {
            return [];
        }

        // "If element's specified value for command is null, return the empty
        // list."
        if (command.getSpecifiedValue(element, context) === null) {
            return [];
        }

        // "If element is a simple modifiable element:"
        if (isSimpleModifiableElement(element, context)) {
            return replaceWithOwnChildren(element, rangesToPreserve);
        }

        // Do command-specific clearing
        if (command.clearValue) {
            command.clearValue(element, context);
        }

        // "If element's specified value for command is null, return the empty
        // list."
        if (command.getSpecifiedValue(element, context) === null) {
            return [];
        }

        // "Set the tag name of element to "span", and return the one-node list
        // consisting of the result."
        return [setTagName(element, "span", rangesToPreserve)];
    }

    var defaultSiblingCriteria = function() { return false };
    var defaultNewParentInstructions = function() { return null };

    function wrap(nodeList, context, siblingCriteria, newParentInstructions) {
        // "If not provided, sibling criteria match nothing and new parent
        // instructions return null."
        siblingCriteria = siblingCriteria || defaultSiblingCriteria;
        newParentInstructions = newParentInstructions || defaultNewParentInstructions;

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
            var newParentNodeIndex = dom.getNodeIndex(newParent);
            for (i = 0; range = rangesToPreserve[i++]; ) {
                if (range.startContainer == newParentParent && range.startOffset == newParentNodeIndex) {
                    range.setStart(range.startContainer, range.startOffset + 1);
                }
                if (range.endContainer == newParentParent && range.endOffset == newParentNodeIndex) {
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
            if (!isInlineNode(newParent) && isInlineNode(newParent.lastChild) && isInlineNode(firstNode)
                    && !isHtmlElement(newParent.lastChild, "br")) {
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
            if (!isInlineNode(newParent) && isInlineNode(newParent.firstChild) && isInlineNode(lastNode)
                    && !isHtmlElement(lastNode, "br")) {
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
            if (!isInlineNode(newParent) && isInlineNode(newParent.lastChild)
                    && isInlineNode(newParentNextSibling.firstChild) && !isHtmlElement(newParent.lastChild, "br")) {
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

    /*----------------------------------------------------------------------------------------------------------------*/

    function Command() {}

    Command.prototype = {
        getSpecifiedValue: function() {
            return null;
        },

        getEffectiveValue: function(element, context) {
            return null;
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
        isBlockNode: isBlockNode,
        isInlineNode: isInlineNode,
/*
        blockExtend: blockExtend,
*/
        isModifiableElement: isModifiableElement,
        isSimpleModifiableElement: isSimpleModifiableElement,
        moveChildrenPreservingRanges: moveChildrenPreservingRanges,
        replaceWithOwnChildren: replaceWithOwnChildren,
        copyAttributes: copyAttributes,
        clearValue: clearValue,
        getEffectiveTextNodes: getEffectiveTextNodes,
        getEffectivelyContainedElements: getEffectivelyContainedElements,
/*
        getEffectiveValue: getEffectiveValue,
        setNodeValue: setNodeValue,
*/
        wrap: wrap
/*
        decomposeRange: decomposeRange,
*/

    };


    api.Command = Command;

    /*----------------------------------------------------------------------------------------------------------------*/

    function SimpleInlineCommand() {}

    SimpleInlineCommand.prototype = new Command();

    api.util.extend(SimpleInlineCommand.prototype, {
        getEffectiveValue: function(element) {
            return getComputedStyleProperty(element, this.relevantCssProperty);
        },

        clearValue: function(element) {
            element.style[this.relevantCssProperty] = "";
            if (element.style.cssText == "") {
                element.removeAttribute("style");
            }
        }
    });

    SimpleInlineCommand.create = function(commandConstructor, properties) {
        var proto = new Command();
        commandConstructor.prototype = proto;
        api.util.extend(proto, properties);
    };

    api.SimpleInlineCommand = SimpleInlineCommand;

    /*----------------------------------------------------------------------------------------------------------------*/

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
});