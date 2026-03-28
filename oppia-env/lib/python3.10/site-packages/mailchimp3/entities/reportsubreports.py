# coding=utf-8
"""
The Sub-Reports Report API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/reports/sub-reports/
Schema: https://api.mailchimp.com/schema/3.0/Reports/Sub/Collection.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class ReportSubReports(BaseApi):
    """
    A list of reports for child campaigns of a specific parent campaign. For
    example, use this endpoint to view Multivariate, RSS, and A/B Testing
    Campaign reports.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(ReportSubReports, self).__init__(*args, **kwargs)
        self.endpoint = 'reports'
        self.campaign_id = None


    def all(self, campaign_id, **queryparams):
        """
        Get a list of reports with child campaigns for a specific parent
        campaign.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.campaign_id = campaign_id
        return self._mc_client._get(url=self._build_path(campaign_id, 'sub-reports'), **queryparams)
