import { bg } from '@/assets';
import { LoginForm } from '@/components/features/auth/login-form';
import { useLogin } from '@/hooks/auth/useAuthMutations';

export function HomePage() {
  const { mutate: loginMutate, resource: loginResource } = useLogin();

  const handleLoginSubmit = (email: string, pass: string) => {
    loginMutate(email, pass);
  };

  const getErrorMessage = () => {
    if (!loginResource.error) return undefined;
    return loginResource.error?.response?.data?.message || loginResource.error?.message || 'Login failed. Please try again.';
  };

  return (
    <div 
      class="flex flex-col items-center justify-center min-h-screen bg-repeat text-white p-4"
      style={{ "background-image": `url('${bg}')` }}
    >
      <div class="bg-gray-900 p-6 rounded shadow border border-gray-700 max-w-sm w-full">
        <h1 class="text-2xl font-bold mb-4 text-center">Map Game</h1>
        <LoginForm 
          isLoading={loginResource.loading}
          errorMessage={getErrorMessage()}
          onSubmit={handleLoginSubmit}
        />
      </div>
    </div>
  );
}
