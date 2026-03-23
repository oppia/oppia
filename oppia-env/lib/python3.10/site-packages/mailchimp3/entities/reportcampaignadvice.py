# coding=utf-8
"""
The Campaign Advice Report API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/reports/advice/
Schema: https://api.mailchimp.com/schema/3.0/Reports/Advice/Collection.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class ReportCampaignAdvice(BaseApi):
    """
    Get recent feedback based on a campaign’s statistics.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(ReportCampaignAdvice, self).__init__(*args, **kwargs)
        self.endpoint = 'reports'
        self.campaign_id = None


    def all(self, campaign_id, **queryparams):
        """
        Get feedback based on a campaign’s statistics. Advice feedback is
        based on campaign stats like opens, clicks, unsubscribes, bounces, and
        more.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.campaign_id = campaign_id
        return self._mc_client._get(url=self._build_path(campaign_id, 'advice'), **queryparams)
