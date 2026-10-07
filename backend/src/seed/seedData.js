const { DEFAULT_SLA_MINUTES } = require('../config/constants');

const departments = [
  { name: 'Engineering', code: 'ENG', description: 'Product engineering and software development' },
  { name: 'HR', code: 'HR', description: 'Human resources and people operations' },
  { name: 'Finance', code: 'FIN', description: 'Finance and accounting' },
  { name: 'Sales', code: 'SAL', description: 'Sales and business development' },
  { name: 'Marketing', code: 'MKT', description: 'Marketing and communications' },
  { name: 'Operations', code: 'OPS', description: 'Business operations and facilities' },
];

const categories = [
  { name: 'Hardware', subcategories: ['Laptop', 'Desktop', 'Monitor', 'Performance', 'Peripheral'] },
  { name: 'Software', subcategories: ['Installation', 'License', 'Bug', 'Update'] },
  { name: 'Network', subcategories: ['Wi-Fi', 'LAN', 'Outage', 'Connectivity'] },
  { name: 'Access', subcategories: ['Password Reset', 'Account Lockout', 'Permissions'] },
  { name: 'Security', subcategories: ['Phishing', 'Malware', 'Suspicious Activity'] },
  { name: 'Email', subcategories: ['Mailbox', 'Outlook', 'Distribution List'] },
  { name: 'Printer', subcategories: ['Printer', 'Scanner', 'Toner'] },
  { name: 'VPN', subcategories: ['VPN Connectivity', 'VPN Client'] },
  { name: 'Other', subcategories: ['General'] },
];

const slaConfigs = Object.entries(DEFAULT_SLA_MINUTES).map(([priority, minutes]) => ({
  priority,
  responseMinutes: minutes.response,
  resolutionMinutes: minutes.resolution,
}));

// Departments referenced by name; seed.js resolves these to ObjectIds.
const users = [
  { name: 'Ananya Rao', email: 'admin@demo.com', password: 'Admin@123', role: 'SYSTEM_ADMIN', department: 'Operations' },
  { name: 'Vikram Shetty', email: 'manager@demo.com', password: 'Manager@123', role: 'IT_MANAGER', department: 'Engineering' },
  { name: 'Karthik Iyer', email: 'technician@demo.com', password: 'Tech@123', role: 'TECHNICIAN', department: 'Engineering' },
  { name: 'Sneha Pillai', email: 'tech2@demo.com', password: 'Tech@123', role: 'TECHNICIAN', department: 'Engineering' },
  { name: 'Rohan Mehta', email: 'tech3@demo.com', password: 'Tech@123', role: 'TECHNICIAN', department: 'Operations' },
  { name: 'Priya Nair', email: 'employee@demo.com', password: 'Employee@123', role: 'EMPLOYEE', department: 'Sales' },
  { name: 'Arjun Kapoor', email: 'employee2@demo.com', password: 'Employee@123', role: 'EMPLOYEE', department: 'Marketing' },
  { name: 'Divya Menon', email: 'employee3@demo.com', password: 'Employee@123', role: 'EMPLOYEE', department: 'Finance' },
  { name: 'Sanjay Gupta', email: 'employee4@demo.com', password: 'Employee@123', role: 'EMPLOYEE', department: 'HR' },
  { name: 'Neha Verma', email: 'employee5@demo.com', password: 'Employee@123', role: 'EMPLOYEE', department: 'Engineering' },
  { name: 'Farah Sheikh', email: 'asset@demo.com', password: 'Asset@123', role: 'ASSET_MANAGER', department: 'Operations' },
];

// assignedToEmail/department are resolved against `users`/`departments` in seed.js
const assets = [
  { name: 'Dell Latitude 5440', type: 'LAPTOP', brand: 'Dell', model: 'Latitude 5440', assignedToEmail: 'employee@demo.com', department: 'Sales', location: 'Hyderabad HQ - 4F' },
  { name: 'MacBook Pro 14"', type: 'LAPTOP', brand: 'Apple', model: 'MacBook Pro 14 M3', assignedToEmail: 'employee2@demo.com', department: 'Marketing', location: 'Hyderabad HQ - 3F' },
  { name: 'Lenovo ThinkPad T14', type: 'LAPTOP', brand: 'Lenovo', model: 'ThinkPad T14 Gen4', assignedToEmail: 'employee3@demo.com', department: 'Finance', location: 'Hyderabad HQ - 2F' },
  { name: 'HP EliteBook 840', type: 'LAPTOP', brand: 'HP', model: 'EliteBook 840 G9', assignedToEmail: 'employee4@demo.com', department: 'HR', location: 'Hyderabad HQ - 2F' },
  { name: 'Dell Latitude 5540', type: 'LAPTOP', brand: 'Dell', model: 'Latitude 5540', assignedToEmail: 'employee5@demo.com', department: 'Engineering', location: 'Hyderabad HQ - 5F' },
  { name: 'Dell Latitude 5440 (Spare)', type: 'LAPTOP', brand: 'Dell', model: 'Latitude 5440', department: 'Engineering', location: 'IT Store Room', status: 'AVAILABLE' },
  { name: 'Dell OptiPlex 7010', type: 'DESKTOP', brand: 'Dell', model: 'OptiPlex 7010', assignedToEmail: 'technician@demo.com', department: 'Engineering', location: 'Hyderabad HQ - 5F' },
  { name: 'HP ProDesk 400', type: 'DESKTOP', brand: 'HP', model: 'ProDesk 400 G9', department: 'Operations', location: 'IT Store Room', status: 'AVAILABLE' },
  { name: 'Dell UltraSharp 27"', type: 'MONITOR', brand: 'Dell', model: 'U2723QE', assignedToEmail: 'employee@demo.com', department: 'Sales', location: 'Hyderabad HQ - 4F' },
  { name: 'LG 24" Monitor', type: 'MONITOR', brand: 'LG', model: '24MP400', department: 'Marketing', location: 'IT Store Room', status: 'AVAILABLE' },
  { name: 'iPhone 13 (Corporate)', type: 'MOBILE', brand: 'Apple', model: 'iPhone 13', assignedToEmail: 'employee2@demo.com', department: 'Marketing', location: 'Hyderabad HQ - 3F' },
  { name: 'Samsung Galaxy A54 (Corporate)', type: 'MOBILE', brand: 'Samsung', model: 'Galaxy A54', department: 'Sales', location: 'IT Store Room', status: 'AVAILABLE' },
  { name: 'HP LaserJet Pro M404', type: 'PRINTER', brand: 'HP', model: 'LaserJet Pro M404dn', department: 'Operations', location: 'Hyderabad HQ - 2F Print Room' },
  { name: 'Canon imageCLASS MF445', type: 'PRINTER', brand: 'Canon', model: 'imageCLASS MF445dw', department: 'Operations', location: 'Hyderabad HQ - 4F Print Room' },
  { name: 'Cisco Catalyst 9200 Switch', type: 'NETWORK_DEVICE', brand: 'Cisco', model: 'Catalyst 9200L', department: 'Engineering', location: 'Server Room - Rack 2' },
  { name: 'Ubiquiti UniFi AP', type: 'NETWORK_DEVICE', brand: 'Ubiquiti', model: 'UniFi 6 Pro', department: 'Engineering', location: 'Hyderabad HQ - 3F Ceiling' },
  { name: 'Microsoft 365 E3 License', type: 'SOFTWARE', brand: 'Microsoft', model: 'M365 E3', assignedToEmail: 'employee3@demo.com', department: 'Finance', location: 'N/A' },
  { name: 'Adobe Creative Cloud License', type: 'SOFTWARE', brand: 'Adobe', model: 'Creative Cloud', assignedToEmail: 'employee2@demo.com', department: 'Marketing', location: 'N/A' },
];

// author resolved by email in seed.js
const knowledgeArticles = [
  {
    title: 'Corporate VPN Troubleshooting',
    category: 'VPN',
    tags: ['vpn', 'connectivity', 'remote access'],
    symptoms: ['VPN does not connect', 'Authentication failure', 'Connection timeout'],
    solution:
      '1. Check internet connection.\n2. Restart the VPN client.\n3. Verify credentials.\n4. Restart the device.\n5. Escalate to network team if unresolved.',
    authorEmail: 'technician@demo.com',
  },
  {
    title: 'Fixing Wi-Fi Connectivity Issues',
    category: 'Network',
    tags: ['wifi', 'network', 'connectivity'],
    symptoms: ['Cannot connect to Wi-Fi', 'Frequent disconnects', 'Slow network speed'],
    solution:
      '1. Toggle Wi-Fi off and on.\n2. Forget and reconnect to the corporate SSID.\n3. Confirm the device is not in airplane mode.\n4. Move closer to the nearest access point.\n5. Report to network team if the whole floor is affected.',
    authorEmail: 'tech2@demo.com',
  },
  {
    title: 'Self-Service Password Reset',
    category: 'Access',
    tags: ['password', 'reset', 'lockout'],
    symptoms: ['Forgot password', 'Account locked out', 'Cannot log in'],
    solution:
      '1. Go to the self-service portal.\n2. Verify identity via registered email/phone.\n3. Set a new password following policy.\n4. Wait 5 minutes for lockout to clear if applicable.',
    authorEmail: 'technician@demo.com',
  },
  {
    title: 'Resolving Outlook Sync Problems',
    category: 'Email',
    tags: ['email', 'outlook', 'sync'],
    symptoms: ['Emails not syncing', 'Outlook not opening', 'Mailbox full warning'],
    solution:
      '1. Restart Outlook.\n2. Check mailbox storage quota.\n3. Repair the Outlook profile via Control Panel.\n4. Recreate the profile if repair fails.',
    authorEmail: 'tech2@demo.com',
  },
  {
    title: 'Printer Not Printing - Common Fixes',
    category: 'Printer',
    tags: ['printer', 'print queue', 'toner'],
    symptoms: ['Print jobs stuck in queue', 'Printer offline', 'Poor print quality'],
    solution:
      '1. Confirm printer power and network connection.\n2. Clear the print spooler queue and restart the service.\n3. Check toner/paper levels.\n4. Reinstall printer drivers if issue persists.',
    authorEmail: 'tech3@demo.com',
  },
  {
    title: 'Requesting and Installing Approved Software',
    category: 'Software',
    tags: ['software', 'installation', 'license'],
    symptoms: ['Need new software installed', 'License activation failed'],
    solution:
      '1. Submit a ticket naming the software and business justification.\n2. IT verifies license availability.\n3. Software is deployed via the standard catalog.\n4. Confirm functionality with the requester.',
    authorEmail: 'technician@demo.com',
  },
  {
    title: 'Improving Slow Laptop Performance',
    category: 'Hardware',
    tags: ['performance', 'slow', 'laptop'],
    symptoms: ['Laptop is slow', 'Applications freeze', 'High CPU/disk usage'],
    solution:
      '1. Restart the device.\n2. Close unused applications and startup programs.\n3. Free up disk space (aim for 15%+ free).\n4. Run a malware scan.\n5. Escalate for a hardware check if the problem continues.',
    authorEmail: 'tech2@demo.com',
  },
  {
    title: 'Reporting a Suspected Phishing Email',
    category: 'Security',
    tags: ['phishing', 'security', 'email'],
    symptoms: ['Suspicious email received', 'Clicked an unknown link', 'Entered credentials on unfamiliar site'],
    solution:
      '1. Do not click any further links or attachments.\n2. Forward the email to the security team.\n3. If credentials were entered, reset the password immediately.\n4. IT will isolate the device if compromise is suspected.',
    authorEmail: 'manager@demo.com',
  },
  {
    title: 'Setting Up a New Corporate Mobile Device',
    category: 'Hardware',
    tags: ['mobile', 'setup', 'mdm'],
    symptoms: ['New phone needs configuration', 'MDM enrollment required'],
    solution:
      '1. Confirm the device is on the approved list.\n2. Enroll the device in the MDM platform.\n3. Configure corporate email and Wi-Fi profiles.\n4. Verify security policies are applied.',
    authorEmail: 'tech3@demo.com',
  },
  {
    title: 'Diagnosing a Network Outage',
    category: 'Network',
    tags: ['network', 'outage', 'downtime'],
    symptoms: ['Entire floor/department offline', 'No internet access anywhere'],
    solution:
      '1. Check switch and router status lights in the server room.\n2. Confirm ISP status with the provider.\n3. Restart affected network hardware.\n4. Notify affected departments with an ETA.',
    authorEmail: 'manager@demo.com',
  },
  {
    title: 'Display / Monitor Not Detected',
    category: 'Hardware',
    tags: ['monitor', 'display', 'peripheral'],
    symptoms: ['External monitor not detected', 'Flickering display', 'No signal message'],
    solution:
      '1. Check cable connections at both ends.\n2. Try a different cable or port.\n3. Update display drivers.\n4. Test the monitor with another device to isolate the fault.',
    authorEmail: 'tech2@demo.com',
  },
];

module.exports = { departments, categories, slaConfigs, users, assets, knowledgeArticles };
