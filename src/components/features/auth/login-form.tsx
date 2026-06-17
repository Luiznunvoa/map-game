import { createSignal, Show } from 'solid-js';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface LoginFormProps {
  isLoading: boolean;
  errorMessage?: string;
  onSubmit: (email: string, pass: string) => void;
}

export function LoginForm(props: LoginFormProps) {
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    props.onSubmit(email(), password());
  };

  return (
    <form onSubmit={handleSubmit} class="flex flex-col gap-3">
      <Input 
        type="email" 
        placeholder="Email" 
        value={email()}
        onInput={(e) => setEmail(e.currentTarget.value)}
        required
      />
      <Input 
        type="password" 
        placeholder="Password" 
        value={password()}
        onInput={(e) => setPassword(e.currentTarget.value)}
        required
      />
      <Button type="submit" disabled={props.isLoading}>
        <Show when={props.isLoading} fallback="Login">
          Loading...
        </Show>
      </Button>
      
      <Show when={props.errorMessage}>
        <p class="text-red-600 text-sm text-center">{props.errorMessage}</p>
      </Show>
    </form>
  );
}
