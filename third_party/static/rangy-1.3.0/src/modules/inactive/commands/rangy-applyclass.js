/**
 * Selection save and restore module for Rangy.
 * ApplyClass command
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
rangy.createModule("ApplyClassCommand", function(api, module) {
    api.requireModules( ["Commands"] );

    var dom = api.dom, commandUtil = api.Command.util;
    var log = log4javascript.getLogger("rangy.ApplyClassCommand");

    var defaultTagNames = ["span"];

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

    function sortClassName(className) {
        return className.split(/\s+/).sort().join(" ");
    }

    function getSortedClassName(el) {
        return sortClassName(el.className);
    }

    function haveSameClasses(el1, el2) {
        return getSortedClassName(el1) == getSortedClassName(el2);
    }

    function ApplyClassCommand() {
    }

    api.Command.create(ApplyClassCommand, {
        defaultOptions: {
            tagName: "span",
            validTagNames: ["span"]
        },

        isValidElementForClass: function(el, validTagNames) {
            return new RegExp("^(" + validTagNames.join("|") + ")$", "i").test(el.tagName);
        },

        isModifiableElement: function(el, context) {
            if (!this.isValidElementForClass(el, context.options.validTagNames)) {
                return false;
            }

            // Extract attributes once and quit if more than one is found or the attribute is not "class"
            var hasAnyAttrs = false;
            for (var i = 0, len = el.attributes.length; i < len; ++i) {
                if (el.attributes[i].specified) {
                    // If it's got more than one attribute, everything after this fails.
                    if (hasAnyAttrs || el.attributes[i].name != "class") {
                        return false;
                    }
                    hasAnyAttrs = true;
                }
            }
        },

        isSimpleModifiableElement: function(el, context) {
            if (!this.isValidElementForClass(el, context.options.validTagNames)) {
                return false;
            }

            // Extract attributes once and quit if more than one is found or the attribute is not "class"
            var hasAnyAttrs = false;
            for (var i = 0, len = el.attributes.length; i < len; ++i) {
                if (el.attributes[i].specified) {
                    // If it's got more than one attribute, everything after this fails.
                    if (hasAnyAttrs || el.attributes[i].name != "class") {
                        return false;
                    }
                    hasAnyAttrs = true;
                }
            }

            return true;
        },

        createCssElement: function(doc, context) {
            return doc.createElement(context.options.tagName);
        },

        styleCssElement: function(el, value) {
            el.className = value;
        },

        getAncestorOrSelfWithClass: function(node, validTagNames, className) {
            while (node) {
                if (node.nodeType == 1 && this.isValidElementForClass(node, validTagNames) && hasClass(node, className)) {
                    return node;
                }
                node = node.parentNode;
            }
            return null;
        },

        getSpecifiedValue: function(element, context) {
            return hasClass(element, context.value) ? context.value : null;
        },

        getEffectiveValue: function(element, context) {
            return this.getAncestorOrSelfWithClass(element, context.options.validTagNames, context.value) ?
                    context.value : null;
        },

        createNonCssElement: function(node, value) {
            return (value == "bold" || value == "700") ? dom.getDocument(node).createElement("b") : null;
        },

        getRangeValue: function(range, context) {
            var textNodes = commandUtil.getEffectiveTextNodes(range, context), i = textNodes.length, value;
            log.info("getRangeValue on " + range.inspect() + ", text nodes: " + textNodes);
            while (i--) {
                log.warn("effective value on " + textNodes[i].data +  ": " + commandUtil.getEffectiveValue(textNodes[i], context));
                if (commandUtil.getEffectiveValue(textNodes[i], context) === null) {
                    return false;
                }
            }
            log.info("getRangeValue returning true");
            return textNodes.length > 0;
        },

        getSelectionValue: function(sel, context) {
            var selRanges = sel.getAllRanges();
            for (var i = 0, len = selRanges.length; i < len; ++i) {
                if (!this.getRangeValue(selRanges[i], context)) {
                    return false;
                }
            }
            return len > 0;
        },

        getNewSelectionValue: function(sel, context) {
            return this.getSelectionValue(sel, context) ? "" : context.value;
        },

        applyValueToRange: function(range, context) {
            var decomposed = range.decompose(context.rangesToPreserve);

            for (var i = 0, len = decomposed.length; i < len; ++i) {
                commandUtil.setNodeValue(decomposed[i], context);
            }
        }
    });

    api.registerCommand("applyclass", new ApplyClassCommand());

});
