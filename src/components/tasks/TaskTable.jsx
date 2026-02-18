import TaskRow from './TaskRow';

const TaskTable = ({ tasks = [], onToggle, onEdit, onDelete }) => {
  return (
    <div className="border border-white/10 overflow-hidden relative">
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-primary" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-primary" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary" />

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-900/50 border-b border-white/10 text-[10px] uppercase text-primary font-mono tracking-widest">
              <th className="px-6 py-4 font-normal">Task_ID</th>
              <th className="px-6 py-4 font-normal">Task_Name</th>
              <th className="px-6 py-4 font-normal">Difficulty</th>
              <th className="px-6 py-4 font-normal">Status_Toggle</th>
              <th className="px-6 py-4 font-normal">Criteria_Tags</th>
              <th className="px-6 py-4 font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskTable;
