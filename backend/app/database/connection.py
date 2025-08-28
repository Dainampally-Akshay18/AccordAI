from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import logging
from tenacity import retry, stop_after_attempt, wait_exponential
import os
from dotenv import load_dotenv
import asyncpg
import socket

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Get database credentials from environment variables
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "6543")
DB_NAME = os.getenv("DB_NAME")
PROJECT_REF = os.getenv("PROJECT_REF")
DB_DIRECT_HOST = os.getenv("DB_DIRECT_HOST")

# Format username for Supabase connection pooler
def format_username():
    if PROJECT_REF:
        return f"postgres.{PROJECT_REF}"
    return DB_USER

# Construct the database URL
FORMATTED_USER = format_username()
DATABASE_URL = f"postgresql+asyncpg://{FORMATTED_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

logger.info(f"Database URL: postgresql+asyncpg://{FORMATTED_USER}:***@{DB_HOST}:{DB_PORT}/{DB_NAME}")

# 🔥 FIXED: Create async engine with ALL necessary Supabase/pgbouncer compatibility settings
engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=10,
    max_overflow=20,
    connect_args={
        "timeout": 30,
        "command_timeout": 10,
        "statement_cache_size": 0,  # 🔥 CRITICAL: Disable prepared statement caching
        "prepared_statement_cache_size": 0,  # 🔥 CRITICAL: Additional safety
        "server_settings": {
            "jit": "off",  # 🔥 Disable JIT which can cause issues with poolers
        }
    }
)

# Create async session maker
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base class for models
class Base(DeclarativeBase):
    pass

# Dependency to get database session
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session error: {str(e)}")
            raise
        finally:
            await session.close()

# Test connectivity functions (keeping your existing logic)
def test_port_open(host, port, timeout=10):
    try:
        socket.create_connection((host, port), timeout=timeout)
        logger.info(f"Port {port} is open on {host}")
        return True
    except (socket.timeout, socket.error) as e:
        logger.error(f"Port {port} is not open on {host}: {str(e)}")
        return False

def resolve_hostname(hostname):
    try:
        addr_info = socket.getaddrinfo(hostname, None)
        ip_addresses = [addr[4][0] for addr in addr_info]
        logger.info(f"Hostname {hostname} resolves to IP addresses: {ip_addresses}")
        return ip_addresses
    except socket.gaierror as e:
        logger.error(f"Failed to resolve hostname {hostname}: {str(e)}")
        return []

def test_connectivity():
    ip_addresses = resolve_hostname(DB_HOST)
    if not ip_addresses:
        return False
    
    port = int(DB_PORT)
    for ip in ip_addresses:
        if test_port_open(ip, port):
            return True
    return False

# Test database connection
async def test_connection():
    try:
        logger.info("Testing network connectivity...")
        if not test_connectivity():
            logger.error("Network connectivity test failed")
            return False
        
        logger.info(f"Attempting to connect to database at {DB_HOST}:{DB_PORT}")
        logger.info(f"Using username: {FORMATTED_USER}")
        
        # Use direct asyncpg connection with statement cache disabled
        conn = await asyncpg.connect(
            user=FORMATTED_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=int(DB_PORT),
            database=DB_NAME,
            statement_cache_size=0
        )
        
        result = await conn.fetchval("SELECT NOW()")
        logger.info(f"Database connection test successful. Current time: {result}")
        
        await conn.close()
        return True
        
    except Exception as e:
        logger.error(f"Database connection test failed: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        return False

# 🔥 SIMPLIFIED: Initialize database with better error handling
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
async def init_db():
    try:
        # Test connection first
        if not await test_connection():
            raise Exception("Connection test failed before initialization")
        
        # Import all models here to ensure they are registered with SQLAlchemy
        from app.models import user, document, analysis, audit
        
        # Create tables using the engine with disabled statement caching
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("Database tables created successfully")
        
    except Exception as e:
        logger.error(f"Database initialization error: {str(e)}")
        raise
