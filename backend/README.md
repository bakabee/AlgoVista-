# AlgoVista Backend

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python start_server.py
```

Manual command:

```bash
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

If port `8000` is busy:

```bash
uvicorn main:app --host 127.0.0.1 --port 8010 --reload
```

API:

```http
POST /run-algorithm
```
