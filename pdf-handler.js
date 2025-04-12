/**
 * @fileoverview PDF processing module using PDF.js for text extraction
 * @requires pdf.js
 */

import pdfjsLib from './pdf.js/pdf.mjs';

/**
 * @typedef {Object} PDFExtractResult
 * @property {boolean} success - Whether the extraction was successful
 * @property {string} text - Extracted text content
 * @property {string} [error] - Error message if extraction failed
 */

/**
 * Handles PDF file processing and text extraction
 * @class
 */
class PDFHandler {
  /**
   * Initialize PDFHandler and set up PDF.js worker
   * @constructor
   */
  constructor() {
    pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.js/pdf.worker.mjs');
  }

  /**
   * Extract text from PDF ArrayBuffer
   * @param {ArrayBuffer} arrayBuffer - PDF file contents
   * @returns {Promise<PDFExtractResult>} Extraction result
   */
  async extractText(arrayBuffer) {
    try {
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        console.log(`📄 Page ${i} text:`, pageText);
        fullText += pageText + '\n\n';
      }

      console.log("📄 Full PDF extracted text length:", fullText.length);
      return { success: true, text: fullText.trim() };
    } catch (error) {
      console.error('PDF extraction error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract text from PDF File object
   * @param {File} file - PDF file to process
   * @returns {Promise<PDFExtractResult>} Extraction result
   */
  async extractTextFromPDF(file) {
    try {
      console.log("📂 PDF file selected:", file.name, file.size);
      const arrayBuffer = await file.arrayBuffer();
      return await this.extractText(arrayBuffer);
    } catch (error) {
      console.error('PDF extractTextFromPDF error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle PDF file upload and extraction
   * @param {File} file - Uploaded PDF file
   * @returns {Promise<PDFExtractResult>} Extraction result
   * @throws {Error} If file is invalid or not a PDF
   */
  async handleFileUpload(file) {
    return new Promise((resolve, reject) => {
      if (!file || file.type !== 'application/pdf') {
        reject(new Error('Invalid PDF file'));
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const result = await this.extractText(arrayBuffer);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Extract text from PDF URL
   * @param {string} url - PDF file URL
   * @returns {Promise<PDFExtractResult>} Extraction result
   */
  async extractFromUrl(url) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return await this.handleFileUpload(new File([blob], 'document.pdf', { type: 'application/pdf' }));
    } catch (error) {
      console.error('PDF URL extraction error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new PDFHandler();