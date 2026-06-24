import asyncio
import websockets

async def t():
    try:
        async with websockets.connect('ws://127.0.0.1:8000/ws/transcribe?lang=en') as ws:
            print('connected')
    except Exception as e:
        print('error', e)

asyncio.run(t())
