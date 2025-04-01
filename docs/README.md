# PSSG - ELA Text Generator

A React-powered educational text generation platform designed to support K-8 English Language Arts curriculum development with AI-assisted passage creation and intelligent question generation.

## Features

- **AI-Powered Text Generation**: Generate educational texts aligned with K-8 ELA standards
- **Standards-Based**: Integrates comprehensive standards for all grade levels (K-8)
- **Multiple Question Types**: Generate multiple-choice, multiple-select, open-response, and two-part questions
- **Passage Modification**: Modify generated passages (revise, stretch, shrink, level up, level down)
- **Export Functionality**: Export to Google Docs and PDF with customizable content options
- **Teacher Notes**: AI-generated instructional notes for each passage

## Technologies Used

- React + TypeScript
- Tailwind CSS + shadcn/ui components
- OpenAI GPT-4o for text generation
- PostgreSQL database
- Express.js backend
- Drizzle ORM

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- OpenAI API key

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/pssg-ela-text-generator.git
   cd pssg-ela-text-generator
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/pssg
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Push the database schema
   ```bash
   npm run db:push
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

## Usage

1. Select a grade level from the sidebar
2. Choose standards to align your text with
3. Configure generation options (reading level, word count, text type, topic)
4. Generate the passage
5. Use the passage modification options to refine the text as needed
6. Generate questions based on the passage
7. Export the content in your preferred format

## License

This project is licensed under the MIT License - see the LICENSE file for details.