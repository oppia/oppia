import unittest
from core.domain import csrf_secret_domain
from core import utils


class CsrfSecretDomainTest(unittest.TestCase):

    def test_valid(self):
        obj = csrf_secret_domain.CsrfSecret("abc")
        obj.validate()

    def test_empty(self):
        obj = csrf_secret_domain.CsrfSecret("")
        with self.assertRaises(utils.ValidationError):
            obj.validate()

    def test_wrong_type(self):
        obj = csrf_secret_domain.CsrfSecret(123)
        with self.assertRaises(utils.ValidationError):
            obj.validate()