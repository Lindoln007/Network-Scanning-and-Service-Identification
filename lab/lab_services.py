"""Isolated lab network for the Nmap scanning project.

Starts three "hosts" on loopback addresses (127.0.10.x). Traffic to these
addresses never leaves this computer, so the lab is fully isolated.
Each service sends the banner a real server of that kind would send, so
Nmap's service detection (-sV) can identify it.

Run:   python lab/lab_services.py
Stop:  Ctrl+C
"""
import socket
import threading
import time

# host -> list of (port, name, banner sent on connect, or None for HTTP)
LAB = {
    "127.0.10.10": [  # web server
        (22, "ssh", b"SSH-2.0-OpenSSH_7.4\r\n"),
        (80, "http", None),
    ],
    "127.0.10.20": [  # legacy file / mail server
        (21, "ftp", b"220 (vsFTPd 2.3.4)\r\n"),
        (23, "telnet", b"\xff\xfd\x18\xff\xfd\x20\xff\xfd\x23\xff\xfd\x27"),
        (25, "smtp", b"220 mail.lab.local ESMTP Postfix\r\n"),
    ],
    "127.0.10.30": [  # admin workstation
        (22, "ssh", b"SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.1\r\n"),
        (8080, "http-admin", None),
    ],
}

BODY = b"<html><head><title>Lab Server</title></head><body>Lab</body></html>"
HTTP_RESPONSE = (
    b"HTTP/1.1 200 OK\r\n"
    b"Server: Apache/2.4.29 (Ubuntu)\r\n"
    b"Content-Type: text/html\r\n"
    b"Content-Length: " + str(len(BODY)).encode() + b"\r\n"
    b"Connection: close\r\n\r\n" + BODY
)


def handle(conn, banner):
    try:
        conn.settimeout(5)
        if banner is None:  # HTTP: wait for a request, then answer it
            conn.recv(4096)
            conn.sendall(HTTP_RESPONSE)
        else:
            conn.sendall(banner)
            conn.recv(1024)  # keep the line open briefly, like a real server
    except OSError:
        pass
    finally:
        conn.close()


def serve(host, port, name, banner):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        s.bind((host, port))
    except OSError as e:
        print(f"  ! could not start {name} on {host}:{port} ({e})")
        return
    s.listen(20)
    print(f"  {host}:{port:<5} {name}")
    while True:
        conn, _ = s.accept()
        threading.Thread(target=handle, args=(conn, banner), daemon=True).start()


if __name__ == "__main__":
    print("Starting lab services:")
    for host, services in LAB.items():
        for port, name, banner in services:
            threading.Thread(target=serve, args=(host, port, name, banner), daemon=True).start()
    time.sleep(0.5)
    print("Lab running. Press Ctrl+C to stop.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Stopped.")
