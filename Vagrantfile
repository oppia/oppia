# -*- mode: ruby -*-
# vi: set ft=ruby :

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.


Vagrant.configure(2) do |config|
    config.vm.provider "virtualbox" do |v|
      v.customize ["setextradata", :id, "VBoxInternal2/SharedFoldersEnableSymlinksCreate/v-root", "1"]
    end
  config.vm.provision "shell", inline: 'echo "export VAGRANT=true" >> ~/.profile'
  config.vm.provision "shell", inline: 'apt-get install -y unzip python-pip build-essential gfortran libatlas-base-dev python-dev && pip install -U pip'
  config.vm.network "forwarded_port", guest: 8181, host: 8181
  config.vm.box = "ubuntu/trusty64"
  config.vm.synced_folder ".", "/home/vagrant/oppia"
end
