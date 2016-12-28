from core.domain import email_manager
from core.domain import email_subscription_services
from core.domain import subscription_services
from core.platform import models
from core.tests import test_utils
import feconf

(email_models,) = models.Registry.import_models([models.NAMES.email])

USER_NAME = 'user'
USER_EMAIL = 'user@test.com'


class InformSubscribersTest(test_utils.GenericTestBase):
    """Test for informing subscribers when an exploration is published by the
    creator."""

    def setUp(self):
        super(InformSubscribersTest, self).setUp()
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)

        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.exploration = self.save_new_default_exploration(
            'A', self.editor_id, 'Title')

        self.can_send_emails_ctx = self.swap(
            feconf, 'CAN_SEND_EMAILS', True)
        self.can_send_subscription_email_ctx = self.swap(
            feconf, 'CAN_SEND_SUBSCRIPTION_EMAILS', True)

    def test_inform_subscribers(self):
        subscription_services.subscribe_to_creator(
            self.new_user_id, self.editor_id)
        subscription_services.subscribe_to_creator(
            self.user_id, self.editor_id)

        with self.can_send_emails_ctx, self.can_send_subscription_email_ctx:
            email_subscription_services.inform_subscribers(
            self.editor_id, 'A')

            # make sure correct number of emails is sent.
            messages = self.mail_stub.get_sent_messages(to=self.NEW_USER_EMAIL)
            self.assertEqual(len(messages), 1)
            messages = self.mail_stub.get_sent_messages(to=USER_EMAIL)
            self.assertEqual(len(messages), 1)

            # Make sure correct email models are stored.
            all_models = email_models.SentEmailModel.get_all().fetch()
            sent_email_model_1 = all_models[0]
            sent_email_model_2 = all_models[1]
            if sent_email_model_1.recipient_id == self.user_id:
                self.assertEqual(
                sent_email_model_1.recipient_id, self.user_id)
                self.assertEqual(
                    sent_email_model_1.recipient_email, USER_EMAIL)

                self.assertEqual(
                    sent_email_model_2.recipient_id, self.new_user_id)
                self.assertEqual(
                    sent_email_model_2.recipient_email, self.NEW_USER_EMAIL)
            else:
                self.assertEqual(
                sent_email_model_1.recipient_id, self.new_user_id)
                self.assertEqual(
                    sent_email_model_1.recipient_email, self.NEW_USER_EMAIL)

                self.assertEqual(
                    sent_email_model_2.recipient_id, self.user_id)
                self.assertEqual(
                    sent_email_model_2.recipient_email, USER_EMAIL)
