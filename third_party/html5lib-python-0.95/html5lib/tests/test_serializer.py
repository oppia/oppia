import os
import unittest
from support import html5lib_test_files

try:
    import json
except ImportError:
    import simplejson as json

import html5lib
from html5lib import html5parser, serializer, constants
from html5lib.treewalkers._base import TreeWalker

optionals_loaded = []

try:
    from lxml import etree
    optionals_loaded.append("lxml")
except ImportError:
    pass

default_namespace = constants.namespaces["html"]

class JsonWalker(TreeWalker):
    def __iter__(self):
        for token in self.tree:
            type = token[0]
            if type == "StartTag":
                if len(token) == 4:
                    namespace, name, attrib = token[1:4]
                else:
                    namespace = default_namespace
                    name, attrib = token[1:3]
                yield self.startTag(namespace, name, self._convertAttrib(attrib))
            elif type == "EndTag":
                if len(token) == 3:
                    namespace, name = token[1:3]
                else:
                    namespace = default_namespace
                    name = token[1]
                yield self.endTag(namespace, name)
            elif type == "EmptyTag":
                if len(token) == 4:
                    namespace, name, attrib = token[1:]
                else:
                    namespace = default_namespace
                    name, attrib = token[1:]
                for token in self.emptyTag(namespace, name, self._convertAttrib(attrib)):
                    yield token
            elif type == "Comment":
                yield self.comment(token[1])
            elif type in ("Characters", "SpaceCharacters"):
                for token in self.text(token[1]):
                    yield token
            elif type == "Doctype":
                if len(token) == 4:
                    yield self.doctype(token[1], token[2], token[3])
                elif len(token) == 3:
                    yield self.doctype(token[1], token[2])
                else:
                    yield self.doctype(token[1])
            else:
                raise ValueError("Unknown token type: " + type)
    
    def _convertAttrib(self, attribs):
        """html5lib tree-walkers use a dict of (namespace, name): value for
        attributes, but JSON cannot represent this. Convert from the format
        in the serializer tests (a list of dicts with "namespace", "name",
        and "value" as keys) to html5lib's tree-walker format."""
        attrs = {}
        for attrib in attribs:
            name = (attrib["namespace"], attrib["name"])
            assert(name not in attrs)
            attrs[name] = attrib["value"]
        return attrs


def serialize_html(input, options):
    options = dict([(str(k),v) for k,v in options.iteritems()])
    return serializer.HTMLSerializer(**options).render(JsonWalker(input),options.get("encoding",None))

def serialize_xhtml(input, options):
    options = dict([(str(k),v) for k,v in options.iteritems()])
    return serializer.XHTMLSerializer(**options).render(JsonWalker(input),options.get("encoding",None))

def make_test(input, expected, xhtml, options):
    result = serialize_html(input, options)
    if len(expected) == 1:
        assert expected[0] == result, "Expected:\n%s\nActual:\n%s\nOptions\nxhtml:False\n%s"%(expected[0], result, str(options))
    elif result not in expected:
        assert False, "Expected: %s, Received: %s" % (expected, result)

    if not xhtml:
        return

    result = serialize_xhtml(input, options)
    if len(xhtml) == 1:
        assert xhtml[0] == result, "Expected:\n%s\nActual:\n%s\nOptions\nxhtml:True\n%s"%(xhtml[0], result, str(options))
    elif result not in xhtml:
        assert False, "Expected: %s, Received: %s" % (xhtml, result)


class EncodingTestCase(unittest.TestCase):
    def throwsWithLatin1(self, input):
        self.assertRaises(UnicodeEncodeError, serialize_html, input, {"encoding": "iso-8859-1"})

    def testDoctypeName(self):
        self.throwsWithLatin1([["Doctype", u"\u0101"]])

    def testDoctypePublicId(self):
        self.throwsWithLatin1([["Doctype", u"potato", u"\u0101"]])

    def testDoctypeSystemId(self):
        self.throwsWithLatin1([["Doctype", u"potato", u"potato", u"\u0101"]])

    def testCdataCharacters(self):
        self.assertEquals("<style>&amacr;", serialize_html([["StartTag", "http://www.w3.org/1999/xhtml", "style", {}],
                                                            ["Characters", u"\u0101"]],
                                                           {"encoding": "iso-8859-1"}))

    def testCharacters(self):
        self.assertEquals("&amacr;", serialize_html([["Characters", u"\u0101"]],
                                                    {"encoding": "iso-8859-1"}))

    def testStartTagName(self):
        self.throwsWithLatin1([["StartTag", u"http://www.w3.org/1999/xhtml", u"\u0101", []]])

    def testEmptyTagName(self):
        self.throwsWithLatin1([["EmptyTag", u"http://www.w3.org/1999/xhtml", u"\u0101", []]])

    def testAttributeName(self):
        self.throwsWithLatin1([["StartTag", u"http://www.w3.org/1999/xhtml", u"span", [{"namespace": None, "name": u"\u0101", "value": u"potato"}]]])

    def testAttributeValue(self):
        self.assertEquals("<span potato=&amacr;>", serialize_html([["StartTag", u"http://www.w3.org/1999/xhtml", u"span",
                                                                    [{"namespace": None, "name": u"potato", "value": u"\u0101"}]]],
                                                                  {"encoding": "iso-8859-1"}))

    def testEndTagName(self):
        self.throwsWithLatin1([["EndTag", u"http://www.w3.org/1999/xhtml", u"\u0101"]])

    def testComment(self):
        self.throwsWithLatin1([["Comment", u"\u0101"]])


if "lxml" in optionals_loaded:
    class LxmlTestCase(unittest.TestCase):
        def setUp(self):
            self.parser = etree.XMLParser(resolve_entities=False)
            self.treewalker = html5lib.getTreeWalker("lxml")
            self.serializer = serializer.HTMLSerializer()

        def testEntityReplacement(self):
            doc = """<!DOCTYPE html SYSTEM "about:legacy-compat"><html>&beta;</html>"""
            tree = etree.fromstring(doc, parser = self.parser).getroottree()
            result = serializer.serialize(tree, tree="lxml", omit_optional_tags=False)
            self.assertEquals(u"""<!DOCTYPE html SYSTEM "about:legacy-compat"><html>\u03B2</html>""", result)

        def testEntityXML(self):
            doc = """<!DOCTYPE html SYSTEM "about:legacy-compat"><html>&gt;</html>"""
            tree = etree.fromstring(doc, parser = self.parser).getroottree()
            result = serializer.serialize(tree, tree="lxml", omit_optional_tags=False)
            self.assertEquals(u"""<!DOCTYPE html SYSTEM "about:legacy-compat"><html>&gt;</html>""", result)

        def testEntityNoResolve(self):
            doc = """<!DOCTYPE html SYSTEM "about:legacy-compat"><html>&beta;</html>"""
            tree = etree.fromstring(doc, parser = self.parser).getroottree()
            result = serializer.serialize(tree, tree="lxml", omit_optional_tags=False,
                                          resolve_entities=False)
            self.assertEquals(u"""<!DOCTYPE html SYSTEM "about:legacy-compat"><html>&beta;</html>""", result)

def test_serializer():
    for filename in html5lib_test_files('serializer', '*.test'):
        tests = json.load(file(filename))
        test_name = os.path.basename(filename).replace('.test','')
        for index, test in enumerate(tests['tests']):
            xhtml = test.get("xhtml", test["expected"])
            if test_name == 'optionaltags': 
                xhtml = None
            yield make_test, test["input"], test["expected"], xhtml, test.get("options", {})
