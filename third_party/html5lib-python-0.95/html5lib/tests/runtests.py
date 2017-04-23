import sys
import os
import glob
import unittest

def buildTestSuite():
    suite = unittest.TestSuite()
    for testcase in glob.glob('test_*.py'):
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
