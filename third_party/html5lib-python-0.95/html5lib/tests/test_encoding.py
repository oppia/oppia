import os
import unittest
from support import html5lib_test_files, TestData, test_dir

from html5lib import HTMLParser, inputstream

import re, unittest

class Html5EncodingTestCase(unittest.TestCase):
    def test_codec_name(self):
        self.assertEquals(inputstream.codecName("utf-8"), "utf-8")
        self.assertEquals(inputstream.codecName("utf8"), "utf-8")
        self.assertEquals(inputstream.codecName("  utf8  "), "utf-8")
        self.assertEquals(inputstream.codecName("ISO_8859--1"), "windows-1252")

def buildTestSuite():
    for filename in html5lib_test_files("encoding"):
        test_name = os.path.basename(filename).replace('.dat',''). \
            replace('-','')
        tests = TestData(filename, "data")
        for idx, test in enumerate(tests):
            def encodingTest(self, data=test['data'], 
                             encoding=test['encoding']):
                p = HTMLParser()
                t = p.parse(data, useChardet=False)
                
                errorMessage = ("Input:\n%s\nExpected:\n%s\nRecieved\n%s\n"%
                                (data, repr(encoding.lower()), 
                                 repr(p.tokenizer.stream.charEncoding)))
                self.assertEquals(encoding.lower(),
                                  p.tokenizer.stream.charEncoding[0], 
                                  errorMessage)
            setattr(Html5EncodingTestCase, 'test_%s_%d' % (test_name, idx+1),
                encodingTest)

    try:
        import chardet
        def test_chardet(self):
            data = open(os.path.join(test_dir, "encoding" , "chardet", "test_big5.txt")).read()
            encoding = inputstream.HTMLInputStream(data).charEncoding
            assert encoding[0].lower() == "big5"
        setattr(Html5EncodingTestCase, 'test_chardet', test_chardet)
    except ImportError:
        print "chardet not found, skipping chardet tests"
        

    return unittest.defaultTestLoader.loadTestsFromName(__name__)

def main():
    buildTestSuite()
    unittest.main()

if __name__ == "__main__":
    main()
