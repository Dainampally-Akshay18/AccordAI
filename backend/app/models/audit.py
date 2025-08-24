from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database.connection import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Audit information
    action = Column(String(100), nullable=False, index=True)  # upload, analyze, download, etc.
    resource_type = Column(String(50), nullable=False)  # document, analysis, user
    resource_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Event details
    event_data = Column(JSONB, nullable=True)  # Additional event metadata
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # File integrity (for documents)
    file_hash = Column(String(64), nullable=True)  # SHA256 hash at time of action
    file_size = Column(Integer, nullable=True)
    
    # Result
    success = Column(String(20), default="success")  # success, failed, partial
    error_message = Column(Text, nullable=True)
    processing_time = Column(Integer, nullable=True)  # milliseconds
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, action={self.action})>"

class SystemLog(Base):
    __tablename__ = "system_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Log information
    level = Column(String(20), nullable=False, index=True)  # INFO, WARNING, ERROR, CRITICAL
    logger_name = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    
    # Context
    module = Column(String(100), nullable=True)
    function = Column(String(100), nullable=True)
    line_number = Column(Integer, nullable=True)
    
    # Additional data
    extra_data = Column(JSONB, nullable=True)
    stack_trace = Column(Text, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def __repr__(self):
        return f"<SystemLog(id={self.id}, level={self.level})>"
