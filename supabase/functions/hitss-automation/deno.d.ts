// Definições de tipos para Deno runtime
declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
  }
  
  const env: Env;
  
  interface ServeOptions {
    port?: number;
    hostname?: string;
  }
  
  function serve(
    handler: (request: Request) => Response | Promise<Response>,
    options?: ServeOptions
  ): void;
}

// Declarações de módulos para imports externos
declare module 'https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts' {
  export * from '@supabase/functions-js';
}

declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export function serve(
    handler: (request: Request) => Response | Promise<Response>,
    options?: any
  ): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export * from '@supabase/supabase-js';
}

declare module 'https://esm.sh/xlsx@0.18.5' {
  export * from 'xlsx';
}