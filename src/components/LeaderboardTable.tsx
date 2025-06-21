import React, { useState } from 'react';
import { Trophy, Medal, User, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LeaderboardEntry } from '../lib/supabase';

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  title: string;
  description: string;
  loading: boolean;
  error: string | null;
  userRank: number | null;
  columns: {
    key: string;
    label: string;
    format?: (value: any) => React.ReactNode;
  }[];
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  data,
  title,
  description,
  loading,
  error,
  userRank,
  columns
}) => {
  const [sortColumn, setSortColumn] = useState<string>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return 0;
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-gray-500 dark:text-gray-400">{rank}</span>;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        </div>
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        </div>
        <div className="p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        </div>
        <div className="p-12 text-center">
          <Trophy className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No data available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        
        {userRank && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200 font-medium">
              Your rank: <span className="font-bold">{userRank}</span>
            </p>
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50 text-left">
              <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              
              {columns.map(column => (
                <th 
                  key={column.key}
                  className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {sortColumn === column.key && (
                      sortDirection === 'asc' ? 
                        <ArrowUp className="h-3 w-3" /> : 
                        <ArrowDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            <AnimatePresence>
              {sortedData.map((entry, index) => (
                <motion.tr
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center w-8 h-8">
                      {getRankIcon(entry.rank)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {entry.avatar_url ? (
                          <img
                            src={entry.avatar_url}
                            alt={entry.full_name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {entry.full_name}
                        </div>
                        {entry.username && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            @{entry.username}
                          </div>
                        )}
                        {entry.location && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {entry.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  {columns.map(column => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {column.format ? column.format(entry[column.key]) : entry[column.key]}
                      </div>
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardTable;