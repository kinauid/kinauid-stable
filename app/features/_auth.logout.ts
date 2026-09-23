import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router';
import { AuthService } from '~/services/auth.service';

export const loader = async ({ request }: LoaderFunctionArgs) => AuthService.logout(request);
export const action = async ({ request }: ActionFunctionArgs) => AuthService.logout(request);
export default () => null;
