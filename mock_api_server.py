#!/usr/bin/env python
"""
Mock API Server for Testing Creator Statistics

Run this to test the statistics frontend without backend implementation:
    python mock_api_server.py

Then visit: http://localhost:8888/creator_dashboard/stats_report
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from datetime import datetime, timedelta
import random


class MockStatsHandler(BaseHTTPRequestHandler):
    """Handler for mock statistics API requests."""

    def do_GET(self):
        """Handle GET requests."""

        # Enable CORS for local development
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

        # Route handling
        if self.path == '/creator_dashboard/stats_report':
            self.handle_stats_report()
        elif self.path.startswith('/creator_dashboard/stats_timeseries'):
            self.handle_timeseries()
        elif self.path == '/creator_dashboard/session_distribution':
            self.handle_session_distribution()
        elif self.path == '/creator_dashboard/exploration_performance':
            self.handle_exploration_performance()
        else:
            self.send_error_response('Unknown endpoint')

    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS preflight."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def handle_stats_report(self):
        """Mock response for /creator_dashboard/stats_report"""
        mock_data = {
            'dau': random.randint(35, 50),
            'wau': random.randint(140, 170),
            'retention_7d': round(random.uniform(0.25, 0.40), 2),
            'avg_session_time_secs': round(random.uniform(200, 400), 1),
        }

        response = json.dumps(mock_data, indent=2)
        self.wfile.write(response.encode('utf-8'))

        print(
            f"[{datetime.now()}] Sent stats report: DAU={mock_data['dau']}, WAU={mock_data['wau']}"
        )

    def handle_timeseries(self):
        """Mock response for /creator_dashboard/stats_timeseries"""
        days = 30
        time_series = []

        base_dau = 40
        base_wau = 150

        for i in range(days):
            date = (datetime.now() - timedelta(days=days - i - 1)).strftime(
                '%Y-%m-%d'
            )

            # Add some realistic variation
            dau = base_dau + random.randint(-10, 10)
            wau = base_wau + random.randint(-20, 20)

            time_series.append(
                {'date': date, 'dau': max(0, dau), 'wau': max(0, wau)}
            )

        response = json.dumps({'data': time_series}, indent=2)
        self.wfile.write(response.encode('utf-8'))

        print(f"[{datetime.now()}] Sent timeseries data: {days} days")

    def handle_session_distribution(self):
        """Mock response for /creator_dashboard/session_distribution"""
        distribution = {
            '0-5min': random.randint(100, 150),
            '5-15min': random.randint(70, 100),
            '15-30min': random.randint(30, 60),
            '30-60min': random.randint(10, 25),
            '60+min': random.randint(2, 10),
        }

        response = json.dumps(distribution, indent=2)
        self.wfile.write(response.encode('utf-8'))

        print(f"[{datetime.now()}] Sent session distribution")

    def handle_exploration_performance(self):
        """Mock response for /creator_dashboard/exploration_performance"""
        explorations = [
            {
                'explorationId': 'exp_001',
                'title': 'Introduction to Algebra',
                'views': random.randint(300, 500),
                'uniqueUsers': random.randint(80, 120),
                'avgSessionTime': round(random.uniform(180, 400), 1),
            },
            {
                'explorationId': 'exp_002',
                'title': 'Geometry Basics',
                'views': random.randint(200, 400),
                'uniqueUsers': random.randint(50, 90),
                'avgSessionTime': round(random.uniform(150, 350), 1),
            },
            {
                'explorationId': 'exp_003',
                'title': 'Fractions Made Easy',
                'views': random.randint(250, 450),
                'uniqueUsers': random.randint(60, 100),
                'avgSessionTime': round(random.uniform(200, 380), 1),
            },
        ]

        response = json.dumps({'explorations': explorations}, indent=2)
        self.wfile.write(response.encode('utf-8'))

        print(
            f"[{datetime.now()}] Sent exploration performance for {len(explorations)} explorations"
        )

    def send_error_response(self, message):
        """Send error response."""
        error = {'error': message}
        response = json.dumps(error)
        self.wfile.write(response.encode('utf-8'))
        print(f"[{datetime.now()}] ERROR: {message}")


def run_mock_server(port=8888):
    """Start the mock API server."""
    server_address = ('', port)
    httpd = HTTPServer(server_address, MockStatsHandler)

    print("=" * 60)
    print("🚀 Mock API Server Started!")
    print("=" * 60)
    print(f"Server running on: http://localhost:{port}")
    print()
    print("Available endpoints:")
    print(f"  • http://localhost:{port}/creator_dashboard/stats_report")
    print(
        f"  • http://localhost:{port}/creator_dashboard/stats_timeseries?days=30"
    )
    print(f"  • http://localhost:{port}/creator_dashboard/session_distribution")
    print(
        f"  • http://localhost:{port}/creator_dashboard/exploration_performance"
    )
    print()
    print("Testing instructions:")
    print("  1. Visit endpoint URLs in browser")
    print(
        "  2. Use curl: curl http://localhost:8888/creator_dashboard/stats_report"
    )
    print(
        "  3. Update frontend to call http://localhost:8888 instead of regular API"
    )
    print()
    print("Press Ctrl+C to stop the server")
    print("=" * 60)
    print()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Mock server stopped")
        httpd.server_close()


if __name__ == '__main__':
    run_mock_server(port=8888)
