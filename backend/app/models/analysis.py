from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database.connection import Base

class Analysis(Base):
    __tablename__ = "analyses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    
    # Analysis results
    clauses = Column(JSONB, nullable=True)  # Extracted clauses with metadata
    risk_assessment = Column(JSONB, nullable=True)  # Risk flags and scores
    summaries = Column(JSONB, nullable=True)  # TL;DR for each clause
    rewrites = Column(JSONB, nullable=True)  # Suggested rewrites
    
    # Confidence and provenance
    overall_confidence = Column(Integer, nullable=True)  # 1-100
    similar_clauses = Column(JSONB, nullable=True)  # Similar clauses from database
    
    # Negotiation data
    negotiation_points = Column(JSONB, nullable=True)  # Accept/reject/modify suggestions
    generated_email = Column(Text, nullable=True)  # Generated negotiation email
    
    # Analysis metadata
    analysis_version = Column(String(20), default="1.0")
    model_used = Column(String(100), nullable=True)  # Which AI model was used
    processing_time = Column(Integer, nullable=True)  # Processing time in seconds
    
    # Status
    status = Column(String(50), default="completed")  # completed, failed, partial
    error_message = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="analyses")
    document = relationship("Document", back_populates="analyses")
    
    def __repr__(self):
        return f"<Analysis(id={self.id}, document_id={self.document_id})>"

class ClauseTemplate(Base):
    __tablename__ = "clause_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Clause information
    clause_type = Column(String(100), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    template_text = Column(Text, nullable=False)
    risk_level = Column(String(20), nullable=False)  # low, medium, high
    
    # Metadata
    jurisdiction = Column(String(50), nullable=True)
    document_type = Column(String(100), nullable=True)
    tags = Column(ARRAY(String), nullable=True)
    
    # Usage statistics
    usage_count = Column(Integer, default=0)
    success_rate = Column(Integer, nullable=True)  # How often this template is accepted
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<ClauseTemplate(id={self.id}, type={self.clause_type})>"
