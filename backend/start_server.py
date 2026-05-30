import socket

import uvicorn


def first_available_port(candidates: tuple[int, ...]) -> int:
    for port in candidates:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            if sock.connect_ex(("127.0.0.1", port)) != 0:
                return port
    raise RuntimeError("Ports 8000 and 8010 are both busy.")


if __name__ == "__main__":
    port = first_available_port((8000, 8010))
    print(f"Starting AlgoVista backend on http://127.0.0.1:{port}")
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=True)
