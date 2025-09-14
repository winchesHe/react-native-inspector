import { NativeModules } from 'react-native';

export function getDevServerBaseURL(): string | null {
  const scriptURL: string | undefined = (NativeModules as any)?.SourceCode?.scriptURL;
  if (!scriptURL) return null;
  try {
    const url = new URL(scriptURL);
    return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}`;
  } catch {
    return null;
  }
}
