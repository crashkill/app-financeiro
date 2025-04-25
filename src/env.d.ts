/// <reference types="react" />
/// <reference types="react-dom" />
/// <reference types="react-router-dom" />

declare namespace React {
  interface DOMAttributes<T> {
    children?: React.ReactNode;
  }
}