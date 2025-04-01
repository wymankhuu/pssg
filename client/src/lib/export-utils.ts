import { GeneratedText } from "@shared/schema";

/**
 * Export text to PDF format
 */
export async function exportToPDF(generatedText: GeneratedText): Promise<void> {
  // Basic PDF export without external dependencies
  // In a production app you'd use react-to-pdf or similar library
  
  // Create a new printable window
  const printWindow = window.open('', '_blank');
  if (!printWindow) throw new Error("Failed to open print window");
  
  // Parse content based on sections
  const contentParts = generatedText.content.split(/\n\n-{10,} [A-Z]+ -{10,}\n\n/);
  let passageContent = '';
  let questionsContent = '';
  let answersContent = '';
  let notesContent = '';
  
  // If the content contains section dividers
  if (contentParts.length > 1) {
    // The first part is always the passage
    passageContent = contentParts[0];
    
    // Check following sections based on headers
    const fullContent = generatedText.content;
    
    if (fullContent.includes('---------- QUESTIONS ----------')) {
      const questionsStart = fullContent.indexOf('---------- QUESTIONS ----------') + 
                             '---------- QUESTIONS ----------'.length + 2;
      const questionsEnd = fullContent.includes('---------- ANSWER KEY ----------') ? 
                           fullContent.indexOf('---------- ANSWER KEY ----------') : 
                           (fullContent.includes('---------- TEACHER NOTES ----------') ? 
                           fullContent.indexOf('---------- TEACHER NOTES ----------') : 
                           fullContent.length);
      
      questionsContent = fullContent.slice(questionsStart, questionsEnd).trim();
    }
    
    if (fullContent.includes('---------- ANSWER KEY ----------')) {
      const answersStart = fullContent.indexOf('---------- ANSWER KEY ----------') + 
                           '---------- ANSWER KEY ----------'.length + 2;
      const answersEnd = fullContent.includes('---------- TEACHER NOTES ----------') ? 
                         fullContent.indexOf('---------- TEACHER NOTES ----------') : 
                         fullContent.length;
      
      answersContent = fullContent.slice(answersStart, answersEnd).trim();
    }
    
    if (fullContent.includes('---------- TEACHER NOTES ----------')) {
      const notesStart = fullContent.indexOf('---------- TEACHER NOTES ----------') + 
                         '---------- TEACHER NOTES ----------'.length + 2;
      notesContent = fullContent.slice(notesStart).trim();
    }
  } else {
    // Just a passage with no section markers
    passageContent = generatedText.content;
    notesContent = generatedText.teacherNotes || '';
  }
  
  // Write styled HTML content
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${generatedText.title}</title>
      <style>
        body {
          font-family: 'Georgia', serif;
          line-height: 1.6;
          margin: 40px;
          color: #333;
        }
        h1, h2 {
          font-family: 'Arial', sans-serif;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 20px;
          color: #2a4b8d;
        }
        h2 {
          font-size: 20px;
          margin-top: 30px;
          margin-bottom: 15px;
          color: #2a4b8d;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        p {
          margin-bottom: 16px;
        }
        .section {
          margin-top: 30px;
        }
        .question {
          margin-bottom: 20px;
        }
        .option {
          margin-left: 20px;
          margin-bottom: 8px;
        }
        .answer {
          font-weight: bold;
          color: #006600;
        }
        .answer-key {
          background-color: #f9f9f9;
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 5px;
        }
        .notes {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 5px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <h1>${generatedText.title}</h1>

      ${passageContent ? `
        <div class="section passage">
          ${passageContent.split('\n\n').map(paragraph => {
            // Check if paragraph starts with a number followed by a tab
            const match = paragraph.match(/^(\d+)\t(.+)$/);
            if (match) {
              const [_, number, content] = match;
              return `<div style="display: flex; margin-bottom: 16px;">
                <span style="font-weight: bold; margin-right: 8px;">${number}</span>
                <p style="margin: 0; flex: 1;">${content}</p>
              </div>`;
            } else {
              return `<p>${paragraph}</p>`;
            }
          }).join('')}
        </div>
      ` : ''}

      ${questionsContent ? `
        <div class="section questions">
          <h2>Questions</h2>
          ${questionsContent.split('\n\n').map(question => 
            `<div class="question">${question.split('\n').join('<br>')}</div>`
          ).join('')}
        </div>
      ` : ''}

      ${answersContent ? `
        <div class="section answer-key">
          <h2>Answer Key</h2>
          ${answersContent.split('\n\n').map(answer => 
            `<div class="answer">${answer.split('\n').join('<br>')}</div>`
          ).join('')}
        </div>
      ` : ''}

      ${notesContent ? `
        <div class="section notes">
          <h2>Teacher Notes</h2>
          ${notesContent.split('\n').map(p => `<p>${p}</p>`).join('')}
        </div>
      ` : ''}
    </body>
    </html>
  `);
  
  // Trigger the print dialog which can be saved as PDF
  printWindow.document.close();
  printWindow.focus();
  
  // Wait for content to load
  return new Promise((resolve, reject) => {
    try {
      setTimeout(() => {
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
          resolve();
        };
      }, 300);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Interface for Google Docs export response
 */
interface GoogleDocsExportResponse {
  url: string;
  success: boolean;
  isLargeDocument?: boolean;
  content?: string;
}

/**
 * Export text to Google Docs
 */
export async function exportToGoogleDocs(generatedText: GeneratedText): Promise<string | null> {
  try {
    // Format any numbered paragraphs for better Google Docs display
    // Google Docs handles numbered lists differently, so we convert tab-indented to standard format
    let formattedContent = generatedText.content;
    formattedContent = formattedContent.replace(/^(\d+)\t/gm, "$1. ");
    
    // Update the generatedText object with the formatted content
    const formattedText = {
      ...generatedText,
      content: formattedContent
    };
    
    const response = await fetch('/api/export/google-docs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedText),
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to export to Google Docs');
    }
    
    const data: GoogleDocsExportResponse = await response.json();
    
    // Handle document content with clipboard-based approach
    if (data.isLargeDocument && data.content) {
      // Create a custom solution for Google Docs export
      try {
        // Try to copy the content to clipboard
        navigator.clipboard.writeText(data.content)
          .then(() => {
            console.log("Content copied to clipboard successfully");
          })
          .catch(err => {
            console.error('Failed to copy content to clipboard:', err);
            
            // Show error toast instead of alert for better UX
            throw new Error('Failed to copy content to clipboard. Please try again or use PDF export.');
          });
      } catch (clipboardErr) {
        console.error('Clipboard API error:', clipboardErr);
        
        // Fallback for clipboard write failure
        const copyWindow = window.open('', '_blank');
        if (copyWindow) {
          copyWindow.document.write(`
            <html>
              <head>
                <title>Copy content for ${generatedText.title}</title>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
                  h1 { color: #2a4b8d; }
                  pre { background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap; }
                  .instructions { background: #fff8e1; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                  button { 
                    background: #4285f4; 
                    color: white; 
                    border: none; 
                    padding: 10px 15px; 
                    border-radius: 4px; 
                    cursor: pointer; 
                    font-weight: bold;
                    margin-bottom: 20px;
                  }
                  button:hover { background: #3367d6; }
                </style>
              </head>
              <body>
                <h1>${generatedText.title}</h1>
                <div class="instructions">
                  <p><strong>Instructions:</strong></p>
                  <ol>
                    <li>Click the button below to copy all content</li>
                    <li>Go to the blank Google Doc that opened in another tab</li>
                    <li>Press Ctrl+V (or Cmd+V on Mac) to paste the content</li>
                  </ol>
                </div>
                <button onclick="copyContent()">Copy All Content</button>
                <pre id="content-to-copy">${data.content}</pre>
                <script>
                  function copyContent() {
                    const contentElement = document.getElementById('content-to-copy');
                    const range = document.createRange();
                    range.selectNode(contentElement);
                    window.getSelection().removeAllRanges();
                    window.getSelection().addRange(range);
                    document.execCommand('copy');
                    window.getSelection().removeAllRanges();
                    alert('Content copied! Now go to Google Docs and paste it.');
                  }
                </script>
              </body>
            </html>
          `);
          copyWindow.document.close();
        }
      }
    }
    
    return data.url || null;
  } catch (error) {
    console.error('Error exporting to Google Docs:', error);
    throw error;
  }
}
