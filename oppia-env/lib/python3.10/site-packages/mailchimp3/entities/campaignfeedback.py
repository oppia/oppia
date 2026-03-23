# coding=utf-8
"""
The Campaign Feedback API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/campaigns/feedback/
Schema: https://api.mailchimp.com/schema/3.0/Campaigns/Feedback/Instance.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class CampaignFeedback(BaseApi):
    """
    Post comments, reply to team feedback, and send test emails while you’re
    working together on a MailChimp campaign.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(CampaignFeedback, self).__init__(*args, **kwargs)
        self.endpoint = 'campaigns'
        self.campaign_id = None
        self.feedback_id = None


    def create(self, campaign_id, data, **queryparams):
        """
        Add feedback on a specific campaign.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "message": string*
        }
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.campaign_id = campaign_id
        if 'message' not in data:
            raise KeyError('The campaign feedback must have a message')
        response = self._mc_client._post(url=self._build_path(campaign_id, 'feedback'), data=data, **queryparams)
        if response is not None:
            self.feedback_id = response['feedback_id']
        else:
            self.feedback_id = None
        return response


    def all(self, campaign_id, get_all=False, **queryparams):
        """
        Get team feedback while you’re working together on a MailChimp
        campaign.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param get_all: Should the query get all results
        :type get_all: :py:class:`bool`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.campaign_id = campaign_id
        self.feedback_id = None
        if get_all:
            return self._iterate(url=self._build_path(campaign_id, 'feedback'), **queryparams)
        else:
            return self._mc_client._get(url=self._build_path(campaign_id, 'feedback'), **queryparams)


    def get(self, campaign_id, feedback_id, **queryparams):
        """
        Get a specific feedback message from a campaign.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param feedback_id: The unique id for the feedback message.
        :type feedback_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.campaign_id = campaign_id
        self.feedback_id = feedback_id
        return self._mc_client._get(url=self._build_path(campaign_id, 'feedback', feedback_id), **queryparams)


    def update(self, campaign_id, feedback_id, data):
        """
        Update a specific feedback message for a campaign.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param feedback_id: The unique id for the feedback message.
        :type feedback_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        data = {
            "message": string*
        }
        """
        self.campaign_id = campaign_id
        self.feedback_id = feedback_id
        if 'message' not in data:
            raise KeyError('The campaign feedback must have a message')
        return self._mc_client._patch(url=self._build_path(campaign_id, 'feedback', feedback_id), data=data)


    def delete(self, campaign_id, feedback_id):
        """
        Remove a specific feedback message for a campaign.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param feedback_id: The unique id for the feedback message.
        :type feedback_id: :py:class:`str`
        """
        self.campaign_id = campaign_id
        self.feedback_id = feedback_id
        return self._mc_client._delete(url=self._build_path(campaign_id, 'feedback', feedback_id))
