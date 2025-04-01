import { db } from './db';
import { standardCategories, standards } from '@shared/schema';
import { standardsData } from './sampleData';

// Initialize the database with sample data
async function initializeDatabase() {
  console.log('Initializing database with sample data...');
  
  try {
    // Process each grade level
    for (const gradeId in standardsData) {
      const categories = standardsData[gradeId];
      
      // Process each category in this grade
      for (const category of categories) {
        // Insert category
        await db.insert(standardCategories).values({
          id: category.id,
          title: category.title,
          description: category.description,
          icon: category.icon,
          color: category.color,
          gradeId: gradeId
        }).onConflictDoNothing();
        
        console.log(`Added category: ${category.title} for grade ${gradeId}`);
        
        // Process standards for this category
        for (const standard of category.standards) {
          await db.insert(standards).values({
            code: standard.code,
            description: standard.description,
            categoryId: category.id,
            gradeId: gradeId
          }).onConflictDoNothing();
          
          console.log(`Added standard: ${standard.code}`);
        }
      }
    }
    
    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Run the initialization
initializeDatabase().then(() => {
  console.log('Database setup finished. Press Ctrl+C to exit.');
});