import { createSignal, Show } from 'solid-js';
import { useLogin } from '@/hooks/auth/useAuthMutations';
import { bg } from '@/assets';

export function HomePage() {
  const { mutate: loginMutate, resource: loginResource } = useLogin();
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');

  const handleLogin = (e: Event) => {
    e.preventDefault();
    loginMutate(email(), password());
  };

  return (
    <div 
      class="flex flex-col items-center justify-center min-w-screen min-h-screen bg-repeat bg-cover backdrop-blur-md" 
      style={{
        "background-image": `url('${bg}')`, 
        "background-color": "rgba(0,0,0,0.6)", 
        "background-blend-mode": "overlay"
      }}
    >
      <div class="bg-gray-900/80 p-10 rounded-2xl shadow-2xl border border-gray-700 w-96 backdrop-blur-xl">
        <h1 class="text-4xl font-bold tracking-wider mb-8 text-white drop-shadow-lg text-center">
          Map Game
        </h1>

        <form onSubmit={handleLogin} class="flex flex-col gap-4">
          <input 
            type="email" 
            placeholder="Email" 
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
            required
            class="px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password()}
            onInput={(e) => setPassword(e.currentTarget.value)}
            required
            class="px-4 py-3 bg-gray-800 text-white rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <button 
            type="submit"
            disabled={loginResource.loading}
            class="mt-4 px-10 py-3 text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all duration-200 rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Show when={loginResource.loading} fallback="Login">
              Loading...
            </Show>
          </button>
          
          <Show when={loginResource.error}>
            <p class="text-red-400 text-sm text-center mt-2">
              {loginResource.error?.message || loginResource.error?.response?.data?.message || 'Login failed. Please try again.'}
            </p>
          </Show>
        </form>
      </div>
    </div>
  );
}
