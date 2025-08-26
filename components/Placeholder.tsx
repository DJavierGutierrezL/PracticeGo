import React from 'react';

interface PlaceholderProps {
  title: string;
  message: string;
}

export const Placeholder: React.FC<PlaceholderProps> = ({ title, message }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
      <img src="https://picsum.photos/300/200" alt="En Construcción" className="rounded-lg mb-6 shadow-md" />
      <h2 className="text-3xl font-bold text-gray-700 dark:text-gray-200 mb-2">{title}</h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md">{message}</p>
    </div>
  );
};