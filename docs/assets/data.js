// Single source of truth for the site. Values come from the real Nmap output in /scans.
window.SITE = {
  repo: "https://github.com/Lindoln007/Network-Scanning-and-Service-Identification",
};

// risk: "r" = high, "m" = medium, "" = informational / low
window.LAB = [
  {
    ip: "127.0.10.10", name: "Web server", x: 100, y: 100,
    ports: [
      { p: 22, svc: "ssh", ver: "OpenSSH 7.4", risk: "m" },
      { p: 80, svc: "http", ver: "Apache httpd 2.4.29 (Ubuntu)", risk: "m" },
      { p: 135, svc: "msrpc", ver: "Microsoft Windows RPC", risk: "" },
      { p: 445, svc: "microsoft-ds", ver: "SMB2, signing required", risk: "m" },
    ],
  },
  {
    ip: "127.0.10.20", name: "Legacy file / mail", x: 400, y: 100,
    ports: [
      { p: 21, svc: "ftp", ver: "vsftpd 2.3.4", risk: "r" },
      { p: 23, svc: "telnet", ver: "Linux telnetd", risk: "r" },
      { p: 25, svc: "smtp", ver: "Postfix smtpd", risk: "" },
      { p: 135, svc: "msrpc", ver: "Microsoft Windows RPC", risk: "" },
      { p: 445, svc: "microsoft-ds", ver: "SMB2, signing required", risk: "m" },
    ],
  },
  {
    ip: "127.0.10.30", name: "Admin workstation", x: 250, y: 335,
    ports: [
      { p: 22, svc: "ssh", ver: "OpenSSH 8.9p1 Ubuntu 3ubuntu0.1", risk: "" },
      { p: 135, svc: "msrpc", ver: "Microsoft Windows RPC", risk: "" },
      { p: 445, svc: "microsoft-ds", ver: "SMB2, signing required", risk: "m" },
      { p: 8080, svc: "http", ver: "Apache httpd 2.4.29 (Ubuntu)", risk: "m" },
    ],
  },
];
