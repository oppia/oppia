import sys

sys.path.append('/home/piyush/oppia')
import os
import unittest
import webapp2
from core.controllers import machine_translation
from core.tests import test_utils
from core.domain import machine_translation_services


class PutTest(test_utils.GenericTestBase):
    def setUp(self) -> None:
        super(PutTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])
        self.login(self.ADMIN_EMAIL)

        # We must enable the feature flag
        from core.domain import feature_flag_services
        from core.domain import feature_flag_list

        # Actually this might be hard, we just want to test the db model

    def test_db_model_saving(self) -> None:
        machine_translation_services.update_machine_translation_policy(
            language_to_provider_mapping={'de': 'azure'},
            automatic_translation_is_enabled=True,
        )
        mapping = (
            machine_translation_services.get_translation_provider_mapping()
        )
        is_enabled = (
            machine_translation_services.is_automatic_translation_enabled()
        )
        print("MAPPING:", mapping)
        print("IS_ENABLED:", is_enabled)


if __name__ == '__main__':
    unittest.main()
