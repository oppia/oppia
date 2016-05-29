# -*- mode: ruby -*-
# vi: set ft=ruby :

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.

# The recommended method for short, multi-line shell scripts in Vagrant.
# Usage: http://stackoverflow.com/questions/2500436/how-does-cat-eof-work-in-bash
$script = <<SCRIPT
cd /home/vagrant/oppia
bash ./scripts/install_prerequisites.sh
bash ./scripts/start.sh
SCRIPT

Vagrant.configure(2) do |config|
  config.vm.provider "virtualbox" do |v|
    v.customize ["setextradata", :id, "VBoxInternal2/SharedFoldersEnableSymlinksCreate/v-root", "1"]
    v.memory = 2048
  end
  # General-purpose env var to let scripts know we are in Vagrant.
  config.vm.provision "shell", inline: 'echo "export VAGRANT=true" >> /etc/profile'
  # Tell apt to default to "yes" when installing packages. Necessary for unattended installs.
  config.vm.provision "shell", inline: 'echo \'APT::Get::Assume-Yes "true";\' > /etc/apt/apt.conf.d/90yes'
  config.vm.network "forwarded_port", guest: 8000, host: 8000
  config.vm.network "forwarded_port", guest: 8181, host: 8181
  config.vm.box = "ubuntu/trusty64"
  config.vm.synced_folder ".", "/home/vagrant/oppia"
  config.vm.provision "shell", inline: $script
end
