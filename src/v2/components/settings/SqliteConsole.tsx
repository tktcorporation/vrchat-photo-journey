import { trpcReact } from '@/trpc';
import { Database, Play } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Textarea } from '../../../components/ui/textarea';
import { useI18n } from '../../i18n/store';

interface SqliteConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

const SqliteConsole: React.FC<SqliteConsoleProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const { mutateAsync: executeQuery, isLoading } =
    trpcReact.debug.executeSqlite.useMutation();

  const handleExecute = async () => {
    if (!query.trim()) return;

    try {
      const result = await executeQuery({ query });
      setResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setResult(String(error));
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleExecute();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="flex items-center text-xl font-semibold text-gray-900 dark:text-white">
            <Database className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            {t('debug.sqliteConsole.title') || 'SQLite Console'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 p-6 overflow-hidden">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="query"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t('debug.sqliteConsole.queryLabel') || 'SQL Query'}
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t('debug.sqliteConsole.shortcut') ||
                  'Press Cmd/Ctrl + Enter to execute'}
              </span>
            </div>
            <div className="relative">
              <Textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  t('debug.sqliteConsole.placeholder') || 'Enter SQL query...'
                }
                className="font-mono text-sm min-h-[120px] resize-none"
              />
              <Button
                size="sm"
                onClick={handleExecute}
                disabled={isLoading || !query.trim()}
                className="absolute bottom-2 right-2"
              >
                <Play className="h-4 w-4 mr-1" />
                {t('debug.sqliteConsole.execute') || '実行'}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('debug.sqliteConsole.resultLabel') || 'Result'}
            </label>
            <div className="flex-1 overflow-auto">
              <pre className="h-full p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 font-mono text-sm text-gray-900 dark:text-gray-100">
                {result ||
                  t('debug.sqliteConsole.noResult') ||
                  'Results will appear here...'}
              </pre>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SqliteConsole;
