sudo apt-get update
sudo apt-get install -y lsb-release
# https://unix.stackexchange.com/questions/228412/how-to-wget-a-github-file
curl -L "https://raw.githubusercontent.com/webnicer/chrome-downloads/master/x64.deb/google-chrome-stable_77.0.3865.75-1_amd64.deb" -o google-chrome.deb
sudo mkdir /opt/google/chrome
sudo sed -i 's|HERE/chrome\"|HERE/chrome\" --disable-setuid-sandbox|g' /opt/google/chrome/google-chrome
sudo  dpkg -i google-chrome.deb
sudo apt-get -f install -y
google-chrome --version
