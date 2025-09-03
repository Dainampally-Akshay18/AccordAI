# pdf_service.py - Robust PDF Text Extraction
import os
import logging
from typing import Dict, Any, List
import pdfplumber
import PyPDF2
import fitz  # PyMuPDF
import re
from io import BytesIO

logger = logging.getLogger(__name__)

class EnhancedPDFService:
    def __init__(self):
        self.extraction_methods = [
            self._extract_with_pdfplumber,
            self._extract_with_pymupdf, 
            self._extract_with_pypdf2
        ]
    
    def extract_text_from_pdf(self, pdf_content: bytes) -> Dict[str, Any]:
        """
        Extract clean text from PDF using multiple methods with fallbacks
        """
        best_extraction = None
        best_score = 0
        
        for method in self.extraction_methods:
            try:
                result = method(pdf_content)
                score = self._score_extraction_quality(result['text'])
                
                logger.info(f"Method {method.__name__}: {score:.2f} quality score")
                
                if score > best_score:
                    best_score = score
                    best_extraction = result
                    
            except Exception as e:
                logger.warning(f"Method {method.__name__} failed: {str(e)}")
                continue
        
        if best_extraction:
            # Clean and normalize the best extraction
            cleaned_text = self._clean_extracted_text(best_extraction['text'])
            return {
                'text': cleaned_text,
                'method_used': best_extraction['method'],
                'quality_score': best_score,
                'page_count': best_extraction.get('page_count', 1)
            }
        else:
            raise Exception("All PDF extraction methods failed")
    
    def _extract_with_pdfplumber(self, pdf_content: bytes) -> Dict[str, Any]:
        """Extract using pdfplumber - best for formatted documents"""
        with pdfplumber.open(BytesIO(pdf_content)) as pdf:
            text_parts = []
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            
            return {
                'text': '\n\n'.join(text_parts),
                'method': 'pdfplumber',
                'page_count': len(pdf.pages)
            }
    
    def _extract_with_pymupdf(self, pdf_content: bytes) -> Dict[str, Any]:
        """Extract using PyMuPDF - good for complex layouts"""
        doc = fitz.open(stream=pdf_content, filetype="pdf")
        text_parts = []
        
        for page_num in range(doc.page_count):
            page = doc[page_num]
            page_text = page.get_text()
            if page_text.strip():
                text_parts.append(page_text)
        
        doc.close()
        return {
            'text': '\n\n'.join(text_parts),
            'method': 'pymupdf',
            'page_count': len(text_parts)
        }
    
    def _extract_with_pypdf2(self, pdf_content: bytes) -> Dict[str, Any]:
        """Extract using PyPDF2 - fallback method"""
        reader = PyPDF2.PdfReader(BytesIO(pdf_content))
        text_parts = []
        
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text.strip():
                text_parts.append(page_text)
        
        return {
            'text': '\n\n'.join(text_parts),
            'method': 'pypdf2', 
            'page_count': len(reader.pages)
        }
    
    def _score_extraction_quality(self, text: str) -> float:
        """Score extraction quality based on text characteristics"""
        if not text or len(text.strip()) < 50:
            return 0.0
        
        score = 0.0
        
        # Check for coherent sentences
        sentences = re.split(r'[.!?]+', text)
        valid_sentences = [s for s in sentences if len(s.strip().split()) > 3]
        score += min(len(valid_sentences) / 10, 3.0)
        
        # Check for proper spacing
        if not re.search(r'[a-z][A-Z]', text):  # No missing spaces
            score += 2.0
        
        # Check for legal document indicators
        legal_terms = ['agreement', 'contract', 'terms', 'conditions', 'party', 'obligations']
        found_terms = sum(1 for term in legal_terms if term.lower() in text.lower())
        score += found_terms * 0.5
        
        # Penalize garbled text
        if re.search(r'[^\w\s.,-:;()\[\]{}"\']', text):
            score -= 1.0
        
        return max(0.0, score)
    
    def _clean_extracted_text(self, text: str) -> str:
        """Clean and normalize extracted text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Fix common PDF extraction issues
        text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)  # Add missing spaces
        text = re.sub(r'(\w)-\s*\n\s*(\w)', r'\1\2', text)  # Fix hyphenated words
        text = re.sub(r'\n+', '\n', text)  # Remove excessive newlines
        
        # Remove headers/footers (common patterns)
        lines = text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            # Skip likely headers/footers
            if (len(line) < 5 or 
                re.match(r'^\d+$', line) or  # Page numbers
                'confidential' in line.lower() and len(line) < 50):
                continue
            cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines).strip()

# Global PDF service instance
pdf_service = EnhancedPDFService()
