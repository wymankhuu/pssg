import { useState, useEffect } from "react";

interface TeacherNotesProps {
  notes: string;
  isEditing: boolean;
  onToggleEdit: () => void;
  onSave: (notes: string) => void;
}

const TeacherNotes = ({ notes, isEditing, onToggleEdit, onSave }: TeacherNotesProps) => {
  const [editedNotes, setEditedNotes] = useState<string>(notes);
  
  useEffect(() => {
    setEditedNotes(notes);
  }, [notes]);
  
  const handleSave = () => {
    onSave(editedNotes);
  };
  
  return (
    <div className="border-t border-neutral-200 p-4 bg-neutral-50">
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-neutral-700">Teacher Notes</h4>
        {notes && (
          <button 
            className="text-primary text-sm font-medium"
            onClick={onToggleEdit}
          >
            {isEditing ? "Cancel" : "Edit Notes"}
          </button>
        )}
      </div>
      
      {isEditing ? (
        <div className="mt-3">
          <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center mb-3 pb-2 border-b border-neutral-100">
              <span className="material-icons text-amber-500 mr-2">edit</span>
              <h5 className="font-medium text-indigo-900">Edit Teacher Notes</h5>
            </div>
            <p className="text-xs text-neutral-500 mb-2">
              Use double line breaks to create new paragraphs. Lines ending with a colon will be formatted as section headers.
            </p>
            <textarea 
              className="w-full border border-neutral-300 rounded-md p-3 min-h-[200px] text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={editedNotes} 
              onChange={(e) => setEditedNotes(e.target.value)}
            />
            <div className="flex justify-end mt-3">
              <button 
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm flex items-center"
                onClick={handleSave}
              >
                <span className="material-icons mr-1 text-sm">save</span>
                Save Notes
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          {notes ? (
            <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center mb-3 pb-2 border-b border-neutral-100">
                <span className="material-icons text-indigo-700 mr-2">lightbulb</span>
                <h5 className="font-medium text-indigo-900">Teaching Recommendations</h5>
              </div>
              <div className="text-neutral-700 space-y-3">
                {notes.split('\n\n').map((paragraph, index) => {
                  // Check for section headers (lines ending with a colon)
                  if (paragraph.trim().endsWith(':')) {
                    return (
                      <h6 key={index} className="font-semibold text-indigo-800 mt-4">
                        {paragraph}
                      </h6>
                    );
                  }
                  // Regular paragraphs
                  return (
                    <p key={index} className="text-sm">
                      {paragraph.split('\n').map((line, i) => (
                        <span key={i}>
                          {line}
                          {i < paragraph.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg text-center">
              <p className="text-neutral-500 italic">No teacher notes available yet. Generate text to see teaching suggestions.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherNotes;
