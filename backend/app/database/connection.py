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
DB_PORT = os.getenv("DB_PORT", "6543")  # Default to 6543 if not specified
DB_NAME = os.getenv("DB_NAME")
PROJECT_REF = os.getenv("PROJECT_REF")  # Add this to your .env file
DB_DIRECT_HOST = os.getenv("DB_DIRECT_HOST")  # Direct connection host (non-pooler)

# Log connection parameters (without password for security)
logger.info(f"Database connection parameters:")
logger.info(f"Host: {DB_HOST}")
logger.info(f"Port: {DB_PORT}")
logger.info(f"User: {DB_USER}")
logger.info(f"Database: {DB_NAME}")
logger.info(f"Project Reference: {PROJECT_REF}")
logger.info(f"Direct Host: {DB_DIRECT_HOST}")

# Test if the port is open
def test_port_open(host, port, timeout=10):
    try:
        socket.create_connection((host, port), timeout=timeout)
        logger.info(f"Port {port} is open on {host}")
        return True
    except (socket.timeout, socket.error) as e:
        logger.error(f"Port {port} is not open on {host}: {str(e)}")
        return False

# Resolve hostname to IP addresses
def resolve_hostname(hostname):
    try:
        addr_info = socket.getaddrinfo(hostname, None)
        ip_addresses = [addr[4][0] for addr in addr_info]
        logger.info(f"Hostname {hostname} resolves to IP addresses: {ip_addresses}")
        return ip_addresses
    except socket.gaierror as e:
        logger.error(f"Failed to resolve hostname {hostname}: {str(e)}")
        return []

# Test connectivity to all resolved IP addresses
def test_connectivity():
    ip_addresses = resolve_hostname(DB_HOST)
    if not ip_addresses:
        return False
    
    # Test port on each IP
    port = int(DB_PORT)
    for ip in ip_addresses:
        if test_port_open(ip, port):
            return True
    return False

# Format username for Supabase connection pooler
def format_username():
    if PROJECT_REF:
        return f"postgres.{PROJECT_REF}"
    return DB_USER

# Construct the database URL
FORMATTED_USER = format_username()
DATABASE_URL = f"postgresql+asyncpg://{FORMATTED_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

logger.info(f"Database URL: postgresql+asyncpg://{FORMATTED_USER}:***@{DB_HOST}:{DB_PORT}/{DB_NAME}")

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,  # Set to True for debugging SQL queries
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=10,
    max_overflow=20,
    connect_args={
        "timeout": 30,  # Connection timeout in seconds
        "command_timeout": 10,  # Command timeout in seconds
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

# Test direct connection (non-pooler)
async def test_direct_connection():
    try:
        if not DB_DIRECT_HOST:
            logger.error("Direct connection host not provided")
            return False
            
        logger.info(f"Testing direct connection to {DB_DIRECT_HOST}:5432")
        
        # Test if port 5432 is open on direct host
        if not test_port_open(DB_DIRECT_HOST, 5432):
            logger.error(f"Port 5432 is not open on {DB_DIRECT_HOST}")
            return False
            
        # Try direct connection
        conn = await asyncpg.connect(
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_DIRECT_HOST,
            port=5432,
            database=DB_NAME
        )
        
        # Execute a simple query
        result = await conn.fetchval("SELECT NOW()")
        logger.info(f"Direct connection test successful. Current time: {result}")
        
        # Close the connection
        await conn.close()
        return True
    except Exception as e:
        logger.error(f"Direct connection test failed: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        return False

# Test database connection
async def test_connection():
    try:
        # First test network connectivity
        logger.info("Testing network connectivity...")
        if not test_connectivity():
            logger.error("Network connectivity test failed")
            
            # If connection pooler fails, try direct connection
            if DB_DIRECT_HOST:
                logger.info("Trying direct connection...")
                return await test_direct_connection()
            return False
            
        # Log the connection attempt
        logger.info(f"Attempting to connect to database at {DB_HOST}:{DB_PORT}")
        logger.info(f"Using username: {FORMATTED_USER}")
        
        # Use direct asyncpg connection
        conn = await asyncpg.connect(
            user=FORMATTED_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=int(DB_PORT),
            database=DB_NAME
        )
        
        # Execute a simple query
        result = await conn.fetchval("SELECT NOW()")
        logger.info(f"Database connection test successful. Current time: {result}")
        
        # Close the connection
        await conn.close()
        return True
    except asyncpg.exceptions.InvalidPasswordError as e:
        logger.error(f"Invalid password error: {str(e)}")
        return False
    except asyncpg.exceptions.InvalidAuthorizationSpecificationError as e:
        logger.error(f"Authorization error: {str(e)}")
        return False
    except asyncpg.exceptions.ConnectionDoesNotExistError as e:
        logger.error(f"Connection does not exist error: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Database connection test failed: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        # Log the full exception for debugging
        import traceback
        logger.error(traceback.format_exc())
        return False

# Initialize database with retry logic
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
async def init_db():
    try:
        # Test connection first
        if not await test_connection():
            raise Exception("Connection test failed before initialization")
            
        # Import all models here to ensure they are registered with SQLAlchemy
        from app.models import user, document, analysis, audit
       
        async with engine.begin() as conn:
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
       
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Database initialization error: {str(e)}")
        raise