import { createResource, createSignal } from 'solid-js';
import { AuthService } from '@/services/http/auth-service';
import { networkAdapter } from '@/lib/network';
import type { LoginRequest } from '@/types/auth';
import { useAuth } from '@/components/providers/AuthProvider';

const authService = new AuthService(networkAdapter.http);

export function useLogin() {
  const auth = useAuth();
  // Signal que atua como "gatilho" para a requisição POST
  const [loginArgs, setLoginArgs] = createSignal<LoginRequest>();

  // O recurso reage quando loginArgs recebe um valor
  const [resource] = createResource(loginArgs, async (args) => {
    const response = await authService.login(args);
    
    // Atualiza o Provider global após o sucesso
    auth.login(response.token, response.user?.email);
    
    return response;
  });

  const mutate = (email: string, password: string) => {
    setLoginArgs({ email, password });
  };

  return {
    mutate,
    // o resource contém os estados reativos: resource.loading, resource.error, resource()
    resource 
  };
}

export function useLogout() {
  const auth = useAuth();
  // Signal que atua como gatilho
  const [trigger, setTrigger] = createSignal<boolean>();

  const [resource] = createResource(trigger, async () => {
    await authService.logout();
    auth.logout();
    return true;
  });

  const mutate = () => {
    setTrigger(true);
  };

  return {
    mutate,
    resource
  };
}
