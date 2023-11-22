import { Loader } from "lucide-react";
import React from "react";

import { cn } from "@/lib/utils";

export interface PhotoByBuffProps extends React.HTMLAttributes<HTMLDivElement> {
  bufferString?: string;
}

function Photo({ bufferString, ...props }: PhotoByBuffProps) {
  // 条件レンダリングを適切に修正します
  if (!bufferString) {
    return <Loader className="w-8 h-8" />;
  }

  // dataがオブジェクトで、その中の画像URLを指定するプロパティが `url` だと仮定
  return (
    <div
      {...props}
      className={cn(
        "flex flex-col items-center justify-center w-full h-full",
        props.className,
      )}
    >
      <img src={bufferString} className="w-full h-full" alt="" />
    </div>
  );
}

export default Photo;
