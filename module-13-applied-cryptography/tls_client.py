"""
Module 13 -- a real TLS client, tried two ways against tls_server.py:

  1. Trusting the toy CA (cafile=ca_cert.pem) -- should succeed.
  2. Trusting only the normal system CA store (no cafile) -- should FAIL,
     with a real certificate verification error, because our toy CA isn't
     in anyone's system trust store. This is not a simulated failure --
     it's the exact error a browser raises for an untrusted certificate.
"""
import socket
import ssl

HOST, PORT = "127.0.0.1", 8443


def try_connect(context: ssl.SSLContext, label: str):
    print(f"--- {label} ---")
    try:
        with socket.create_connection((HOST, PORT), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname="lab.test") as tls_sock:
                print(f"  Handshake SUCCEEDED.")
                print(f"  Negotiated protocol: {tls_sock.version()}")
                print(f"  Negotiated cipher:   {tls_sock.cipher()}")
                peer_cert = tls_sock.getpeercert()
                print(f"  Peer certificate subject: {peer_cert.get('subject')}")

                request = b"GET / HTTP/1.1\r\nHost: lab.test\r\nConnection: close\r\n\r\n"
                tls_sock.sendall(request)
                response = tls_sock.recv(4096)
                print(f"  Response: {response.splitlines()[0].decode()}")
    except ssl.SSLCertVerificationError as e:
        print(f"  Handshake FAILED (certificate verification): {e.reason}")
    except Exception as e:
        print(f"  Handshake FAILED: {type(e).__name__}: {e}")
    print()


def main():
    print("Attempt 1: trusting the toy CA explicitly\n")
    trusting_context = ssl.create_default_context(cafile="ca_cert.pem")
    try_connect(trusting_context, "Client trusts ca_cert.pem")

    print("Attempt 2: using only the normal system trust store (NOT trusting our toy CA)\n")
    default_context = ssl.create_default_context()
    try_connect(default_context, "Client does NOT trust our toy CA")


if __name__ == "__main__":
    main()
