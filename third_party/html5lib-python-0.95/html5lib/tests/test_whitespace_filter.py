import unittest

from html5lib.filters.whitespace import Filter
from html5lib.constants import spaceCharacters
spaceCharacters = u"".join(spaceCharacters)

class TestCase(unittest.TestCase):
    def runTest(self, input, expected):
        output = list(Filter(input))
        errorMsg = "\n".join(["\n\nInput:", str(input),
                              "\nExpected:", str(expected),
                              "\nReceived:", str(output)])
        self.assertEquals(output, expected, errorMsg)

    def runTestUnmodifiedOutput(self, input):
        self.runTest(input, input)

    def testPhrasingElements(self):
        self.runTestUnmodifiedOutput(
            [{"type": u"Characters", "data": u"This is a " },
             {"type": u"StartTag", "name": u"span", "data": [] },
             {"type": u"Characters", "data": u"phrase" },
             {"type": u"EndTag", "name": u"span", "data": []},
             {"type": u"SpaceCharacters", "data": u" " },
             {"type": u"Characters", "data": u"with" },
             {"type": u"SpaceCharacters", "data": u" " },
             {"type": u"StartTag", "name": u"em", "data": [] },
             {"type": u"Characters", "data": u"emphasised text" },
             {"type": u"EndTag", "name": u"em", "data": []},
             {"type": u"Characters", "data": u" and an " },
             {"type": u"StartTag", "name": u"img", "data": [[u"alt", u"image"]] },
             {"type": u"Characters", "data": u"." }])

    def testLeadingWhitespace(self):
        self.runTest(
            [{"type": u"StartTag", "name": u"p", "data": []},
             {"type": u"SpaceCharacters", "data": spaceCharacters},
             {"type": u"Characters", "data": u"foo"},
             {"type": u"EndTag", "name": u"p", "data": []}],
            [{"type": u"StartTag", "name": u"p", "data": []},
             {"type": u"SpaceCharacters", "data": u" "},
             {"type": u"Characters", "data": u"foo"},
             {"type": u"EndTag", "name": u"p", "data": []}])

    def testLeadingWhitespaceAsCharacters(self):
        self.runTest(
            [{"type": u"StartTag", "name": u"p", "data": []},
             {"type": u"Characters", "data": spaceCharacters + u"foo"},
             {"type": u"EndTag", "name": u"p", "data": []}],
            [{"type": u"StartTag", "name": u"p", "data": []},
             {"type": u"Characters", "data": u" foo"},
             {"type": u"EndTag", "name": u"p", "data": []}])

    def testTrailingWhitespace(self):
        self.runTest(
            [{"type": u"StartTag", "name": u"p", "data": []},
             {"type": u"Characters", "data": u"foo"},
             {"type": u"SpaceCharacters", "data": spaceCharacters},
             {"type": u"EndTag", "name": u"p", "data": []}],
            [{"type": u"StartTag", "name": u"p", "data": []},
             {"type": u"Characters", "data": u"foo"},
             {"type": u"SpaceCharacters", "data": u" "},
             {"type": u"EndTag", "name": u"p", "data": []}])

    def testTrailingWhitespaceAsCharacters(self):
        self.runTest(
            [{"type": u"StartTag", "name": u"p", "data": []},
             {"type": u"Characters", "data": u"foo" + spaceCharacters},
             {"type": u"EndTag", "name": u"p", "data": []}],
            [{"type": u"StartTag", "name": u"p", "data": []},
             {"type": u"Characters", "data": u"foo "},
             {"type": u"EndTag", "name": u"p", "data": []}])

    def testWhitespace(self):
        self.runTest(
            [{"type": u"StartTag", "name": u"p", "data": []},
             {"type": u"Characters", "data": u"foo" + spaceCharacters + "bar"},
             {"type": u"EndTag", "name": u"p", "data": []}],
            [{"type": u"StartTag", "name": u"p", "data": []},
             {"type": u"Characters", "data": u"foo bar"},
             {"type": u"EndTag", "name": u"p", "data": []}])

    def testLeadingWhitespaceInPre(self):
        self.runTestUnmodifiedOutput(
            [{"type": u"StartTag", "name": u"pre", "data": []},
             {"type": u"SpaceCharacters", "data": spaceCharacters},
             {"type": u"Characters", "data": u"foo"},
             {"type": u"EndTag", "name": u"pre", "data": []}])

    def testLeadingWhitespaceAsCharactersInPre(self):
        self.runTestUnmodifiedOutput(
            [{"type": u"StartTag", "name": u"pre", "data": []},
             {"type": u"Characters", "data": spaceCharacters + u"foo"},
             {"type": u"EndTag", "name": u"pre", "data": []}])

    def testTrailingWhitespaceInPre(self):
        self.runTestUnmodifiedOutput(
            [{"type": u"StartTag", "name": u"pre", "data": []},
             {"type": u"Characters", "data": u"foo"},
             {"type": u"SpaceCharacters", "data": spaceCharacters},
             {"type": u"EndTag", "name": u"pre", "data": []}])

    def testTrailingWhitespaceAsCharactersInPre(self):
        self.runTestUnmodifiedOutput(
            [{"type": u"StartTag", "name": u"pre", "data": []},
             {"type": u"Characters", "data": u"foo" + spaceCharacters},
             {"type": u"EndTag", "name": u"pre", "data": []}])

    def testWhitespaceInPre(self):
        self.runTestUnmodifiedOutput(
            [{"type": u"StartTag", "name": u"pre", "data": []},
             {"type": u"Characters", "data": u"foo" + spaceCharacters + "bar"},
             {"type": u"EndTag", "name": u"pre", "data": []}])

def buildTestSuite():
    return unittest.defaultTestLoader.loadTestsFromName(__name__)

def main():
    buildTestSuite()
    unittest.main()

if __name__ == "__main__":
    main()
