import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../electron/api";

export const trpcReact = createTRPCReact<AppRouter>();
