# Ensure the script is being run as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run with root or elevated privileges"
   exit 1
fi

# Stop the service
echo "Stopping cronmanager service..."
systemctl stop cronmanager.service

# Disable the service
echo "Disabling cronmanager service..."
systemctl disable cronmanager.service

# Remove the service file
echo "Removing service file from systemd directory..."
rm /etc/systemd/system/cronmanager.service

# Reload systemd to recognize the change
echo "Reloading systemd..."
systemctl daemon-reload

# Print final message to signal the end of the script
echo "Uninstallation completed successfully."