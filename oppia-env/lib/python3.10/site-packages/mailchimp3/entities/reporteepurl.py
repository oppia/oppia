# coding=utf-8
"""
The EepURL Report API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/reports/eepurl/
Schema: https://api.mailchimp.com/schema/3.0/Reports/Eepurl/Collection.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class ReportEepURL(BaseApi):
    """
    Get a summary of social activity for the campaign, tracked by EepURL.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(ReportEepURL, self).__init__(*args, **kwargs)
        self.endpoint = 'reports'
        self.campaign_id = None


    def all(self, campaign_id, **queryparams):
        """
        Get a summary of social activity for the campaign, tracked by EepURL.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.campaign_id = campaign_id
        return self._mc_client._get(url=self._build_path(campaign_id, 'eepurl'), **queryparams)
