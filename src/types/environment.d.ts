/// <reference types="react" />
/// <reference types="react-dom" />
/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
  }
}

declare module '*.svg' {
  import * as React from 'react';

  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;

  const src: string;
  export default src;
}

declare module '*.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare global {
  interface Window {
    __INITIAL_DATA__: any;
  }

  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}