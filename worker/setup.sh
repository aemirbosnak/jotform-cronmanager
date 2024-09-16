# Ensure the script is being run as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run with root or elevated privileges"
   exit 1
fi

# Add execute permission to the script
echo "Adding execute permission to the uninstall.sh script..."
chmod +x uninstall.sh

# Update apt repositories
echo "Updating apt repositories..."
apt update

# Install pip for system-wide python package management
echo "Installing python3-pip..."
apt install -y python3-pip

# Install python packages
echo "Installing required Python packages..."
if pip install -r requirements.txt; then
    echo "Python packages installed successfully."
else
    echo "Error installing Python packages."
    exit 1
fi

# Copy service file to systemd directory
echo "Copying service file to systemd directory..."
cp cronmanager.service /etc/systemd/system/cronmanager.service

# Reload systemd to recognize the new service
echo "Reloading systemd..."
systemctl daemon-reload

# Enable the service to start at boot
echo "Enabling cronmanager service to start at boot..."
systemctl enable cronmanager.service

# Start the service
echo "Starting cronmanager service..."
systemctl start cronmanager.service

# Check if the service started successfully
if systemctl is-active --quiet cronmanager.service; then
    echo "cronmanager service started successfully."
else
    echo "Failed to start cronmanager service."
    exit 1
fi

# Print final message to signal the end of the script
echo "Setup completed successfully."
