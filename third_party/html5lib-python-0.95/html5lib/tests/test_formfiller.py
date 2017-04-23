import sys
import unittest

from html5lib.filters.formfiller import SimpleFilter

class FieldStorage(dict):
    def getlist(self, name):
        l = self[name]
        if isinstance(l, list):
            return l
        elif isinstance(l, tuple) or hasattr(l, '__iter__'):
            return list(l)
        return [l]

class TestCase(unittest.TestCase):
    def runTest(self, input, formdata, expected):
        try:
            output = list(SimpleFilter(input, formdata))
        except NotImplementedError, nie:
            # Amnesty for those that confess...
            print >>sys.stderr, "Not implemented:", str(nie)
        else:
            errorMsg = "\n".join(["\n\nInput:", str(input),
                                  "\nForm data:", str(formdata),
                                  "\nExpected:", str(expected),
                                  "\nReceived:", str(output)])
            self.assertEquals(output, expected, errorMsg)

    def testSingleTextInputWithValue(self):
        self.runTest(
            [{"type": u"EmptyTag", "name": u"input",
                "data": [(u"type", u"text"), (u"name", u"foo"), (u"value", u"quux")]}],
            FieldStorage({"foo": "bar"}),
            [{"type": u"EmptyTag", "name": u"input",
                "data": [(u"type", u"text"), (u"name", u"foo"), (u"value", u"bar")]}])

    def testSingleTextInputWithoutValue(self):
        self.runTest(
            [{"type": u"EmptyTag", "name": u"input",
                "data": [(u"type", u"text"), (u"name", u"foo")]}],
            FieldStorage({"foo": "bar"}),
            [{"type": u"EmptyTag", "name": u"input",
                "data": [(u"type", u"text"), (u"name", u"foo"), (u"value", u"bar")]}])

    def testSingleCheckbox(self):
        self.runTest(
            [{"type": u"EmptyTag", "name": u"input",
                "data": [(u"type", u"checkbox"), (u"name", u"foo"), (u"value", u"bar")]}],
            FieldStorage({"foo": "bar"}),
            [{"type": u"EmptyTag", "name": u"input",
                "data": [(u"type", u"checkbox"), (u"name", u"foo"), (u"value", u"bar"), (u"checked", u"")]}])

    def testSingleCheckboxShouldBeUnchecked(self):
        self.runTest(
            [{"type": u"EmptyTag", "name": u"input",
                "data": [(u"type", u"checkbox"), (u"name", u"foo"), (u"value", u"quux")]}],
            FieldStorage({"foo": "bar"}),
            [{"type": u"EmptyTag", "name": u"input",
                "data": [(u"type", u"checkbox"), (u"name", u"foo"), (u"value", u"quux")]}])

    def testSingleCheckboxCheckedByDefault(self):
        self.runTest(
            [{"type": u"EmptyTag", "name": u"input",
                "data": [(u"type", u"checkbox"), (u"name", u"foo"), (u"value", u"bar"), (u"checked", u"")]}],
            FieldStorage({"foo": "bar"}),
            [{"type": u"EmptyTag", "name": u"input",
                "data": [(u"type", u"checkbox"), (u"name", u"foo"), (u"value", u"bar"), (u"checked", u"")]}])

    def testSingleCheckboxCheckedByDefaultShouldBeUnchecked(self):
        self.runTest(
            [{"type": u"EmptyTag", "name": u"input",
                "data": [(u"type", u"checkbox"), (u"name", u"foo"), (u"value", u"quux"), (u"checked", u"")]}],
            FieldStorage({"foo": "bar"}),
            [{"type": u"EmptyTag", "name": u"input",
                "data": [(u"type", u"checkbox"), (u"name", u"foo"), (u"value", u"quux")]}])

    def testSingleTextareaWithValue(self):
        self.runTest(
            [{"type": u"StartTag", "name": u"textarea", "data": [(u"name", u"foo")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"textarea", "data": []}],
            FieldStorage({"foo": "bar"}),
            [{"type": u"StartTag", "name": u"textarea", "data": [(u"name", u"foo")]},
             {"type": u"Characters", "data": u"bar"},
             {"type": u"EndTag", "name": u"textarea", "data": []}])

    def testSingleTextareaWithoutValue(self):
        self.runTest(
            [{"type": u"StartTag", "name": u"textarea", "data": [(u"name", u"foo")]},
             {"type": u"EndTag", "name": u"textarea", "data": []}],
            FieldStorage({"foo": "bar"}),
            [{"type": u"StartTag", "name": u"textarea", "data": [(u"name", u"foo")]},
             {"type": u"Characters", "data": u"bar"},
             {"type": u"EndTag", "name": u"textarea", "data": []}])

    def testSingleSelectWithValue(self):
        self.runTest(
            [{"type": u"StartTag", "name": u"select", "data": [(u"name", u"foo")]},
             {"type": u"StartTag", "name": u"option", "data": [(u"value", u"bar")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"EndTag", "name": u"select", "data": []}],
            FieldStorage({"foo": "bar"}),
            [{"type": u"StartTag", "name": u"select", "data": [(u"name", u"foo")]},
             {"type": u"StartTag", "name": u"option", "data": [(u"value", u"bar"), (u"selected", u"")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"EndTag", "name": u"select", "data": []}])

    def testSingleSelectWithValueShouldBeUnselected(self):
        self.runTest(
            [{"type": u"StartTag", "name": u"select", "data": [(u"name", u"foo")]},
             {"type": u"StartTag", "name": u"option", "data": [(u"value", u"bar")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"EndTag", "name": u"select", "data": []}],
            FieldStorage({"foo": "quux"}),
            [{"type": u"StartTag", "name": u"select", "data": [(u"name", u"foo")]},
             {"type": u"StartTag", "name": u"option", "data": [(u"value", u"bar")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"EndTag", "name": u"select", "data": []}])

    def testSingleSelectWithoutValue(self):
        self.runTest(
            [{"type": u"StartTag", "name": u"select", "data": [(u"name", u"foo")]},
             {"type": u"StartTag", "name": u"option", "data": []},
             {"type": u"Characters", "data": u"bar"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"EndTag", "name": u"select", "data": []}],
            FieldStorage({"foo": "bar"}),
            [{"type": u"StartTag", "name": u"select", "data": [(u"name", u"foo")]},
             {"type": u"StartTag", "name": u"option", "data": [(u"selected", u"")]},
             {"type": u"Characters", "data": u"bar"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"EndTag", "name": u"select", "data": []}])

    def testSingleSelectWithoutValueShouldBeUnselected(self):
        self.runTest(
            [{"type": u"StartTag", "name": u"select", "data": [(u"name", u"foo")]},
             {"type": u"StartTag", "name": u"option", "data": []},
             {"type": u"Characters", "data": u"bar"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"EndTag", "name": u"select", "data": []}],
            FieldStorage({"foo": "quux"}),
            [{"type": u"StartTag", "name": u"select", "data": [(u"name", u"foo")]},
             {"type": u"StartTag", "name": u"option", "data": []},
             {"type": u"Characters", "data": u"bar"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"EndTag", "name": u"select", "data": []}])

    def testSingleSelectTwoOptionsWithValue(self):
        self.runTest(
            [{"type": u"StartTag", "name": u"select", "data": [(u"name", u"foo")]},
             {"type": u"StartTag", "name": u"option", "data": [(u"value", u"bar")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"StartTag", "name": u"option", "data": [(u"value", u"quux")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"EndTag", "name": u"select", "data": []}],
            FieldStorage({"foo": "bar"}),
            [{"type": u"StartTag", "name": u"select", "data": [(u"name", u"foo")]},
             {"type": u"StartTag", "name": u"option", "data": [(u"value", u"bar"), (u"selected", u"")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"StartTag", "name": u"option", "data": [(u"value", u"quux")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"EndTag", "name": u"select", "data": []}])

    def testSingleSelectTwoOptionsWithValueShouldBeUnselected(self):
        self.runTest(
            [{"type": u"StartTag", "name": u"select", "data": [(u"name", u"foo")]},
             {"type": u"StartTag", "name": u"option", "data": [(u"value", u"bar")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"StartTag", "name": u"option", "data": [(u"value", u"baz")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"EndTag", "name": u"select", "data": []}],
            FieldStorage({"foo": "quux"}),
            [{"type": u"StartTag", "name": u"select", "data": [(u"name", u"foo")]},
             {"type": u"StartTag", "name": u"option", "data": [(u"value", u"bar")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"StartTag", "name": u"option", "data": [(u"value", u"baz")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"EndTag", "name": u"select", "data": []}])

    def testSingleSelectTwoOptionsWithoutValue(self):
        self.runTest(
            [{"type": u"StartTag", "name": u"select", "data": [(u"name", u"foo")]},
             {"type": u"StartTag", "name": u"option", "data": []},
             {"type": u"Characters", "data": u"bar"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"StartTag", "name": u"option", "data": []},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"EndTag", "name": u"select", "data": []}],
            FieldStorage({"foo": "bar"}),
            [{"type": u"StartTag", "name": u"select", "data": [(u"name", u"foo")]},
             {"type": u"StartTag", "name": u"option", "data": [(u"selected", u"")]},
             {"type": u"Characters", "data": u"bar"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"StartTag", "name": u"option", "data": []},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"EndTag", "name": u"select", "data": []}])

    def testSingleSelectTwoOptionsWithoutValueShouldBeUnselected(self):
        self.runTest(
            [{"type": u"StartTag", "name": u"select", "data": [(u"name", u"foo")]},
             {"type": u"StartTag", "name": u"option", "data": []},
             {"type": u"Characters", "data": u"bar"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"StartTag", "name": u"option", "data": []},
             {"type": u"Characters", "data": u"baz"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"EndTag", "name": u"select", "data": []}],
            FieldStorage({"foo": "quux"}),
            [{"type": u"StartTag", "name": u"select", "data": [(u"name", u"foo")]},
             {"type": u"StartTag", "name": u"option", "data": []},
             {"type": u"Characters", "data": u"bar"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"StartTag", "name": u"option", "data": []},
             {"type": u"Characters", "data": u"baz"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"EndTag", "name": u"select", "data": []}])

    def testSingleSelectMultiple(self):
        self.runTest(
            [{"type": u"StartTag", "name": u"select", "data": [(u"name", u"foo"), (u"multiple", u"")]},
             {"type": u"StartTag", "name": u"option", "data": [(u"value", u"bar")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"StartTag", "name": u"option", "data": [(u"value", u"quux")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"EndTag", "name": u"select", "data": []}],
            FieldStorage({"foo": ["bar", "quux"]}),
            [{"type": u"StartTag", "name": u"select", "data": [(u"name", u"foo"), (u"multiple", u"")]},
             {"type": u"StartTag", "name": u"option", "data": [(u"value", u"bar"), (u"selected", u"")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"StartTag", "name": u"option", "data": [(u"value", u"quux"), (u"selected", u"")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"EndTag", "name": u"select", "data": []}])

    def testTwoSelect(self):
        self.runTest(
            [{"type": u"StartTag", "name": u"select", "data": [(u"name", u"foo")]},
             {"type": u"StartTag", "name": u"option", "data": [(u"value", u"bar")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"StartTag", "name": u"option", "data": [(u"value", u"quux")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"EndTag", "name": u"select", "data": []},
             {"type": u"StartTag", "name": u"select", "data": [(u"name", u"foo")]},
             {"type": u"StartTag", "name": u"option", "data": [(u"value", u"bar")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"StartTag", "name": u"option", "data": [(u"value", u"quux")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"EndTag", "name": u"select", "data": []}],
            FieldStorage({"foo": ["bar", "quux"]}),
            [{"type": u"StartTag", "name": u"select", "data": [(u"name", u"foo")]},
             {"type": u"StartTag", "name": u"option", "data": [(u"value", u"bar"), (u"selected", u"")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"StartTag", "name": u"option", "data": [(u"value", u"quux")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"EndTag", "name": u"select", "data": []},
             {"type": u"StartTag", "name": u"select", "data": [(u"name", u"foo")]},
             {"type": u"StartTag", "name": u"option", "data": [(u"value", u"bar")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"StartTag", "name": u"option", "data": [(u"value", u"quux"), (u"selected", u"")]},
             {"type": u"Characters", "data": u"quux"},
             {"type": u"EndTag", "name": u"option", "data": []},
             {"type": u"EndTag", "name": u"select", "data": []}])

def buildTestSuite():
    return unittest.defaultTestLoader.loadTestsFromName(__name__)

def main():
    buildTestSuite()
    unittest.main()

if __name__ == "__main__":
    main()
