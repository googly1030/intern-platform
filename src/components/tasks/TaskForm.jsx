import { useState } from 'react';

const TaskForm = ({ onSubmit }) => {
  const [taskName, setTaskName] = useState('');
  const [tags, setTags] = useState([]);

  const handleSubmit = () => {
    onSubmit?.({ taskName, tags });
  };

  return (
    <div className="bg-black border border-white/10 p-5 relative h-full">
      <div className="absolute top-0 right-0 p-2">
        <span className="text-[10px] text-neon-green font-mono animate-pulse">● AWAITING_INPUT</span>
      </div>

      <h3 className="text-sm text-gray-400 font-mono mb-4 uppercase">[ Requirement Extraction ]</h3>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-primary/70 font-mono block mb-1">TASK_NAME</label>
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-700 text-white font-mono text-sm px-3 py-2 focus:border-primary focus:ring-0 placeholder-gray-600"
            placeholder="e.g. Implement OAuth Flow"
          />
        </div>

        <div>
          <label className="text-xs text-primary/70 font-mono block mb-1">EXTRACTED_TAGS</label>
          <div className="w-full min-h-[80px] bg-gray-900/50 border border-gray-700 p-2 flex flex-wrap gap-2 content-start">
            {tags.length === 0 ? (
              <span className="border border-dashed border-gray-600 text-gray-500 px-2 py-1 text-[10px] font-mono h-fit">
                Waiting for analysis...
              </span>
            ) : (
              tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-1.5 py-0.5 text-[10px] bg-gray-900 text-gray-300 border border-gray-700"
                >
                  [{tag}]
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskForm;
