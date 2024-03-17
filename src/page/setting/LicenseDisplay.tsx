import { ScrollArea } from '@/components/ui/scroll-area';
import { SettingBreadcrumb } from './__setting/SettingsBreadcrumb';

// const licenseFileRawData = require('@/assets/licenses.json');
import licenseJsonFile from '@/assets/licenses.json';

const licenseFileRawData = licenseJsonFile as {
  [key: string]: Omit<LibraryMetadata, 'name'>;
};

interface LibraryMetadata {
  name: string;
  licenses: string;
  repository?: string;
  publisher?: string;
  email?: string;
  url?: string;
  path: string;
  licenseFile?: string;
}

const libraries: LibraryMetadata[] = Object.keys(licenseFileRawData).map(
  (key) => ({ ...licenseFileRawData[key], name: key }),
);

export const LicenseDisplay = () => {
  return (
    <div className="flex flex-col h-full justify-center items-center">
      <div className="w-3/5 flex flex-col h-full">
        <div className="mt-6">
          <SettingBreadcrumb />
        </div>
        <p className="mt-6">以下のライブラリを使用しています。</p>
        <ScrollArea className="my-6">
          <div className="flex-grow overflow-y">
            <ul className="space-y-10">
              {libraries.map((library) => (
                <li key={library.path}>
                  <h2 className="font-medium">{library.name}</h2>
                  <div className="mt-2">
                    <p>License: {library.licenses}</p>
                    {library.repository && (
                      <p>
                        <span>Repository: </span>
                        <span>{library.repository}</span>
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
