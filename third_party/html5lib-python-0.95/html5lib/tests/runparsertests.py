import sys
import os
import glob
import unittest

#Allow us to import the parent module
os.chdir(os.path.split(os.path.abspath(__file__))[0])
sys.path.insert(0, os.path.abspath(os.curdir))
sys.path.insert(0, os.path.abspath(os.pardir))
sys.path.insert(0, os.path.join(os.path.abspath(os.pardir), "src"))

def buildTestSuite():
    suite = unittest.TestSuite()
    for testcase in glob.glob('test_*.py'):
        if testcase in ("test_tokenizer.py", "test_parser.py", "test_parser2.py"):
            module = os.path.splitext(testcase)[0]
            suite.addTest(__import__(module).buildTestSuite())
    return suite

def main():
    results = unittest.TextTestRunner().run(buildTestSuite())
    return results

if __name__ == "__main__":
    results = main()
    if not results.wasSuccessful():
        sys.exit(1)
