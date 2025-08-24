import { useCallback, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PDFGeneratorOptions {
  filename?: string;
  orientation?: 'portrait' | 'landscape';
  format?: string;
}

interface PDFGeneratorReturn {
  generatePDF: (
    element: HTMLElement,
    options?: PDFGeneratorOptions,
  ) => Promise<void>;
  isGenerating: boolean;
}

export const usePDFGenerator = (): PDFGeneratorReturn => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = useCallback(
    async (
      element: HTMLElement,
      options: PDFGeneratorOptions = {},
    ): Promise<void> => {
      const {
        filename = 'voucher.pdf',
        orientation = 'landscape',
        format = 'a4',
      } = options;

      setIsGenerating(true);

      try {
        // Wait a bit for any animations to complete
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Capture the element with specific settings that work well
        const canvas = await html2canvas(element, {
          backgroundColor: null, // Keep original background
          scale: 2, // Higher quality
          useCORS: true,
          allowTaint: true,
          logging: false,
          removeContainer: true,
          onclone: (clonedDoc) => {
            // Ensure all styles are applied in the cloned document
            const clonedElement = clonedDoc.querySelector(
              '[data-html2canvas-ignore]',
            );
            if (clonedElement) {
              clonedElement.remove();
            }
          },
        });

        // Create new PDF document
        const pdf = new jsPDF({
          orientation,
          unit: 'mm',
          format,
        });

        // Calculate dimensions
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // Convert canvas to image data
        const imgData = canvas.toDataURL('image/png', 1.0);

        // Calculate scaling to fit the page with some margin
        const margin = 5;
        const availableWidth = pdfWidth - 2 * margin;
        const availableHeight = pdfHeight - 2 * margin;

        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const imgRatio = imgWidth / imgHeight;

        let finalWidth = availableWidth;
        let finalHeight = availableWidth / imgRatio;

        if (finalHeight > availableHeight) {
          finalHeight = availableHeight;
          finalWidth = availableHeight * imgRatio;
        }

        // Center the image
        const x = (pdfWidth - finalWidth) / 2;
        const y = (pdfHeight - finalHeight) / 2;

        // Add image to PDF
        pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);

        // Save the PDF
        pdf.save(filename);
      } catch (error) {
        console.error('PDF generation failed:', error);
        throw new Error('Failed to generate PDF. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    },
    [],
  );

  return {
    generatePDF,
    isGenerating,
  };
};
