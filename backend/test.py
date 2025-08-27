from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import logging
from tenacity import retry, stop_after_attempt, wait_exponential
import os
from dotenv import load_dotenv
import asyncpg

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Get database credentials from environment variables
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

# Log connection parameters (without password for security)
logger.info(f"Database connection parameters:")
logger.info(f"Host: {DB_HOST}")
logger.info(f"Port: {DB_PORT}")
logger.info(f"User: {DB_USER}")
logger.info(f"Database: {DB_NAME}")

# Construct the database URL using the same approach as your test.py
DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

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

# Test database connection using the same approach as your test.py
async def test_connection():
    try:
        # Log the connection attempt
        logger.info(f"Attempting to connect to database at {DB_HOST}:{DB_PORT}")
        
        # Use direct asyncpg connection like in your test.py
        conn = await asyncpg.connect(
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT,
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
        return False

# Initialize database with retry logic
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
async def init_db():
    try:
        # Test connection first using the same approach as your test.py
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