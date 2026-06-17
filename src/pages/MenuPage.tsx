import { onMount, onCleanup } from 'solid-js';
import { MainMenuUI } from '@/ui/main-menu';
import { AuthService } from '@/services/http/auth-service';
import { networkAdapter } from '@/lib/network';
import { setCookie, getCookie } from '@/lib/utils/cookies';
import { useNavigate } from '@solidjs/router';

export function MenuPage() {
  let containerRef!: HTMLDivElement;
  let menuUI: MainMenuUI | null = null;
  const navigate = useNavigate();
  const authService = new AuthService(networkAdapter.http);

  const startGame = () => {
    navigate('/lobby');
  };

  onMount(() => {
    menuUI = new MainMenuUI(
      containerRef,
      async (email: string, pass: string) => {
        const response = await authService.login({ email, password: pass });
        setCookie('auth_token', response.token);
        if (response.user) {
          setCookie('user_email', response.user.email);
        }
        startGame();
      },
      () => {
        startGame();
      }
    );

    if (getCookie('auth_token')) {
      startGame();
    }
  });

  onCleanup(() => {
    if (menuUI) {
      menuUI.dispose();
      menuUI = null;
    }
  });

  return <div ref={containerRef} style="width: 100%; height: 100%;" />;
}
