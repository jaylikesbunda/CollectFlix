# CollectFlix (ALPHA)
![Spooky_Logo](https://github.com/user-attachments/assets/a2e0c481-0745-40af-9000-8a651233fa7e)

## Requirements
- [Node.js](https://nodejs.org) (Includes npm)
- [Python 3.9+](https://python.org)
- [PostgreSQL](https://www.postgresql.org/download/)

## Installation
```bash
# Clone repo
git clone https://github.com/yourusername/collectflix.git
cd collectflix

# Install Python dependencies
pip install -r requirements.txt

# Run the launcher (auto-installs frontend deps)
python launcher.py
```

## First Run Flow
1. Launcher checks for `node_modules`
2. If missing → auto-runs `npm ci` in frontend
3. Starts Flask backend (port 5500)
4. Starts React frontend (port 3000)

## Database Setup

### Manual Setup
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib  # Debian/Ubuntu
brew install postgresql && brew services start postgresql  # Mac

# Create database and user
sudo -u postgres psql -c "CREATE DATABASE collectflix;"
sudo -u postgres psql -c "CREATE USER collectflix WITH PASSWORD 'your_password_here';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE collectflix TO collectflix;"
```

### Automated Setup
1. First launch will detect missing database
2. Click "⚠️ Create Database ⚠️" button in launcher
3. Enter credentials when prompted (saved to `.env`)

**Troubleshooting:**
- Connection issues? Verify PostgreSQL is running
- Reset database: `sudo -u postgres psql -c "DROP DATABASE collectflix; CREATE DATABASE collectflix;"`

**Troubleshooting:**
```bash
# Manual frontend install if needed
cd frontend && npm ci
