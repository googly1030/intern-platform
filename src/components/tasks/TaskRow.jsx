import DifficultyIndicator from './DifficultyIndicator';
import StatusToggle from './StatusToggle';

const TechTag = ({ tech }) => (
  <span className="px-1.5 py-0.5 text-[10px] bg-gray-900 text-gray-300 border border-gray-700">
    [{tech}]
  </span>
);

const TaskRow = ({ task, onToggle, onEdit, onDelete }) => {
  const { id, name, lastEdit, difficulty, enabled, tags } = task;

  return (
    <tr className="group hover:bg-white/5 transition-colors">
      <td className="px-6 py-4">
        <span className="text-gray-500 text-xs">{id}</span>
      </td>

      <td className="px-6 py-4">
        <div className="font-bold text-white text-sm group-hover:text-primary transition-colors">
          {name}
        </div>
        <div className="text-[10px] text-gray-500">Last edit: {lastEdit}</div>
      </td>

      <td className="px-6 py-4">
        <DifficultyIndicator level={difficulty} />
      </td>

      <td className="px-6 py-4">
        <StatusToggle enabled={enabled} onChange={(val) => onToggle?.(task.id, val)} />
      </td>

      <td className="px-6 py-4">
        <div className="flex gap-1 flex-wrap max-w-[200px]">
          {tags.map((tech) => (
            <TechTag key={tech} tech={tech} />
          ))}
        </div>
      </td>

      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
          <button
            className="p-1 text-gray-400 hover:text-primary transition-colors"
            title="Edit JSON"
            onClick={() => onEdit?.(task)}
          >
            <span className="material-symbols-outlined text-[18px]">data_object</span>
          </button>
          <button
            className="p-1 text-gray-400 hover:text-neon-red transition-colors"
            title="Delete"
            onClick={() => onDelete?.(task.id)}
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default TaskRow;
