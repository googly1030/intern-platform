import { useState } from 'react';
import {
  FileUpload,
  TaskForm,
  ScoringWeights,
  TaskTable,
  SearchBar,
} from '../../components/tasks';
import { Pagination } from '../../components/dashboard';

// Sample task data
const sampleTasks = [
  {
    id: '0x1A4',
    name: 'React Auth Flow',
    lastEdit: '2h ago',
    difficulty: 'hard',
    enabled: true,
    tags: ['JWT', 'Redux', 'Security'],
  },
  {
    id: '0x1B2',
    name: 'API Rate Limiter',
    lastEdit: '1d ago',
    difficulty: 'medium',
    enabled: true,
    tags: ['Redis', 'NodeJS'],
  },
  {
    id: '0x2C9',
    name: 'Landing Page Optimization',
    lastEdit: '3d ago',
    difficulty: 'easy',
    enabled: false,
    tags: ['Lighthouse', 'CSS'],
  },
];

const Tasks = () => {
  const [tasks, setTasks] = useState(sampleTasks);
  const [currentPage, setCurrentPage] = useState(1);

  const handleFileDrop = (files) => {
    console.log('Files dropped:', files);
  };

  const handleFileSelect = (files) => {
    console.log('Files selected:', files);
  };

  const handleTaskSubmit = (task) => {
    console.log('Task submitted:', task);
  };

  const handleWeightsChange = (weights) => {
    console.log('Weights changed:', weights);
  };

  const handleSearch = (term) => {
    console.log('Search:', term);
  };

  const handleToggle = (taskId, enabled) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, enabled } : task
    ));
  };

  const handleEdit = (task) => {
    console.log('Edit task:', task);
  };

  const handleDelete = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  return (
    <>
      {/* Create New Task Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-mono text-primary uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add_box</span>
            CREATE_NEW_TASK
          </h2>
          <div className="h-px bg-primary/30 flex-1 ml-4 shadow-[0_0_2px_#00ffff]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File Upload */}
          <div className="lg:col-span-1 h-full">
            <FileUpload onFileDrop={handleFileDrop} onFileSelect={handleFileSelect} />
          </div>

          {/* Task Form & Scoring Weights */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <TaskForm onSubmit={handleTaskSubmit} />
            <ScoringWeights onWeightsChange={handleWeightsChange} />
          </div>
        </div>
      </div>

      {/* Active Task Queue Section */}
      <div className="mb-6 flex flex-col md:flex-row items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-mono text-white uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-primary">list_alt</span>
            ACTIVE_TASK_QUEUE
          </h2>
          <p className="text-[10px] text-gray-500 font-mono mt-1">
            MANAGE AND MONITOR INTERNSHIP ASSIGNMENTS
          </p>
        </div>
        <div className="w-full md:w-auto flex-1 max-w-xl">
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>

      {/* Task Table */}
      <TaskTable
        tasks={tasks}
        onToggle={handleToggle}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={3}
        onPageChange={setCurrentPage}
      />
    </>
  );
};

export default Tasks;
