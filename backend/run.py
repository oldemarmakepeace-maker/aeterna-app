"""
AETERNA Backend — Entry Point.
Явная передача SelectorEventLoop в uvicorn для совместимости с psycopg3 на Windows.
"""
import sys
import asyncio
import selectors

import uvicorn


def main():
    config = uvicorn.Config(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info",
    )
    server = uvicorn.Server(config)

    if sys.platform == "win32":
        # psycopg3 async требует SelectorEventLoop на Windows
        loop = asyncio.SelectorEventLoop(selectors.SelectSelector())
        asyncio.set_event_loop(loop)
        loop.run_until_complete(server.serve())
    else:
        asyncio.run(server.serve())


if __name__ == "__main__":
    main()
