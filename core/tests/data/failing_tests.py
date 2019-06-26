from core.tests import test_utils


class FailingTests(test_utils.GenericTestBase):

    def test_fail(self):
        self.assertEqual(1, 2)
