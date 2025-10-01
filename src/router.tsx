import { createBrowserRouter } from 'react-router-dom';
import App from './App';

// Cria um router que irá lidar com todas as rotas da aplicação
const router = createBrowserRouter([
  {
    path: '/*',
    element: <App />,
  },
]);

export default router;