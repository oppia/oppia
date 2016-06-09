"""Script to process HAR data and timing data"""

class ProcessData(object):
    """Class that contains methods to process data and get us metrics"""

    def __init__(self, har=None, timings=None):
        self.har = har
        self.timings = timings
        self.result = {
            'no_requests': 0,
            'total_size': 0, #in bytes
        }

    def get_stats(self):
        """Call all the methods"""
        self.result['no_requests'] = self._get_no_requests()
        self.result['total_size'] = self._get_total_size()

    def _get_no_requests(self):
        no_requests = 0

        if 'log' in self.har:
            if 'entries' in self.har['log']:
                no_requests = len(self.har['log']['entries'])

        return no_requests

    def _get_total_size(self):
        total_size = 0

        for entry in self.har['log']['entries']:
            total_size += int(entry['response']['bodySize'])

        return total_size
