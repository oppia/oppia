# coding=utf-8
"""
The Campaign Abuse Report API endpoint

Documentation: http://developer.mailchimp.com/documentation/mailchimp/reference/reports/abuse-reports/
"""
from __future__ import unicode_literals

from mailchimp3.baseapi import BaseApi


class ReportCampaignAbuseReports(BaseApi):
    """
    Get information about campaign abuse complaints.
    """
    def __init__(self, *args, **kwargs):
        """
        Initialize the endpoint
        """
        super(ReportCampaignAbuseReports, self).__init__(*args, **kwargs)
        self.endpoint = 'reports'
        self.campaign_id = None
        self.report_id = None


    def all(self, campaign_id, **queryparams):
        """
        Get a list of abuse complaints for a specific campaign.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.campaign_id = campaign_id
        self.report_id = None
        return self._mc_client._get(url=self._build_path(campaign_id, 'abuse-reports'), **queryparams)


    def get(self, campaign_id, report_id, **queryparams):
        """
        Get information about a specific abuse report for a campaign.

        :param campaign_id: The unique id for the campaign.
        :type campaign_id: :py:class:`str`
        :param report_id: The id for the abuse report.
        :type report_id: :py:class:`str`
        :param queryparams: The query string parameters
        queryparams['fields'] = []
        queryparams['exclude_fields'] = []
        """
        self.campaign_id = campaign_id
        self.report_id = report_id
        return self._mc_client._get(url=self._build_path(campaign_id, 'abuse-reports', report_id), **queryparams)
