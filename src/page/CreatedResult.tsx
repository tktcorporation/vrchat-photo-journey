import { Button } from "@/components/ui/button";
import React from "react";
import { trpcReact } from "../trpc";

function CreatedResult() {
	const vrchatPhotoDir = trpcReact.getVRChatPhotoDir.useQuery().data?.path;
	const mutate = trpcReact.openPathOnExplorer.useMutation();
	const handleOpenFolder = () => {
		return mutate.mutate(vrchatPhotoDir!);
	};

	return (
		<div className="flex-auto">
			<div className=" flex flex-col justify-center items-center h-full space-y-4">
				<p>VRChatの写真フォルダにファイルを生成しました</p>
				<Button onClick={handleOpenFolder}>写真フォルダを開いて確認する</Button>
			</div>
		</div>
	);
}

export default CreatedResult;
