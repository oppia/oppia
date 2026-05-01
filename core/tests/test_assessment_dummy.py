from core.tests import test_utils

class DummyTest(test_utils.GenericTestBase):

    def test_simple(self):
        self.assertEqual(1 + 1, 2)
