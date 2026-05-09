"""Test Supabase REST connection."""
import asyncio
from app.database import supabase

async def main():
    try:
        # Test users table
        users = await supabase.select("users", limit=5)
        print(f"Connected! Users count: {len(users)}")
        if users:
            print(f"First user: {users[0].get('email')}")
        
        # Test tasks table
        tasks = await supabase.select("tasks", limit=5)
        print(f"Tasks count: {len(tasks)}")
        
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(main())
