# coding=utf-8
"""
The Customer Journey API endpoint

Documentation: https://mailchimp.com/developer/marketing/api/customer-journeys-journeys-steps-actions/
Schema: https://us1.api.mailchimp.com/schema/3.0/Paths/CustomerJourneys/Journeys/Steps/Actions/Trigger.json
"""

from mailchimp3.baseapi import BaseApi
from mailchimp3.helpers import check_email


class CustomerJourney(BaseApi):
    """
    Manage specific customer journeys in your Mailchimp account.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(CustomerJourney, self).__init__(*args, **kwargs)
        self.endpoint = 'customer-journeys'
        self.journey_id = None
        self.step_id = None

    def trigger(self, journey_id, step_id, data):
        """
        Trigger a step in a customer journey.

        :param journey_id: The unique id for the Customer Journey
        :type journey_id: :py:class:`str`
        :param step_id: The unique id for the step within the customer journey
        :type step_id: :py:class:`str`
        :type data: :py:class:`dict`
        data = {
            "email": string*,
        }
        """
        self.journey_id = journey_id
        self.step_id = step_id
        if 'email_address' not in data:
            raise KeyError('The automation email queue must have an email_address')

        check_email(data['email_address'])
        response = self._mc_client._post(
            url=self._build_path("journeys", journey_id, 'steps', step_id, 'actions', "trigger"),
            data=data
        )

        return response
