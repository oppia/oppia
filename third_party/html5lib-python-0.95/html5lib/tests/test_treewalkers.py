import os
import sys
import StringIO
import unittest
import warnings

warnings.simplefilter("error")

from support import html5lib_test_files, TestData, convertExpected

from html5lib import html5parser, treewalkers, treebuilders, constants
from html5lib.filters.lint import Filter as LintFilter, LintError

def PullDOMAdapter(node):
    from xml.dom import Node
    from xml.dom.pulldom import START_ELEMENT, END_ELEMENT, COMMENT, CHARACTERS

    if node.nodeType in (Node.DOCUMENT_NODE, Node.DOCUMENT_FRAGMENT_NODE):
        for childNode in node.childNodes:
            for event in PullDOMAdapter(childNode):
                yield event

    elif node.nodeType == Node.DOCUMENT_TYPE_NODE:
        raise NotImplementedError("DOCTYPE nodes are not supported by PullDOM")

    elif node.nodeType == Node.COMMENT_NODE:
        yield COMMENT, node

    elif node.nodeType in (Node.TEXT_NODE, Node.CDATA_SECTION_NODE):
        yield CHARACTERS, node

    elif node.nodeType == Node.ELEMENT_NODE:
        yield START_ELEMENT, node
        for childNode in node.childNodes:
            for event in PullDOMAdapter(childNode):
                yield event
        yield END_ELEMENT, node

    else:
        raise NotImplementedError("Node type not supported: " + str(node.nodeType))

treeTypes = {
"simpletree":  {"builder": treebuilders.getTreeBuilder("simpletree"),
                "walker":  treewalkers.getTreeWalker("simpletree")},
"DOM":         {"builder": treebuilders.getTreeBuilder("dom"),
                "walker":  treewalkers.getTreeWalker("dom")},
"PullDOM":     {"builder": treebuilders.getTreeBuilder("dom"),
                "adapter": PullDOMAdapter,
                "walker":  treewalkers.getTreeWalker("pulldom")},
}

#Try whatever etree implementations are available from a list that are
#"supposed" to work
try:
    import xml.etree.ElementTree as ElementTree
    treeTypes['ElementTree'] = \
        {"builder": treebuilders.getTreeBuilder("etree", ElementTree),
         "walker":  treewalkers.getTreeWalker("etree", ElementTree)}
except ImportError:
    try:
        import elementtree.ElementTree as ElementTree
        treeTypes['ElementTree'] = \
            {"builder": treebuilders.getTreeBuilder("etree", ElementTree),
             "walker":  treewalkers.getTreeWalker("etree", ElementTree)}
    except ImportError:
        pass

try:
    import xml.etree.cElementTree as ElementTree
    treeTypes['cElementTree'] = \
        {"builder": treebuilders.getTreeBuilder("etree", ElementTree),
         "walker":  treewalkers.getTreeWalker("etree", ElementTree)}
except ImportError:
    try:
        import cElementTree as ElementTree
        treeTypes['cElementTree'] = \
            {"builder": treebuilders.getTreeBuilder("etree", ElementTree),
             "walker":  treewalkers.getTreeWalker("etree", ElementTree)}
    except ImportError:
        pass

try:
    import lxml.etree as ElementTree
#    treeTypes['lxml_as_etree'] = \
#        {"builder": treebuilders.getTreeBuilder("etree", ElementTree),
#         "walker":  treewalkers.getTreeWalker("etree", ElementTree)}
    treeTypes['lxml_native'] = \
        {"builder": treebuilders.getTreeBuilder("lxml"),
         "walker":  treewalkers.getTreeWalker("lxml")}
except ImportError:
    pass

try:
    import BeautifulSoup
    treeTypes["beautifulsoup"] = \
        {"builder": treebuilders.getTreeBuilder("beautifulsoup"),
         "walker":  treewalkers.getTreeWalker("beautifulsoup")}
except ImportError:
    pass
    
#Try whatever etree implementations are available from a list that are
#"supposed" to work
try:
    import pxdom
    treeTypes['pxdom'] = \
        {"builder": treebuilders.getTreeBuilder("dom", pxdom),
         "walker":  treewalkers.getTreeWalker("dom")}
except ImportError:
    pass

try:
    from genshi.core import QName, Attrs
    from genshi.core import START, END, TEXT, COMMENT, DOCTYPE

    def GenshiAdapter(tree):
        text = None
        for token in treewalkers.getTreeWalker("simpletree")(tree):
            type = token["type"]
            if type in ("Characters", "SpaceCharacters"):
                if text is None:
                    text = token["data"]
                else:
                    text += token["data"]
            elif text is not None:
                yield TEXT, text, (None, -1, -1)
                text = None

            if type in ("StartTag", "EmptyTag"):
                if token["namespace"]:
                    name = u"{%s}%s" % (token["namespace"], token["name"])
                else:
                    name = token["name"]
                yield (START,
                       (QName(name),
                        Attrs([(QName(attr),value) for attr,value in token["data"]])),
                       (None, -1, -1))
                if type == "EmptyTag":
                    type = "EndTag"

            if type == "EndTag":
                yield END, QName(token["name"]), (None, -1, -1)

            elif type == "Comment":
                yield COMMENT, token["data"], (None, -1, -1)

            elif type == "Doctype":
                yield DOCTYPE, (token["name"], token["publicId"], 
                                token["systemId"]), (None, -1, -1)

            else:
                pass # FIXME: What to do?

        if text is not None:
            yield TEXT, text, (None, -1, -1)

    #treeTypes["genshi"] = \
    #    {"builder": treebuilders.getTreeBuilder("simpletree"),
    #     "adapter": GenshiAdapter,
    #     "walker":  treewalkers.getTreeWalker("genshi")}
except ImportError:
    pass

def concatenateCharacterTokens(tokens):
    charactersToken = None
    for token in tokens:
        type = token["type"]
        if type in ("Characters", "SpaceCharacters"):
            if charactersToken is None:
                charactersToken = {"type": "Characters", "data": token["data"]}
            else:
                charactersToken["data"] += token["data"]
        else:
            if charactersToken is not None:
                yield charactersToken
                charactersToken = None
            yield token
    if charactersToken is not None:
        yield charactersToken

def convertTokens(tokens):
    output = []
    indent = 0
    for token in concatenateCharacterTokens(tokens):
        type = token["type"]
        if type in ("StartTag", "EmptyTag"):
            if (token["namespace"] and
                token["namespace"] != constants.namespaces["html"]):
                if token["namespace"] in constants.prefixes:
                    name = constants.prefixes[token["namespace"]]
                else:
                    name = token["namespace"]
                name += u" " + token["name"]
            else:
                name = token["name"]
            output.append(u"%s<%s>" % (" "*indent, name))
            indent += 2
            attrs = token["data"]
            if attrs:
                #TODO: Remove this if statement, attrs should always exist
                for (namespace,name),value in sorted(attrs.items()):
                    if namespace:
                        if namespace in constants.prefixes:
                            outputname = constants.prefixes[namespace]
                        else:
                            outputname = namespace
                        outputname += u" " + name
                    else:
                        outputname = name
                    output.append(u"%s%s=\"%s\"" % (" "*indent, outputname, value))
            if type == "EmptyTag":
                indent -= 2
        elif type == "EndTag":
            indent -= 2
        elif type == "Comment":
            output.append("%s<!-- %s -->" % (" "*indent, token["data"]))
        elif type == "Doctype":
            if token["name"]:
                if token["publicId"]:
                    output.append("""%s<!DOCTYPE %s "%s" "%s">"""% 
                                  (" "*indent, token["name"], 
                                   token["publicId"],
                                   token["systemId"] and token["systemId"] or ""))
                elif token["systemId"]:
                    output.append("""%s<!DOCTYPE %s "" "%s">"""% 
                                  (" "*indent, token["name"], 
                                   token["systemId"]))
                else:
                    output.append("%s<!DOCTYPE %s>"%(" "*indent,
                                                     token["name"]))
            else:
                output.append("%s<!DOCTYPE >" % (" "*indent,))
        elif type in ("Characters", "SpaceCharacters"):
            output.append("%s\"%s\"" % (" "*indent, token["data"]))
        else:
            pass # TODO: what to do with errors?
    return u"\n".join(output)

import re
attrlist = re.compile(r"^(\s+)\w+=.*(\n\1\w+=.*)+",re.M)
def sortattrs(x):
  lines = x.group(0).split("\n")
  lines.sort()
  return "\n".join(lines)


class TokenTestCase(unittest.TestCase):
    def test_all_tokens(self):
        expected = [
            {'data': {}, 'type': 'StartTag', 'namespace': u'http://www.w3.org/1999/xhtml', 'name': u'html'},
            {'data': {}, 'type': 'StartTag', 'namespace': u'http://www.w3.org/1999/xhtml', 'name': u'head'},
            {'data': {}, 'type': 'EndTag', 'namespace': u'http://www.w3.org/1999/xhtml', 'name': u'head'},
            {'data': {}, 'type': 'StartTag', 'namespace': u'http://www.w3.org/1999/xhtml', 'name': u'body'},
            {'data': u'a', 'type': 'Characters'},
            {'data': {}, 'type': 'StartTag', 'namespace': u'http://www.w3.org/1999/xhtml', 'name': u'div'},
            {'data': u'b', 'type': 'Characters'},
            {'data': {}, 'type': 'EndTag', 'namespace': u'http://www.w3.org/1999/xhtml', 'name': u'div'},
            {'data': u'c', 'type': 'Characters'},
            {'data': {}, 'type': 'EndTag', 'namespace': u'http://www.w3.org/1999/xhtml', 'name': u'body'},
            {'data': {}, 'type': 'EndTag', 'namespace': u'http://www.w3.org/1999/xhtml', 'name': u'html'}
            ]
        for treeName, treeCls in treeTypes.iteritems():
            p = html5parser.HTMLParser(tree = treeCls["builder"])
            document = p.parse("<html><head></head><body>a<div>b</div>c</body></html>")
            document = treeCls.get("adapter", lambda x: x)(document)
            output = treeCls["walker"](document)
            for expectedToken, outputToken in zip(expected, output):
                self.assertEquals(expectedToken, outputToken)

def run_test(innerHTML, input, expected, errors, treeClass):
    try:
        p = html5parser.HTMLParser(tree = treeClass["builder"])
        if innerHTML:
            document = p.parseFragment(StringIO.StringIO(input), innerHTML)
        else:
            document = p.parse(StringIO.StringIO(input))
    except constants.DataLossWarning:
        #Ignore testcases we know we don't pass
        return

    document = treeClass.get("adapter", lambda x: x)(document)
    try:
        output = convertTokens(treeClass["walker"](document))
        output = attrlist.sub(sortattrs, output)
        expected = attrlist.sub(sortattrs, convertExpected(expected))
        assert expected == output, "\n".join([
                "", "Input:", input,
                "", "Expected:", expected,
                "", "Received:", output
                ])
    except NotImplementedError:
        pass # Amnesty for those that confess...
            
def test_treewalker():
    sys.stdout.write('Testing tree walkers '+ " ".join(treeTypes.keys()) + "\n")

    for treeName, treeCls in treeTypes.iteritems():
        files = html5lib_test_files('tree-construction')
        for filename in files:
            testName = os.path.basename(filename).replace(".dat","")

            tests = TestData(filename, "data")

            for index, test in enumerate(tests):
                (input, errors,
                 innerHTML, expected) = [test[key] for key in ("data", "errors",
                                                               "document-fragment",
                                                               "document")]
                errors = errors.split("\n")
                yield run_test, innerHTML, input, expected, errors, treeCls


