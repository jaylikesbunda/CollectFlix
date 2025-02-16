import tkinter as tk
from tkinter import ttk, messagebox
import os
import subprocess
import threading
import time
from itertools import cycle
import base64
import requests
import shutil
import socket
import webbrowser
import ctypes
import psycopg2
import logging

# Server control variables
server_processes = {
    'flask': None,
    'react': None
}
monitoring = False

# Get the base directory dynamically
base_dir = os.path.dirname(os.path.abspath(__file__))
frontend_dir = os.path.join(base_dir, 'frontend')

AZURE_THEME_BASE64 = """
IyBDb3B5cmlnaHQgwqkgMjAyMSByZGJlbmRlIDxyZGJlbmRlQGdtYWlsLmNvbT4KCnNvdXJjZSBbZmlsZSBqb2luIFtmaWxlIGRpcm5hbWUgW2luZm8gc2NyaXB0XV0gdGhlbWUgbGlnaHQudGNsXQpzb3VyY2UgW2ZpbGUgam9pbiBbZmlsZSBkaXJuYW1lIFtpbmZvIHNjcmlwdF1dIHRoZW1lIGRhcmsudGNsXQoKb3B0aW9uIGFkZCAqdGVhck9mZiAwCgpwcm9jIHNldF90aGVtZSB7bW9kZX0gewoJaWYgeyRtb2RlID09ICJkYXJrIn0gewoJCXR0azo6c3R5bGUgdGhlbWUgdXNlICJhenVyZS1kYXJrIgoKCQlhcnJheSBzZXQgY29sb3JzIHsKICAgICAgICAgICAgLWZnICAgICAgICAgICAgICIjZmZmZmZmIgogICAgICAgICAgICAtYmcgICAgICAgICAgICAgIiMzMzMzMzMiCiAgICAgICAgICAgIC1kaXNhYmxlZGZnICAgICAiI2ZmZmZmZiIKICAgICAgICAgICAgLWRpc2FibGVkYmcgICAgICIjNzM3MzczIgogICAgICAgICAgICAtc2VsZWN0ZmcgICAgICAgIiNmZmZmZmYiCiAgICAgICAgICAgIC1zZWxlY3RiZyAgICAgICAiIzAwN2ZmZiIKICAgICAgICB9CiAgICAgICAgCiAgICAgICAgdHRrOjpzdHlsZSBjb25maWd1cmUgLiBcCiAgICAgICAgICAgIC1iYWNrZ3JvdW5kICRjb2xvcnMoLWJnKSBcCiAgICAgICAgICAgIC1mb3JlZ3JvdW5kICRjb2xvcnMoLWZnKSBcCiAgICAgICAgICAgIC10cm91Z2hjb2xvciAkY29sb3JzKC1iZykgXAogICAgICAgICAgICAtZm9jdXNjb2xvciAkY29sb3JzKC1zZWxlY3RiZykgXAogICAgICAgICAgICAtc2VsZWN0YmFja2dyb3VuZCAkY29sb3JzKC1zZWxlY3RiZykgXAogICAgICAgICAgICAtc2VsZWN0Zm9yZWdyb3VuZCAkY29sb3JzKC1zZWxlY3RmZykgXAogICAgICAgICAgICAtaW5zZXJ0Y29sb3IgJGNvbG9ycygtZmcpIFwKICAgICAgICAgICAgLWluc2VydHdpZHRoIDEgXAogICAgICAgICAgICAtZmllbGRiYWNrZ3JvdW5kICRjb2xvcnMoLXNlbGVjdGJnKSBcCiAgICAgICAgICAgIC1mb250IHsiU2Vnb2UgVWkiIDEwfSBcCiAgICAgICAgICAgIC1ib3JkZXJ3aWR0aCAxIFwKICAgICAgICAgICAgLXJlbGllZiBmbGF0CgogICAgICAgIHRrX3NldFBhbGV0dGUgYmFja2dyb3VuZCBbdHRrOjpzdHlsZSBsb29rdXAgLiAtYmFja2dyb3VuZF0gXAogICAgICAgICAgICBmb3JlZ3JvdW5kIFt0dGs6OnN0eWxlIGxvb2t1cCAuIC1mb3JlZ3JvdW5kXSBcCiAgICAgICAgICAgIGhpZ2hsaWdodENvbG9yIFt0dGs6OnN0eWxlIGxvb2t1cCAuIC1mb2N1c2NvbG9yXSBcCiAgICAgICAgICAgIHNlbGVjdEJhY2tncm91bmQgW3R0azo6c3R5bGUgbG9va3VwIC4gLXNlbGVjdGJhY2tncm91bmRdIFwKICAgICAgICAgICAgc2VsZWN0Rm9yZWdyb3VuZCBbdHRrOjpzdHlsZSBsb29rdXAgLiAtc2VsZWN0Zm9yZWdyb3VuZF0gXAogICAgICAgICAgICBhY3RpdmVCYWNrZ3JvdW5kIFt0dGs6OnN0eWxlIGxvb2t1cCAuIC1zZWxlY3RiYWNrZ3JvdW5kXSBcCiAgICAgICAgICAgIGFjdGl2ZUZvcmVncm91bmQgW3R0azo6c3R5bGUgbG9va3VwIC4gLXNlbGVjdGZvcmVncm91bmRdCgogICAgICAgIHR0azo6c3R5bGUgbWFwIC4gLWZvcmVncm91bmQgW2xpc3QgZGlzYWJsZWQgJGNvbG9ycygtZGlzYWJsZWRmZyldCgogICAgICAgIG9wdGlvbiBhZGQgKmZvbnQgW3R0azo6c3R5bGUgbG9va3VwIC4gLWZvbnRdCiAgICAgICAgb3B0aW9uIGFkZCAqTWVudS5zZWxlY3Rjb2xvciAkY29sb3JzKC1mZykKICAgIAoJfSBlbHNlaWYgeyRtb2RlID09ICJsaWdodCJ9IHsKCQl0dGs6OnN0eWxlIHRoZW1lIHVzZSAiYXp1cmUtbGlnaHQiCgogICAgICAgIGFycmF5IHNldCBjb2xvcnMgewogICAgICAgICAgICAtZmcgICAgICAgICAgICAgIiMwMDAwMDAiCiAgICAgICAgICAgIC1iZyAgICAgICAgICAgICAiI2ZmZmZmZiIKICAgICAgICAgICAgLWRpc2FibGVkZmcgICAgICIjNzM3MzczIgogICAgICAgICAgICAtZGlzYWJsZWRiZyAgICAgIiNmZmZmZmYiCiAgICAgICAgICAgIC1zZWxlY3RmZyAgICAgICAiI2ZmZmZmZiIKICAgICAgICAgICAgLXNlbGVjdGJnICAgICAgICIjMDA3ZmZmIgogICAgICAgIH0KCgkJdHRrOjpzdHlsZSBjb25maWd1cmUgLiBcCiAgICAgICAgICAgIC1iYWNrZ3JvdW5kICRjb2xvcnMoLWJnKSBcCiAgICAgICAgICAgIC1mb3JlZ3JvdW5kICRjb2xvcnMoLWZnKSBcCiAgICAgICAgICAgIC10cm91Z2hjb2xvciAkY29sb3JzKC1iZykgXAogICAgICAgICAgICAtZm9jdXNjb2xvciAkY29sb3JzKC1zZWxlY3RiZykgXAogICAgICAgICAgICAtc2VsZWN0YmFja2dyb3VuZCAkY29sb3JzKC1zZWxlY3RiZykgXAogICAgICAgICAgICAtc2VsZWN0Zm9yZWdyb3VuZCAkY29sb3JzKC1zZWxlY3RmZykgXAogICAgICAgICAgICAtaW5zZXJ0Y29sb3IgJGNvbG9ycygtZmcpIFwKICAgICAgICAgICAgLWluc2VydHdpZHRoIDEgXAogICAgICAgICAgICAtZmllbGRiYWNrZ3JvdW5kICRjb2xvcnMoLXNlbGVjdGJnKSBcCiAgICAgICAgICAgIC1mb250IHsiU2Vnb2UgVWkiIDEwfSBcCiAgICAgICAgICAgIC1ib3JkZXJ3aWR0aCAxIFwKICAgICAgICAgICAgLXJlbGllZiBmbGF0CgogICAgICAgIHRrX3NldFBhbGV0dGUgYmFja2dyb3VuZCBbdHRrOjpzdHlsZSBsb29rdXAgLiAtYmFja2dyb3VuZF0gXAogICAgICAgICAgICBmb3JlZ3JvdW5kIFt0dGs6OnN0eWxlIGxvb2t1cCAuIC1mb3JlZ3JvdW5kXSBcCiAgICAgICAgICAgIGhpZ2hsaWdodENvbG9yIFt0dGs6OnN0eWxlIGxvb2t1cCAuIC1mb2N1c2NvbG9yXSBcCiAgICAgICAgICAgIHNlbGVjdEJhY2tncm91bmQgW3R0azo6c3R5bGUgbG9va3VwIC4gLXNlbGVjdGJhY2tncm91bmRdIFwKICAgICAgICAgICAgc2VsZWN0Rm9yZWdyb3VuZCBbdHRrOjpzdHlsZSBsb29rdXAgLiAtc2VsZWN0Zm9yZWdyb3VuZF0gXAogICAgICAgICAgICBhY3RpdmVCYWNrZ3JvdW5kIFt0dGs6OnN0eWxlIGxvb2t1cCAuIC1zZWxlY3RiYWNrZ3JvdW5kXSBcCiAgICAgICAgICAgIGFjdGl2ZUZvcmVncm91bmQgW3R0azo6c3R5bGUgbG9va3VwIC4gLXNlbGVjdGZvcmVncm91bmRdCgogICAgICAgIHR0azo6c3R5bGUgbWFwIC4gLWZvcmVncm91bmQgW2xpc3QgZGlzYWJsZWQgJGNvbG9ycygtZGlzYWJsZWRmZyldCgogICAgICAgIG9wdGlvbiBhZGQgKmZvbnQgW3R0azo6c3R5bGUgbG9va3VwIC4gLWZvbnRdCiAgICAgICAgb3B0aW9uIGFkZCAqTWVudS5zZWxlY3Rjb2xvciAkY29sb3JzKC1mZykKCX0KfQ==
"""

def setup_theme():
    theme_dir = os.path.join(base_dir, 'theme')
    light_path = os.path.join(theme_dir, 'light.tcl')
    dark_path = os.path.join(theme_dir, 'dark.tcl')
    
    if not os.path.exists(light_path) or not os.path.exists(dark_path):
        messagebox.showerror("Theme Error", 
            f"Theme files missing!\nExpected locations:\n{light_path}\n{dark_path}")
        return False
    return True

def check_server_status():
    # Check both process handles AND actual port availability
    flask_proc_alive = server_processes['flask'] and server_processes['flask'].poll() is None
    react_proc_alive = server_processes['react'] and server_processes['react'].poll() is None
    
    # Fallback port checks
    flask_port_active = check_port(5500)  # Flask default port
    react_port_active = check_port(3000)  # React default port
    
    return (
        flask_proc_alive or flask_port_active,
        react_proc_alive or react_port_active
    )

def check_port(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def get_local_ip():
    """Get actual LAN IP instead of localhost"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def update_status_labels():
    while monitoring:
        try:
            flask_status, react_status = check_server_status()
            ip = get_local_ip()
            
            status_text = f"Flask: {'🟢 Running' if flask_status else '🔴 Stopped'}\n"
            status_text += f"React: {'🟢 Running' if react_status else '🔴 Stopped'}"
            
            status_label.config(text=status_text)
            start_btn.config(state='normal' if not (flask_status and react_status) else 'disabled')
            stop_btn.config(state='normal' if (flask_status or react_status) else 'disabled')
            
            access_label.config(text=f"http://{ip}:3000")
            
            # Update the GUI immediately
            status_label.update_idletasks()
            start_btn.update_idletasks()
            stop_btn.update_idletasks()
            
            time.sleep(0.5)  # Reduced from 2 seconds to 0.5 seconds
            
        except Exception as e:
            print(f"Status update error: {e}")
            time.sleep(1)  # Error cooldown

def start_servers():
    global monitoring, server_processes
    try:
        # Add this Windows-specific initialization
        if os.name == 'nt':
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            startupinfo.wShowWindow = subprocess.SW_HIDE
        else:
            startupinfo = None
            
        # Kill any existing processes first
        stop_servers()
        
        # Change to the base directory
        os.chdir(base_dir)
        
        # Modified Flask command with explicit title
        flask_cmd = [
            'python',
            '-c',
            'from app import ensure_db_constraints; ensure_db_constraints(); import app; app.app.run(host="0.0.0.0", port=5500, debug=False, threaded=True)'
        ]
        server_processes['flask'] = subprocess.Popen(
            flask_cmd,
            cwd=base_dir,
            creationflags=subprocess.CREATE_NO_WINDOW | subprocess.CREATE_NEW_PROCESS_GROUP,
            startupinfo=startupinfo
        )
        
        # Add this before starting React server
        node_modules_path = os.path.join(frontend_dir, 'node_modules')
        if not os.path.exists(node_modules_path):
            subprocess.run(['npm', 'ci', '--prefix', frontend_dir], 
                check=True, timeout=300,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
        
        # React with proper process tree
        react_cmd = [
            'npm.cmd',
            'start',
            '--prefix',
            frontend_dir
        ]
        server_processes['react'] = subprocess.Popen(
            react_cmd,
            shell=True,
            cwd=frontend_dir,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
        )
        
        monitoring = True
        threading.Thread(target=update_status_labels, daemon=True).start()
        messagebox.showinfo("Success", "Servers started successfully!")
        
    except Exception as e:
        messagebox.showerror("Start Error", str(e))

def stop_servers():
    global monitoring, server_processes
    try:
        monitoring = False
        time.sleep(0.5)
        
        # Kill React's entire process tree
        subprocess.run(
            'taskkill /IM node.exe /F /T',
            shell=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
        # Precision kill for Flask using PID
        if server_processes['flask'] and server_processes['flask'].pid:
            subprocess.run(
                f'taskkill /F /T /PID {server_processes["flask"].pid}',
                shell=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        
        server_processes = {'flask': None, 'react': None}
        messagebox.showinfo("Servers Stopped", "All processes terminated")
        
    except Exception as e:
        messagebox.showerror("Stop Error", str(e))

def load_settings():
    env_vars = {}
    template_path = os.path.join(base_dir, '.env.template')
    env_path = os.path.join(base_dir, '.env')
    
    # Try loading from .env first
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    env_vars[key] = value.strip('"').strip("'")
    
    # If .env doesn't exist, use .env.template
    elif os.path.exists(template_path):
        with open(template_path) as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    env_vars[key] = value.strip('"').strip("'")
    
    # Also check system environment variables
    for key in ['TMDB_API_KEY', 'EBAY_APP_ID', 'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS', 'DB_PORT']:
        env_value = os.getenv(key)
        if env_value:
            env_vars[key] = env_value
            
    return env_vars

def save_settings():
    content = []
    for key, var in env_variables.items():
        content.append(f'{key}="{var.get()}"')
    
    # Save to dynamic path
    with open(os.path.join(base_dir, '.env'), 'w') as f:
        f.write('\n'.join(content))

def check_database_exists():
    """Check if database connection works and database exists"""
    try:
        conn = psycopg2.connect(
            dbname=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASS'),
            host=os.getenv('DB_HOST'),
            port=os.getenv('DB_PORT')
        )
        conn.close()
        return True
    except psycopg2.OperationalError as e:
        logging.error(f"Database connection failed: {e}")
        return False

def create_database():
    """Create database if it doesn't exist"""
    try:
        # Connect to default postgres DB to create target DB
        conn = psycopg2.connect(
            dbname='postgres',
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASS'),
            host=os.getenv('DB_HOST'),
            port=os.getenv('DB_PORT')
        )
        conn.autocommit = True
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE {os.getenv('DB_NAME')}")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        messagebox.showerror("DB Creation Failed", str(e))
        return False

def create_gui():
    global env_variables, status_label, start_btn, stop_btn, monitoring, access_label
    env_variables = {}

    root = tk.Tk()
    root.title("CollectFlix Launcher")
    root.geometry("400x700")
    root.minsize(400, 700)
    if os.name == 'nt':
        app_id = 'CollectFlix.Launcher'  # Unique application ID
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(app_id)
        
        # Load icon from file
        try:
            # Use base_dir for absolute paths
            light_icon = os.path.join(base_dir, 'frontend/public/collectflix.ico')
            root.iconbitmap(default=light_icon)
        except Exception as e:
            print(f"Icon loading error: {e}")

    # Load theme files using absolute paths
    light_theme = os.path.join(base_dir, 'theme/light.tcl')
    dark_theme = os.path.join(base_dir, 'theme/dark.tcl')
    root.tk.call('source', light_theme)
    root.tk.call('source', dark_theme)
    
    # Configure the theme using ttk
    style = ttk.Style(root)
    style.theme_use('azure-light')

    # Theme toggle function with window color update
    def toggle_theme():
        if style.theme_use() == 'azure-dark':
            style.theme_use('azure-light')
            theme_btn.config(text='🌙 Dark Mode')
            root.configure(bg='#ffffff')
            style.configure('TFrame', background='#ffffff')
            style.configure('TLabel', background='#ffffff', foreground='#000000')
        else:
            style.theme_use('azure-dark')
            theme_btn.config(text='☀️ Light Mode')
            root.configure(bg='#333333')
            style.configure('TFrame', background='#333333')
            style.configure('TLabel', background='#333333', foreground='#ffffff')

    # Initial window background
    root.configure(bg='#ffffff')

    # Configure styles
    style.configure('TFrame', background='#ffffff')
    style.configure('TLabel', background='#ffffff', foreground='#000000')
    style.configure('TButton', font=('Segoe UI', 10), padding=6)
    style.configure('Accent.TButton', font=('Segoe UI', 10, 'bold'))

    ttk.Label(root, text="CollectFlix Launcher", font=('Helvetica', 14, 'bold')).pack(pady=10)

    fields = [
        ('TMDB_API_KEY', 'TMDB API Key'),
        ('EBAY_APP_ID', 'eBay App ID'),
        ('DB_HOST', 'Database Host'),
        ('DB_NAME', 'Database Name'),
        ('DB_USER', 'Database User'),
        ('DB_PASS', 'Database Password'),
        ('DB_PORT', 'Database Port')
    ]

    saved_settings = load_settings()
    
    for key, label in fields:
        frame = ttk.Frame(root)
        frame.pack(fill='x', padx=20, pady=5)
        
        ttk.Label(frame, text=label, width=20).pack(side='left')
        var = tk.StringVar(value=saved_settings.get(key, ''))
        entry = ttk.Entry(frame, textvariable=var, width=30)
        entry.pack(side='right', fill='x', expand=True)
        
        # If empty and we have an environment variable, use that
        if not var.get() and key in os.environ:
            var.set(os.environ[key])
        
        env_variables[key] = var

    # Status display
    status_frame = ttk.Frame(root, padding=10)
    status_frame.pack(pady=10, fill='x', padx=20)
    status_label = ttk.Label(
        status_frame, 
        text="🔄 Initializing...",
        font=('Segoe UI', 10),
        anchor='center'
    )
    status_label.pack(expand=True)

    # Control buttons frame
    btn_frame = ttk.Frame(root)
    btn_frame.pack(pady=15)

    start_btn = ttk.Button(
        btn_frame,
        text="Start Servers",
        style='Accent.TButton',
        command=lambda: threading.Thread(target=start_servers, daemon=True).start()
    )
    start_btn.pack(side='left', padx=5)

    stop_btn = ttk.Button(
        btn_frame,
        text="Stop Servers",
        style='Accent.TButton',
        command=stop_servers,
        state='disabled'
    )
    stop_btn.pack(side='left', padx=5)

    # Theme toggle button
    theme_btn = ttk.Button(
        root,
        text='🌙 Dark Mode',
        command=toggle_theme,
        style='TButton'
    )
    theme_btn.pack(pady=5)

    # Exit button
    ttk.Button(
        root,
        text="Exit",
        command=root.destroy,
        style='TButton'
    ).pack(pady=5)

    # Add network access section
    access_frame = ttk.Frame(root)
    access_frame.pack(pady=5)
    
    ttk.Label(access_frame, text="Network Access:").pack(side='left')
    access_label = ttk.Label(
        access_frame,
        text="http://...",
        foreground="blue",
        cursor="hand2"
    )
    access_label.pack(side='left')
    access_label.bind("<Button-1>", lambda e: webbrowser.open(access_label.cget("text")))

    # Add open browser button
    ttk.Button(
        root,
        text="Open Web Interface",
        command=lambda: webbrowser.open(access_label.cget("text")),
        style='Accent.TButton'
    ).pack(pady=5)

    # Database creation button
    if not check_database_exists():
        db_btn = ttk.Button(
            root,
            text="⚠️ Create Database ⚠️",
            style='Accent.TButton',
            command=lambda: [create_database(), root.destroy()]
        )
        db_btn.pack(pady=10, fill='x', padx=20)

    # Start monitoring immediately
    monitoring = True
    threading.Thread(target=update_status_labels, daemon=True).start()

    root.mainloop()

if __name__ == "__main__":
    setup_theme()
    create_gui() 