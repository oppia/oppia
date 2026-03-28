# coding=utf-8
"""
The Campaign Send Checklist API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/campaigns/send-checklist/
Schema: https://api.mailchimp.com/schema/3.0/Campaigns/Checklist/Collection.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class CampaignSendChecklist(BaseApi):
    """
    Review the send checklist for your campaign, and resolve any issues before
    sending.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(CampaignSendChecklist, self).__init__(*args, **kwargs)
        self.endpoint = 'campaigns'
        self.campaign_id = None


    def get(self, campaign_id, **queryparams):
        """
        Review the send checklist for a campaign, and resolve any issues
        before sending.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.campaign_id = campaign_id
        return self._mc_client._get(url=self._build_path(campaign_id, 'send-checklist'), **queryparams)

