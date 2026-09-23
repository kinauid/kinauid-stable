import type { ActionFunctionArgs } from 'react-router';
import { createPage, createMeta, type InferAction, type MetaAccessConfig } from '~/builder';
import { handleAuthAction } from '~/services/auth.service';
import { LoginViewWidget } from '~/components/feature/LoginViewWidget';

export const metaAccess: MetaAccessConfig = { roles: ['*'] };
export const meta = createMeta({
  title: 'Masuk — Kinau ID Production Portal',
  description: 'Login ke portal manajemen order, produksi jersey, dan apparel Kinau ID.',
});

export async function action(args: ActionFunctionArgs) {
  return handleAuthAction(args);
}

export default createPage<any, InferAction<typeof action>>(({ result, isSubmitting }) =>
  LoginViewWidget({ actionData: result, isSubmitting })
);
