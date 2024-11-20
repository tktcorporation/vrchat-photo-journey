import { Book } from 'lucide-react';
import React, { memo } from 'react';
import packageJson from '../../../../package.json';
import { useI18n } from '../../i18n/store';

const licenses = [
  {
    name: 'React',
    version: packageJson.dependencies.react,
    license: 'MIT',
    url: 'https://github.com/facebook/react/blob/main/LICENSE',
  },
  {
    name: '@tanstack/react-virtual',
    version: packageJson.dependencies['@tanstack/react-virtual'],
    license: 'MIT',
    url: 'https://github.com/TanStack/virtual/blob/main/LICENSE',
  },
  {
    name: 'Lucide React',
    version: packageJson.dependencies['lucide-react'],
    license: 'ISC',
    url: 'https://github.com/lucide-icons/lucide/blob/main/LICENSE',
  },
];

const LicenseInfo = memo(() => {
  const { t } = useI18n();

  return (
    <section>
      <h3 className="flex items-center text-lg font-medium text-gray-900 dark:text-white mb-4">
        <Book className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
        {t('settings.info.licenses.title')}
      </h3>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {licenses.map((lib) => (
          <div key={lib.name} className="py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-900 dark:text-white">
                {lib.name}
              </span>
              <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                {lib.version}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {lib.license} {t('settings.info.licenses.suffix')}
              </span>
              <a
                href={lib.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {t('settings.info.licenses.viewLicense')}
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});

LicenseInfo.displayName = 'LicenseInfo';

export default LicenseInfo;
