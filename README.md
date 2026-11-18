# Network Scanning and Service Identification

**351 CP 81 · Comprehension Review · Project 2**
Asante Mbaya · 23311351002

> Use Nmap to scan an isolated laboratory network and identify active hosts, open ports and running services.
> Output: a network scanning report with identified services and security recommendations.

- **Portfolio website:** https://lindoln007.github.io/Network-Scanning-and-Service-Identification/
- **Full report (PDF):** [docs/Network_Scanning_Report.pdf](docs/Network_Scanning_Report.pdf)

## Repository contents

| Path | What it is |
|---|---|
| `lab/lab_services.py` | The isolated lab: three hosts on `127.0.10.x` running seven services |
| `scans/` | Raw Nmap output (`.txt` and `.xml`) from every scan phase |
| `docs/Network_Scanning_Report.pdf` | The network scanning report (PDF): findings, risk ratings, recommendations |
| `report/report.html` | Source the PDF report is printed from |
| `docs/` | The three-page portfolio website (served by GitHub Pages) |

## Reproduce the scan

Requirements: Python 3 and [Nmap](https://nmap.org/download) (tested with Nmap 7.80 on Windows 11).

1. Start the lab and leave it running:
   ```bash
   python lab/lab_services.py
   ```
2. In a second terminal, run the three scan phases:
   ```bash
   nmap -sT -Pn -p 21-25,80,8080 --open 127.0.10.1-50 -oN scans/01_host_discovery.txt
   nmap -sT -Pn -T5 -p 1-1024,3306,8080 127.0.10.10,20,30 -oN scans/02_port_scan.txt -oX scans/02_port_scan.xml
   nmap -sT -Pn -sV -sC -p 21,22,23,25,80,135,445,8080 127.0.10.10,20,30 -oN scans/03_service_detection.txt -oX scans/03_service_detection.xml
   ```

All traffic stays on the loopback interface, so nothing leaves the computer.

## Summary of results

| Host | Role | Open ports / services |
|---|---|---|
| 127.0.10.10 | Web server | 22 OpenSSH 7.4 · 80 Apache 2.4.29 · 135 MS-RPC · 445 SMB |
| 127.0.10.20 | Legacy file & mail | 21 **vsftpd 2.3.4** · 23 **Telnet** · 25 Postfix · 135 · 445 |
| 127.0.10.30 | Admin workstation | 22 OpenSSH 8.9p1 · 135 · 445 · 8080 Apache admin panel |

3 live hosts · 13 open ports · 8 findings (2 High, 4 Medium, 2 Low). The PDF report has the details.
