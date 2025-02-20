import React from 'react';

export const useNavigate = jest.fn();
export const useLocation = jest.fn();
export const useParams = jest.fn();

export const Link = ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
  <a href={to} className={className}>
    {children}
  </a>
);

export const BrowserRouter = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const Routes = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const Route = () => null;
