import sys

sys.path.append('/home/piyush/oppia')
import os
import unittest
import webapp2
from core.controllers import machine_translation
from core.tests import test_utils
from core.domain import feature_flag_services
from core.domain import feature_flag_list


class GetTest(test_utils.GenericTestBase):
    def setUp(self) -> None:
        super(GetTest, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])
        self.login(self.ADMIN_EMAIL)

        # Enable the feature flag
        feature_flag_services.update_feature_flag(
            feature_flag_list.FeatureNames.ENABLE_AUTOMATIC_TRANSLATION_SUGGESTIONS.value,
            True,
            0,
            [],
        )

    def test_get_endpoint(self) -> None:
        response = self.get_json('/translation-provider-mapping')
        print("GET RESPONSE:", response)


if __name__ == '__main__':
    unittest.main()
