# coding=utf-8
"""
The Campaign Content API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/campaigns/content/
Schema: https://api.mailchimp.com/schema/3.0/Campaigns/Content/Collection.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class CampaignContent(BaseApi):
    """
    Manage the HTML, plain-text, and template content for your MailChimp
    campaigns.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(CampaignContent, self).__init__(*args, **kwargs)
        self.endpoint = 'campaigns'
        self.campaign_id = None


    def get(self, campaign_id, **queryparams):
        """
        Get the the HTML and plain-text content for a campaign.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.campaign_id = campaign_id
        return self._mc_client._get(url=self._build_path(campaign_id, 'content'), **queryparams)


    def update(self, campaign_id, data):
        """
        Set the content for a campaign.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param data: The request body parameters
        :type data: :py:class:`dict`
        """
        self.campaign_id = campaign_id
        return self._mc_client._put(url=self._build_path(campaign_id, 'content'), data=data)
