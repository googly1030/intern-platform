"""
PDF Extraction Service
Extracts text content from PDF files
"""

import io
import logging
from typing import Optional

logger = logging.getLogger(__name__)

try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    logger.warning("PyPDF2 not available, PDF extraction disabled")


class PDFExtractor:
    """Service for extracting text from PDF files"""

    @staticmethod
    def is_available() -> bool:
        """Check if PDF extraction is available"""
        return PDF_AVAILABLE

    @staticmethod
    def extract_from_bytes(pdf_bytes: bytes) -> Optional[str]:
        """
        Extract text from PDF bytes.

        Args:
            pdf_bytes: PDF file content as bytes

        Returns:
            Extracted text or None if extraction fails
        """
        if not PDF_AVAILABLE:
            logger.error("PDF extraction not available, install PyPDF2")
            return None

        try:
            pdf_file = io.BytesIO(pdf_bytes)
            reader = PyPDF2.PdfReader(pdf_file)

            text_parts = []
            for page in reader.pages:
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
                except Exception as e:
                    logger.warning(f"Failed to extract text from page: {e}")
                    continue

            full_text = "\n\n".join(text_parts)
            logger.info(f"Extracted {len(full_text)} characters from PDF")
            return full_text

        except Exception as e:
            logger.error(f"Failed to extract text from PDF: {e}")
            return None

    @staticmethod
    def extract_from_file(file_path: str) -> Optional[str]:
        """
        Extract text from PDF file.

        Args:
            file_path: Path to PDF file

        Returns:
            Extracted text or None if extraction fails
        """
        if not PDF_AVAILABLE:
            logger.error("PDF extraction not available, install PyPDF2")
            return None

        try:
            with open(file_path, "rb") as f:
                pdf_bytes = f.read()
            return PDFExtractor.extract_from_bytes(pdf_bytes)

        except Exception as e:
            logger.error(f"Failed to read PDF file {file_path}: {e}")
            return None
