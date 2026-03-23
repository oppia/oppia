# coding=utf-8
"""
The Domain Performance Report API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/reports/domain-performance/
Schema: https://api.mailchimp.com/schema/3.0/Reports/DomainPerformance/Collection.json
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class ReportDomainPerformance(BaseApi):
    """
    Get statistics for the top-performing domains from a campaign.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(ReportDomainPerformance, self).__init__(*args, **kwargs)
        self.endpoint = 'reports'
        self.campaign_id = None


    def all(self, campaign_id, **queryparams):
        """
        Get statistics for the top-performing email domains in a campaign.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.campaign_id = campaign_id
        return self._mc_client._get(url=self._build_path(campaign_id, 'domain-performance'), **queryparams)
