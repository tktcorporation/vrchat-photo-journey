import React, { memo } from 'react';
import { Package } from 'lucide-react';
import { useI18n } from '../../i18n/store';
import packageJson from '../../../../package.json';

const DependencyList = memo(() => {
  const { t } = useI18n();

  return (
    <section>
      <h3 className="flex items-center text-lg font-medium text-gray-900 dark:text-white mb-4">
        <Package className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
        {t('settings.info.dependencies')}
      </h3>
      <div className="space-y-4">
        {Object.entries(packageJson.dependencies).map(([name, version]) => (
          <div key={name} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <span className="font-mono text-gray-900 dark:text-white">{name}</span>
            <span className="font-mono text-gray-500 dark:text-gray-400">{version}</span>
          </div>
        ))}
      </div>
    </section>
  );
});

DependencyList.displayName = 'DependencyList';

export default DependencyList;