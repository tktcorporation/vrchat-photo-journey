import * as neverthrow from 'neverthrow';
import * as z from 'zod';

type WorldId = `wrld_${string}`;

/**
 * type guard for WorldId
 */
const isWorldId = (str: string): str is WorldId => {
  return /^wrld_\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(str);
};

// const isJoinInfoFileName = (str: string): str is JoinInfoFileName => {
//   return /^VRChat_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}.\d{3}
// _wrld_\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(str);
// };
const JoinInfoFileNameSchema = z
  .string()
  .regex(
    /^VRChat_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}.\d{3}_wrld_\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/,
  );
type JoinInfoFileName = z.infer<typeof JoinInfoFileNameSchema>;

export { isWorldId };

export type { WorldId, JoinInfoFileName };
