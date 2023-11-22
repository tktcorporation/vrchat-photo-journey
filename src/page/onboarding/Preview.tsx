import PhotoByBuff from "@/components/ui/PhotoByBuff";
import { trpcReact } from "@/trpc";
import React from "react";

export function OnBordingPreview() {
  const infoMap = trpcReact.getToCreateInfoFileMap.useQuery().data;

  return (
    <div className="space-y-4">
      osyasinn
      <div className="col-span-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
          {infoMap?.map((item) => {
            const content = <PhotoByBuff bufferString={item.content} />;

            return <div key={item.fileName}>{content}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
