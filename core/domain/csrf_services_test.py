# coding: utf-8

import datetime
import unittest

from core.domain import csrf_services
from utils import ValidationError


class CsrfSecretDomainTests(unittest.TestCase):

    def test_valid_secret_passes_validation(self):
        obj = csrf_services.CsrfSecret(
            user_id='user_123',
            secret='ABCDEFGHIJKLMNOPQRSTUV',
            created_on=datetime.datetime.utcnow()
        )
        obj.validate()  # Should not raise

    def test_empty_user_id_fails(self):
        obj = csrf_services.CsrfSecret(
            user_id='',
            secret='ABCDEFGHIJKLMNOPQRSTUV'
        )
        with self.assertRaises(ValidationError):
            obj.validate()

    def test_short_secret_fails(self):
        obj = csrf_services.CsrfSecret(
            user_id='user_123',
            secret='short'
        )
        with self.assertRaises(ValidationError):
            obj.validate()

    def test_future_created_on_fails(self):
        future = datetime.datetime.utcnow() + datetime.timedelta(days=1)
        obj = csrf_services.CsrfSecret(
            user_id='user_123',
            secret='ABCDEFGHIJKLMNOPQRSTUV',
            created_on=future
        )
        with self.assertRaises(ValidationError):
            obj.validate()

    def test_last_used_before_created_on_fails(self):
        created = datetime.datetime(2023, 1, 1)
        last_used = datetime.datetime(2022, 1, 1)
        obj = csrf_services.CsrfSecret(
            user_id='user_123',
            secret='ABCDEFGHIJKLMNOPQRSTUV',
            created_on=created,
            last_used_on=last_used
        )
        with self.assertRaises(ValidationError):
            obj.validate()

    def test_non_boolean_is_active_fails(self):
        obj = csrf_services.CsrfSecret(
            user_id='user_123',
            secret='ABCDEFGHIJKLMNOPQRSTUV',
            is_active='yes'
        )
        with self.assertRaises(ValidationError):
            obj.validate()
