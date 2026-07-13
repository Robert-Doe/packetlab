"""
Module 02 -- a deliberately plain target for Wireshark capture practice.

Serves one route with a distinctive body string so it's trivial to find in
a capture with a display filter like:  tcp.port == 8080

Binds to 127.0.0.1 only. See ../SAFETY.md.
"""
from flask import Flask

app = Flask(__name__)

MARKER = "LAYER-DEMO-PAYLOAD-92f1"


@app.route("/layer-demo")
def layer_demo():
    return f"You reached the layer-demo route. Marker: {MARKER}\n"


if __name__ == "__main__":
    print("=" * 64)
    print(" Module 02 target server is up.")
    print(" http://127.0.0.1:8080/layer-demo")
    print(f" Look for the marker '{MARKER}' in your Wireshark capture.")
    print("=" * 64)
    app.run(host="127.0.0.1", port=8080, debug=False)
